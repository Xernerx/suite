/** @format */

import crypto from 'crypto';
import net from 'net';

const DEFAULT_DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1189674721899888751';

export interface RpcActivityPayload {
	details?: string;
	state?: string;
}

let socket: net.Socket | null = null;
let isReady = false;
let isEnabled = true;
const startTimestamp = Math.floor(Date.now() / 1000);
let lastActivity: RpcActivityPayload = {
	details: 'In Xernerx Desktop',
	state: 'Managing Workspace',
};

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

function sendActivityFrame(activity: RpcActivityPayload | null) {
	if (!socket || socket.destroyed || !isReady) return;
	try {
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
		socket.write(encodePacket(1, frame));
	} catch {}
}

function tryConnectPipe(index = 0) {
	if (!isEnabled || index > 9 || (socket && !socket.destroyed)) return;

	const pipePath = getIpcPath(index);
	const client = net.createConnection(pipePath);

	let connected = false;

	client.once('connect', () => {
		connected = true;
		socket = client;
		try {
			client.write(encodePacket(0, { v: 1, client_id: DEFAULT_DISCORD_CLIENT_ID }));
		} catch {}
	});

	client.on('data', () => {
		if (!isReady) {
			isReady = true;
			sendActivityFrame(isEnabled ? lastActivity : null);
		}
	});

	client.once('error', () => {
		client.destroy();
		if (!connected) {
			tryConnectPipe(index + 1);
		}
	});

	client.once('close', () => {
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
		if (socket && !socket.destroyed && isReady) {
			sendActivityFrame(null);
		}
		if (socket && !socket.destroyed) {
			socket.destroy();
		}
		socket = null;
		isReady = false;
		return;
	}

	if (!socket || socket.destroyed) {
		tryConnectPipe(0);
	} else if (isReady) {
		sendActivityFrame(lastActivity);
	}
}
