/** @format */

import 'server-only';
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

export { Locale };

export const dictionary = async (locale: Locale) => {
	const loadDefault = localesConfig[defaultLocale].load;
	const loadActive = localesConfig[locale]?.load ?? loadDefault;

	const defaultDict = await loadDefault();
	const activeDict = await loadActive();

	const totalKeys = countKeys(defaultDict);

	const locales = await Promise.all(
		supportedLocales.map(async (dictCode) => {
			const dictObj = await localesConfig[dictCode].load();
			const translatedKeys = countKeys(dictObj);

			const coverage = totalKeys > 0 ? Math.round((translatedKeys / totalKeys) * 100) : 100;

			return {
				code: dictCode,
				label: localesConfig[dictCode].label,
				coverage,
			};
		})
	);

	return {
		dictionary: activeDict,
		fallbackDictionary: defaultDict, // <-- Include the default/fallback dictionary here
		locales,
		currentLocale: locale,
	};
};
