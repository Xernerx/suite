/** @format */

import http from 'http';
import { WebSocketServer, type WebSocket } from 'ws';
import database from './lib/database.js';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs/promises';
import path from 'path';
import { jwtVerify } from 'jose';
import { Terminal } from '@xernerx/terminal';

database();

const terminal = new Terminal({ scope: 'WS', title: 'XERNERX', format: ['title', 'scope', 'datetime', 'memory'] });

const secret = new TextEncoder().encode(process.env.WS_TOKEN!);
/* ================= TYPES ================= */

type AuthedWebSocket = WebSocket & {
	authed: boolean;
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
		const servicePath = path.join(appDir, folder, 'server.js');

		try {
			const mod = await import(pathToFileURL(servicePath).href);
			services[folder] = mod.default;
			console.log(`Loaded service: ${folder}`);
		} catch (e) {
			console.warn(`Skipped ${folder} (no server.js) ${(e as Error).message}`);
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
		if (req.url === '/health') {
			res.writeHead(200);
			res.end('ok');
			return;
		}

		res.writeHead(200);
		res.end('alive');
	});

	const wss = new WebSocketServer({ server });

	wss.on('connection', (ws: AuthedWebSocket, req) => {
		ws.authed = false;

		const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket.remoteAddress;

		terminal.log(`Connection established from ${ip}`);

		ws.on('message', async (data) => {
			try {
				const msg = JSON.parse(data.toString());

				if (!msg.service) {
					return ws.send(JSON.stringify({ message: 'Invalid message format' }));
				}

				if (msg.service === 'auth') {
					const { token } = msg.body ?? {};

					if (!token || typeof token !== 'string') {
						return ws.send(JSON.stringify({ id: msg.id, message: 'Missing token' }));
					}

					try {
						const { payload } = await jwtVerify(token, secret).catch(() => ({ payload: null }));

						if (!payload && token !== process.env.WS_TOKEN) throw new Error('Invalid Token');

						ws.authed = true;

						// optional but useful
						(ws as any).userId = payload?.userId;

						return ws.send(JSON.stringify({ id: msg.id, success: true }));
					} catch (e) {
						return ws.send(JSON.stringify({ id: msg.id, message: 'Invalid token' }));
					}
				}

				if (!ws.authed) {
					return ws.send(JSON.stringify({ id: msg.id, message: 'unauthorized' }));
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
		console.log(`Server running on port ${port}`);
	});
}

start();
