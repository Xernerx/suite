/** @format */

import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { terminal } from '../utils/terminal';

export function initializeCommand() {
	let repoRoot = process.cwd();
	if (!fs.existsSync(path.join(repoRoot, 'packages', 'public'))) {
		const parentCandidate = path.join(process.cwd(), '..', '..');
		if (fs.existsSync(path.join(parentCandidate, 'packages', 'public'))) {
			repoRoot = parentCandidate;
		}
	}

	const sourceDir = path.join(repoRoot, 'packages', 'public');
	if (!fs.existsSync(sourceDir)) {
		terminal.warn(`Source directory ${sourceDir} does not exist, skipping public asset sync.`);
		return;
	}

	if (process.cwd() !== repoRoot) {
		const targetDir = path.join(process.cwd(), 'public');
		syncPublicAssets(sourceDir, targetDir);
		terminal.log(`Synced public assets from ${sourceDir} to ${targetDir}`);
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
	terminal.log(`Synced public assets to ${targets.length} applications.`);
}

export default function registerInitialize(program: Command) {
	program
		.command('initialize')
		.description('Initialize workspace locally (copies shared public assets)')
		.action(() => {
			initializeCommand();
		});
}

function syncPublicAssets(from: string, to: string) {
	if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
	fs.readdirSync(from).forEach((element) => {
		if (element.endsWith('.md')) return;
		const srcPath = path.join(from, element);
		const destPath = path.join(to, element);
		const stat = fs.lstatSync(srcPath);
		if (stat.isFile()) {
			try {
				if (fs.existsSync(destPath)) {
					const destStat = fs.lstatSync(destPath);
					if (destStat.isFile() && destStat.size === stat.size && destStat.mtimeMs >= stat.mtimeMs) {
						return;
					}
				}
				fs.copyFileSync(srcPath, destPath);
			} catch {
				try {
					fs.writeFileSync(destPath, fs.readFileSync(srcPath));
				} catch {}
			}
		} else if (stat.isSymbolicLink()) {
			try {
				if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
				fs.symlinkSync(fs.readlinkSync(srcPath), destPath);
			} catch {}
		} else if (stat.isDirectory()) {
			syncPublicAssets(srcPath, destPath);
		}
	});
}
