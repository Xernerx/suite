/** @format */

import { Command } from 'commander';
import { execSync, spawnSync } from 'child_process';

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
				console.log('\n[CLI] Versioning was skipped or failed. Aborting release.');
				return;
			}
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
					console.log(`[CLI] Pushing client release tag ${tag} individually to trigger Release workflow...`);
					runSync(`git push origin refs/tags/${tag}`);
				}
			} catch {
				// Fallback if tag lookup fails
			}
			runSync('git push --follow-tags');
		});
}
