/** @format */

import mongoose, { Connection, Model, Schema } from 'mongoose';

import { xernerxModels, virtueModels, hasteModels, yourappsModels } from './registry';
import { createLogger } from './terminal';

const dbLog = createLogger('DB');

export type DatabaseProjectId = 'xernerx' | 'virtue' | 'haste' | 'soteria' | 'yourapps';

type DatabaseHandle = {
	connections: Record<string, Connection>;
	models: Record<string, Record<string, Model<any>>>;
};

const globalWithMongoose = global as typeof global & {
	__connections?: Record<string, Record<string, Connection>>;
	__connections_v2?: Record<string, Record<string, Connection>>;
	__models_v4?: Record<string, Record<string, Record<string, Model<any>>>>;
	__root_connections_v5?: Record<string, Connection>;
	__db_connections_v5?: Record<string, Record<string, Connection>>;
	__inflight_connections_v5?: Record<string, Promise<Connection> | undefined>;
	__inflight_init_v5?: Record<string, Promise<DatabaseHandle> | undefined>;
	__models_v44?: Record<string, Record<string, Record<string, Model<any>>>>;
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

for (let v = 5; v <= 43; v++) {
	const key = `__models_v${v}`;
	if (globalWithMongoose[key]) {
		delete globalWithMongoose[key];
	}
}

const rootConnections = globalWithMongoose.__root_connections_v5 || (globalWithMongoose.__root_connections_v5 = {});
const activeConnections = globalWithMongoose.__db_connections_v5 || (globalWithMongoose.__db_connections_v5 = {});
const inFlightConnections = globalWithMongoose.__inflight_connections_v5 || (globalWithMongoose.__inflight_connections_v5 = {});
const inFlightInit = globalWithMongoose.__inflight_init_v5 || (globalWithMongoose.__inflight_init_v5 = {});
const cachedModels = globalWithMongoose.__models_v44 || (globalWithMongoose.__models_v44 = {});

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
		soteria: cleanEnvUri(process.env.MONGO_SOTERIA) || (isLocalMemoryServer ? xernerxUri : ''),
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

function clearProjectCache(projectId: DatabaseProjectId, expectedConn?: Connection) {
	if (expectedConn && rootConnections[projectId] !== expectedConn) {
		return;
	}
	delete rootConnections[projectId];
	activeConnections[projectId] = {};
	cachedModels[projectId] = {};
}

export async function resetDatabaseConnection(projectId: DatabaseProjectId): Promise<void> {
	const existing = rootConnections[projectId];
	delete rootConnections[projectId];
	delete inFlightConnections[projectId];
	delete inFlightInit[projectId];
	activeConnections[projectId] = {};
	cachedModels[projectId] = {};

	if (existing && typeof existing.close === 'function') {
		try {
			await existing.close();
		} catch {}
	}
}

export async function database(projectId: DatabaseProjectId): Promise<DatabaseHandle> {
	if (!activeConnections[projectId]) activeConnections[projectId] = {};
	if (!cachedModels[projectId]) cachedModels[projectId] = {};

	const existingRoot = rootConnections[projectId];
	if (existingRoot && isConnectionHealthy(existingRoot) && Object.keys(cachedModels[projectId]).length > 0) {
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

	if (inFlightInit[projectId]) {
		return inFlightInit[projectId]!;
	}

	const initPromise = (async (): Promise<DatabaseHandle> => {
		let rootConn = rootConnections[projectId];
		if (rootConn && !isConnectionHealthy(rootConn)) {
			try {
				rootConn.close().catch(() => {});
			} catch {}
			clearProjectCache(projectId, rootConn);
			rootConn = undefined as any;
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
						maxIdleTimeMS: 45000,
						connectTimeoutMS: 5000,
						serverSelectionTimeoutMS: 5000,
						socketTimeoutMS: 30000,
					});
					created.on('error', (err) => dbLog.warn(`Mongoose connection error for ${projectId}: ${err?.message || err}`));
					created.on('disconnected', () => clearProjectCache(projectId, created));
					created.on('close', () => clearProjectCache(projectId, created));
					try {
						await created.asPromise();
					} catch (connErr: any) {
						created.close().catch(() => {});
						throw new Error(`MongoDB connection failed for ${projectId}: ${connErr?.message || connErr}`, { cause: connErr });
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
	})().finally(() => {
		if (inFlightInit[projectId] === initPromise) {
			delete inFlightInit[projectId];
		}
	});

	inFlightInit[projectId] = initPromise;
	return initPromise;
}
