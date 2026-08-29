import { Command } from 'commander';
import { spawnSync } from 'child_process';

function runSync(cmd: string, args: string[]) {
	spawnSync(cmd, args, { stdio: 'inherit', shell: true });
}

export default function registerShip(program: Command) {
	program
		.command('ship')
		.description('Version, commit, tag, and push release')
		.action(() => {
			runSync('npx', ['@changesets/cli', 'version']);
			runSync('git', ['add', '.']);
			runSync('git', ['commit', '-m', '"chore: release"']);
			runSync('npx', ['@changesets/cli', 'tag']);
			runSync('git', ['push', '--follow-tags']);
		});
}
