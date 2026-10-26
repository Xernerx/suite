/** @format */

import crypto from 'crypto';
import net from 'net';

const DEFAULT_DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1189674721899888751';

export interface RpcActivityPayload {
	details?: string;
	state?: string;
}

let socket: net.Socket | null = null;
let pendingClient: net.Socket | null = null;
let isReady = false;
let isEnabled = true;
let isIdleOverride = false;
const startTimestamp = Math.floor(Date.now() / 1000);
let lastActivity: RpcActivityPayload = {
	details: 'In Xernerx Desktop',
	state: 'Managing Workspace',
};

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
						details: activity.details || 'In Xernerx Desktop',
						state: activity.state || 'Managing Workspace',
						timestamps: { start: startTimestamp },
						assets: {
							large_image: 'logo',
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
		socket.write(buildActivityPacket(activity));
	} catch {}
}

function tryConnectPipe(index = 0) {
	if (!isEnabled || index > 9 || (socket && !socket.destroyed)) return;

	const pipePath = getIpcPath(index);
	const client = net.createConnection(pipePath);
	pendingClient = client;

	let connected = false;

	client.once('connect', () => {
		if (pendingClient === client) pendingClient = null;
		if (!isEnabled) {
			client.destroy();
			return;
		}
		connected = true;
		socket = client;
		try {
			client.write(encodePacket(0, { v: 1, client_id: DEFAULT_DISCORD_CLIENT_ID }));
		} catch {}
	});

	client.on('data', () => {
		if (!isEnabled) {
			client.destroy();
			return;
		}
		if (!isReady) {
			isReady = true;
			sendActivityFrame(getEffectiveActivity());
		}
	});

	client.once('error', () => {
		if (pendingClient === client) pendingClient = null;
		client.destroy();
		if (!connected && isEnabled) {
			tryConnectPipe(index + 1);
		}
	});

	client.once('close', () => {
		if (pendingClient === client) pendingClient = null;
		if (socket === client) {
			socket = null;
			isReady = false;
		}
	});
}

export function syncDiscordRpc(enabled: boolean, activity?: RpcActivityPayload) {
	isEnabled = enabled;
	if (activity) {
		lastActivity = { ...lastActivity, ...activity };
	}

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
		tryConnectPipe(0);
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
