/** @format */

import http from 'http';
import { WebSocketServer, type WebSocket } from 'ws';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs/promises';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env configuration
for (const envPath of [path.resolve(__dirname, '../.env'), path.resolve(__dirname, '../../.env'), path.resolve(process.cwd(), '.env')]) {
	try {
		process.loadEnvFile(envPath);
	} catch {}
}

import { Terminal } from '@xernerx/terminal';
import { verifyWebsocketToken, checkTokenWebsocketAccess } from './lib/auth';

const terminal = new Terminal({ scope: 'WS', title: 'XERNERX', format: ['title', 'scope', 'datetime', 'memory'], spin: false });

process.on('uncaughtException', (err) => {
	terminal.error(`Uncaught exception: ${err?.stack || err?.message || err}`);
});

process.on('unhandledRejection', (reason) => {
	terminal.error(`Unhandled rejection: ${reason}`);
});

/* ================= TYPES ================= */

type AuthedWebSocket = WebSocket & {
	authed: boolean;
	authError?: string;
	tokenId?: string;
	userId?: string;
	tokenDoc?: any;
};

type ServiceFn = (
	msg: {
		method: string;
		action?: string;
		body: unknown;
	},
	ws: AuthedWebSocket
) => Promise<unknown>;

/* ================= PATH ================= */

const appDir = path.join(__dirname, './app');

/* ================= REGISTRY ================= */

const services: Record<string, ServiceFn> = {};

const methods = {
	GET: 'get',
	POST: 'create',
	PATCH: 'update',
	DELETE: 'delete',
} as const;

/* ================= LOAD SERVICES ================= */

async function loadServices() {
	const folders = await fs.readdir(appDir);

	for (const folder of folders) {
		let servicePath = path.join(appDir, folder, 'server.ts');
		try {
			await fs.access(servicePath);
		} catch {
			servicePath = path.join(appDir, folder, 'server.js');
		}

		try {
			const mod = await import(pathToFileURL(servicePath).href);
			services[folder] = mod.default;
			terminal.log(`Loaded service: ${folder}`);
		} catch (e) {
			terminal.warn(`Skipped ${folder}: ${(e as Error).message}`);
		}
	}
}

/* ================= ROUTER ================= */

function send(ws: WebSocket, data: any) {
	if (ws && ws.readyState === 1) {
		try {
			ws.send(typeof data === 'string' ? data : JSON.stringify(data));
		} catch (e) {
			terminal.warn(`Failed to send WebSocket message: ${(e as Error).message}`);
		}
	}
}

async function handleMessage(ws: AuthedWebSocket, msg: any) {
	const { id } = msg;

	if (!id) {
		return send(ws, { message: 'Missing request id' });
	}

	const service = services[msg.service];
	const method = methods[msg.method as keyof typeof methods];

	if (!service) {
		return send(ws, { id, message: 'Unknown service' });
	}

	if (!method) {
		return send(ws, { id, message: 'Unknown method' });
	}

	if (!msg.body || typeof msg.body !== 'object') {
		return send(ws, { id, message: 'Invalid body' });
	}

	terminal.log(`${msg.method?.toUpperCase()} ${msg.service}${msg.action ? '/' + msg.action : ''} (id: ${id})`);

	try {
		const data = await service(
			{
				method,
				action: msg.action,
				body: msg.body,
			},
			ws
		);

		let responseData = data ?? {};
		if (typeof (responseData as any).toJSON === 'function') {
			responseData = (responseData as any).toJSON();
		}

		send(ws, { ...responseData, id });
	} catch (err: unknown) {
		terminal.error(`Error handling ${msg.service}/${msg.action}: ${(err as Error)?.message || err}`);
		send(ws, {
			id,
			message: (err as Error)?.message || 'Server error',
		});
	}
}

/* ================= SERVER ================= */

async function start() {
	await loadServices();

	const port = Number(process.env.PORT) || 5000;
	const isDev = process.env.ENVIRONMENT?.toUpperCase() === 'DEVELOPMENT' || process.env.NODE_ENV?.toUpperCase() === 'DEVELOPMENT';
	const publicWsUrl = isDev ? 'wss://ws.dev.xernerx.com' : 'wss://ws.xernerx.com';

	const requestHandler: http.RequestListener = (req, res) => {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
		res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

		if (req.method === 'OPTIONS') {
			res.writeHead(204);
			res.end();
			return;
		}

		if (req.url === '/health') {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('ok');
			return;
		}

		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('alive');
	};

	const server = http.createServer(requestHandler);

	const wss = new WebSocketServer({ noServer: true });
	wss.on('error', (err) => {
		terminal.error(`WebSocketServer error: ${err.message}`);
	});

	const attachUpgradeHandler = (httpServer: http.Server) => {
		httpServer.on('upgrade', (req, socket, head) => {
			wss.handleUpgrade(req, socket, head, (ws) => {
				wss.emit('connection', ws, req);
			});
		});
	};

	attachUpgradeHandler(server);

	wss.on('connection', (ws: AuthedWebSocket, req) => {
		ws.authed = false;

		const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket.remoteAddress;

		terminal.log(`Connection established from ${ip}`);

		ws.on('error', (err) => {
			terminal.warn(`Socket error from ${ip}: ${err.message}`);
		});

		// Check for pre-authentication via URL query parameter (?token=...) or Authorization header
		const preAuthPromise = (async () => {
			try {
				const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
				const queryToken = url.searchParams.get('token');
				const authHeader = req.headers['authorization'];
				const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
				const initialToken = queryToken || bearerToken;

				if (initialToken) {
					const res = await verifyWebsocketToken(initialToken);
					if (res.valid && res.tokenId) {
						ws.authed = true;
						ws.authError = undefined;
						ws.tokenId = res.tokenId;
						ws.userId = res.userId;
						ws.tokenDoc = res.tokenDoc;
						terminal.log(`Connection pre-authenticated from ${ip} (token: ${res.tokenId})`);
					} else {
						ws.authed = false;
						ws.tokenId = undefined;
						ws.userId = undefined;
						ws.tokenDoc = undefined;
						ws.authError = res.message || 'Forbidden: Token does not have websocket permission';
						terminal.warn(`Pre-auth failed from ${ip}: ${ws.authError}`);
					}
				}
			} catch (e) {
				terminal.warn(`Pre-auth parse error from ${ip}: ${(e as Error).message}`);
			}
		})();

		let messageQueue: Promise<void> = preAuthPromise;

		ws.on('message', (data) => {
			messageQueue = messageQueue
				.then(async () => {
					try {
						const msg = JSON.parse(data.toString());

						if (!msg.service) {
							return send(ws, { message: 'Invalid message format' });
						}

						if (msg.service === 'auth') {
							const { token } = msg.body ?? {};

							if (!token || typeof token !== 'string') {
								ws.authed = false;
								ws.tokenId = undefined;
								ws.userId = undefined;
								ws.tokenDoc = undefined;
								return send(ws, { id: msg.id, success: false, message: 'Missing token' });
							}

							const res = await verifyWebsocketToken(token);

							if (!res.valid || !res.tokenId) {
								ws.authed = false;
								ws.tokenId = undefined;
								ws.userId = undefined;
								ws.tokenDoc = undefined;
								ws.authError = res.message || 'Forbidden: Token does not have websocket permission';
								return send(ws, { id: msg.id, success: false, message: ws.authError });
							}

							ws.authed = true;
							ws.authError = undefined;
							ws.tokenId = res.tokenId;
							ws.userId = res.userId;
							ws.tokenDoc = res.tokenDoc;

							terminal.log(`Client authenticated from ${ip} (token: ${res.tokenId})`);
							return send(ws, { id: msg.id, success: true });
						}

						if (!ws.authed || !ws.tokenId) {
							return send(ws, {
								id: msg.id,
								message: ws.authError || 'Unauthorized: A valid token with websocket permission is required',
							});
						}

						// Enforce live token state & websocket permission on every message
						const hasAccess = await checkTokenWebsocketAccess(ws.tokenId);
						if (!hasAccess) {
							ws.authed = false;
							ws.tokenId = undefined;
							ws.tokenDoc = undefined;
							ws.authError = 'Forbidden: Token websocket permission revoked or token inactive';
							return send(ws, { id: msg.id, message: ws.authError });
						}

						await handleMessage(ws, msg);
					} catch {
						send(ws, { message: 'Invalid JSON' });
					}
				})
				.catch((err) => {
					terminal.error(`Unexpected message queue error: ${(err as Error)?.message || err}`);
				});
		});

		ws.on('close', () => {
			terminal.log(`Connection disconnected from ${ip}`);
		});
	});

	server.listen(port, '0.0.0.0', () => {
		terminal.log(`Server running on port ${port}`);
		terminal.log(`Local gateway: ws://localhost:${port}`);
		terminal.log(`Cloudflare tunnel: ${publicWsUrl}`);
		terminal.log(`Websocket is ready`);
	});

	if (!process.env.PORT && !isDev) {
		for (const fallbackPort of [80, 3000]) {
			if (fallbackPort === port) continue;
			try {
				const auxServer = http.createServer(requestHandler);
				attachUpgradeHandler(auxServer);
				auxServer.on('error', () => {});
				auxServer.listen(fallbackPort, '0.0.0.0', () => {
					terminal.log(`Auxiliary listener bound on port ${fallbackPort}`);
				});
			} catch {}
		}
	}
}

start();
