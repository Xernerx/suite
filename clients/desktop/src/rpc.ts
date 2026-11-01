/** @format */

import { app } from 'electron';
import crypto from 'crypto';
import fs from 'fs';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROD_DISCORD_CLIENT_ID = '1317801434389151774';
const DEV_DISCORD_CLIENT_ID = '1563881720397434910';

function resolveClientIds(): string[] {
	const ids: string[] = [];
	if (process.env.DISCORD_CLIENT_ID) {
		ids.push(process.env.DISCORD_CLIENT_ID.trim());
	}
	if (!app.isPackaged) {
		const envCandidates = [path.resolve(__dirname, '../.env'), path.resolve(__dirname, '../../../.env'), path.resolve(process.cwd(), '.env')];
		for (const envFile of envCandidates) {
			try {
				if (!fs.existsSync(envFile)) continue;
				const content = fs.readFileSync(envFile, 'utf-8');
				const match = content.match(/^DISCORD_CLIENT_ID\s*=\s*['"]?([0-9]{15,22})['"]?/m);
				if (match?.[1] && !ids.includes(match[1])) {
					ids.push(match[1]);
				}
			} catch {}
		}
	}
	const primaryDefault = app.isPackaged ? PROD_DISCORD_CLIENT_ID : DEV_DISCORD_CLIENT_ID;
	for (const fallbackId of [primaryDefault, PROD_DISCORD_CLIENT_ID, DEV_DISCORD_CLIENT_ID]) {
		if (!ids.includes(fallbackId)) {
			ids.push(fallbackId);
		}
	}
	return ids;
}

const CLIENT_ID_CANDIDATES = resolveClientIds();

export interface RpcActivityPayload {
	details?: string;
	state?: string;
}

let socket: net.Socket | null = null;
let pendingClient: net.Socket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let activeClientIdIndex = 0;
let isReady = false;
let isEnabled = true;
let isIdleOverride = false;
let rpcLog: (msg: string) => void = () => {};
const startTimestamp = Math.floor(Date.now() / 1000);
let lastActivity: RpcActivityPayload = {
	details: 'In Xernerx Desktop',
	state: 'Managing Workspace',
};

export function setRpcLogger(logger: (msg: string) => void) {
	rpcLog = logger;
}

function getEffectiveActivity(): RpcActivityPayload {
	if (isIdleOverride) {
		return {
			details: lastActivity.details || 'In Xernerx Desktop',
			state: 'Away from Desk (Idle)',
		};
	}
	return lastActivity;
}

function getIpcPath(index: number): string {
	if (process.platform === 'win32') {
		return `\\\\?\\pipe\\discord-ipc-${index}`;
	}
	const prefix = process.env.XDG_RUNTIME_DIR || process.env.TMPDIR || process.env.TMP || process.env.TEMP || '/tmp';
	return `${prefix.replace(/\/$/, '')}/discord-ipc-${index}`;
}

function encodePacket(op: number, data: Record<string, any>): Buffer {
	const payload = Buffer.from(JSON.stringify(data), 'utf8');
	const header = Buffer.alloc(8);
	header.writeInt32LE(op, 0);
	header.writeInt32LE(payload.length, 4);
	return Buffer.concat([header, payload]);
}

function buildActivityPacket(activity: RpcActivityPayload | null): Buffer {
	const frame = {
		cmd: 'SET_ACTIVITY',
		args: {
			pid: process.pid,
			activity: activity
				? {
						type: 3,
						created_at: Date.now(),
						details: activity.details || 'In Xernerx Desktop',
						state: activity.state || 'Managing Workspace',
						timestamps: { start: startTimestamp },
						assets: {
							large_image: 'https://xernerx.com/icon.png',
							large_text: 'Xernerx Suite',
						},
						buttons: [{ label: 'Xernerx Suite', url: 'https://xernerx.com' }],
					}
				: null,
		},
		nonce: crypto.randomUUID(),
	};
	return encodePacket(1, frame);
}

function sendActivityFrame(activity: RpcActivityPayload | null) {
	if (!socket || socket.destroyed || !isReady) return;
	try {
		const packet = buildActivityPacket(activity);
		socket.write(packet);
		rpcLog(`RPC SENT SET_ACTIVITY: pid=${process.pid} details="${activity?.details || ''}" state="${activity?.state || ''}"`);
	} catch (err) {
		rpcLog(`RPC WRITE ERROR: ${(err as Error)?.message || err}`);
	}
}

function ensureReconnectLoop() {
	if (!isEnabled) {
		if (reconnectTimer) {
			clearInterval(reconnectTimer);
			reconnectTimer = null;
		}
		return;
	}
	if (reconnectTimer) return;
	reconnectTimer = setInterval(() => {
		if (!isEnabled) return;
		if ((!socket || socket.destroyed) && (!pendingClient || pendingClient.destroyed)) {
			tryConnectPipe(0, activeClientIdIndex);
		}
	}, 15000);
	if (typeof reconnectTimer.unref === 'function') {
		reconnectTimer.unref();
	}
}

function tryConnectPipe(index = 0, clientIdIdx = activeClientIdIndex) {
	if (!isEnabled || index > 9 || (socket && !socket.destroyed) || (pendingClient && !pendingClient.destroyed)) return;

	const clientId = CLIENT_ID_CANDIDATES[clientIdIdx] || PROD_DISCORD_CLIENT_ID;
	const pipePath = getIpcPath(index);
	const client = net.createConnection(pipePath);
	pendingClient = client;

	let connected = false;
	let rejectedClientId = false;

	client.once('connect', () => {
		if (pendingClient === client) pendingClient = null;
		if (!isEnabled) {
			client.destroy();
			return;
		}
		connected = true;
		socket = client;
		rpcLog(`RPC CONNECTED: pipe=${pipePath} clientId=${clientId} pid=${process.pid}`);
		try {
			client.write(encodePacket(0, { v: 1, client_id: clientId }));
		} catch (err) {
			rpcLog(`RPC HANDSHAKE ERROR: ${(err as Error)?.message || err}`);
		}
	});

	client.on('data', (buf: Buffer) => {
		if (!isEnabled) {
			client.destroy();
			return;
		}
		if (buf.length < 8) return;
		const op = buf.readInt32LE(0);
		const len = buf.readInt32LE(4);
		const rawJson = buf.subarray(8, 8 + len).toString('utf8');
		rpcLog(`RPC RECV op=${op}: ${rawJson.slice(0, 300)}`);

		if (op === 3) {
			// Respond to Discord PING with PONG
			try {
				let pingPayload: Record<string, any> = {};
				try {
					pingPayload = JSON.parse(rawJson);
				} catch {}
				client.write(encodePacket(4, pingPayload));
			} catch {}
			return;
		}

		if (op === 2) {
			// Close / Invalid Client ID frame from Discord
			rejectedClientId = true;
			isReady = false;
			client.destroy();
			if (isEnabled && clientIdIdx + 1 < CLIENT_ID_CANDIDATES.length) {
				activeClientIdIndex = clientIdIdx + 1;
				setTimeout(() => tryConnectPipe(index, activeClientIdIndex), 250);
			}
			return;
		}

		if (op === 1 && !isReady) {
			isReady = true;
			activeClientIdIndex = clientIdIdx;
			sendActivityFrame(getEffectiveActivity());
		}
	});

	client.once('error', (err) => {
		if (pendingClient === client) pendingClient = null;
		client.destroy();
		if (!connected && isEnabled) {
			if (index === 0) {
				rpcLog(`RPC PIPE 0 ERROR: ${(err as Error)?.message || err} (trying next pipes)`);
			}
			tryConnectPipe(index + 1, clientIdIdx);
		}
	});

	client.once('close', () => {
		if (pendingClient === client) pendingClient = null;
		if (socket === client) {
			rpcLog(`RPC SOCKET CLOSED (clientId=${clientId})`);
			socket = null;
			isReady = false;
		}
		if (rejectedClientId) return;
	});
}

export function syncDiscordRpc(enabled: boolean, activity?: RpcActivityPayload) {
	isEnabled = enabled;
	if (activity) {
		lastActivity = { ...lastActivity, ...activity };
	}

	ensureReconnectLoop();

	if (!isEnabled) {
		if (pendingClient && !pendingClient.destroyed) {
			pendingClient.destroy();
		}
		pendingClient = null;

		const activeSocket = socket;
		const wasReady = isReady;
		socket = null;
		isReady = false;

		if (activeSocket && !activeSocket.destroyed) {
			try {
				if (wasReady) {
					activeSocket.write(buildActivityPacket(null), () => {
						try {
							activeSocket.write(encodePacket(2, {}));
						} catch {}
						setTimeout(() => {
							if (!activeSocket.destroyed) activeSocket.destroy();
						}, 150);
					});
				} else {
					activeSocket.destroy();
				}
			} catch {
				if (!activeSocket.destroyed) activeSocket.destroy();
			}
		}
		return;
	}

	if (!socket || socket.destroyed) {
		tryConnectPipe(0, activeClientIdIndex);
	} else if (isReady) {
		sendActivityFrame(getEffectiveActivity());
	}
}

export function setRpcIdleOverride(idle: boolean) {
	if (isIdleOverride === idle) return;
	isIdleOverride = idle;
	if (isEnabled && isReady) {
		sendActivityFrame(getEffectiveActivity());
	}
}
