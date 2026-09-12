import { Command } from 'commander';
import { spawnSync, execSync } from 'child_process';
import { select, isCancel } from '@clack/prompts';
import fs from 'fs';
import path from 'path';

function runSync(cmd: string) {
	spawnSync(cmd, { stdio: 'inherit', shell: true });
}

export default function registerCommit(program: Command) {
	program
		.command('commit')
		.description('Format, build, and create a changeset')
		.action(async () => {
			runSync('npx prettier --write .');

			try {
				const gitStatus = execSync('git status --porcelain').toString();
				const policyModified = gitStatus.includes('packages/lib/src/dictionaries') || gitStatus.includes('apps/www/src/app/privacy') || gitStatus.includes('apps/www/src/app/terms');

				if (policyModified) {
					const bump = await select({
						message: 'You have modified the policy files. Do you want to enforce re-agreement for all users?',
						options: [
							{ label: 'No, this was just a minor typo or layout fix', value: false },
							{ label: 'Yes, this is a significant policy update', value: true },
						],
					});

					if (!isCancel(bump) && bump) {
						const termsPromptPath = path.resolve(process.cwd(), 'packages/components/src/TermsPrompt.tsx');
						let content = fs.readFileSync(termsPromptPath, 'utf8');
						const newDate = new Date().toISOString().split('T')[0] + 'T00:00:00Z';

						content = content.replace(/const TERMS_VERSION = new Date\('.*'\)\.getTime\(\);/g, `const TERMS_VERSION = new Date('${newDate}').getTime();`);
						content = content.replace(/const PRIVACY_VERSION = new Date\('.*'\)\.getTime\(\);/g, `const PRIVACY_VERSION = new Date('${newDate}').getTime();`);

						fs.writeFileSync(termsPromptPath, content);
						console.log(`\n✅ Bumped policy dates to ${newDate} in TermsPrompt.tsx\n`);

						// Add the newly modified file to git so it gets committed
						execSync(`git add "${termsPromptPath}"`);
					}
				}
			} catch (e) {
				// Safely ignore git errors if not in a git repo
			}

			runSync('npx @changesets/cli');
		});
}
