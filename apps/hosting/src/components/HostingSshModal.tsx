/** @format */
'use client';

import { useEffect, useRef, useState } from 'react';
import { Copy, KeyRound, Play, Server, Terminal, Trash2 } from 'lucide-react';
import { Button, Input, Modal } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
export interface HostingNodeConfig {
	id: string;
	name: string;
	url: string;
	region?: string;
	sshTarget?: string;
	sshPort?: string;
	provider?: 'easypanel' | 'vercel';
}

export const DEFAULT_HOSTING_NODES: HostingNodeConfig[] = [
	{
		id: 'one-dummi',
		name: 'one-dummi',
		url: process.env.NEXT_PUBLIC_HOSTING_ONE_DUMMI_URL || 'https://one-dummi.xernerx.com',
		region: 'Primary Node',
		sshTarget: 'root@172.235.181.92',
		sshPort: '22',
		provider: 'easypanel',
	},
	{
		id: 'two-dummi',
		name: 'two-dummi',
		url: process.env.NEXT_PUBLIC_HOSTING_TWO_DUMMI_URL || 'https://two-dummi.xernerx.com',
		region: 'Secondary Node',
		sshTarget: 'root@62.235.163.212',
		sshPort: '22',
		provider: 'easypanel',
	},
	{
		id: 'vercel',
		name: 'vercel',
		url: 'https://vercel.com/dashboard',
		region: 'Edge & Web Cloud',
		provider: 'vercel',
	},
];

export function isVercelNode(node?: HostingNodeConfig): boolean {
	return Boolean(node && (node.provider === 'vercel' || node.id === 'vercel' || node.url?.toLowerCase().includes('vercel.com')));
}

interface HostingSshModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	activeNode?: HostingNodeConfig;
	nodes: HostingNodeConfig[];
	userId?: string;
	defaultPassword?: string;
}

interface TerminalHistoryEntry {
	id: string;
	target: string;
	cwd: string;
	command: string;
	stdout: string;
	stderr: string;
	exitCode: number;
	timestamp: string;
}

const QUICK_SSH_COMMANDS = [
	{ label: 'Uptime & OS', cmd: 'uname -a && uptime' },
	{ label: 'Docker Containers', cmd: 'docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"' },
	{ label: 'Disk Space', cmd: 'df -h /' },
	{ label: 'Memory Usage', cmd: 'free -h' },
	{ label: 'Easypanel Service', cmd: 'docker service ls || systemctl status easypanel --no-pager' },
];

export function buildThemedNodeUrl(rawUrl: string, resolvedTheme: 'light' | 'dark'): string {
	try {
		const parsed = new URL(rawUrl);
		parsed.searchParams.set('theme', resolvedTheme);
		parsed.searchParams.set('colorScheme', resolvedTheme);
		return parsed.toString();
	} catch {
		const sep = rawUrl.includes('?') ? '&' : '?';
		return `${rawUrl}${sep}theme=${resolvedTheme}&colorScheme=${resolvedTheme}`;
	}
}

export function resolveNodeSshTarget(node?: HostingNodeConfig): string {
	if (node?.sshTarget?.trim()) {
		const raw = node.sshTarget.trim();
		return raw.includes('@') ? raw : `root@${raw}`;
	}
	if (node?.id === 'one-dummi') return 'root@172.235.181.92';
	if (node?.id === 'two-dummi') return 'root@62.235.163.212';
	if (node?.url) {
		try {
			const parsed = new URL(node.url);
			if (parsed.hostname) return `root@${parsed.hostname}`;
		} catch {}
	}
	return 'root@';
}

export default function HostingSshModal({ open, onOpenChange, activeNode, nodes, userId, defaultPassword }: HostingSshModalProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();

	const [target, setTarget] = useState(() => resolveNodeSshTarget(activeNode));
	const [port, setPort] = useState(() => activeNode?.sshPort || '22');
	const [password, setPassword] = useState(() => defaultPassword || '');
	const [command, setCommand] = useState('');
	const [cwd, setCwd] = useState('~');
	const [running, setRunning] = useState(false);
	const [history, setHistory] = useState<TerminalHistoryEntry[]>([]);
	const [cmdHistory, setCmdHistory] = useState<string[]>([]);
	const [cmdHistoryIdx, setCmdHistoryIdx] = useState(-1);
	const outputEndRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (open) {
			setTarget(resolveNodeSshTarget(activeNode));
			setPort(activeNode?.sshPort || '22');
			setCwd('~');
			if (defaultPassword && !password) {
				setPassword(defaultPassword);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, activeNode, defaultPassword]);

	useEffect(() => {
		outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [history]);

	const normalizedTarget = (() => {
		const trimmed = target.trim();
		if (!trimmed) return 'root@';
		return trimmed.includes('@') ? trimmed : `root@${trimmed}`;
	})();

	const normalizedPort = port.trim() || '22';
	const sshCliCommand = normalizedPort !== '22' ? `ssh -p ${normalizedPort} ${normalizedTarget}` : `ssh ${normalizedTarget}`;

	const handleCopy = async (value: string, label: string) => {
		try {
			await navigator.clipboard.writeText(value);
			toast({ type: 'success', title: t('hosting.console.copiedToast', { field: label }) });
		} catch {}
	};

	const handleRunCommand = async (cmdToRun?: string) => {
		const finalCmd = (cmdToRun ?? command).trim();
		if (finalCmd === 'clear' || finalCmd === 'cls') {
			setHistory([]);
			setCommand('');
			return;
		}

		const hostPart = normalizedTarget.split('@')[1]?.trim();
		if (!hostPart) {
			toast({ type: 'error', title: t('hosting.sshModal.missingIpError') });
			return;
		}
		if (!finalCmd || !userId) return;

		setCmdHistory((prev) => [finalCmd, ...prev.filter((c) => c !== finalCmd)].slice(0, 50));
		setCmdHistoryIdx(-1);
		if (cmdToRun === undefined) setCommand('');

		setRunning(true);
		const startingCwd = cwd === '~' ? '' : cwd;

		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/hosting/ssh'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					userId,
					target: normalizedTarget,
					port: normalizedPort,
					command: finalCmd,
					cwd: startingCwd,
					password,
				}),
			});
			const data = await res.json().catch(() => ({}));
			const now = new Date().toLocaleTimeString();

			if (!res.ok || !data.ok) {
				setHistory((prev) => [
					...prev,
					{
						id: `${Date.now()}`,
						target: normalizedTarget,
						cwd,
						command: finalCmd,
						stdout: '',
						stderr: data.error || t('hosting.sshModal.execFailed'),
						exitCode: 1,
						timestamp: now,
					},
				]);
			} else {
				const returnedCwd = data.cwd || cwd;
				setCwd(returnedCwd);
				if (data.resolvedHost) {
					const userPart = normalizedTarget.split('@')[0] || 'root';
					setTarget(`${userPart}@${data.resolvedHost}`);
				}
				setHistory((prev) => [
					...prev,
					{
						id: `${Date.now()}`,
						target: data.resolvedHost ? `${normalizedTarget.split('@')[0] || 'root'}@${data.resolvedHost}` : normalizedTarget,
						cwd,
						command: finalCmd,
						stdout: data.stdout || '',
						stderr: data.stderr || '',
						exitCode: typeof data.exitCode === 'number' ? data.exitCode : 0,
						timestamp: now,
					},
				]);
			}
		} catch (err: any) {
			setHistory((prev) => [
				...prev,
				{
					id: `${Date.now()}`,
					target: normalizedTarget,
					cwd,
					command: finalCmd,
					stdout: '',
					stderr: err?.message || t('hosting.sshModal.execFailed'),
					exitCode: 1,
					timestamp: new Date().toLocaleTimeString(),
				},
			]);
		} finally {
			setRunning(false);
		}
	};

	return (
		<Modal open={open} onOpenChange={onOpenChange} maxWidth="max-w-4xl" title={t('hosting.sshModal.title')} description={t('hosting.sshModal.description')}>
			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
				{/* Node Quick Switcher Pills */}
				<div className="flex flex-wrap items-center gap-1.5">
					{nodes
						.filter((n) => !isVercelNode(n))
						.map((n) => {
							const nodeTarget = resolveNodeSshTarget(n);
							const isCurrent = normalizedTarget === nodeTarget;
							return (
								<button
									key={n.id}
									type="button"
									onClick={() => {
										setTarget(nodeTarget);
										setPort(n.sshPort || '22');
										setCwd('~');
									}}
									className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border transition-all cursor-pointer ${
										isCurrent ? 'bg-(--accent) text-(--text) border-(--accent)' : 'bg-(--background)/60 text-(--text-muted) border-(--border)/10 hover:text-(--text)'
									}`}
								>
									<Server size={12} />
									<span>{n.name}</span>
								</button>
							);
						})}
				</div>

				{/* Target (root@ip), Port & Password */}
				<div className="grid grid-cols-1 sm:grid-cols-12" style={{ gap: 'calc(var(--ui-gap) * 0.6)' }}>
					<div className="sm:col-span-6 flex flex-col gap-1">
						<span className="text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">{t('hosting.sshModal.targetLabel')}</span>
						<Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="root@123.45.67.89" />
					</div>
					<div className="sm:col-span-2 flex flex-col gap-1">
						<span className="text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">{t('hosting.sshModal.portLabel')}</span>
						<Input value={port} onChange={(e) => setPort(e.target.value)} placeholder="22" />
					</div>
					<div className="sm:col-span-4 flex flex-col gap-1">
						<div className="flex items-center justify-between gap-1">
							<span className="text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">{t('hosting.sshModal.passwordLabel')}</span>
							{defaultPassword && password !== defaultPassword && (
								<button type="button" onClick={() => setPassword(defaultPassword)} className="text-[10px] font-bold text-(--accent) hover:underline cursor-pointer">
									{t('hosting.sshModal.useLinkedSecret')}
								</button>
							)}
						</div>
						<Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" />
					</div>
				</div>

				{/* Web SSH Connect & CLI Copy Bar */}
				<div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-(--background)/60 border border-(--border)/10 px-3 py-2">
					<code className="font-mono text-xs text-(--accent) font-bold truncate">{sshCliCommand}</code>
					<div className="flex flex-wrap items-center gap-1.5 shrink-0">
						<Button variant="secondary" size="sm" onClick={() => handleCopy(sshCliCommand, 'SSH command')} className="flex items-center gap-1.5">
							<Copy size={12} />
							<span>{t('hosting.sshModal.copyCmd')}</span>
						</Button>
						{password && (
							<Button variant="secondary" size="sm" onClick={() => handleCopy(password, 'SSH password')} className="flex items-center gap-1.5">
								<KeyRound size={12} />
								<span>{t('hosting.sshModal.copyPassword')}</span>
							</Button>
						)}
						<Button variant="primary" size="sm" loading={running} onClick={() => handleRunCommand('uname -a && uptime && pwd')} className="flex items-center gap-1.5">
							<Terminal size={12} />
							<span>{t('hosting.sshModal.openTerminalApp')}</span>
						</Button>
					</div>
				</div>

				{/* Quick Preset Commands */}
				<div className="flex flex-wrap items-center gap-1.5">
					{QUICK_SSH_COMMANDS.map((preset) => (
						<button
							key={preset.label}
							type="button"
							disabled={running}
							onClick={() => handleRunCommand(preset.cmd)}
							className="inline-flex items-center gap-1 rounded-full bg-(--foreground)/50 hover:bg-(--accent)/15 border border-(--border)/10 hover:border-(--accent)/30 px-3 py-1 text-xs font-semibold text-(--text-muted) hover:text-(--accent) transition-all cursor-pointer"
						>
							<Play size={10} />
							<span>{preset.label}</span>
						</button>
					))}
				</div>

				{/* Interactive Terminal Output & Prompt */}
				<div className="rounded-2xl bg-(--background)/90 border border-(--border)/15 p-4 font-mono text-xs h-80 overflow-y-auto flex flex-col gap-3">
					{history.length === 0 ? (
						<div className="flex flex-col items-center justify-center flex-1 text-(--text-muted) text-center gap-2">
							<Terminal size={24} className="text-(--accent)" />
							<span>{t('hosting.sshModal.emptyPrompt', { target: normalizedTarget })}</span>
						</div>
					) : (
						history.map((item) => (
							<div key={item.id} className="flex flex-col gap-1 border-b border-(--border)/10 pb-2.5 last:border-b-0 last:pb-0">
								<div className="flex items-center justify-between text-[11px] text-(--text-muted)">
									<span className="font-bold text-(--accent)">
										{item.target}:{item.cwd}# <span className="text-(--text)">{item.command}</span>
									</span>
									<span>
										{item.timestamp} • exit {item.exitCode}
									</span>
								</div>
								{item.stdout && <pre className="whitespace-pre-wrap break-all text-(--text) leading-relaxed">{item.stdout.trimEnd()}</pre>}
								{item.stderr && <pre className="whitespace-pre-wrap break-all text-(--accent-red) leading-relaxed">{item.stderr.trimEnd()}</pre>}
							</div>
						))
					)}
					<div ref={outputEndRef} />
				</div>

				{/* Command Input Row */}
				<div className="flex items-center gap-2">
					<span className="hidden sm:inline-flex items-center rounded-xl bg-(--background)/70 border border-(--border)/10 px-3 py-2 font-mono text-xs font-bold text-(--accent) shrink-0">
						{normalizedTarget}:{cwd}#
					</span>
					<div className="flex-1">
						<Input
							value={command}
							onChange={(e) => setCommand(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter' && !running) {
									e.preventDefault();
									handleRunCommand();
								} else if (e.key === 'ArrowUp' && cmdHistory.length > 0) {
									e.preventDefault();
									const nextIdx = Math.min(cmdHistoryIdx + 1, cmdHistory.length - 1);
									setCmdHistoryIdx(nextIdx);
									setCommand(cmdHistory[nextIdx] || '');
								} else if (e.key === 'ArrowDown') {
									e.preventDefault();
									const nextIdx = cmdHistoryIdx - 1;
									if (nextIdx < 0) {
										setCmdHistoryIdx(-1);
										setCommand('');
									} else {
										setCmdHistoryIdx(nextIdx);
										setCommand(cmdHistory[nextIdx] || '');
									}
								}
							}}
							placeholder="cd /etc/easypanel, ls -la, docker ps, df -h..."
						/>
					</div>
					<Button variant="primary" onClick={() => handleRunCommand()} loading={running} className="flex items-center gap-1.5 shrink-0">
						<Play size={14} />
						<span>{t('hosting.sshModal.runButton')}</span>
					</Button>
					{history.length > 0 && (
						<Button variant="ghost" size="sm" onClick={() => setHistory([])} title={t('hosting.sshModal.clearConsole')}>
							<Trash2 size={14} />
						</Button>
					)}
				</div>
			</div>
		</Modal>
	);
}
