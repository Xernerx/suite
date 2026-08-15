import { spawn } from 'child_process';

export function runCommand(command: string, args: string[]) {
	return spawn(command, args, { stdio: 'inherit', shell: true });
}
