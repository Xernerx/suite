import { Command } from 'commander';
import { runCommand } from '../utils/run';
import fs from 'fs';
import path from 'path';

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
				console.log(`[CLI] Deleting ${fullPath}...`);
				try {
					fs.rmSync(fullPath, { recursive: true, force: true });
				} catch (e) {
					console.error(`[CLI] Failed to delete ${fullPath}:`, e);
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
			console.log('[CLI] Cleaning directories...');
			try {
				removeDirs(process.cwd(), ['.next', 'dist', 'build']);
			} catch (err) {
				console.error('[CLI] Error cleaning directories:', err);
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

			console.log('[CLI] Running pnpm clean...');
			try {
				await runAsync('pnpm', ['clean']);
			} catch (err) {
				console.error('[CLI] Error running pnpm clean:', err);
			}

			console.log('[CLI] Running pnpm install...');
			try {
				await runAsync('pnpm', ['install']);
			} catch (err) {
				console.error('[CLI] Error running pnpm install:', err);
			}
		});
}
