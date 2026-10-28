/** @format */

import { Command } from 'commander';
import { runCommand } from '../utils/run';
import { terminal } from '../utils/terminal';

export default function registerBuild(program: Command) {
	program
		.command('build')
		.description('Build all workspaces')
		.action(() => {
			terminal.log('Building all workspaces...');
			runCommand('pnpm', ['-r', 'build'], 'BUILD');
		});
}
