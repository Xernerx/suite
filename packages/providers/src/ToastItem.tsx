/** @format */
'use client';

import { AlertCircle, Check, CheckCircle, Copy, Eye, Info, X } from 'lucide-react';
import { motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';
import { useDictionary } from './DictionaryProvider';
import type { Toast } from './ToastProvider';

export function formatErrorPayload(title: string, description?: string, route?: string, createdAt?: number): string {
	let formattedDesc = description || '';
	if (formattedDesc) {
		try {
			const parsed = JSON.parse(formattedDesc);
			formattedDesc = JSON.stringify(parsed, null, 2);
		} catch {}
	}
	const lines = [`Error: ${title}`];
	if (formattedDesc) lines.push(`Details:\n${formattedDesc}`);
	if (route) lines.push(`Location: ${route}`);
	if (createdAt) lines.push(`Timestamp: ${new Date(createdAt).toISOString()}`);
	return lines.join('\n\n');
}

export function ToastItem({
	toast,
	index,
	totalCount,
	isStackHovered,
	isPaused,
	onDismiss,
	onInspectError,
}: {
	toast: Toast;
	index: number;
	totalCount: number;
	isStackHovered: boolean;
	isPaused: boolean;
	onDismiss: (id: string) => void;
	onInspectError: (toast: Toast) => void;
}) {
	const { t } = useDictionary();
	const isError = toast.type === 'error';
	const duration = toast.duration || (isError ? 6000 : 3500);

	const remainingRef = useRef(duration);
	const [progress, setProgress] = useState(100);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (isPaused) return;
		const tickMs = 40;
		const interval = setInterval(() => {
			remainingRef.current = Math.max(0, remainingRef.current - tickMs);
			const nextPct = Math.max(0, (remainingRef.current / duration) * 100);
			setProgress(nextPct);
			if (remainingRef.current <= 0) {
				clearInterval(interval);
				onDismiss(toast.id);
			}
		}, tickMs);

		return () => clearInterval(interval);
	}, [duration, isPaused, onDismiss, toast.id]);

	const handleCopyError = (e: React.MouseEvent) => {
		e.stopPropagation();
		const route = typeof window !== 'undefined' ? window.location.href : undefined;
		navigator.clipboard.writeText(formatErrorPayload(toast.title, toast.description, route, toast.createdAt));
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const icons = {
		success: <CheckCircle className="text-(--accent-green)" size={20} />,
		error: <AlertCircle className="text-(--accent-red)" size={20} />,
		warning: <AlertCircle className="text-(--accent-orange)" size={20} />,
		info: <Info className="text-(--accent)" size={20} />,
	};
	const progressColors = {
		success: 'bg-(--accent-green)',
		error: 'bg-(--accent-red)',
		warning: 'bg-(--accent-orange)',
		info: 'bg-(--accent)',
	};

	const icon = icons[toast.type || 'info'];
	const progressColor = progressColors[toast.type || 'info'];

	const isCollapsedBehind = !isStackHovered && index > 0;
	const collapsedScale = index === 0 ? 1 : Math.max(0.86, 1 - index * 0.05);
	const collapsedY = index === 0 ? 0 : -index * 10;
	const collapsedOpacity = index === 0 ? 1 : index === 1 ? 0.85 : index === 2 ? 0.55 : 0;

	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 30, scale: 0.92 }}
			animate={{
				opacity: isStackHovered ? 1 : collapsedOpacity,
				y: isStackHovered ? 0 : collapsedY,
				scale: isStackHovered ? 1 : collapsedScale,
			}}
			exit={{
				opacity: 0,
				scale: 0.9,
				transition: { duration: 0.18 },
			}}
			transition={{ type: 'spring', stiffness: 360, damping: 28 }}
			className={`pointer-events-auto flex w-full items-start overflow-hidden rounded-2xl border border-(--border)/15 bg-(--foreground) shadow-2xl backdrop-blur-md ${
				isCollapsedBehind ? 'absolute inset-x-0 bottom-0 select-none' : 'relative'
			} ${!isStackHovered && index >= 3 ? 'pointer-events-none' : ''}`}
			style={{
				zIndex: 50 - index,
				padding: 'var(--ui-gap)',
				gap: 'calc(var(--ui-gap) * 0.75)',
			}}
		>
			<div className="mt-0.5 shrink-0">{icon}</div>
			<div className="min-w-0 flex-1 pb-1">
				<div className="flex items-center justify-between gap-2">
					<h4 className="break-words text-sm font-bold text-(--text)">{toast.title}</h4>
					{!isStackHovered && index === 0 && totalCount > 1 && (
						<span className="shrink-0 rounded-full bg-(--accent)/15 border border-(--accent)/30 px-2 py-0.5 text-[10px] font-bold text-(--accent)">
							{t('common.toastprovider.moreToasts', { count: totalCount - 1 })}
						</span>
					)}
				</div>

				{toast.description &&
					(isError ? (
						<div
							onClick={() => onInspectError(toast)}
							className="mt-2 rounded-xl border border-(--accent-red)/20 bg-(--background)/60 p-2.5 font-mono text-xs text-(--text-muted) line-clamp-3 break-words cursor-pointer hover:border-(--accent-red)/40 transition-colors"
						>
							{toast.description}
						</div>
					) : (
						<p className="mt-1 break-words text-xs text-(--text-muted) line-clamp-3">{toast.description}</p>
					))}

				{isError && (
					<div className="mt-2.5 flex flex-wrap items-center gap-2">
						<button
							type="button"
							onClick={handleCopyError}
							className="inline-flex items-center gap-1.5 rounded-xl border border-(--border)/15 bg-(--background)/60 hover:bg-(--background) px-2.5 py-1 text-[11px] font-semibold text-(--text) transition-colors cursor-pointer"
						>
							{copied ? <Check size={12} className="text-(--accent-green)" /> : <Copy size={12} />}
							{copied ? t('common.toastprovider.copiedError') : t('common.toastprovider.copyError')}
						</button>
						<button
							type="button"
							onClick={() => onInspectError(toast)}
							className="inline-flex items-center gap-1.5 rounded-xl border border-(--accent-red)/25 bg-(--accent-red)/10 hover:bg-(--accent-red)/20 px-2.5 py-1 text-[11px] font-semibold text-(--accent-red) transition-colors cursor-pointer"
						>
							<Eye size={12} />
							{t('common.toastprovider.viewFullError')}
						</button>
					</div>
				)}

				{toast.action && (
					<button
						onClick={() => {
							toast.action?.onClick();
							onDismiss(toast.id);
						}}
						className="mt-3 text-xs font-semibold bg-(--background)/60 hover:bg-(--background) border border-(--border)/10 text-(--text) px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer"
					>
						{toast.action.label}
					</button>
				)}
			</div>

			<button onClick={() => onDismiss(toast.id)} className="shrink-0 rounded-xl p-1 text-(--text-muted) transition-colors hover:bg-(--background) hover:text-(--text) cursor-pointer">
				<X size={16} />
			</button>

			<div style={{ width: `${progress}%` }} className={`absolute bottom-0 left-0 h-[3px] transition-[width] duration-75 ease-linear ${progressColor}`} />
		</motion.div>
	);
}
