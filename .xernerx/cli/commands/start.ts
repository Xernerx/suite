import { Command } from 'commander';
import { runCommand } from '../utils/run';

export default function registerStart(program: Command) {
	program
		.command('start')
		.description('Start the production servers')
		.action(() => {
			runCommand('pnpm', ['--parallel', '--filter', './apps/*', 'start']);
		});
}
