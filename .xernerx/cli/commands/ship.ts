/** @format */

import { Command } from 'commander';
import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { terminal } from '../utils/terminal';

const shipLog = terminal.child({ scope: 'SHIP' });

function deduplicateChangelogDependencies(rootDir: string) {
	const workspaceFolders = ['apps', 'packages', 'services', 'clients', '.xernerx'];
	for (const group of workspaceFolders) {
		const groupPath = path.join(rootDir, group);
		if (!fs.existsSync(groupPath)) continue;
		for (const entry of fs.readdirSync(groupPath, { withFileTypes: true })) {
			if (!entry.isDirectory()) continue;
			const clPath = path.join(groupPath, entry.name, 'CHANGELOG.md');
			if (!fs.existsSync(clPath)) continue;
			try {
				const raw = fs.readFileSync(clPath, 'utf8');
				const cleaned = raw.replace(/(?:^[ \t]*[-*][ \t]+Updated dependencies[^\r\n]*\r?\n)+([ \t]*[-*][ \t]+Updated dependencies)/gim, '$1');
				if (cleaned !== raw) {
					fs.writeFileSync(clPath, cleaned, 'utf8');
				}
			} catch {}
		}
	}
}

function runSync(cmd: string) {
	spawnSync(cmd, { stdio: 'inherit', shell: true });
}

export default function registerShip(program: Command) {
	program
		.command('ship')
		.description('Version, commit, tag, and push release')
		.action(() => {
			const versionProcess = spawnSync('npx @changesets/cli version', { stdio: 'inherit', shell: true });
			if (versionProcess.status !== 0) {
				shipLog.warn('Versioning was skipped or failed. Aborting release.');
				return;
			}
			deduplicateChangelogDependencies(process.cwd());
			runSync('git add .');
			runSync('git commit -m "chore: release"');
			runSync('npx @changesets/cli git-tag');

			// Push the branch commit first, then push any desktop@* or mobile@* release tags
			// individually so GitHub's 3-tag push webhook limit never suppresses release.yml.
			runSync('git push');
			try {
				const headTags = execSync('git tag --points-at HEAD', { encoding: 'utf8' })
					.split(/\r?\n/)
					.map((t) => t.trim())
					.filter(Boolean);
				const clientReleaseTags = headTags.filter((t) => t.startsWith('desktop@') || t.startsWith('mobile@'));
				for (const tag of clientReleaseTags) {
					shipLog.log(`Pushing client release tag ${tag} individually to trigger Release workflow...`);
					runSync(`git push origin refs/tags/${tag}`);
				}
			} catch {
				// Fallback if tag lookup fails
			}
			runSync('git push --follow-tags');
		});
}
