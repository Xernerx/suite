/** @format */

export { auth, wrapAuthRouteHandler, encryptQrHandoffTicket, decryptQrHandoffTicket } from './src/auth';
export { navigation, headerSubdomainsCatalog, type NavigationItem, type HeaderSubdomainItem } from './src/navigation';
export { proxy } from './src/proxy';
export * from './src/env';
export * from './src/products';
export * from './src/permissions';
export * from './src/timezones';
export * from './src/milestones';
export type { Locale } from './src/i18n.config';
import defaultEnGbDictionary from './src/dictionaries/en-GB.json';
export { defaultEnGbDictionary };
