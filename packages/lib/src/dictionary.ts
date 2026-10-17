/** @format */

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

export const dictionary = async (locale: Locale) => {
	const targetLocale = localesConfig[locale] ? locale : defaultLocale;
	const defaultDict = await localesConfig[defaultLocale].load();
	const activeDict = targetLocale === defaultLocale ? defaultDict : await localesConfig[targetLocale].load();

	if (!localesCoveragePromise || cachedDefaultDict !== defaultDict) {
		cachedDefaultDict = defaultDict;
		localesCoveragePromise = (async () => {
			const totalKeys = countKeys(defaultDict);
			return Promise.all(
				supportedLocales.map(async (dictCode) => {
					const dictObj = dictCode === defaultLocale ? defaultDict : await localesConfig[dictCode].load();
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
