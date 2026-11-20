/** @format */

import { Command } from 'commander';
import { execSync, spawnSync } from 'child_process';
import { terminal } from '../utils/terminal';

const promoteLog = terminal.child({ scope: 'PROMOTE' });

function runSync(cmd: string): number {
	const res = spawnSync(cmd, { stdio: 'inherit', shell: true });
	return res.status ?? 1;
}

export default function registerPromote(program: Command) {
	program
		.command('promote')
		.description('Verify Canary soak errors, deployment statuses & live stress gate, then promote canary -> main')
		.option('--skip-verify', 'Skip Canary verification gates and promote immediately')
		.option('--require-vercel-soak', 'Fail if VERCEL_TOKEN is not set for 24h Vercel runtime log inspection')
		.action((opts: { skipVerify?: boolean; requireVercelSoak?: boolean }) => {
			promoteLog.log('Fetching latest origin/canary and origin/main...');
			runSync('git fetch origin canary main');

			if (!opts.skipVerify) {
				promoteLog.log('Running 5-gate Canary dictionary, GitHub/Vercel soak-error, 13-app smoke, and concurrent stress gate...');
				const extraArgs = opts.requireVercelSoak ? ' --require-vercel-soak' : '';
				if (runSync(`node .xernerx/cli/verify-canary.mjs${extraArgs}`) !== 0) {
					promoteLog.error('Canary verification gate failed. Aborting promotion to main.');
					process.exit(1);
				}
			}

			const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();

			const aheadCount = Number(execSync('git rev-list --count origin/main..origin/canary', { encoding: 'utf8' }).trim() || '0');
			if (aheadCount === 0) {
				promoteLog.log('main is already up-to-date with canary (0 commits ahead).');
				return;
			}

			promoteLog.log(`Promoting ${aheadCount} commit(s) from canary -> main...`);
			if (runSync('git checkout main') !== 0) process.exit(1);
			if (runSync('git pull origin main') !== 0) process.exit(1);
			if (runSync('git merge origin/canary --no-edit -m "chore: promote canary to main"') !== 0) process.exit(1);
			if (runSync('git push origin main') !== 0) process.exit(1);

			if (currentBranch && currentBranch !== 'main') {
				runSync(`git checkout ${currentBranch}`);
			}
			promoteLog.log('Successfully promoted canary -> main!');
		});
}
