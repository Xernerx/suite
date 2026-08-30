import fs from 'fs';
import path from 'path';
import { Command } from 'commander';

export default function registerInitialize(program: Command) {
	program
		.command('initialize')
		.description('Initialize workspace locally (copies shared public assets)')
		.action(() => {
			const sourceDir = path.join(process.cwd(), '..', '..', 'packages', 'public');
			const targetDir = path.join(process.cwd(), 'public');

			if (fs.existsSync(sourceDir)) {
				// Make sure target dir exists
				if (!fs.existsSync(targetDir)) {
					fs.mkdirSync(targetDir, { recursive: true });
				}

				// Copy files recursively
				copyFolderSync(sourceDir, targetDir);
				console.log(`[CLI] Synced public assets from ${sourceDir} to ${targetDir}`);
			} else {
				console.warn(`[CLI] Source directory ${sourceDir} does not exist, skipping public asset sync.`);
			}
		});
}

function copyFolderSync(from: string, to: string) {
	if (!fs.existsSync(to)) fs.mkdirSync(to);
	fs.readdirSync(from).forEach((element) => {
		const stat = fs.lstatSync(path.join(from, element));
		if (stat.isFile()) {
			fs.copyFileSync(path.join(from, element), path.join(to, element));
		} else if (stat.isSymbolicLink()) {
			fs.symlinkSync(fs.readlinkSync(path.join(from, element)), path.join(to, element));
		} else if (stat.isDirectory()) {
			copyFolderSync(path.join(from, element), path.join(to, element));
		}
	});
}
