/** @format */

import { Terminal } from '@xernerx/terminal';

/**
 * Shared root `@xernerx/terminal` logger instance for the Xernerx Suite.
 */
export const terminal = new Terminal({
	title: 'XERNERX',
	scope: 'SUITE',
	format: ['title', 'scope', 'datetime', 'memory'],
	spin: false,
});

/**
 * Creates a scoped `@xernerx/terminal` logger with the canonical suite format:
 * `XERNERX | <SCOPE> | <DATETIME> | <MEMORY> | <MESSAGE>`
 */
export function createLogger(scope: string): Terminal {
	return new Terminal({
		title: 'XERNERX',
		scope,
		format: ['title', 'scope', 'datetime', 'memory'],
		spin: false,
	});
}

export { Terminal };
