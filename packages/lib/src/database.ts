/** @format */

import mongoose, { Connection, Model, Schema } from 'mongoose';

import { xernerxModels, virtueModels } from './registry';

const globalWithMongoose = global as typeof global & {
	__connections?: Record<string, Record<string, Connection>>;
	__connections_v2?: Record<string, Record<string, Connection>>;
	__models_v4?: Record<string, Record<string, Record<string, Model<any>>>>;
	__root_connections_v5?: Record<string, Connection>;
	__db_connections_v5?: Record<string, Record<string, Connection>>;
	__models_v5?: Record<string, Record<string, Record<string, Model<any>>>>;
	__models_v6?: Record<string, Record<string, Record<string, Model<any>>>>;
	__models_v7?: Record<string, Record<string, Record<string, Model<any>>>>;
	__models_v8?: Record<string, Record<string, Record<string, Model<any>>>>;
	__models_v9?: Record<string, Record<string, Record<string, Model<any>>>>;
	__models_v10?: Record<string, Record<string, Record<string, Model<any>>>>;
	__models_v11?: Record<string, Record<string, Record<string, Model<any>>>>;
	__models_v12?: Record<string, Record<string, Record<string, Model<any>>>>;
	__models_v13?: Record<string, Record<string, Record<string, Model<any>>>>;
	__models_v14?: Record<string, Record<string, Record<string, Model<any>>>>;
	__models_v15?: Record<string, Record<string, Record<string, Model<any>>>>;
	__models_v16?: Record<string, Record<string, Record<string, Model<any>>>>;
	__models_v17?: Record<string, Record<string, Record<string, Model<any>>>>;
	__models_v18?: Record<string, Record<string, Record<string, Model<any>>>>;
	__models_v19?: Record<string, Record<string, Record<string, Model<any>>>>;
	__models_v20?: Record<string, Record<string, Record<string, Model<any>>>>;
	__models_v21?: Record<string, Record<string, Record<string, Model<any>>>>;
};

// Close any legacy per-database connections left over from older HMR reloads
if (globalWithMongoose.__connections_v2) {
	for (const projectConns of Object.values(globalWithMongoose.__connections_v2)) {
		for (const conn of Object.values(projectConns || {})) {
			if (conn && typeof conn.close === 'function') {
				conn.close().catch(() => {});
			}
		}
	}
	delete globalWithMongoose.__connections_v2;
	delete globalWithMongoose.__models_v4;
}

if (globalWithMongoose.__models_v5) {
	delete globalWithMongoose.__models_v5;
}
if (globalWithMongoose.__models_v6) {
	delete globalWithMongoose.__models_v6;
}
if (globalWithMongoose.__models_v7) {
	delete globalWithMongoose.__models_v7;
}
if (globalWithMongoose.__models_v8) {
	delete globalWithMongoose.__models_v8;
}
if (globalWithMongoose.__models_v9) {
	delete globalWithMongoose.__models_v9;
}
if (globalWithMongoose.__models_v10) {
	delete globalWithMongoose.__models_v10;
}
if (globalWithMongoose.__models_v11) {
	delete globalWithMongoose.__models_v11;
}
if (globalWithMongoose.__models_v12) {
	delete globalWithMongoose.__models_v12;
}
if (globalWithMongoose.__models_v13) {
	delete globalWithMongoose.__models_v13;
}
if (globalWithMongoose.__models_v14) {
	delete globalWithMongoose.__models_v14;
}
if (globalWithMongoose.__models_v15) {
	delete globalWithMongoose.__models_v15;
}
if (globalWithMongoose.__models_v16) {
	delete globalWithMongoose.__models_v16;
}
if (globalWithMongoose.__models_v17) {
	delete globalWithMongoose.__models_v17;
}
if (globalWithMongoose.__models_v18) {
	delete globalWithMongoose.__models_v18;
}
if (globalWithMongoose.__models_v19) {
	delete globalWithMongoose.__models_v19;
}
if (globalWithMongoose.__models_v20) {
	delete globalWithMongoose.__models_v20;
}

const rootConnections = globalWithMongoose.__root_connections_v5 || {};
const activeConnections = globalWithMongoose.__db_connections_v5 || {};
const cachedModels = globalWithMongoose.__models_v21 || {};

// Also close any orphaned top-level mongoose.connections not tracked in rootConnections
const trackedRoots = new Set(Object.values(rootConnections));
for (const conn of mongoose.connections) {
	if (conn && conn !== mongoose.connection && !trackedRoots.has(conn) && conn.readyState !== 0) {
		conn.close().catch(() => {});
	}
}

if (process.env.NODE_ENV !== 'production') {
	globalWithMongoose.__root_connections_v5 = rootConnections;
	globalWithMongoose.__db_connections_v5 = activeConnections;
	globalWithMongoose.__models_v21 = cachedModels;
}

const getUris = (): Record<string, string> => ({
	xernerx: process.env.MONGO_XERNERX || '',
	virtue: process.env.MONGO_VIRTUE || process.env.MONGO_XERNERX || '',
});

interface ModelDefinition {
	schema: Schema;
	modelName: string;
	collection: string;
}

const registries: Record<string, any> = {
	xernerx: xernerxModels,
	virtue: virtueModels,
};

export async function database(projectId: 'xernerx' | 'virtue') {
	if (!activeConnections[projectId]) activeConnections[projectId] = {};
	if (!cachedModels[projectId]) cachedModels[projectId] = {};

	let rootConn = rootConnections[projectId];
	if (rootConn && (rootConn.readyState === 0 || typeof rootConn.useDb !== 'function')) {
		delete rootConnections[projectId];
		activeConnections[projectId] = {};
		cachedModels[projectId] = {};
		rootConn = undefined as any;
	}

	if (rootConn && Object.keys(cachedModels[projectId]).length > 0) {
		const registry = registries[projectId];
		const isFullyCached =
			registry && Object.entries(registry).every(([cat, models]: [string, any]) => cachedModels[projectId][cat] && Object.keys(models).every((m) => cachedModels[projectId][cat][m]));

		if (isFullyCached) {
			return {
				connections: activeConnections[projectId],
				models: cachedModels[projectId],
			};
		}
	}

	const baseUri = getUris()[projectId];
	if (!baseUri) throw new Error(`Database URI for ${projectId} is not defined.`);

	const registry = registries[projectId];
	if (!registry) throw new Error(`No registry found for ${projectId}.`);

	if (!rootConn) {
		// Strip any trailing slash/db path so the root pool connects cleanly to the cluster
		let clusterUri = baseUri;
		try {
			const parsed = new URL(baseUri);
			parsed.pathname = '/';
			clusterUri = parsed.toString();
		} catch {}

		rootConn = mongoose.createConnection(clusterUri, {
			maxPoolSize: 3,
			minPoolSize: 0,
			maxIdleTimeMS: 15000,
			serverSelectionTimeoutMS: 5000,
			socketTimeoutMS: 30000,
		});
		rootConn.on('error', (err) => console.warn(`Mongoose connection error for ${projectId}:`, err?.message || err));
		rootConnections[projectId] = rootConn;
	}

	const projectModels: Record<string, Record<string, Model<any>>> = {};

	for (const [uriSuffix, collectionsMap] of Object.entries(registry)) {
		const cleanDbName = uriSuffix.replace(/^\/+/, '').replace(/\/+$/, '');

		let conn: Connection | undefined = activeConnections[projectId][uriSuffix];
		if (!conn || typeof conn.model !== 'function') {
			conn = rootConn.useDb(cleanDbName, { useCache: true });
			activeConnections[projectId][uriSuffix] = conn;
		}

		projectModels[uriSuffix] = {};

		for (const [key, def] of Object.entries(collectionsMap as Record<string, ModelDefinition>)) {
			try {
				if (process.env.NODE_ENV !== 'production' && conn.models[def.modelName]) {
					delete (conn.models as any)[def.modelName];
				}
				projectModels[uriSuffix][key] = conn.models[def.modelName] || conn.model(def.modelName, def.schema, def.collection);
			} catch (err) {
				console.warn(`Failed to initialize ${def.modelName} in ${uriSuffix}:`, err);
			}
		}
	}

	cachedModels[projectId] = projectModels;

	return {
		connections: activeConnections[projectId],
		models: projectModels,
	};
}
