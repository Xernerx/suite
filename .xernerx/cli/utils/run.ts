/** @format */

import { type ChildProcess, spawn } from 'child_process';
import { pipeStreamToTerminal, terminal } from './terminal';

export interface ScopedProcessSpec {
	scope: string;
	command: string;
	args: string[];
	cwd?: string;
	env?: NodeJS.ProcessEnv;
}

export function runCommand(command: string, args: string[], scope?: string, cwd?: string): ChildProcess {
	if (!scope) {
		return spawn(command, args, { stdio: 'inherit', shell: true, cwd });
	}
	return spawnScopedProcess({ scope, command, args, cwd });
}

export function spawnScopedProcess(spec: ScopedProcessSpec): ChildProcess {
	const logger = terminal.child({ scope: spec.scope });
	const child = spawn(spec.command, spec.args, {
		cwd: spec.cwd || process.cwd(),
		stdio: ['ignore', 'pipe', 'pipe'],
		shell: true,
		env: {
			...process.env,
			...spec.env,
			FORCE_COLOR: '1',
		},
	});

	pipeStreamToTerminal(child.stdout, logger, false);
	pipeStreamToTerminal(child.stderr, logger, true);

	return child;
}

export function runScopedProcesses(specs: ScopedProcessSpec[]): ChildProcess[] {
	const children = specs.map((spec) => spawnScopedProcess(spec));

	let shuttingDown = false;
	const cleanup = () => {
		if (shuttingDown) return;
		shuttingDown = true;
		for (const child of children) {
			if (!child.killed && child.pid) {
				try {
					if (process.platform === 'win32') {
						spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
					} else {
						child.kill('SIGTERM');
					}
				} catch {}
			}
		}
	};

	process.once('SIGINT', cleanup);
	process.once('SIGTERM', cleanup);
	process.once('exit', cleanup);

	return children;
}
