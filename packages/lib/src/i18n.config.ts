/** @format */
// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.

export const localesConfig = {
    'en-GB': {
        label: 'English (UK)',
        load: () => import('./dictionaries/en-GB.json').then((module) => module.default),
    },
    'en-US': {
        label: 'English (US)',
        load: () => import('./dictionaries/en-US.json').then((module) => module.default),
    },
    'es': {
        label: 'Spanish',
        load: () => import('./dictionaries/es.json').then((module) => module.default),
    },
    'fr': {
        label: 'Français',
        load: () => import('./dictionaries/fr.json').then((module) => module.default),
    },
    'nl': {
        label: 'Nederlands',
        load: () => import('./dictionaries/nl.json').then((module) => module.default),
    },
} as const;

export type Locale = keyof typeof localesConfig;
export const supportedLocales = Object.keys(localesConfig) as Locale[];
export const defaultLocale: Locale = supportedLocales[0] || 'en-GB';
