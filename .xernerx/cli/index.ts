import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { runCommand } from './utils/run';
import { initCommand } from './commands/init';
import registerInit from './commands/init';
import registerDev from './commands/dev';
import registerStart from './commands/start';
import registerBuild from './commands/build';
import registerLint from './commands/lint';
import registerCommit from './commands/commit';
import registerPush from './commands/push';
import registerGenerateLocales from './commands/generateLocales';
import registerInitialize from './commands/initialize';
import registerClean from './commands/clean';

async function main() {
	const rootEnvPath = path.join(process.cwd(), '.env');
	let envInitialized = false;

	if (!fs.existsSync(rootEnvPath)) {
		console.log('\n[CLI] No .env file found. Running interactive initialization...');
		await initCommand();
		envInitialized = true;
	}

	const program = new Command();

	program.name('suite').description('Xernerx Suite Monorepo CLI').version('1.0.0');

	// Register Commands
	registerInit(program);
	registerDev(program);
	registerStart(program);
	registerBuild(program);
	registerLint(program);
	registerGenerateLocales(program);
	registerCommit(program);
	registerPush(program);
	registerInitialize(program);
	registerClean(program);

	program.action(async () => {
		if (!fs.existsSync(rootEnvPath) && !envInitialized) {
			await initCommand();
			console.log('[CLI] Linking the `suite` command globally so you can use it natively...');
			runCommand('npm', ['link']);
		} else {
			program.help();
		}
	});

	await program.parseAsync(process.argv);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
