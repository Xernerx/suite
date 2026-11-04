/** @format */

import { Command } from 'commander';
import { runCommand } from '../utils/run';
import { terminal } from '../utils/terminal';
import { generateLocalesCommand } from './generateLocales';
import { initializeCommand } from './initialize';

export default function registerBuild(program: Command) {
	program
		.command('build [target]')
		.description('Build all workspaces or a single scoped workspace target')
		.action((target?: string) => {
			if (target) {
				terminal.log(`Building scoped workspace "${target}"...`);
				runCommand('pnpm', ['--filter', target, 'build'], 'BUILD');
				return;
			}

			process.env.SUITE_MONOREPO_BUILD = '1';
			generateLocalesCommand();
			initializeCommand();
			terminal.log('Building all workspaces...');
			runCommand('pnpm', ['-r', 'build'], 'BUILD');
		});
}
