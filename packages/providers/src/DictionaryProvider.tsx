/** @format */
'use client';

import React, { createContext, useContext, useMemo } from 'react';

import { Locale } from '@xernerx/lib/server';

const DictionaryContext = createContext<any | null>(null);

function getNestedValue(obj: any, path: string) {
	return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

export function DictionaryProvider({
	dictionary,
	children,
}: {
	dictionary: { dictionary: any; fallbackDictionary: any; currentLocale: Locale; locales: Array<{ code: any }> };
	children: React.ReactNode;
}) {
	const currentLanguage = dictionary.locales.find((language) => language.code == dictionary.currentLocale);

	const t = useMemo(() => {
		return function translate(path: string, variables?: Record<string, string | number>) {
			// 1. Try active language dictionary
			let value = getNestedValue(dictionary.dictionary, path);

			// 2. Fall back to the default/fallback dictionary if missing
			if (value === undefined && dictionary.fallbackDictionary) {
				value = getNestedValue(dictionary.fallbackDictionary, path);
			}

			// 3. Last resort fallback to path string
			if (value === undefined) {
				return path;
			}

			// 4. Handle variable interpolation
			if (variables) {
				return Object.entries(variables).reduce((str, [key, val]) => {
					return str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
				}, value);
			}

			return value;
		};
	}, [dictionary.dictionary, dictionary.fallbackDictionary]);

	return (
		<DictionaryContext.Provider
			value={{
				dictionary: dictionary.dictionary,
				currentLocale: dictionary.currentLocale,
				locales: dictionary.locales,
				currentLanguage,
				t,
			}}>
			{children}
		</DictionaryContext.Provider>
	);
}

export function useDictionary() {
	const context = useContext(DictionaryContext);
	if (!context) {
		throw new Error('useDictionary must be used within a DictionaryProvider');
	}
	return context;
}
