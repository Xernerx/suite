/** @format */

import type { Readable } from 'stream';
import { Terminal } from '@xernerx/terminal';

export const terminal = new Terminal({
	title: 'XERNERX',
	scope: 'CLI',
	format: ['title', 'scope', 'datetime', 'memory'],
	spin: false,
});

// eslint-disable-next-line no-control-regex
const ANSI_REGEX = /\x1B\[[0-9;]*[a-zA-Z]/g;

export function stripAnsi(input: string): string {
	return input.replace(ANSI_REGEX, '');
}

/**
 * Pipes a child process's stdout or stderr stream into a scoped `@xernerx/terminal` instance.
 * - Lines already formatted by `@xernerx/terminal` (`XERNERX | ...` or `boxen` borders) are passed through untouched so they are never double-prefixed.
 * - Cloudflared ISO log lines (`2026-...Z INF/WRN/ERR ...`) have their redundant timestamp/level stripped and map to `.log()` / `.warn()` / `.error()`.
 * - Redundant `pnpm` script echo lines (`> pkg@version dev ...`) are filtered out.
 */
export function pipeStreamToTerminal(stream: Readable | null | undefined, logger: Terminal, isErr = false, onLine?: (rawLine: string, plainLine: string) => void): void {
	if (!stream) return;

	let remainder = '';

	const flushLine = (rawLine: string) => {
		const trimmedRaw = rawLine.replace(/\r$/, '');
		const plain = stripAnsi(trimmedRaw).trim();
		if (!plain) return;

		onLine?.(trimmedRaw, plain);

		// 1. Pass through lines already formatted by @xernerx/terminal or boxen inside child processes
		if (/(?:^|^[ℹ⚠✔✖]\s+)XERNERX\s*\|/.test(plain) || /^[╭│├╰]/.test(plain)) {
			process.stdout.write(trimmedRaw + '\n');
			return;
		}

		// 2. Filter out noisy pnpm/npm script header echoes
		if (/^>\s+\S+@\S+\s+(dev|start|build)\b/.test(plain) || /^>\s+(node|tsx|tsc|next|electron)\b/.test(plain)) {
			return;
		}

		// 3. Clean up cloudflared log lines ("2026-10-28T19:30:00Z INF Registered tunnel connection...")
		const cfMatch = plain.match(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z\s+(INF|WRN|ERR|DBG)\s+(.*)$/);
		if (cfMatch) {
			const [, level, msg] = cfMatch;
			if (level === 'ERR') {
				logger.error(msg);
			} else if (level === 'WRN') {
				logger.warn(msg);
			} else {
				logger.log(msg);
			}
			return;
		}

		// 4. Strip any residual concurrently/parallel index prefix
		const cleaned = trimmedRaw.replace(/^\s*\[\d+\]\s*/, '');
		const cleanedPlain = stripAnsi(cleaned).trim();

		if (/\b(error|err|fatal|exception|unhandled)\b/i.test(cleanedPlain)) {
			logger.error(cleaned);
		} else if (/\b(warn|warning|deprecated)\b/i.test(cleanedPlain)) {
			logger.warn(cleaned);
		} else if (isErr) {
			logger.warn(cleaned);
		} else {
			logger.log(cleaned);
		}
	};

	stream.on('data', (chunk: Buffer) => {
		const text = remainder + chunk.toString('utf8');
		const lines = text.split('\n');
		remainder = lines.pop() ?? '';
		for (const line of lines) {
			flushLine(line);
		}
	});

	stream.on('end', () => {
		if (remainder.trim()) {
			flushLine(remainder);
			remainder = '';
		}
	});
}

export { Terminal };
