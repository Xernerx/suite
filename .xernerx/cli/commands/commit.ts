/** @format */

import { Command } from 'commander';
import { spawnSync, execSync } from 'child_process';
import { select, isCancel } from '@clack/prompts';
import fs from 'fs';
import path from 'path';
import { terminal } from '../utils/terminal';

const commitLog = terminal.child({ scope: 'COMMIT' });
const i18nLog = terminal.child({ scope: 'I18N' });

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

function flattenDictionary(obj: Record<string, any>, prefix = '', out: Record<string, string> = {}): Record<string, string> {
	for (const [k, v] of Object.entries(obj || {})) {
		const p = prefix ? `${prefix}.${k}` : k;
		if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
			flattenDictionary(v, p, out);
		} else {
			out[p] = JSON.stringify(v);
		}
	}
	return out;
}

function deleteNestedKey(obj: Record<string, any>, keyPath: string): boolean {
	const parts = keyPath.split('.');
	const stack: Array<[Record<string, any>, string]> = [];
	let cur: any = obj;
	for (let i = 0; i < parts.length - 1; i++) {
		if (!cur || typeof cur !== 'object' || !(parts[i] in cur)) return false;
		stack.push([cur, parts[i]]);
		cur = cur[parts[i]];
	}
	const last = parts[parts.length - 1];
	if (!cur || typeof cur !== 'object' || !(last in cur)) return false;
	delete cur[last];
	for (let i = stack.length - 1; i >= 0; i--) {
		const [parent, key] = stack[i];
		if (parent[key] && typeof parent[key] === 'object' && Object.keys(parent[key]).length === 0) {
			delete parent[key];
		} else {
			break;
		}
	}
	return true;
}

function pruneUpdatedLocaleKeys() {
	try {
		const dictDir = path.resolve(process.cwd(), 'packages/lib/src/dictionaries');
		const enGbPath = path.join(dictDir, 'en-GB.json');
		if (!fs.existsSync(enGbPath)) return;

		const currentEnFlat = flattenDictionary(JSON.parse(fs.readFileSync(enGbPath, 'utf8')));
		let headEnFlat: Record<string, string> = {};
		try {
			const headRaw = execSync('git show HEAD:"packages/lib/src/dictionaries/en-GB.json"', {
				stdio: ['pipe', 'pipe', 'ignore'],
			}).toString();
			headEnFlat = flattenDictionary(JSON.parse(headRaw));
		} catch {
			// Ignore if not in git repo
		}

		const modifiedEnKeys = new Set<string>();
		for (const [k, oldVal] of Object.entries(headEnFlat)) {
			if (!k.startsWith('metadata.') && k in currentEnFlat && currentEnFlat[k] !== oldVal) {
				modifiedEnKeys.add(k);
			}
		}

		for (const file of fs.readdirSync(dictDir)) {
			if (file === 'en-GB.json' || !file.endsWith('.json')) continue;
			const localePath = path.join(dictDir, file);
			const localeObj = JSON.parse(fs.readFileSync(localePath, 'utf8'));
			const localeFlat = flattenDictionary(localeObj);

			const keysToRemove = Object.keys(localeFlat).filter((k) => !k.startsWith('metadata.') && (!(k in currentEnFlat) || modifiedEnKeys.has(k)));
			if (keysToRemove.length > 0) {
				for (const k of keysToRemove) deleteNestedKey(localeObj, k);
				fs.writeFileSync(localePath, JSON.stringify(localeObj, null, '\t') + '\n');
				i18nLog.log(`Pruned ${keysToRemove.length} updated/orphaned key(s) from ${file}: ${keysToRemove.join(', ')}`);
			}
		}
	} catch {
		// Safely ignore errors
	}
}

export default function registerCommit(program: Command) {
	program
		.command('commit')
		.description('Format, build, and create a changeset')
		.action(async () => {
			pruneUpdatedLocaleKeys();
			runSync('npx prettier --write .');

			if (process.stdin.isTTY) {
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
							commitLog.log(`✔ Bumped ${changedLabels} date(s) to ${newDate} in TermsPrompt.tsx`);

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
							commitLog.log(`✔ Bumped COOKIES_VERSION date to ${newDate} in CookieProvider.tsx`);

							execSync(`git add "${cookieProviderPath}"`);
						}
					}
				} catch (e) {
					// Safely ignore git errors if not in a git repo
				}
			}

			const changesetDir = path.resolve(process.cwd(), '.changeset');
			const existingChangesets = fs.existsSync(changesetDir) ? fs.readdirSync(changesetDir).filter((f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md') : [];
			for (const file of existingChangesets) {
				const fp = path.join(changesetDir, file);
				const raw = fs.readFileSync(fp, 'utf8');
				if (/^<!--\s*@format\s*-->\s*/.test(raw)) {
					fs.writeFileSync(fp, raw.replace(/^<!--\s*@format\s*-->\s*/, ''));
				}
			}
			if (!process.stdin.isTTY && existingChangesets.length > 0) {
				runSync('npx @changesets/cli status');
			} else {
				runSync('npx @changesets/cli');
			}
		});
}
