/** @format */
'use client';

import { useDictionary, useEnvironment, useSidebar } from '@xernerx/providers';

import { Button } from '@xernerx/ui';
import { Session } from 'next-auth';
import { AlertTriangle, Check, Copy, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReturnPage({ session, dbError }: { session: Session | null; dbError?: string | null }) {
	const router = useRouter();
	const { hide } = useSidebar();
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		hide();
	}, [hide]);

	const handleCopyDbError = () => {
		if (!dbError) return;
		const fullText = [`Database Error: ${dbError}`, ...(typeof window !== 'undefined' ? [`Location: ${window.location.href}`] : []), `Timestamp: ${new Date().toISOString()}`].join('\n');
		navigator.clipboard.writeText(fullText);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	if (dbError) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[70vh] w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				<div
					className="flex flex-col items-center text-center max-w-2xl w-full rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
					style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
				>
					<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-(--accent-red)/10 text-(--accent-red)">
						<AlertTriangle size={32} />
					</div>
					<div className="flex flex-col w-full" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<h1 className="text-xl font-bold text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('feedback.error.databaseErrorTitle')}
						</h1>
						<p className="text-sm text-(--text-muted)">{t('feedback.error.description')}</p>
						<div className="mt-4 flex flex-col bg-(--background)/70 rounded-2xl border border-(--border)/10 text-left w-full overflow-hidden">
							<div className="flex items-center justify-between px-4 py-2.5 border-b border-(--border)/10 bg-(--background)/50">
								<span className="text-xs font-mono text-(--accent-red) font-bold">{t('feedback.error.details')}</span>
								<button
									type="button"
									onClick={handleCopyDbError}
									className="inline-flex items-center gap-1.5 rounded-xl border border-(--border)/15 bg-(--foreground)/60 hover:bg-(--foreground) px-2.5 py-1 text-[11px] font-semibold text-(--text) transition-colors cursor-pointer"
								>
									{copied ? <Check size={12} className="text-(--accent-green)" /> : <Copy size={12} />}
									{copied ? t('feedback.error.copied') : t('feedback.error.copyError')}
								</button>
							</div>
							<div className="p-4 max-h-[36vh] overflow-auto">
								<p className="text-xs font-mono text-(--text) whitespace-pre-wrap break-words">{dbError}</p>
							</div>
						</div>
					</div>
					<div className="flex flex-wrap items-center justify-center gap-3">
						<Button onClick={() => window.location.reload()}>{t('feedback.error.retry')}</Button>
						<Button variant="secondary" onClick={handleCopyDbError} className="flex items-center gap-2">
							{copied ? <Check size={15} className="text-(--accent-green)" /> : <Copy size={15} />}
							{copied ? t('feedback.error.copied') : t('feedback.error.copyError')}
						</Button>
						<Button variant="secondary" onClick={() => router.back()}>
							{t('account.unauthorized.button')}
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center min-h-screen w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<div
				className="flex flex-col items-center text-center max-w-md rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-(--accent-red)/10 text-(--accent-red)">
					<ShieldAlert size={32} />
				</div>
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<h1 className="text-xl font-bold text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('account.unauthorized.title')}
					</h1>
					<p className="text-sm text-(--text-muted)">{t('account.unauthorized.description')}</p>
				</div>
				{session ? (
					<Button onClick={() => router.back()}>{t('account.unauthorized.button')}</Button>
				) : (
					<Button
						onClick={() => {
							if (typeof window !== 'undefined') {
								window.location.href = `${getEnvUrl('https://account.xernerx.com/login')}?redirect=${encodeURIComponent(window.location.href)}`;
							}
						}}
					>
						{t('account.signin.button')}
					</Button>
				)}
			</div>
		</div>
	);
}
