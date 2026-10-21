/** @format */

import fs from 'fs';
import path from 'path';
import { type Locale, localesConfig, supportedLocales, defaultLocale } from './i18n.config';

const countKeys = (obj: any): number => {
	let count = 0;
	for (const key in obj) {
		if (typeof obj[key] === 'object' && obj[key] !== null) {
			count += countKeys(obj[key]);
		} else {
			count++;
		}
	}
	return count;
};

export const locales = supportedLocales;

export { Locale };

let cachedDefaultDict: any = null;
let localesCoveragePromise: Promise<{ code: Locale; label: string; coverage: number }[]> | null = null;

async function loadLocaleDict(code: Locale): Promise<any> {
	if (process.env.NODE_ENV === 'development') {
		const candidates = [path.resolve(process.cwd(), 'packages/lib/src/dictionaries', `${code}.json`), path.resolve(process.cwd(), '../../packages/lib/src/dictionaries', `${code}.json`)];
		for (const filePath of candidates) {
			try {
				if (fs.existsSync(filePath)) {
					return JSON.parse(fs.readFileSync(filePath, 'utf8'));
				}
			} catch {
				// Fall back to bundled dynamic import
			}
		}
	}
	return localesConfig[code].load();
}

export const dictionary = async (locale: Locale) => {
	const targetLocale = localesConfig[locale] ? locale : defaultLocale;
	const isDev = process.env.NODE_ENV === 'development';
	const defaultDict = await loadLocaleDict(defaultLocale);
	const activeDict = targetLocale === defaultLocale ? defaultDict : await loadLocaleDict(targetLocale);

	if (isDev || !localesCoveragePromise || cachedDefaultDict !== defaultDict) {
		cachedDefaultDict = defaultDict;
		localesCoveragePromise = (async () => {
			const totalKeys = countKeys(defaultDict);
			return Promise.all(
				supportedLocales.map(async (dictCode) => {
					const dictObj = dictCode === defaultLocale ? defaultDict : await loadLocaleDict(dictCode);
					const translatedKeys = countKeys(dictObj);
					const coverage = totalKeys > 0 ? Math.round((translatedKeys / totalKeys) * 100) : 100;

					return {
						code: dictCode,
						label: localesConfig[dictCode].label,
						coverage,
					};
				})
			);
		})();
	}

	const localesList = await localesCoveragePromise;

	return {
		dictionary: activeDict,
		fallbackDictionary: defaultDict,
		locales: localesList,
		currentLocale: targetLocale,
	};
};
