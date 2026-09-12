import { Command } from 'commander';
import { spawnSync } from 'child_process';

function runSync(cmd: string) {
	spawnSync(cmd, { stdio: 'inherit', shell: true });
}

export default function registerShip(program: Command) {
	program
		.command('ship')
		.description('Version, commit, tag, and push release')
		.action(() => {
			const versionProcess = spawnSync('npx @changesets/cli version', { stdio: 'inherit', shell: true });
			if (versionProcess.status !== 0) {
				console.log('\n[CLI] Versioning was skipped or failed. Aborting release.');
				return;
			}
			runSync('git add .');
			runSync('git commit -m "chore: release"');
			runSync('npx @changesets/cli git-tag');
			runSync('git push --follow-tags');
		});
}
