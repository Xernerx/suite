/** @format */
'use client';

import React, { createContext, useContext, useMemo } from 'react';

import { defaultEnGbDictionary, type Locale } from '@xernerx/lib';

const DictionaryContext = createContext<any | null>(null);

function getNestedValue(obj: any, path: string) {
	return path.split('.').reduce((acc, part) => (acc && typeof acc === 'object' ? acc[part] : undefined), obj);
}

export function DictionaryProvider({
	dictionary,
	children,
}: {
	dictionary: { dictionary: any; fallbackDictionary: any; currentLocale: Locale; locales: Array<{ code: any }> };
	children: React.ReactNode;
}) {
	const currentLanguage = dictionary.locales.find((language) => language.code == dictionary.currentLocale);
	const activeDictionary = dictionary.dictionary || defaultEnGbDictionary;
	const fallbackDictionary = dictionary.fallbackDictionary || (dictionary.currentLocale !== 'en-GB' ? defaultEnGbDictionary : null);

	const t = useMemo(() => {
		return function translate(path: string, variables?: Record<string, string | number>) {
			// 1. Try active language dictionary
			let value = getNestedValue(activeDictionary, path);

			// 2. Fall back to the default/fallback dictionary if missing
			if (value === undefined && fallbackDictionary) {
				value = getNestedValue(fallbackDictionary, path);
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
	}, [activeDictionary, fallbackDictionary]);

	return (
		<DictionaryContext.Provider
			value={{
				dictionary: activeDictionary,
				currentLocale: dictionary.currentLocale,
				locales: dictionary.locales,
				currentLanguage,
				t,
			}}
		>
			{children}
		</DictionaryContext.Provider>
	);
}

const FALLBACK_DICTIONARY: Record<string, string> = {
	'feedback.error.title': 'Something went wrong!',
	'feedback.error.description': 'An unexpected error occurred while loading this page. Please try again or contact support if the issue persists.',
	'feedback.error.details': 'Error Details:',
	'feedback.error.unknown': 'Unknown error occurred.',
	'feedback.error.digest': 'Error ID: ',
	'feedback.error.retry': 'Try Again',
	'feedback.notFound.title': 'Page Not Found',
	'feedback.notFound.description': 'The page you are looking for does not exist or has been moved.',
	'feedback.notFound.backHome': 'Back to Home',
};

export function useDictionary() {
	const context = useContext(DictionaryContext);
	if (!context) {
		return {
			dictionary: {},
			currentLocale: 'en-GB' as Locale,
			locales: [],
			currentLanguage: undefined,
			t: (path: string, variables?: Record<string, string | number>) => {
				const value = FALLBACK_DICTIONARY[path] || path;
				if (variables) {
					return Object.entries(variables).reduce((str, [key, val]) => {
						return str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
					}, value);
				}
				return value;
			},
		};
	}
	return context;
}
