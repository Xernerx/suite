/** @format */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { confirm, isCancel } from '@clack/prompts';
import { Command } from 'commander';
import { type ScopedProcessSpec, runScopedProcesses } from '../utils/run';
import { terminal } from '../utils/terminal';
import { generateLocalesCommand } from './generateLocales';
import { initializeCommand } from './initialize';
import { walkAndSync } from './init';
import { getLocalIp } from '../utils/ip';
import { SUITE_APPS, startLazyAppsSupervisor } from '../utils/lazyProxy';

function getServiceSpecs(rootDir: string): ScopedProcessSpec[] {
	return [
		{ scope: 'APP-BOT', command: 'pnpm', args: ['--silent', 'run', 'dev'], cwd: path.join(rootDir, 'services/app') },
		{ scope: 'BOT', command: 'pnpm', args: ['--silent', 'run', 'dev'], cwd: path.join(rootDir, 'services/bot') },
		{ scope: 'WS', command: 'pnpm', args: ['--silent', 'run', 'dev'], cwd: path.join(rootDir, 'services/websocket') },
	];
}

function getClientSpecs(rootDir: string): ScopedProcessSpec[] {
	return [{ scope: 'DESKTOP', command: 'pnpm', args: ['--silent', 'run', 'dev'], cwd: path.join(rootDir, 'clients/desktop') }];
}

function getEagerAppSpecs(rootDir: string): ScopedProcessSpec[] {
	return SUITE_APPS.map((app) => ({
		scope: `${app.label}:${app.port}`,
		command: 'pnpm',
		args: ['--silent', 'run', 'dev'],
		cwd: path.join(rootDir, app.dir),
	}));
}

function getTunnelSpec(): ScopedProcessSpec {
	return {
		scope: 'TUNNEL',
		command: 'cloudflared',
		args: ['tunnel', 'run'],
		env: { TUNNEL_LOGLEVEL: 'info' },
	};
}

export default function registerDev(program: Command) {
	program
		.command('dev')
		.description('Start the development servers and conditionally run the tunnel')
		.option('--only <type>', 'Run only a specific workspace type (apps, services, clients, tunnel)')
		.option('--prepare-only', 'Run only the environment preparation step and exit')
		.option('--eager', 'Start all 12 web apps immediately instead of waiting for URL requests')
		.option('--idle-timeout <seconds>', 'Seconds of inactivity before spinning down an awake app (0 to disable)', '60')
		.action(async (options) => {
			const rootEnvPath = path.join(process.cwd(), '.env');

			try {
				const currentBranch = execSync('git branch --show-current').toString().trim();
				if (currentBranch === 'canary' && process.stdin.isTTY && !options.prepareOnly) {
					terminal.log('Checking for updates on canary branch...');
					execSync('git fetch origin refs/heads/canary', { stdio: 'ignore', timeout: 10000 });
					const behindCount = parseInt(execSync('git rev-list --count HEAD..origin/canary').toString().trim());

					if (behindCount > 0) {
						const pull = await confirm({
							message: `There are ${behindCount} new commit(s) on the canary branch. Do you want to safely pull them now?`,
							initialValue: true,
						});
						if (!isCancel(pull) && pull) {
							terminal.log('Discarding local dictionary changes to favor remote...');
							try {
								execSync('git checkout HEAD -- packages/lib/src/dictionaries', { stdio: 'ignore' });
							} catch (e) {}
							terminal.log('Pulling with autostash to preserve your other local work...');
							execSync('git pull origin refs/heads/canary --autostash', { stdio: 'inherit' });
						}
					}
				}
			} catch (e: any) {
				terminal.error('Git operation failed:', e.message || e.toString());
			}

			terminal.log('Pre-flight: Generating locales...');
			generateLocalesCommand();

			terminal.log('Pre-flight: Syncing shared public assets...');
			initializeCommand();

			terminal.log('Synchronizing root .env to all workspaces...');
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
						terminal.log(`Dynamically injecting DOMAIN to local IP: ${localIp}`);
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
						terminal.log('Syncing updated .env to workspaces...');
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
							terminal.log(`Syncing custom domain '${currentDomain}' to NEXT_PUBLIC_DOMAIN...`);
							walkAndSync(process.cwd(), rootEnvPath);
						}
					}
				}

				// Handle MongoDB Memory Server auto-spawning
				const mongoMatch = envContent.match(/^MONGO_XERNERX=["']?(.*?)["']?$/m);
				const mongoUri = mongoMatch ? mongoMatch[1].trim() : '';

				if (!mongoUri) {
					terminal.log('No remote MongoDB URI detected in .env.');
					terminal.log('Spawning built-in mongodb-memory-server (Zero Configuration)...');
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
								args: ['--wiredTigerCacheSizeGB', '0.25'],
							},
						});

						process.env.MONGO_XERNERX = mongod.getUri();
						terminal.log(`\x1b[32m✔\x1b[0m MongoDB successfully running natively at ${mongod.getUri()}`);
					} catch (e: any) {
						if (e.message?.includes('EADDRINUSE')) {
							process.env.MONGO_XERNERX = 'mongodb://127.0.0.1:27017/';
							terminal.log('Local MongoDB is already running on port 27017. Attaching...');
						} else {
							terminal.error('Failed to spawn mongodb-memory-server:', e.message);
						}
					}
				}
			}

			if (options.prepareOnly) {
				terminal.log('Preparation complete. Exiting (--prepare-only).');
				return;
			}

			if (!process.env.NODE_OPTIONS || !process.env.NODE_OPTIONS.includes('--max-old-space-size')) {
				process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS ? process.env.NODE_OPTIONS + ' ' : ''}--max-old-space-size=512 --max-semi-space-size=16`;
			}

			const parsedIdleTimeout = Number.parseFloat(options.idleTimeout ?? '60');
			const idleTimeoutSeconds = Number.isFinite(parsedIdleTimeout) && parsedIdleTimeout >= 0 ? parsedIdleTimeout : 60;
			const isLazy = !options.eager;

			if (options.only) {
				const type = options.only;
				terminal.log(`Running only: ${type}`);
				if (type === 'apps') {
					process.env.NEXT_PUBLIC_DOMAIN = currentDomain;
					if (isLazy) {
						terminal.log(`Starting On-Demand URL Listener for all 12 apps (idle spin-down: ${idleTimeoutSeconds > 0 ? `${idleTimeoutSeconds}s` : 'off'})...`);
						await startLazyAppsSupervisor({
							domain: currentDomain,
							isCustomDomain: hasCustomDomain,
							idleTimeoutSeconds,
						});
						printEndpointsBox(currentDomain, hasCustomDomain, true, idleTimeoutSeconds, 200);
					} else {
						printEndpointsBox(currentDomain, hasCustomDomain, false, 0, 8000);
						runScopedProcesses(getEagerAppSpecs(process.cwd()));
					}
				} else if (type === 'services') {
					runScopedProcesses(getServiceSpecs(process.cwd()));
				} else if (type === 'clients') {
					runScopedProcesses(getClientSpecs(process.cwd()));
				} else if (type === 'tunnel') {
					runScopedProcesses([getTunnelSpec()]);
				} else {
					terminal.error(`Unknown --only type: ${type}`);
				}
			} else {
				process.env.NEXT_PUBLIC_DOMAIN = currentDomain;

				if (isLazy) {
					terminal.log(`Starting On-Demand URL Listener for apps (4000-4011) [idle spin-down: ${idleTimeoutSeconds > 0 ? `${idleTimeoutSeconds}s` : 'off'}]...`);
					await startLazyAppsSupervisor({
						domain: currentDomain,
						isCustomDomain: hasCustomDomain,
						idleTimeoutSeconds,
					});

					const specs: ScopedProcessSpec[] = [...getServiceSpecs(process.cwd()), ...getClientSpecs(process.cwd())];
					if (hasCustomDomain) {
						terminal.log('Custom domain detected. Starting services, clients, and Cloudflare Tunnel...');
						specs.push(getTunnelSpec());
					} else {
						terminal.log('Local IP mode detected. Starting services and clients alongside On-Demand URL Listener...');
					}
					printEndpointsBox(currentDomain, hasCustomDomain, true, idleTimeoutSeconds, 1500);
					runScopedProcesses(specs);
				} else {
					const specs: ScopedProcessSpec[] = [...getEagerAppSpecs(process.cwd()), ...getServiceSpecs(process.cwd()), ...getClientSpecs(process.cwd())];
					if (hasCustomDomain) {
						terminal.log('Custom domain detected (--eager). Starting all apps, services, clients, and Cloudflare Tunnel...');
						specs.push(getTunnelSpec());
					} else {
						terminal.log('Local IP mode detected (--eager). Starting all apps, services, and clients without tunnel...');
					}
					printEndpointsBox(currentDomain, hasCustomDomain, false, 0, 8000);
					runScopedProcesses(specs);
				}
			}
		});
}

function printEndpointsBox(domain: string, isCustomDomain: boolean, isLazy = true, idleTimeoutSeconds = 60, delayMs = 8000) {
	setTimeout(() => {
		const lines = SUITE_APPS.map((app) => {
			const url = isCustomDomain ? `https://${app.id}.dev.${domain}` : `http://${domain}:${app.port}`;
			return `\x1b[35m${app.label.padEnd(8)}\x1b[0m \x1b[90m→\x1b[0m  \x1b[36m${url}\x1b[0m`;
		}).join('\n');

		terminal.box(lines, {
			title: isLazy ? 'XERNERX SUITE ENDPOINTS (ON-DEMAND)' : 'XERNERX SUITE ENDPOINTS',
			titleAlignment: 'center',
			textAlignment: 'left',
			height: undefined,
			fullscreen: false,
			padding: { top: 0, bottom: 0, left: 2, right: 2 },
			margin: { top: 1, bottom: 1, left: 0, right: 0 },
		});

		if (isLazy) {
			terminal.log(`Apps sleep until their URL is visited (auto-spin-down after \x1b[1m${idleTimeoutSeconds > 0 ? `${idleTimeoutSeconds}s` : 'off'}\x1b[0m idle).`);
		}
		terminal.warn(`Please use the above \x1b[1m${isCustomDomain ? '*.dev' : 'IP'} URLs\x1b[0m instead of localhost!`);
		terminal.warn(`Cookies and authentication will \x1b[1mfail\x1b[0m on localhost!\n`);
	}, delayMs);
}
