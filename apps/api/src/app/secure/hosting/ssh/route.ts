/** @format */

import { NextRequest, NextResponse } from 'next/server';
import dns from 'node:dns/promises';
import { Client } from 'ssh2';
import { database } from '@xernerx/lib/server';

export const dynamic = 'force-dynamic';

function isIpv4(str: string): boolean {
	return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(str.trim());
}

function isCloudflareProxyIp(ip: string): boolean {
	const parts = ip.split('.').map((n) => parseInt(n, 10));
	if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
	const [a, b] = parts;
	if (a === 104 && b >= 16 && b <= 31) return true;
	if (a === 172 && b >= 64 && b <= 71) return true;
	if (a === 108 && b === 162) return true;
	if (a === 162 && (b === 158 || b === 159)) return true;
	if (a === 198 && b === 41) return true;
	if (a === 188 && b === 114) return true;
	if (a === 190 && b === 93) return true;
	if (a === 197 && b === 234) return true;
	if (a === 131 && b === 0) return true;
	return false;
}

async function tryResolveEasypanelServerIp(hostname: string, user: any, fallbackPassword?: string): Promise<string | null> {
	try {
		const epConn = Array.isArray(user?.connections) ? user.connections.find((c: any) => c.provider === 'easypanel') : null;
		let token = epConn?.token || '';
		if (!token) {
			const rawEmail = String(epConn?.username || user?.email || '').trim();
			const candidateEmails = Array.from(new Set([rawEmail, rawEmail.includes('@') && !rawEmail.split('@')[1]?.includes('.') ? `${rawEmail}.me` : '', 'dummi@dummi.me'].filter(Boolean)));
			const password = epConn?.secret || fallbackPassword || '';
			if (password) {
				for (const email of candidateEmails) {
					const loginRes = await fetch(`https://${hostname}/api/trpc/auth.login`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ json: { email, password } }),
						signal: AbortSignal.timeout(4000),
					});
					if (loginRes.ok) {
						const loginData: any = await loginRes.json().catch(() => ({}));
						token = loginData?.json?.token || loginData?.result?.data?.json?.token || loginData?.result?.data?.token || '';
						if (token) break;
					}
				}
			}
		}
		if (!token) return null;
		const ipRes = await fetch(`https://${hostname}/api/trpc/settings.getServerIp`, {
			headers: { Authorization: token },
			signal: AbortSignal.timeout(4000),
		});
		if (!ipRes.ok) return null;
		const ipData: any = await ipRes.json().catch(() => ({}));
		const serverIp = String(ipData?.json || ipData?.result?.data?.json || ipData?.result?.data || '').trim();
		return isIpv4(serverIp) ? serverIp : null;
	} catch {
		return null;
	}
}

function parseSshTarget(rawTarget: string, defaultPort = 22): { username: string; host: string; port: number } {
	let cleaned = rawTarget.trim().replace(/^ssh:\/\//i, '');
	let username = 'root';
	if (cleaned.includes('@')) {
		const [userPart, hostPart] = cleaned.split('@');
		if (userPart) username = userPart.trim();
		cleaned = (hostPart || '').trim();
	}
	let host = cleaned;
	let port = defaultPort;
	if (cleaned.includes(':')) {
		const [h, p] = cleaned.split(':');
		host = h.trim();
		const parsedPort = parseInt(p, 10);
		if (!Number.isNaN(parsedPort) && parsedPort > 0 && parsedPort <= 65535) {
			port = parsedPort;
		}
	}
	return { username, host, port };
}

function shellSingleQuote(str: string): string {
	return `'${str.replace(/'/g, `'\\''`)}'`;
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json().catch(() => ({}));
		const userId = String(body.userId || '').trim();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized: Missing userId' }, { status: 401 });
		}

		const { models } = await database('xernerx');
		const user = (await models.users.User.findOne({ id: userId }).lean()) as any;
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const userRoles: string[] = Array.isArray(user.roles) ? user.roles : [];
		const roles = userRoles.length > 0 ? await models.core.Role.find({ id: { $in: userRoles } }).lean() : [];
		const hasHostingPermission = roles.some((r: any) => Boolean(r?.permissions?.hosting));
		if (!hasHostingPermission) {
			return NextResponse.json({ error: 'Forbidden: Missing server hosting permission' }, { status: 403 });
		}

		const rawTarget = String(body.target || '').trim();
		if (!rawTarget) {
			return NextResponse.json({ error: 'SSH target (root@ip) is required' }, { status: 400 });
		}

		const requestedPort = body.port ? parseInt(String(body.port), 10) : 22;
		const parsedTarget = parseSshTarget(rawTarget, Number.isNaN(requestedPort) ? 22 : requestedPort);
		const username = parsedTarget.username;
		const port = parsedTarget.port;
		let host = parsedTarget.host;

		if (!host) {
			return NextResponse.json({ error: 'Invalid SSH host/IP address' }, { status: 400 });
		}

		const password = body.password !== undefined ? String(body.password) : '';
		const privateKey = body.privateKey !== undefined ? String(body.privateKey) : '';
		const command = String(body.command || 'uname -a && uptime').trim();
		const cwd = String(body.cwd || '').trim();

		if (!password && !privateKey) {
			return NextResponse.json({ error: 'Please enter the SSH root password to execute commands on this server.' }, { status: 400 });
		}

		if (host.toLowerCase() === 'one-dummi.xernerx.com') {
			host = '172.235.181.92';
		} else if (host.toLowerCase() === 'two-dummi.xernerx.com') {
			host = '62.235.163.212';
		}

		if (isIpv4(host) && isCloudflareProxyIp(host)) {
			return NextResponse.json(
				{
					ok: false,
					error: `${host} is a Cloudflare proxy IP (not your VPS origin IP). Use root@172.235.181.92 for one-dummi or root@62.235.163.212 for two-dummi.`,
				},
				{ status: 400 }
			);
		}

		if (!isIpv4(host) && !host.includes(':')) {
			const easypanelIp = await tryResolveEasypanelServerIp(host, user, password);
			if (easypanelIp) {
				host = easypanelIp;
			} else {
				try {
					const resolvedAddresses = await dns.resolve4(host);
					if (resolvedAddresses.length > 0 && resolvedAddresses.every(isCloudflareProxyIp)) {
						return NextResponse.json(
							{
								ok: false,
								error: `"${host}" is proxied through Cloudflare, which blocks SSH on port ${port}.\nUse root@172.235.181.92 for one-dummi or root@62.235.163.212 for two-dummi.`,
							},
							{ status: 400 }
						);
					}
				} catch {}
			}
		}

		const pwdMarker = '__XERNERX_PWD_MARKER__';
		const wrappedCommand = cwd
			? `cd ${shellSingleQuote(cwd)} 2>/dev/null || true; ${command}; __ec=$?; printf "\\n${pwdMarker}%s\\n" "$PWD"; exit $__ec`
			: `${command}; __ec=$?; printf "\\n${pwdMarker}%s\\n" "$PWD"; exit $__ec`;

		const result = await new Promise<{ stdout: string; stderr: string; exitCode: number; cwd: string }>((resolve, reject) => {
			const conn = new Client();
			let settled = false;

			const timer = setTimeout(() => {
				if (!settled) {
					settled = true;
					conn.end();
					reject(new Error(`SSH connection to ${username}@${host}:${port} timed out after 12s`));
				}
			}, 12000);

			conn.on('ready', () => {
				conn.exec(wrappedCommand, (err, stream) => {
					if (err) {
						clearTimeout(timer);
						settled = true;
						conn.end();
						return reject(err);
					}

					let stdout = '';
					let stderr = '';

					stream.on('data', (chunk: Buffer) => {
						stdout += chunk.toString('utf-8');
					});

					stream.stderr.on('data', (chunk: Buffer) => {
						stderr += chunk.toString('utf-8');
					});

					stream.on('close', (code: number) => {
						clearTimeout(timer);
						if (!settled) {
							settled = true;
							conn.end();

							let nextCwd = cwd || '~';
							const markerIdx = stdout.lastIndexOf(pwdMarker);
							if (markerIdx !== -1) {
								const afterMarker = stdout.slice(markerIdx + pwdMarker.length).trim();
								if (afterMarker) nextCwd = afterMarker.split(/\r?\n/)[0].trim();
								stdout = stdout.slice(0, markerIdx).replace(/\r?\n$/, '');
							}

							resolve({
								stdout,
								stderr,
								exitCode: typeof code === 'number' ? code : 0,
								cwd: nextCwd,
							});
						}
					});
				});
			});

			conn.on('error', (err) => {
				clearTimeout(timer);
				if (!settled) {
					settled = true;
					reject(err);
				}
			});

			const connectConfig: Record<string, any> = {
				host,
				port,
				username,
				readyTimeout: 10000,
			};

			if (privateKey) {
				connectConfig.privateKey = privateKey;
				if (password) connectConfig.passphrase = password;
			} else if (password) {
				connectConfig.password = password;
			}

			conn.connect(connectConfig);
		});

		return NextResponse.json({
			ok: true,
			target: `${username}@${host}:${port}`,
			resolvedHost: host,
			command,
			...result,
		});
	} catch (err: any) {
		return NextResponse.json(
			{
				ok: false,
				error: err?.message || 'SSH connection failed',
			},
			{ status: 500 }
		);
	}
}
