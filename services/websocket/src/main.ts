/** @format */

import http from 'http';
import { WebSocketServer, type WebSocket } from 'ws';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs/promises';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env configuration
for (const envPath of [
	path.resolve(__dirname, '../.env'),
	path.resolve(__dirname, '../../.env'),
	path.resolve(process.cwd(), '.env'),
]) {
	try {
		process.loadEnvFile(envPath);
	} catch {}
}

import { Terminal } from '@xernerx/terminal';
import { verifyWebsocketToken, checkTokenWebsocketAccess } from './lib/auth';

const terminal = new Terminal({ scope: 'WS', title: 'XERNERX', format: ['title', 'scope', 'datetime', 'memory'] });

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

async function handleMessage(ws: AuthedWebSocket, msg: any) {
	const { id } = msg;

	if (!id) {
		return ws.send(JSON.stringify({ message: 'Missing request id' }));
	}

	const service = services[msg.service];
	const method = methods[msg.method as keyof typeof methods];

	if (!service) {
		return ws.send(JSON.stringify({ id, message: 'Unknown service' }));
	}

	if (!method) {
		return ws.send(JSON.stringify({ id, message: 'Unknown method' }));
	}

	if (!msg.body || typeof msg.body !== 'object') {
		return ws.send(JSON.stringify({ id, message: 'Invalid body' }));
	}

	try {
		const data = await service(
			{
				method,
				action: msg.action,
				body: msg.body,
			},
			ws
		);

		ws.send(JSON.stringify({ id, ...(data ?? {}) }));
	} catch (err: unknown) {
		ws.send(
			JSON.stringify({
				id,
				message: (err as Error)?.message || 'Server error',
			})
		);
	}
}

/* ================= SERVER ================= */

async function start() {
	await loadServices();

	const port = Number(process.env.PORT) || 5000;

	const server = http.createServer((req, res) => {
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
	});

	const wss = new WebSocketServer({ server });

	wss.on('connection', async (ws: AuthedWebSocket, req) => {
		ws.authed = false;

		const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket.remoteAddress;

		terminal.log(`Connection established from ${ip}`);

		// Check for pre-authentication via URL query parameter (?token=...) or Authorization header
		try {
			const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
			const queryToken = url.searchParams.get('token');
			const authHeader = req.headers['authorization'];
			const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
			const initialToken = queryToken || bearerToken;

			if (initialToken) {
				const res = await verifyWebsocketToken(initialToken);
				if (res.valid) {
					ws.authed = true;
					ws.authError = undefined;
					ws.tokenId = res.tokenId;
					ws.userId = res.userId;
					ws.tokenDoc = res.tokenDoc;
					terminal.log(`Connection pre-authenticated from ${ip} (token: ${res.tokenId || 'jwt'})`);
				} else {
					ws.authError = res.message;
					terminal.warn(`Pre-auth failed from ${ip}: ${res.message}`);
				}
			}
		} catch (e) {
			terminal.warn(`Pre-auth parse error from ${ip}: ${(e as Error).message}`);
		}

		ws.on('message', async (data) => {
			try {
				const msg = JSON.parse(data.toString());

				if (!msg.service) {
					return ws.send(JSON.stringify({ message: 'Invalid message format' }));
				}

				if (msg.service === 'auth') {
					const { token } = msg.body ?? {};

					if (!token || typeof token !== 'string') {
						return ws.send(JSON.stringify({ id: msg.id, success: false, message: 'Missing token' }));
					}

					const res = await verifyWebsocketToken(token);

					if (!res.valid) {
						ws.authed = false;
						ws.authError = res.message;
						return ws.send(JSON.stringify({ id: msg.id, success: false, message: res.message || 'Invalid token' }));
					}

					ws.authed = true;
					ws.authError = undefined;
					ws.tokenId = res.tokenId;
					ws.userId = res.userId;
					ws.tokenDoc = res.tokenDoc;

					terminal.log(`Client authenticated from ${ip} (token: ${res.tokenId || 'jwt'})`);
					return ws.send(JSON.stringify({ id: msg.id, success: true }));
				}

				if (!ws.authed) {
					return ws.send(JSON.stringify({ id: msg.id, message: ws.authError || 'unauthorized' }));
				}

				// Extra safety check: ensure the token state hasn't been revoked
				if (ws.tokenId) {
					const hasAccess = await checkTokenWebsocketAccess(ws.tokenId);
					if (!hasAccess) {
						ws.authed = false;
						return ws.send(JSON.stringify({ id: msg.id, message: 'Forbidden: websocket permission revoked' }));
					}
				}

				await handleMessage(ws, msg);
			} catch {
				ws.send(JSON.stringify({ message: 'Invalid JSON' }));
			}
		});

		ws.on('close', () => {
			terminal.log(`Connection disconnected from ${ip}`);
		});
	});

	server.listen(port, '0.0.0.0', () => {
		terminal.log(`Server running on port ${port}`);
		terminal.log(`Local gateway: ws://localhost:${port}`);
		terminal.log(`Cloudflare tunnel: wss://ws.dev.xernerx.com`);
	});
}

start();
