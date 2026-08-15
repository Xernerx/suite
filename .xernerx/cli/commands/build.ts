import { Command } from 'commander';
import { runCommand } from '../utils/run';

export default function registerBuild(program: Command) {
	program
		.command('build')
		.description('Build all workspaces')
		.action(() => {
			runCommand('pnpm', ['-r', 'build']);
		});
}
