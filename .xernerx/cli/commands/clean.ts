/** @format */

import { Command } from 'commander';
import { runCommand } from '../utils/run';
import fs from 'fs';
import path from 'path';
import { terminal } from '../utils/terminal';

const cleanLog = terminal.child({ scope: 'CLEAN' });

function removeDirs(dir: string, targets: string[]) {
	if (!fs.existsSync(dir)) return;

	const files = fs.readdirSync(dir);
	for (const file of files) {
		const fullPath = path.join(dir, file);
		let stats;
		try {
			stats = fs.statSync(fullPath);
		} catch (e) {
			continue;
		}

		if (stats.isDirectory()) {
			if (targets.includes(file)) {
				cleanLog.log(`Deleting ${fullPath}...`);
				try {
					fs.rmSync(fullPath, { recursive: true, force: true });
				} catch (e) {
					cleanLog.error(`Failed to delete ${fullPath}:`, e);
				}
			} else if (file !== 'node_modules' && file !== '.git') {
				removeDirs(fullPath, targets);
			}
		}
	}
}

export default function registerClean(program: Command) {
	program
		.command('clean')
		.description('Delete all .next, dist, and build folders and run pnpm clean')
		.action(async () => {
			cleanLog.log('Cleaning directories...');
			try {
				removeDirs(process.cwd(), ['.next', 'dist', 'build']);
			} catch (err) {
				cleanLog.error('Error cleaning directories:', err);
			}

			const runAsync = (cmd: string, args: string[]) => {
				return new Promise<void>((resolve, reject) => {
					const child = runCommand(cmd, args);
					child.on('close', (code) => {
						if (code === 0) resolve();
						else reject(new Error(`Command exited with code ${code}`));
					});
					child.on('error', reject);
				});
			};

			cleanLog.log('Running pnpm clean...');
			try {
				await runAsync('pnpm', ['clean']);
			} catch (err) {
				cleanLog.error('Error running pnpm clean:', err);
			}

			cleanLog.log('Running pnpm install...');
			try {
				await runAsync('pnpm', ['install']);
			} catch (err) {
				cleanLog.error('Error running pnpm install:', err);
			}
		});
}
