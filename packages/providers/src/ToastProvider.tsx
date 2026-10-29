/** @format */
'use client';

import { AlertCircle, Check, Copy, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useDictionary } from './DictionaryProvider';
import { useEffectiveAlignment } from './ThemeProvider';
import { ToastItem, formatErrorPayload } from './ToastItem';

// -----------------------------------------------------------------------------
// Types & Context
// -----------------------------------------------------------------------------

export type ToastType = 'success' | 'error' | 'info' | 'warning';
export interface Toast {
	id: string;
	title: string;
	description?: string;
	type?: ToastType;
	duration?: number;
	createdAt?: number;
	action?: {
		label: string;
		onClick: () => void;
	};
}

interface ToastContextType {
	toast: (toast: Omit<Toast, 'id'>) => void;
	dismiss: (id: string) => void;
	remind: (dirty: boolean, onSave?: () => void, onReset?: () => void, isSaving?: boolean) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// -----------------------------------------------------------------------------
// Provider
// -----------------------------------------------------------------------------

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const { t } = useDictionary();
	const { isRightAligned } = useEffectiveAlignment();
	const [toasts, setToasts] = useState<Toast[]>([]);
	const [isStackHovered, setIsStackHovered] = useState(false);
	const [inspectedError, setInspectedError] = useState<Toast | null>(null);
	const [modalCopied, setModalCopied] = useState(false);

	const [reminder, setReminder] = useState<{
		dirty: boolean;
		onSave?: () => void;
		onReset?: () => void;
		isSaving?: boolean;
	}>({
		dirty: false,
	});
	const [shake, setShake] = useState(false);

	useEffect(() => {
		if (!reminder.dirty) return;
		const handleNavigationAttempt = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			const anchor = target.closest('a');

			if (anchor && anchor.href && !anchor.target && anchor.href !== window.location.href) {
				e.preventDefault();
				e.stopPropagation();
				setShake(true);
				setTimeout(() => setShake(false), 400);
			}
		};

		document.addEventListener('click', handleNavigationAttempt, true);
		return () => document.removeEventListener('click', handleNavigationAttempt, true);
	}, [reminder.dirty]);

	useEffect(() => {
		if (!reminder.dirty || reminder.isSaving) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && (e.key === 'Enter' || e.key === 's' || e.key === 'S')) {
				e.preventDefault();
				reminder.onSave?.();
			} else if (e.altKey && (e.key === 'r' || e.key === 'R')) {
				e.preventDefault();
				reminder.onReset?.();
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [reminder]);

	const toast = useCallback((newToast: Omit<Toast, 'id'>) => {
		const id = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
		setToasts((prev) => [
			{
				...newToast,
				id,
				createdAt: Date.now(),
			},
			...prev.slice(0, 14),
		]);
	}, []);

	const dismiss = useCallback((id: string) => {
		setToasts((prev) => prev.filter((item) => item.id !== id));
	}, []);

	const clearAllToasts = useCallback(() => {
		setToasts([]);
		setIsStackHovered(false);
	}, []);

	const remind = useCallback((dirty: boolean, onSave?: () => void, onReset?: () => void, isSaving?: boolean) => {
		setReminder({
			dirty,
			onSave,
			onReset,
			isSaving,
		});
	}, []);

	const contextValue = React.useMemo(
		() => ({
			toast,
			dismiss,
			remind,
		}),
		[toast, dismiss, remind]
	);

	const handleCopyModalError = () => {
		if (!inspectedError) return;
		const route = typeof window !== 'undefined' ? window.location.href : '';
		const fullText = formatErrorPayload(inspectedError.title, inspectedError.description, route, inspectedError.createdAt);
		navigator.clipboard.writeText(fullText);
		setModalCopied(true);
		setTimeout(() => setModalCopied(false), 2000);
	};

	return (
		<ToastContext.Provider value={contextValue}>
			{children}

			{/* Collapsible Overlapping Toast Stack (Most Recent on Top) */}
			{toasts.length > 0 && (
				<div
					onMouseEnter={() => setIsStackHovered(true)}
					onMouseLeave={() => setIsStackHovered(false)}
					className={`fixed left-4 right-4 z-[9999] flex flex-col sm:w-[380px] transition-all duration-300 ${
						isRightAligned ? 'sm:right-auto' : 'sm:left-auto'
					} ${isStackHovered ? 'max-h-[80dvh] overflow-y-auto overflow-x-hidden pr-1 pt-2' : 'overflow-visible pt-7'}`}
					style={{
						bottom: 'calc(var(--ui-gap) + env(safe-area-inset-bottom, 0px))',
						...(isRightAligned ? { left: 'calc(var(--ui-gap) + env(safe-area-inset-left, 0px))' } : { right: 'calc(var(--ui-gap) + env(safe-area-inset-right, 0px))' }),
						gap: isStackHovered ? 'calc(var(--ui-gap) * 0.65)' : '0px',
					}}
				>
					<AnimatePresence>
						{isStackHovered && toasts.length > 1 && (
							<motion.div
								initial={{ opacity: 0, y: 6 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 6 }}
								className={`flex items-center ${isRightAligned ? 'justify-start' : 'justify-end'}`}
							>
								<button
									type="button"
									onClick={clearAllToasts}
									className="inline-flex items-center gap-1.5 rounded-full border border-(--border)/15 bg-(--foreground)/90 px-3 py-1 text-xs font-semibold text-(--text-muted) shadow-md backdrop-blur-md transition-colors hover:border-(--accent)/40 hover:text-(--text) cursor-pointer"
								>
									<Trash2 size={12} />
									{t('common.toastprovider.clearAll', { count: toasts.length })}
								</button>
							</motion.div>
						)}
					</AnimatePresence>

					<div className="relative flex flex-col w-full" style={{ gap: isStackHovered ? 'calc(var(--ui-gap) * 0.65)' : '0px' }}>
						<AnimatePresence initial={false}>
							{toasts.map((item, index) => (
								<ToastItem
									key={item.id}
									toast={item}
									index={index}
									totalCount={toasts.length}
									isStackHovered={isStackHovered}
									isPaused={isStackHovered || Boolean(inspectedError)}
									onDismiss={dismiss}
									onInspectError={(errToast) => setInspectedError(errToast)}
								/>
							))}
						</AnimatePresence>
					</div>
				</div>
			)}

			{/* Full Error Details Inspector Modal */}
			<AnimatePresence>
				{inspectedError && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
						onClick={() => setInspectedError(null)}
					>
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 12 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 12 }}
							onClick={(e) => e.stopPropagation()}
							className="flex flex-col w-full max-w-2xl rounded-3xl border border-(--border)/15 bg-(--foreground) shadow-2xl overflow-hidden"
							style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
						>
							<div className="flex items-start justify-between gap-3">
								<div className="flex items-center gap-3 min-w-0">
									<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-(--accent-red)/15 text-(--accent-red) border border-(--accent-red)/25">
										<AlertCircle size={22} />
									</div>
									<div className="flex flex-col min-w-0">
										<h3 className="text-lg font-extrabold text-(--text) truncate" style={{ fontFamily: 'var(--font-fredoka)' }}>
											{inspectedError.title || t('common.toastprovider.errorModalTitle')}
										</h3>
										<p className="text-xs text-(--text-muted)">{t('common.toastprovider.errorModalSubtitle')}</p>
									</div>
								</div>
								<button
									type="button"
									onClick={() => setInspectedError(null)}
									className="rounded-xl p-1.5 text-(--text-muted) hover:bg-(--background)/60 hover:text-(--text) transition-colors cursor-pointer"
								>
									<X size={18} />
								</button>
							</div>

							<div className="flex flex-col rounded-2xl border border-(--border)/10 bg-(--background)/70 p-4 max-h-[50dvh] overflow-auto gap-3">
								<pre className="text-xs font-mono text-(--text) whitespace-pre-wrap break-words leading-relaxed m-0">
									{formatErrorPayload(inspectedError.title, inspectedError.description, typeof window !== 'undefined' ? window.location.href : undefined, inspectedError.createdAt)}
								</pre>
							</div>

							<div className="flex items-center justify-end gap-2.5">
								<button
									type="button"
									onClick={handleCopyModalError}
									className="inline-flex items-center gap-2 rounded-2xl bg-(--accent) hover:bg-(--hover-accent) px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
								>
									{modalCopied ? <Check size={15} /> : <Copy size={15} />}
									{modalCopied ? t('common.toastprovider.copiedError') : t('common.toastprovider.copyFullError')}
								</button>
								<button
									type="button"
									onClick={() => setInspectedError(null)}
									className="inline-flex items-center gap-2 rounded-2xl border border-(--border)/15 bg-(--background)/60 hover:bg-(--background) px-4 py-2.5 text-xs font-semibold text-(--text) transition-colors cursor-pointer"
								>
									{t('common.toastprovider.closeModal')}
								</button>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Reminder Bar */}
			<AnimatePresence>
				{reminder.dirty && (
					<motion.div
						initial={{ opacity: 0, y: 50, scale: 0.95 }}
						animate={shake ? { x: [-10, 10, -10, 10, 0], opacity: 1, y: 0, scale: 1 } : { opacity: 1, y: 0, scale: 1, x: 0 }}
						exit={{ opacity: 0, y: 50, scale: 0.95 }}
						transition={{
							duration: shake ? 0.4 : 0.3,
							type: shake ? 'tween' : 'spring',
							stiffness: 300,
							damping: 30,
						}}
						className="fixed left-1/2 -translate-x-1/2 z-[9998] w-[90%] max-w-3xl flex items-center justify-between overflow-hidden rounded-3xl border border-(--border)/20 bg-(--foreground)/50 backdrop-blur-xl shadow-2xl p-4 px-6 text-(--text)"
						style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
					>
						<div className="flex flex-col ml-2">
							<span className="font-bold text-sm tracking-wide">{t('common.toastprovider.description')}</span>
						</div>
						<div className="flex items-center gap-4">
							<button
								onClick={() => reminder.onReset?.()}
								disabled={reminder.isSaving}
								className="text-sm font-medium hover:underline text-(--text-muted) hover:text-(--text) transition-colors"
							>
								{t('common.toastprovider.button')}
							</button>
							<button
								onClick={() => reminder.onSave?.()}
								disabled={reminder.isSaving}
								className="text-sm font-bold bg-(--accent) hover:bg-(--hover-accent) text-white px-5 py-2.5 rounded-2xl transition-colors shadow-[0_0_15px_color-mix(in_srgb,var(--accent)_40%,transparent)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
							>
								{reminder.isSaving && <span className="animate-spin inline-block border-2 border-white/30 border-t-white rounded-full w-4 h-4" />}
								{t('common.toastprovider.button2')}
							</button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</ToastContext.Provider>
	);
}

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

export function useToast() {
	const ctx = useContext(ToastContext);
	if (!ctx) throw new Error('useToast must be used within a ToastProvider');
	return ctx;
}
