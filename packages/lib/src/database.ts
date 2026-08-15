/** @format */

import mongoose, { Connection, Model, Schema } from 'mongoose';

import { xernerxModels } from './registry';

const globalWithMongoose = global as typeof global & {
	__connections?: Record<string, Record<string, Connection>>;
	__models?: Record<string, Record<string, Record<string, Model<any>>>>;
};

const activeConnections = globalWithMongoose.__connections || {};
const cachedModels = globalWithMongoose.__models || {};

if (process.env.NODE_ENV !== 'production') {
	globalWithMongoose.__connections = activeConnections;
	globalWithMongoose.__models = cachedModels;
}

const uris = {
	xernerx: process.env.MONGO_XERNERX || '',
	virtue: process.env.MONGO_VIRTUE || '',
};

interface ModelDefinition {
	schema: Schema;
	modelName: string;
	collection: string;
}

const registries: Record<string, any> = {
	xernerx: xernerxModels,
};

export async function database(projectId: keyof typeof uris) {
	// Ensure cache objects exist for this specific project identifier (e.g., 'xernerx')
	if (!activeConnections[projectId]) activeConnections[projectId] = {};
	if (!cachedModels[projectId]) cachedModels[projectId] = {};

	if (Object.keys(cachedModels[projectId]).length > 0) {
		return {
			connections: activeConnections[projectId],
			models: cachedModels[projectId],
		};
	}

	const baseUri = uris[projectId];
	if (!baseUri) throw new Error(`Database URI for ${projectId} is not defined.`);

	const registry = registries[projectId];
	if (!registry) throw new Error(`No registry found for ${projectId}.`);

	const projectModels: Record<string, Record<string, Model<any>>> = {};

	// Loop 1: uriSuffix is 'profiles', 'stats', 'tokens'
	for (const [uriSuffix, collectionsMap] of Object.entries(registry)) {
		// Connects to mongodb+srv://.../profiles
		let connectionUri = '';
		try {
			const parsed = new URL(baseUri);
			parsed.pathname = parsed.pathname === '/' ? `/${uriSuffix}` : `${parsed.pathname.replace(/\/$/, '')}/${uriSuffix}`;
			connectionUri = parsed.toString();
		} catch (e) {
			connectionUri = `${baseUri.replace(/\/$/, '')}/${uriSuffix}`;
		}

		let conn: Connection | undefined = activeConnections[projectId][uriSuffix];

		// HMR cleanup / pending promise resolution
		if (conn && typeof (conn as any).then === 'function') conn = await (conn as any);
		if (conn && typeof conn.model !== 'function') {
			delete activeConnections[projectId][uriSuffix];
			conn = undefined;
		}

		if (!conn) {
			conn = mongoose.createConnection(connectionUri);
			activeConnections[projectId][uriSuffix] = conn;
		}

		projectModels[uriSuffix] = {};

		// Loop 2: key is 'users', 'guilds', 'bots'
		for (const [key, def] of Object.entries(collectionsMap as Record<string, ModelDefinition>)) {
			try {
				// conn.model('User', schema, 'users')
				// This builds the EXACT structure from your screenshot.
				projectModels[uriSuffix][key] = conn.model(def.modelName, def.schema, def.collection);
			} catch (err) {
				console.error(`Failed to initialize ${def.modelName} in ${uriSuffix}:`, err);
			}
		}
	}

	cachedModels[projectId] = projectModels;

	return {
		connections: activeConnections[projectId],
		models: projectModels,
	};
}
