/** @format */

import { Command } from 'commander';
import { spawnSync, execSync } from 'child_process';
import { select, multiselect, text, isCancel } from '@clack/prompts';
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

function detectPolicyChanges(): { termsChanged: boolean; privacyChanged: boolean; cookiesChanged: boolean; securityChanged: boolean } {
	let termsChanged = false;
	let privacyChanged = false;
	let cookiesChanged = false;
	let securityChanged = false;

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
			if (filePath.includes('apps/www/src/app/security')) {
				securityChanged = true;
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
					if (getNestedJsonString(currentRaw, ['www', 'security'])) securityChanged = true;
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
					if (getNestedJsonString(currentRaw, ['www', 'security']) !== getNestedJsonString(headRaw, ['www', 'security'])) {
						securityChanged = true;
					}
				}
			}
		}
	} catch {
		// Safely ignore git errors if not in a git repo
	}

	return { termsChanged, privacyChanged, cookiesChanged, securityChanged };
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
					const { termsChanged, privacyChanged, cookiesChanged, securityChanged } = detectPolicyChanges();
					const now = new Date();
					const newDate = now.toISOString().split('T')[0] + 'T00:00:00Z';
					const readableDate = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

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
								const termsPagePath = path.resolve(process.cwd(), 'apps/www/src/app/terms/page.tsx');
								if (fs.existsSync(termsPagePath)) {
									const pageContent = fs.readFileSync(termsPagePath, 'utf8').replace(/(\{t\('www\.terms\.header\.effectiveDate'\)\})\s+[^<]+/g, `$1 ${readableDate}`);
									fs.writeFileSync(termsPagePath, pageContent);
									execSync(`git add "${termsPagePath}"`);
								}
							}
							if (privacyChanged) {
								content = content.replace(/const PRIVACY_VERSION = new Date\('.*'\)\.getTime\(\);/g, `const PRIVACY_VERSION = new Date('${newDate}').getTime();`);
								const privacyPagePath = path.resolve(process.cwd(), 'apps/www/src/app/privacy/page.tsx');
								if (fs.existsSync(privacyPagePath)) {
									const pageContent = fs.readFileSync(privacyPagePath, 'utf8').replace(/(\{t\('www\.privacy\.header\.effectiveDate'\)\})\s+[^<]+/g, `$1 ${readableDate}`);
									fs.writeFileSync(privacyPagePath, pageContent);
									execSync(`git add "${privacyPagePath}"`);
								}
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
							const cookiesPagePath = path.resolve(process.cwd(), 'apps/www/src/app/cookies/page.tsx');
							if (fs.existsSync(cookiesPagePath)) {
								const pageContent = fs.readFileSync(cookiesPagePath, 'utf8').replace(/(\{t\('www\.cookies\.header\.effectiveDate'\)\})\s+[^<]+/g, `$1 ${readableDate}`);
								fs.writeFileSync(cookiesPagePath, pageContent);
								execSync(`git add "${cookiesPagePath}"`);
							}
							commitLog.log(`✔ Bumped COOKIES_VERSION date to ${newDate} in CookieProvider.tsx`);

							execSync(`git add "${cookieProviderPath}"`);
						}
					}

					if (securityChanged) {
						const bumpSecurity = await select({
							message: 'You have modified the Platform & Bot Security page (/security). Do you want to update its Last Reviewed date?',
							options: [
								{ label: 'No, this was just a minor typo or layout fix', value: false },
								{ label: 'Yes, update the Last Reviewed date to today', value: true },
							],
						});

						if (!isCancel(bumpSecurity) && bumpSecurity) {
							const securityPagePath = path.resolve(process.cwd(), 'apps/www/src/app/security/page.tsx');
							if (fs.existsSync(securityPagePath)) {
								const pageContent = fs.readFileSync(securityPagePath, 'utf8').replace(/(\{t\('www\.security\.header\.effectiveDate'\)\})\s+[^<]+/g, `$1 ${readableDate}`);
								fs.writeFileSync(securityPagePath, pageContent);
								commitLog.log(`✔ Updated Last Reviewed date to ${readableDate} in apps/www/src/app/security/page.tsx`);
								execSync(`git add "${securityPagePath}"`);
							}
						}
					}
				} catch (e) {
					// Safely ignore git errors if not in a git repo
				}
			}

			const changesetDir = path.resolve(process.cwd(), '.changeset');
			if (!fs.existsSync(changesetDir)) {
				fs.mkdirSync(changesetDir, { recursive: true });
			}
			const existingChangesets = fs.readdirSync(changesetDir).filter((f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md');
			for (const file of existingChangesets) {
				const fp = path.join(changesetDir, file);
				const raw = fs.readFileSync(fp, 'utf8');
				if (/^<!--\s*@format\s*-->\s*/.test(raw)) {
					fs.writeFileSync(fp, raw.replace(/^<!--\s*@format\s*-->\s*/, ''));
				}
			}

			if (!process.stdin.isTTY) {
				runSync('npx @changesets/cli status');
				return;
			}

			if (existingChangesets.length > 0) {
				const action = await select({
					message: `Found ${existingChangesets.length} existing per-app changeset file(s) in .changeset/. What would you like to do?`,
					options: [
						{ label: `Use existing per-app changesets (${existingChangesets.length} ready)`, value: 'keep' },
						{ label: 'Add additional per-app changeset(s)', value: 'add' },
					],
				});
				if (isCancel(action) || action === 'keep') {
					runSync('npx @changesets/cli status');
					return;
				}
			}

			// Discover all workspace packages and detect which ones have modified files in git status
			const workspaceRoots = ['apps', 'packages', 'services', 'clients', '.xernerx'];
			const workspaces: Array<{ name: string; relDir: string; version: string }> = [];
			for (const root of workspaceRoots) {
				const absRoot = path.resolve(process.cwd(), root);
				if (!fs.existsSync(absRoot)) continue;
				for (const entry of fs.readdirSync(absRoot, { withFileTypes: true })) {
					if (!entry.isDirectory()) continue;
					const pkgJsonPath = path.join(absRoot, entry.name, 'package.json');
					if (!fs.existsSync(pkgJsonPath)) continue;
					try {
						const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
						if (pkg.name && pkg.version) {
							workspaces.push({
								name: pkg.name,
								relDir: `${root}/${entry.name}`,
								version: pkg.version,
							});
						}
					} catch {}
				}
			}

			const changedDirs = new Set<string>();
			try {
				const rawStatus = execSync('git status --porcelain').toString();
				for (const line of rawStatus.split(/\r?\n/).filter(Boolean)) {
					const filePath = line.slice(3).trim().replace(/\\/g, '/').replace(/^"|"$/g, '');
					for (const ws of workspaces) {
						if (filePath.startsWith(`${ws.relDir}/`)) {
							changedDirs.add(ws.name);
						}
					}
				}
			} catch {}

			const selectedPackages = await multiselect({
				message: 'Select the apps/packages to create separate changesets for (Space to toggle, Enter to confirm):',
				options: workspaces.map((ws) => ({
					value: ws.name,
					label: `${ws.name} (${ws.relDir} @ v${ws.version})`,
					hint: changedDirs.has(ws.name) ? 'modified' : undefined,
				})),
				initialValues: workspaces.filter((ws) => changedDirs.has(ws.name)).map((ws) => ws.name),
				required: true,
			});

			if (isCancel(selectedPackages) || !Array.isArray(selectedPackages) || selectedPackages.length === 0) {
				return;
			}

			for (const pkgName of selectedPackages) {
				const bumpType = await select({
					message: `[${pkgName}] Select version bump type:`,
					options: [
						{ label: 'patch (bug fixes, UI polish, internal updates)', value: 'patch' },
						{ label: 'minor (new features, endpoints, or components)', value: 'minor' },
						{ label: 'major (breaking changes)', value: 'major' },
					],
				});
				if (isCancel(bumpType)) return;

				const title = await text({
					message: `[${pkgName}] Enter release title (## Title):`,
					placeholder: `Short headline for ${pkgName} update...`,
					validate: (val) => (!val || !val.trim() ? `Please enter a release title for ${pkgName}` : undefined),
				});
				if (isCancel(title)) return;

				const shortDesc = await text({
					message: `[${pkgName}] Enter short description:`,
					placeholder: `Concise overview of what changed in ${pkgName}...`,
					validate: (val) => (!val || !val.trim() ? `Please enter a short description for ${pkgName}` : undefined),
				});
				if (isCancel(shortDesc)) return;

				const addedRaw = await text({
					message: `[${pkgName}] ### Added items (optional, separate bullets with ";" or leave blank):`,
					placeholder: `Feature A: Description; Feature B: Description`,
				});
				if (isCancel(addedRaw)) return;

				const changedRaw = await text({
					message: `[${pkgName}] ### Changed items (optional, separate bullets with ";" or leave blank):`,
					placeholder: `Updated Feature: Description`,
				});
				if (isCancel(changedRaw)) return;

				const deletedRaw = await text({
					message: `[${pkgName}] ### Deleted items (optional, separate bullets with ";" or leave blank):`,
					placeholder: `Removed Feature: Description`,
				});
				if (isCancel(deletedRaw)) return;

				const formatBullets = (rawVal: string | symbol | undefined) =>
					String(rawVal || '')
						.split(';')
						.map((s) => s.trim().replace(/^[-*]\s+/, ''))
						.filter(Boolean)
						.map((s) => `- ${s}`)
						.join('\n');

				const sections: string[] = [`## ${String(title).trim()}`, String(shortDesc).trim()];
				const addedBullets = formatBullets(addedRaw);
				const changedBullets = formatBullets(changedRaw);
				const deletedBullets = formatBullets(deletedRaw);
				if (addedBullets) sections.push(`### Added\n\n${addedBullets}`);
				if (changedBullets) sections.push(`### Changed\n\n${changedBullets}`);
				if (deletedBullets) sections.push(`### Deleted\n\n${deletedBullets}`);

				const safeSlug = pkgName
					.replace(/^@/, '')
					.replace(/[^a-z0-9-]+/gi, '-')
					.toLowerCase();
				const fileName = `${safeSlug}-${Date.now().toString(36)}.md`;
				const filePath = path.join(changesetDir, fileName);
				const fileContent = `---\n'${pkgName}': ${bumpType}\n---\n\n${sections.join('\n\n')}\n`;
				fs.writeFileSync(filePath, fileContent, 'utf8');
				commitLog.log(`✔ Created dedicated changeset .changeset/${fileName} for ${pkgName} (${bumpType})`);
			}

			runSync('npx @changesets/cli status');
		});
}
