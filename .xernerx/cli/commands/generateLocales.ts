import fs from 'fs';
import path from 'path';
import { Command } from 'commander';

export function generateLocalesCommand() {
	const dictionariesDir = path.join(process.cwd(), 'packages/lib/src/dictionaries');
	const outputFile = path.join(process.cwd(), 'packages/lib/src/i18n.config.ts');

	const filenames = fs.existsSync(dictionariesDir) ? fs.readdirSync(dictionariesDir).filter((file) => file.endsWith('.json')) : [];

	const locales: { code: string; label: string; filename: string }[] = [];

	for (const file of filenames) {
		const code = path.basename(file, '.json');
		const filePath = path.join(dictionariesDir, file);
		const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

		// Pull label from metadata.label now
		const label = content.metadata?.label || code;

		locales.push({ code, label, filename: file });
	}

	// Write the fully typed, auto-scanned i18n.config.ts file
	const codeOutput = `/** @format */
// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.

export const localesConfig = {
${locales
	.map(
		(l) => `    '${l.code}': {
        label: '${l.label}',
        load: () => import('./dictionaries/${l.filename}').then((module) => module.default),
    },`
	)
	.join('\n')}
} as const;

export type Locale = keyof typeof localesConfig;
export const supportedLocales = Object.keys(localesConfig) as Locale[];
export const defaultLocale: Locale = supportedLocales[0] || 'en-GB';
`;

	fs.writeFileSync(outputFile, codeOutput);
	console.log(`[i18n] Generated i18n.config.ts with ${locales.length} locales.`);
}

export default function registerGenerateLocales(program: Command) {
	program
		.command('generate-locales')
		.description('Scans dictionaries and generates the i18n.config.ts file in packages/lib.')
		.action(() => {
			generateLocalesCommand();
		});
}
