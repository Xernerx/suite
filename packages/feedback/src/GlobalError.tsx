/** @format */
'use client';

import { AlertTriangle, Check, Copy, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDictionary } from '@xernerx/providers';

export function GlobalError({
	error,
	reset,
}: {
	error: Error & {
		digest?: string;
	};
	reset: () => void;
}) {
	const { t } = useDictionary();
	const [copied, setCopied] = useState(false);

	// Initialize preferences from cookies in case the root layout crashed before setting them
	useEffect(() => {
		try {
			const getCookie = (name: string) => {
				const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
				return match ? match[2] : null;
			};
			const zoom = getCookie('uiZoom');
			if (zoom) {
				const parsed = parseInt(zoom, 10);
				if (!isNaN(parsed)) {
					document.documentElement.style.setProperty('--ui-zoom', String(parsed / 100));
					document.documentElement.style.setProperty('--ui-scale', String(parsed));
				}
			}
			const gap = getCookie('uiGap');
			if (gap) document.documentElement.style.setProperty('--ui-gap', `${gap}px`);
			const textScale = getCookie('textScale');
			if (textScale) document.documentElement.style.setProperty('--text-scale', `${textScale}px`);
		} catch {}
	}, []);

	const buildFullErrorString = () => {
		const lines = [
			`Global Error: ${error?.message || t('feedback.error.unknown')}`,
			...(error?.digest ? [`Digest: ${error.digest}`] : []),
			...(typeof window !== 'undefined' ? [`Location: ${window.location.href}`] : []),
			`Timestamp: ${new Date().toISOString()}`,
			...(error?.stack ? [`\nStack Trace:\n${error.stack}`] : []),
		];
		return lines.join('\n');
	};

	const handleCopyError = () => {
		navigator.clipboard.writeText(buildFullErrorString());
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<html lang="en">
			<body
				className="flex min-h-screen flex-col items-center justify-center text-center bg-(--background) text-(--text)"
				style={{
					padding: 'var(--ui-gap)',
					gap: 'var(--ui-gap)',
				}}
			>
				<div
					className="flex flex-col items-center w-full max-w-2xl rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
					style={{
						padding: 'calc(var(--ui-gap) * 1.5)',
						gap: 'var(--ui-gap)',
					}}
				>
					<div className="rounded-2xl bg-(--accent-red)/10 p-4 border border-(--accent-red)/20">
						<AlertTriangle size={48} className="text-(--accent-red)" />
					</div>
					<div
						className="flex flex-col items-center w-full"
						style={{
							gap: 'calc(var(--ui-gap) * 0.25)',
						}}
					>
						<h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('common.globalerror.title')}
						</h2>
						<p className="text-sm text-(--text-muted) max-w-md">{t('common.globalerror.description')}</p>

						{error && (
							<div className="mt-3 flex flex-col bg-(--background)/70 rounded-2xl border border-(--border)/10 text-left w-full overflow-hidden">
								<div className="flex items-center justify-between px-4 py-2.5 border-b border-(--border)/10 bg-(--background)/50">
									<span className="text-xs font-mono text-(--accent-red) font-bold">{t('feedback.error.details')}</span>
									<button
										type="button"
										onClick={handleCopyError}
										className="inline-flex items-center gap-1.5 rounded-xl border border-(--border)/15 bg-(--foreground)/60 hover:bg-(--foreground) px-2.5 py-1 text-[11px] font-semibold text-(--text) transition-colors cursor-pointer"
									>
										{copied ? <Check size={12} className="text-(--accent-green)" /> : <Copy size={12} />}
										{copied ? t('feedback.error.copied') : t('feedback.error.copyError')}
									</button>
								</div>
								<div className="p-4 max-h-[36dvh] overflow-auto flex flex-col gap-2">
									<p className="text-xs font-mono text-(--text) whitespace-pre-wrap break-words">{error.message || t('feedback.error.unknown')}</p>
									{error.digest && (
										<p className="text-xs font-mono text-(--text-muted)">
											{t('feedback.error.digest')}
											{error.digest}
										</p>
									)}
									{error.stack && <pre className="mt-1 text-[11px] font-mono text-(--text-muted)/80 whitespace-pre-wrap break-words leading-relaxed m-0">{error.stack}</pre>}
								</div>
							</div>
						)}
					</div>

					<div className="flex flex-wrap items-center justify-center gap-3">
						<button
							type="button"
							onClick={() => reset()}
							className="inline-flex items-center gap-2 rounded-2xl bg-(--accent) font-semibold text-white text-sm transition-colors hover:bg-(--hover-accent) shadow-sm cursor-pointer"
							style={{
								padding: 'calc(var(--ui-gap) * 0.6) var(--ui-gap)',
							}}
						>
							<RotateCcw size={15} />
							{t('common.globalerror.button')}
						</button>
						<button
							type="button"
							onClick={handleCopyError}
							className="inline-flex items-center gap-2 rounded-2xl bg-(--background)/60 hover:bg-(--background) border border-(--border)/15 font-semibold text-(--text) text-sm transition-colors shadow-sm cursor-pointer"
							style={{
								padding: 'calc(var(--ui-gap) * 0.6) var(--ui-gap)',
							}}
						>
							{copied ? <Check size={15} className="text-(--accent-green)" /> : <Copy size={15} />}
							{copied ? t('feedback.error.copied') : t('feedback.error.copyError')}
						</button>
					</div>
				</div>
			</body>
		</html>
	);
}
