import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { runCommand } from '../utils/run';
import { generateLocalesCommand } from './generateLocales';
import { walkAndSync } from './init';
import { getLocalIp } from '../utils/ip';

export default function registerDev(program: Command) {
	program
		.command('dev')
		.description('Start the development servers and conditionally run the tunnel')
		.option('--only <type>', 'Run only a specific workspace type (apps, services, clients, tunnel)')
		.option('--prepare-only', 'Run only the environment preparation step and exit')
		.action(async (options) => {
			const rootEnvPath = path.join(process.cwd(), '.env');

			console.log('[CLI] Pre-flight: Generating locales...');
			generateLocalesCommand();

			console.log('[CLI] Synchronizing root .env to all workspaces...');
			walkAndSync(process.cwd(), rootEnvPath);
			let hasCustomDomain = false;
			let currentDomain = '';

			if (fs.existsSync(rootEnvPath)) {
				let envContent = fs.readFileSync(rootEnvPath, 'utf8');

				// Inject variables into process.env so child processes (like node/tsx) inherit them
				envContent.split('\n').forEach((line) => {
					const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
					if (match) {
						const key = match[1];
						let val = match[2] || '';
						if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
						else if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
						if (process.env[key] === undefined) process.env[key] = val;
					}
				});

				// Extract domain values if they exist
				const domainMatch = envContent.match(/^DOMAIN="(.*)"/m);
				currentDomain = domainMatch ? domainMatch[1].trim() : '';

				const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(currentDomain);
				const isLocalhost = currentDomain === 'localhost' || currentDomain === '127.0.0.1';

				const hasDomainDefined = /^DOMAIN=/m.test(envContent);
				const hasNextPublicDomainDefined = /^NEXT_PUBLIC_DOMAIN=/m.test(envContent);

				// Treat it as undefined if it's missing OR if it's already an IP (so we can keep it updated)
				const shouldInjectIp = (!hasDomainDefined && !hasNextPublicDomainDefined) || isIp || currentDomain === '';

				if (shouldInjectIp && !isLocalhost) {
					const localIp = getLocalIp();
					if (currentDomain !== localIp) {
						console.log(`[CLI] Dynamically injecting DOMAIN to local IP: ${localIp}`);
						if (hasDomainDefined) {
							envContent = envContent.replace(/^DOMAIN=".*"/m, `DOMAIN="${localIp}"`);
						} else {
							envContent += `\nDOMAIN="${localIp}"\n`;
						}

						if (hasNextPublicDomainDefined) {
							envContent = envContent.replace(/^NEXT_PUBLIC_DOMAIN=".*"/m, `NEXT_PUBLIC_DOMAIN="${localIp}"`);
						} else {
							envContent += `NEXT_PUBLIC_DOMAIN="${localIp}"\n`;
						}

						fs.writeFileSync(rootEnvPath, envContent);
						console.log('[CLI] Syncing updated .env to workspaces...');
						walkAndSync(process.cwd(), rootEnvPath);
					}
					hasCustomDomain = false;
					currentDomain = localIp;
				} else {
					const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(currentDomain);
					const isLocalhost = currentDomain === 'localhost' || currentDomain === '127.0.0.1';

					if (isIp || isLocalhost) {
						hasCustomDomain = false;
					} else {
						hasCustomDomain = true;
						const currentNextDomainMatch = envContent.match(/^NEXT_PUBLIC_DOMAIN="(.*)"/m);
						const currentNextDomain = currentNextDomainMatch ? currentNextDomainMatch[1].trim() : '';
						if (currentNextDomain !== currentDomain) {
							if (currentNextDomainMatch) {
								envContent = envContent.replace(/^NEXT_PUBLIC_DOMAIN=".*"/m, `NEXT_PUBLIC_DOMAIN="${currentDomain}"`);
							} else {
								envContent += `\nNEXT_PUBLIC_DOMAIN="${currentDomain}"\n`;
							}
							fs.writeFileSync(rootEnvPath, envContent);
							console.log(`[CLI] Syncing custom domain '${currentDomain}' to NEXT_PUBLIC_DOMAIN...`);
							walkAndSync(process.cwd(), rootEnvPath);
						}
					}
				}

				// Handle MongoDB Memory Server auto-spawning
				const mongoMatch = envContent.match(/^MONGO_XERNERX=["']?(.*?)["']?$/m);
				const mongoUri = mongoMatch ? mongoMatch[1].trim() : '';

				if (!mongoUri) {
					console.log('[CLI] No remote MongoDB URI detected in .env.');
					console.log('[CLI] Spawning built-in mongodb-memory-server (Zero Configuration)...');
					try {
						// Dynamically import to not block the rest of the CLI
						const { MongoMemoryServer } = await import('mongodb-memory-server');

						// Start a persistent memory server bound to 27017
						// It stores data in .xernerx/database so it survives restarts!
						const dbPath = path.join(process.cwd(), '.xernerx', 'database');
						if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });

						const mongod = await MongoMemoryServer.create({
							instance: {
								port: 27017,
								dbPath: dbPath,
								storageEngine: 'wiredTiger',
							},
						});

						process.env.MONGO_XERNERX = mongod.getUri();
						console.log(`[CLI] \x1b[32m✔\x1b[0m MongoDB successfully running natively at ${mongod.getUri()}`);
					} catch (e: any) {
						if (e.message?.includes('EADDRINUSE')) {
							process.env.MONGO_XERNERX = 'mongodb://127.0.0.1:27017/';
							console.log('[CLI] Local MongoDB is already running on port 27017. Attaching...');
						} else {
							console.log('\x1b[31m[ERROR]\x1b[0m Failed to spawn mongodb-memory-server:', e.message);
						}
					}
				}
			}

			if (options.prepareOnly) {
				console.log('[CLI] Preparation complete. Exiting (--prepare-only).');
				return;
			}

			if (options.only) {
				const type = options.only;
				console.log(`[CLI] Running only: ${type}`);
				if (type === 'apps') {
					runCommand('pnpm', ['--parallel', '--filter', './apps/*', 'dev']);
				} else if (type === 'services') {
					runCommand('pnpm', ['--parallel', '--filter', './services/*', 'dev']);
				} else if (type === 'clients') {
					runCommand('pnpm', ['--parallel', '--filter', './clients/*', 'dev']);
				} else if (type === 'tunnel') {
					process.env.TUNNEL_LOGLEVEL = 'error';
					runCommand('cloudflared', ['tunnel', '--protocol', 'http2', 'run']);
				} else {
					console.log(`\x1b[31m[ERROR]\x1b[0m Unknown --only type: ${type}`);
				}
			} else {
				if (hasCustomDomain) {
					console.log('[CLI] Custom domain detected. Starting apps and Cloudflare Tunnel...');
					printEndpointsBox(currentDomain, hasCustomDomain);
					process.env.TUNNEL_LOGLEVEL = 'error';
					process.env.NEXT_PUBLIC_DOMAIN = currentDomain;
					runCommand('npx', [
						'concurrently',
						'-n',
						'apps,tunnel',
						'-c',
						'blue,green',
						'"pnpm --parallel --filter ./apps/* --filter ./services/* --filter ./clients/* dev"',
						'"cloudflared tunnel --protocol http2 run"',
					]);
				} else {
					console.log('[CLI] Local IP mode detected. Starting apps without tunnel...');
					printEndpointsBox(currentDomain, hasCustomDomain);
					process.env.NEXT_PUBLIC_DOMAIN = currentDomain;
					runCommand('npx', ['concurrently', '-n', 'apps', '-c', 'blue', '"pnpm --parallel --filter ./apps/* --filter ./services/* --filter ./clients/* dev"']);
				}
			}
		});
}

function printEndpointsBox(domain: string, isCustomDomain: boolean) {
	setTimeout(() => {
		const apps = [
			{ name: 'WWW', port: 4000 },
			{ name: 'API', port: 4001 },
			{ name: 'CDN', port: 4002 },
			{ name: 'Account', port: 4003 },
			{ name: 'App', port: 4004 },
			{ name: 'Docs', port: 4005 },
			{ name: 'Admin', port: 4006 },
		];

		const boxWidth = 56;
		console.log('\n\x1b[36m╭' + '─'.repeat(boxWidth) + '╮\x1b[0m');

		const title = 'Xernerx Suite Endpoints';
		const titlePadding = Math.floor((boxWidth - title.length) / 2);
		console.log('\x1b[36m│\x1b[0m' + ' '.repeat(titlePadding) + '\x1b[1m' + title + '\x1b[0m' + ' '.repeat(boxWidth - titlePadding - title.length) + '\x1b[36m│\x1b[0m');
		console.log('\x1b[36m├' + '─'.repeat(boxWidth) + '┤\x1b[0m');

		for (const app of apps) {
			const url = isCustomDomain ? `https://${app.name.toLowerCase()}.dev.${domain}` : `http://${domain}:${app.port}`;
			const lineStr = `  \x1b[35m${app.name.padEnd(8)}\x1b[0m →  ${url} `;
			// Visible length = 2 (spaces) + 8 (name padded) + 4 (" →  ") + url.length + 1 (space)
			const visibleLength = 2 + 8 + 4 + url.length + 1;
			const padding = ' '.repeat(Math.max(0, boxWidth - visibleLength));
			console.log('\x1b[36m│\x1b[0m' + lineStr + padding + '\x1b[36m│\x1b[0m');
		}

		console.log('\x1b[36m╰' + '─'.repeat(boxWidth) + '╯\x1b[0m\n');
		console.log(`\x1b[33m[IMPORTANT]\x1b[0m Please use the above \x1b[1mIP URLs\x1b[0m instead of localhost!`);
		console.log(`\x1b[33m[IMPORTANT]\x1b[0m Cookies and authentication will \x1b[1mfail\x1b[0m on localhost!\n`);
	}, 8000); // 8 second delay to print AFTER Next.js boots
}
