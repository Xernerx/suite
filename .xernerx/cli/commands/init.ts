import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { runCommand } from '../utils/run';
import crypto from 'crypto';
import { input } from '@inquirer/prompts';
import { getLocalIp } from '../utils/ip';

export async function initCommand() {
	const rootEnv = path.join(process.cwd(), '.env');

	console.log('\n=======================================');
	console.log('   Xernerx Suite - Environment Setup   ');
	console.log('=======================================\n');

	let domain = await input({ message: 'What is the primary domain for this project? (Leave blank for local pure dev)' });
	if (!domain || domain.trim() === '') {
		domain = getLocalIp();
		console.log(`[CLI] No domain provided. Defaulting to local IP: ${domain}`);
	}
	const discordClientId = await input({ message: 'Discord Client ID (Optional):' });
	const discordClientSecret = await input({ message: 'Discord Client Secret (Optional):' });
	const discordClientToken = await input({ message: 'Discord Bot Token (Optional):' });
	const discordGuildId = await input({ message: 'Discord Guild ID (Optional):' });
	const mongoXernerx = await input({ message: 'MongoDB URI (Leave blank for local 127.0.0.1 fallback):' });
	const githubPat = await input({ message: 'Github Personal Access Token (PAT):' });

	const randomToken = crypto.randomBytes(32).toString('hex');

	const boilerplateEnv = `#################################################
## Environment                                  #
#################################################
DOMAIN="${domain}"
NEXT_PUBLIC_DOMAIN="${domain}"
ENVIRONMENT="DEVELOPMENT"
NEXT_PUBLIC_ENVIRONMENT="DEVELOPMENT"
NODE_ENV="development"
ENABLE_EXPERIMENTAL_COREPACK=1

#################################################
## NextAuth                                     #
#################################################

AUTH_TRUST_HOST=true
NEXTAUTH_SECRET="${randomToken}"

#################################################
## Discord                                      #
#################################################

DISCORD_CLIENT_ID="${discordClientId}"
DISCORD_CLIENT_SECRET="${discordClientSecret}"
DISCORD_CLIENT_TOKEN="${discordClientToken}"
DISCORD_GUILD_ID="${discordGuildId}"

#################################################
## Stripe                                       #
#################################################

STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_COUPON_ID=""

#################################################
## Mongo                                        #
#################################################

# New monolithic database
MONGO_XERNERX="${mongoXernerx}"
MONGO_LEGACY=""

# Legacy shards (do not delete yet)
MONGO_ZODIAC=""
MONGO_METAMORPHOSIS=""
MONGO_STATUS=""

#################################################
## Github                                       #
#################################################

GITHUB_REPO_OWNER="Xernerx"
GITHUB_REPO_NAME="suite"
GITHUB_PAT="${githubPat}"

#################################################
## Postmark                                     #
#################################################

POSTMARK_TOKEN=""

# this is to be kept for now

WS_TOKEN=""
XERNERX_TOKEN=""
MONGO_VIRTUE="${mongoXernerx}"
`;

	fs.writeFileSync(rootEnv, boilerplateEnv);
	console.log('\n[init] Generated root .env file.');

	console.log('[init] Syncing .env to all workspaces...');
	walkAndSync(process.cwd(), rootEnv);
	console.log('[init] Environment synchronization complete!\n');

	console.log('================================================================');
	console.log(' 🔑 ACTION REQUIRED: CLAIM MASTER ADMIN (OWNER) ROLE');
	console.log('================================================================');
	console.log(' To access the Admin Dashboard on this fresh setup, you must');
	console.log(' claim the master owner role by navigating to the following URL');
	console.log(' in your browser AFTER starting the dev server (suite dev):');
	console.log(`\n http://admin.${domain}/setup/${randomToken}\n`);
	console.log(' This URL is a one-time backdoor. It will automatically lock');
	console.log(' permanently after the first user successfully uses it.');
	console.log('================================================================\n');
}

export function walkAndSync(dir: string, rootEnvPath: string) {
	const files = fs.readdirSync(dir);
	for (const file of files) {
		const filePath = path.join(dir, file);
		if (fs.statSync(filePath).isDirectory()) {
			if (!['node_modules', '.git', '.next', 'dist', 'build', 'cli'].includes(file)) {
				walkAndSync(filePath, rootEnvPath);
			}
		} else if (file === 'package.json') {
			if (dir !== process.cwd()) {
				const destEnvPath = path.join(dir, '.env');
				if (fs.existsSync(rootEnvPath)) {
					fs.copyFileSync(rootEnvPath, destEnvPath);
				}
			}
		}
	}
}

export default function registerInit(program: Command) {
	program
		.command('init')
		.description('Interactive setup and .env generation')
		.action(async () => {
			const rootEnvPath = path.join(process.cwd(), '.env');
			const envInitialized = fs.existsSync(rootEnvPath);
			if (envInitialized) {
				console.log('\n[CLI] Suite is already initialized! Please use the native `suite` command directly for other operations (e.g., `suite dev`).\n');
				process.exit(0);
			} else {
				await initCommand();
				console.log('[CLI] Linking the `suite` command globally so you can use it natively...');
				runCommand('npm', ['link']);
			}
		});
}
