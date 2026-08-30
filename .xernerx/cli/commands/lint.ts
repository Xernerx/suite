import { Command } from 'commander';
import { runCommand } from '../utils/run';

export default function registerLint(program: Command) {
	program
		.command('lint')
		.description('Lint all workspaces')
		.action(() => {
			runCommand('pnpm', ['--recursive', 'run', 'lint']);
		});
}
