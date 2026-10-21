/** @format */
'use client';

import { Check, Copy, ExternalLink, RefreshCw, Terminal } from 'lucide-react';
import { Button, Modal } from '@xernerx/ui';
import { useCallback, useEffect, useState } from 'react';
import { useDictionary, useToast } from '@xernerx/providers';

interface DesktopLogsModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	desktopMeta: Record<string, any>;
}

export function DesktopLogsModal({ open, onOpenChange, desktopMeta }: DesktopLogsModalProps) {
	const { t } = useDictionary();
	const { toast } = useToast();
	const [logContent, setLogContent] = useState<string>('');
	const [logPath, setLogPath] = useState<string>('');
	const [loading, setLoading] = useState(false);
	const [copied, setCopied] = useState(false);

	const loadLogs = useCallback(async () => {
		if (typeof window === 'undefined') return;
		setLoading(true);
		try {
			const bridge = (window as any).electron;
			const now = new Date().toISOString();
			const version = bridge?.version || '1.0.0';
			const ua = window.navigator.userAgent;

			const headerLines = [
				`=== Xernerx Desktop Diagnostics (${now}) ===`,
				`App Version: ${version}`,
				`User-Agent: ${ua}`,
				`Current URL: ${window.location.href}`,
				`Active Config: ${JSON.stringify(desktopMeta)}`,
				`================================================`,
				'',
			];

			if (bridge?.getLogs) {
				const res = await bridge.getLogs();
				if (res && typeof res === 'object') {
					if (res.path) setLogPath(res.path);
					const fileBody = res.content ? String(res.content).trim() : '';
					setLogContent(fileBody ? `${headerLines.join('\n')}${fileBody}` : headerLines.join('\n'));
					setLoading(false);
					return;
				}
			}

			setLogContent(headerLines.join('\n'));
		} catch (err: any) {
			setLogContent(`Failed to read desktop log file: ${err?.message || String(err)}`);
		} finally {
			setLoading(false);
		}
	}, [desktopMeta]);

	useEffect(() => {
		if (open) {
			loadLogs();
		}
	}, [open, loadLogs]);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(logContent);
			setCopied(true);
			toast({
				type: 'success',
				title: t('account.preferences.desktop.logsCopied'),
			});
			setTimeout(() => setCopied(false), 2000);
		} catch {}
	};

	const handleOpenExternal = async () => {
		const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		try {
			if (bridge?.openLogs) {
				await bridge.openLogs();
			} else {
				const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
				const url = URL.createObjectURL(blob);
				window.open(url, '_blank');
				setTimeout(() => URL.revokeObjectURL(url), 5000);
			}
		} catch {}
	};

	return (
		<Modal open={open} onOpenChange={onOpenChange} title={t('account.preferences.desktop.logsModalTitle')} description={t('account.preferences.desktop.logsModalSubtitle')} maxWidth="max-w-2xl">
			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
				{logPath && (
					<div className="flex items-center gap-2 rounded-2xl bg-(--foreground)/40 border border-(--border)/10 px-3 py-2 text-xs font-mono text-(--text-muted) truncate">
						<Terminal size={14} className="text-(--accent) shrink-0" />
						<span className="truncate">{logPath}</span>
					</div>
				)}

				<pre className="max-h-96 min-h-56 overflow-y-auto rounded-2xl border border-(--border)/10 bg-(--background)/80 p-4 font-mono text-xs text-(--text) whitespace-pre-wrap break-words leading-relaxed select-all">
					{loading ? '...' : logContent}
				</pre>

				<div className="flex flex-wrap items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<Button variant="secondary" size="sm" onClick={loadLogs} className="flex items-center gap-1.5">
							<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
							{t('account.preferences.desktop.refreshLogs')}
						</Button>
						<Button variant="secondary" size="sm" onClick={handleOpenExternal} className="flex items-center gap-1.5">
							<ExternalLink size={14} />
							{t('account.preferences.desktop.openLogFile')}
						</Button>
					</div>

					<Button variant="primary" size="sm" onClick={handleCopy} className="flex items-center gap-1.5">
						{copied ? <Check size={14} /> : <Copy size={14} />}
						{t('account.preferences.desktop.copyLogs')}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
