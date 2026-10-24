/** @format */

import { Command } from 'commander';
import { spawnSync, execSync } from 'child_process';
import { select, isCancel } from '@clack/prompts';
import fs from 'fs';
import path from 'path';

function runSync(cmd: string) {
	spawnSync(cmd, { stdio: 'inherit', shell: true });
}

function getNestedJsonString(fileContent: string, keyPath: string[]): string | null {
	try {
		let cur: any = JSON.parse(fileContent);
		for (const key of keyPath) {
			if (cur === null || typeof cur !== 'object' || !(key in cur)) return null;
			cur = cur[key];
		}
		return JSON.stringify(cur);
	} catch {
		return null;
	}
}

function detectPolicyChanges(): { termsChanged: boolean; privacyChanged: boolean; cookiesChanged: boolean } {
	let termsChanged = false;
	let privacyChanged = false;
	let cookiesChanged = false;

	try {
		const rawStatus = execSync('git status --porcelain').toString();
		const lines = rawStatus.split(/\r?\n/).filter(Boolean);

		for (const line of lines) {
			const filePath = line.slice(3).trim().replace(/\\/g, '/').replace(/^"|"$/g, '');

			if (filePath.includes('apps/www/src/app/terms')) {
				termsChanged = true;
			}
			if (filePath.includes('apps/www/src/app/privacy')) {
				privacyChanged = true;
			}
			if (filePath.includes('apps/www/src/app/cookies')) {
				cookiesChanged = true;
			}

			if (filePath.startsWith('packages/lib/src/dictionaries/') && filePath.endsWith('.json')) {
				const absPath = path.resolve(process.cwd(), filePath);
				if (!fs.existsSync(absPath)) continue;

				const currentRaw = fs.readFileSync(absPath, 'utf8');
				let headRaw = '';
				try {
					headRaw = execSync(`git show HEAD:"${filePath}"`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
				} catch {
					// File might be untracked/new
				}

				if (!headRaw) {
					if (getNestedJsonString(currentRaw, ['www', 'terms'])) termsChanged = true;
					if (getNestedJsonString(currentRaw, ['www', 'privacy'])) privacyChanged = true;
					if (getNestedJsonString(currentRaw, ['www', 'cookies'])) cookiesChanged = true;
				} else {
					if (getNestedJsonString(currentRaw, ['www', 'terms']) !== getNestedJsonString(headRaw, ['www', 'terms'])) {
						termsChanged = true;
					}
					if (getNestedJsonString(currentRaw, ['www', 'privacy']) !== getNestedJsonString(headRaw, ['www', 'privacy'])) {
						privacyChanged = true;
					}
					if (
						getNestedJsonString(currentRaw, ['www', 'cookies']) !== getNestedJsonString(headRaw, ['www', 'cookies']) ||
						getNestedJsonString(currentRaw, ['common', 'cookiePrompt']) !== getNestedJsonString(headRaw, ['common', 'cookiePrompt'])
					) {
						cookiesChanged = true;
					}
				}
			}
		}
	} catch {
		// Safely ignore git errors if not in a git repo
	}

	return { termsChanged, privacyChanged, cookiesChanged };
}

export default function registerCommit(program: Command) {
	program
		.command('commit')
		.description('Format, build, and create a changeset')
		.action(async () => {
			runSync('npx prettier --write .');

			try {
				const { termsChanged, privacyChanged, cookiesChanged } = detectPolicyChanges();
				const newDate = new Date().toISOString().split('T')[0] + 'T00:00:00Z';

				if (termsChanged || privacyChanged) {
					const changedLabels = [termsChanged && 'Terms of Service', privacyChanged && 'Privacy Policy'].filter(Boolean).join(' & ');
					const bump = await select({
						message: `You have modified the ${changedLabels}. Do you want to enforce re-agreement for all users?`,
						options: [
							{ label: 'No, this was just a minor typo or layout fix', value: false },
							{ label: 'Yes, this is a significant policy update', value: true },
						],
					});

					if (!isCancel(bump) && bump) {
						const termsPromptPath = path.resolve(process.cwd(), 'packages/components/src/TermsPrompt.tsx');
						let content = fs.readFileSync(termsPromptPath, 'utf8');

						if (termsChanged) {
							content = content.replace(/const TERMS_VERSION = new Date\('.*'\)\.getTime\(\);/g, `const TERMS_VERSION = new Date('${newDate}').getTime();`);
						}
						if (privacyChanged) {
							content = content.replace(/const PRIVACY_VERSION = new Date\('.*'\)\.getTime\(\);/g, `const PRIVACY_VERSION = new Date('${newDate}').getTime();`);
						}

						fs.writeFileSync(termsPromptPath, content);
						console.log(`\n✅ Bumped ${changedLabels} date(s) to ${newDate} in TermsPrompt.tsx\n`);

						execSync(`git add "${termsPromptPath}"`);
					}
				}

				if (cookiesChanged) {
					const bumpCookies = await select({
						message: 'You have modified the Cookie Policy. Do you want to re-prompt cookie preferences for all users?',
						options: [
							{ label: 'No, this was just a minor typo or layout fix', value: false },
							{ label: 'Yes, this is a significant cookie policy update', value: true },
						],
					});

					if (!isCancel(bumpCookies) && bumpCookies) {
						const cookieProviderPath = path.resolve(process.cwd(), 'packages/providers/src/CookieProvider.tsx');
						let content = fs.readFileSync(cookieProviderPath, 'utf8');

						content = content.replace(/const COOKIES_VERSION = new Date\('.*'\)\.getTime\(\);/g, `const COOKIES_VERSION = new Date('${newDate}').getTime();`);

						fs.writeFileSync(cookieProviderPath, content);
						console.log(`\n✅ Bumped COOKIES_VERSION date to ${newDate} in CookieProvider.tsx\n`);

						execSync(`git add "${cookieProviderPath}"`);
					}
				}
			} catch (e) {
				// Safely ignore git errors if not in a git repo
			}

			const changesetDir = path.resolve(process.cwd(), '.changeset');
			const existingChangesets = fs.existsSync(changesetDir) ? fs.readdirSync(changesetDir).filter((f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md') : [];
			if (!process.stdin.isTTY && existingChangesets.length > 0) {
				runSync('npx @changesets/cli status');
			} else {
				runSync('npx @changesets/cli');
			}
		});
}
