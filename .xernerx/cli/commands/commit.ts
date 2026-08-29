import { Command } from 'commander';
import { spawnSync } from 'child_process';

function runSync(cmd: string, args: string[]) {
	spawnSync(cmd, args, { stdio: 'inherit', shell: true });
}

export default function registerCommit(program: Command) {
	program
		.command('commit')
		.description('Format, build, and create a changeset')
		.action(() => {
			runSync('npx', ['prettier', '--write', '.']);
			runSync('npx', ['@changesets/cli']);
		});
}
