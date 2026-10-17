/** @format */

import fs from 'fs';
import path from 'path';
import { Command } from 'commander';

export default function registerInitialize(program: Command) {
	program
		.command('initialize')
		.description('Initialize workspace locally (copies shared public assets)')
		.action(() => {
			let repoRoot = process.cwd();
			if (!fs.existsSync(path.join(repoRoot, 'packages', 'public'))) {
				const parentCandidate = path.join(process.cwd(), '..', '..');
				if (fs.existsSync(path.join(parentCandidate, 'packages', 'public'))) {
					repoRoot = parentCandidate;
				}
			}

			const sourceDir = path.join(repoRoot, 'packages', 'public');
			if (!fs.existsSync(sourceDir)) {
				console.warn(`[CLI] Source directory ${sourceDir} does not exist, skipping public asset sync.`);
				return;
			}

			if (process.cwd() !== repoRoot) {
				const targetDir = path.join(process.cwd(), 'public');
				syncPublicAssets(sourceDir, targetDir);
				console.log(`[CLI] Synced public assets from ${sourceDir} to ${targetDir}`);
				return;
			}

			const targets: string[] = [];
			const appDirs = ['apps', 'clients'];
			for (const dirName of appDirs) {
				const fullDirPath = path.join(repoRoot, dirName);
				if (fs.existsSync(fullDirPath)) {
					const subs = fs.readdirSync(fullDirPath);
					for (const sub of subs) {
						const subPath = path.join(fullDirPath, sub);
						if (fs.statSync(subPath).isDirectory() && fs.existsSync(path.join(subPath, 'package.json'))) {
							targets.push(path.join(subPath, 'public'));
						}
					}
				}
			}

			for (const targetDir of targets) {
				syncPublicAssets(sourceDir, targetDir);
			}
			console.log(`[CLI] Synced public assets to ${targets.length} applications.`);
		});
}

function syncPublicAssets(from: string, to: string) {
	if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
	fs.readdirSync(from).forEach((element) => {
		if (element.endsWith('.md')) return;
		const stat = fs.lstatSync(path.join(from, element));
		if (stat.isFile()) {
			fs.copyFileSync(path.join(from, element), path.join(to, element));
		} else if (stat.isSymbolicLink()) {
			fs.symlinkSync(fs.readlinkSync(path.join(from, element)), path.join(to, element));
		} else if (stat.isDirectory()) {
			syncPublicAssets(path.join(from, element), path.join(to, element));
		}
	});
}
