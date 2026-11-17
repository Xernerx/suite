/** @format */

import mongoose, { Connection, Model, Schema } from 'mongoose';

import { xernerxModels, virtueModels, hasteModels, yourappsModels } from './registry';
import { createLogger } from './terminal';

const dbLog = createLogger('DB');

const globalWithMongoose = global as typeof global & {
	__connections?: Record<string, Record<string, Connection>>;
	__connections_v2?: Record<string, Record<string, Connection>>;
	__models_v4?: Record<string, Record<string, Record<string, Model<any>>>>;
	__root_connections_v5?: Record<string, Connection>;
	__db_connections_v5?: Record<string, Record<string, Connection>>;
	__inflight_connections_v5?: Record<string, Promise<Connection> | undefined>;
	__models_v41?: Record<string, Record<string, Record<string, Model<any>>>>;
	[key: string]: any;
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

for (let v = 5; v <= 40; v++) {
	const key = `__models_v${v}`;
	if (globalWithMongoose[key]) {
		delete globalWithMongoose[key];
	}
}

const rootConnections = globalWithMongoose.__root_connections_v5 || {};
const activeConnections = globalWithMongoose.__db_connections_v5 || {};
const inFlightConnections = globalWithMongoose.__inflight_connections_v5 || {};
const cachedModels = globalWithMongoose.__models_v41 || {};

if (process.env.NODE_ENV !== 'production') {
	globalWithMongoose.__root_connections_v5 = rootConnections;
	globalWithMongoose.__db_connections_v5 = activeConnections;
	globalWithMongoose.__inflight_connections_v5 = inFlightConnections;
	globalWithMongoose.__models_v41 = cachedModels;
}

function isConnectionHealthy(conn?: Connection | null): boolean {
	if (!conn || conn.readyState !== 1 || typeof conn.useDb !== 'function') {
		return false;
	}
	try {
		const client: any = typeof conn.getClient === 'function' ? conn.getClient() : (conn as any).client;
		if (!client) return false;
		if (client.s?.hasBeenClosed) return false;
		if (client.topology && typeof client.topology.isDestroyed === 'function' && client.topology.isDestroyed()) {
			return false;
		}
	} catch {
		return false;
	}
	return true;
}

const cleanEnvUri = (val?: string): string =>
	(val || '')
		.trim()
		.replace(/^[A-Z0-9_]+\s*=\s*/i, '')
		.replace(/^["']+|["']+$/g, '')
		.trim();

const getUris = (): Record<string, string> => {
	const xernerxUri = cleanEnvUri(process.env.MONGO_XERNERX);
	const isLocalMemoryServer = xernerxUri.includes('127.0.0.1') || xernerxUri.includes('localhost');
	return {
		xernerx: xernerxUri,
		virtue: cleanEnvUri(process.env.MONGO_VIRTUE) || (isLocalMemoryServer ? xernerxUri : ''),
		haste: cleanEnvUri(process.env.MONGO_HASTE) || (isLocalMemoryServer ? xernerxUri : ''),
		yourapps: cleanEnvUri(process.env.MONGO_YOURAPPS) || (isLocalMemoryServer ? xernerxUri : ''),
	};
};

interface ModelDefinition {
	schema: Schema;
	modelName: string;
	collection: string;
}

const registries: Record<string, any> = {
	xernerx: xernerxModels,
	virtue: virtueModels,
	haste: hasteModels,
	yourapps: yourappsModels,
};

export async function database(projectId: 'xernerx' | 'virtue' | 'haste' | 'yourapps') {
	if (!activeConnections[projectId]) activeConnections[projectId] = {};
	if (!cachedModels[projectId]) cachedModels[projectId] = {};

	let rootConn = rootConnections[projectId];
	if (rootConn && !isConnectionHealthy(rootConn)) {
		try {
			rootConn.close().catch(() => {});
		} catch {}
		delete rootConnections[projectId];
		activeConnections[projectId] = {};
		cachedModels[projectId] = {};
		rootConn = undefined as any;
	}

	if (rootConn && Object.keys(cachedModels[projectId]).length > 0) {
		const registry = registries[projectId];
		const isFullyCached =
			registry &&
			Object.entries(registry).every(
				([cat, models]: [string, any]) =>
					activeConnections[projectId][cat]?.readyState === 1 &&
					cachedModels[projectId][cat] &&
					Object.entries(models).every(([m, def]: [string, any]) => {
						const cached = cachedModels[projectId][cat][m];
						return cached && (process.env.NODE_ENV === 'production' || cached.schema === def.schema);
					})
			);

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
		if (!inFlightConnections[projectId]) {
			inFlightConnections[projectId] = (async () => {
				let clusterUri = baseUri;
				try {
					const parsed = new URL(baseUri);
					parsed.pathname = '/';
					clusterUri = parsed.toString();
				} catch {}

				const created = mongoose.createConnection(clusterUri, {
					maxPoolSize: 5,
					minPoolSize: 0,
					maxIdleTimeMS: 30000,
					serverSelectionTimeoutMS: 5000,
					socketTimeoutMS: 30000,
				});
				created.on('error', (err) => dbLog.warn(`Mongoose connection error for ${projectId}: ${err?.message || err}`));
				try {
					await created.asPromise();
				} catch (connErr: any) {
					created.close().catch(() => {});
					throw new Error(`MongoDB connection failed for ${projectId}: ${connErr?.message || connErr}`);
				}
				rootConnections[projectId] = created;
				return created;
			})().finally(() => {
				delete inFlightConnections[projectId];
			});
		}
		rootConn = await inFlightConnections[projectId]!;
	}

	const projectModels: Record<string, Record<string, Model<any>>> = {};

	for (const [uriSuffix, collectionsMap] of Object.entries(registry)) {
		const cleanDbName = uriSuffix.replace(/^\/+/, '').replace(/\/+$/, '');

		let conn: Connection | undefined = activeConnections[projectId][uriSuffix];
		if (!conn || typeof conn.model !== 'function' || conn.readyState !== 1) {
			conn = rootConn.useDb(cleanDbName, { useCache: true });
			activeConnections[projectId][uriSuffix] = conn;
		}

		projectModels[uriSuffix] = {};

		for (const [key, def] of Object.entries(collectionsMap as Record<string, ModelDefinition>)) {
			try {
				if (process.env.NODE_ENV !== 'production' && conn.models[def.modelName]) {
					try {
						if (typeof (conn as any).deleteModel === 'function') (conn as any).deleteModel(def.modelName);
					} catch {}
					delete (conn.models as any)[def.modelName];
				}
				projectModels[uriSuffix][key] = conn.models[def.modelName] || conn.model(def.modelName, def.schema, def.collection);
			} catch (err) {
				dbLog.warn(`Failed to initialize ${def.modelName} in ${uriSuffix}: ${(err as any)?.message || err}`);
			}
		}
	}

	cachedModels[projectId] = projectModels;

	return {
		connections: activeConnections[projectId],
		models: projectModels,
	};
}
