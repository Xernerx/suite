/** @format */
'use client';

import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

// -----------------------------------------------------------------------------
// Types & Context
// -----------------------------------------------------------------------------

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
	id: string;
	title: string;
	description?: string;
	type?: ToastType;
	duration?: number;
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
	const [toasts, setToasts] = useState<Toast[]>([]);
	const [reminder, setReminder] = useState<{
		dirty: boolean;
		onSave?: () => void;
		onReset?: () => void;
		isSaving?: boolean;
	}>({ dirty: false });

	const [shake, setShake] = useState(false);

	useEffect(() => {
		if (!reminder.dirty) return;

		const handleNavigationAttempt = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			const anchor = target.closest('a');

			// If it's a link and it's not opening in a new tab, block it!
			if (anchor && anchor.href && !anchor.target && anchor.href !== window.location.href) {
				e.preventDefault();
				e.stopPropagation();

				setShake(true);
				setTimeout(() => setShake(false), 400);
			}
		};

		// Use capture phase to intercept before Next.js or React router handles it
		document.addEventListener('click', handleNavigationAttempt, true);
		return () => document.removeEventListener('click', handleNavigationAttempt, true);
	}, [reminder.dirty]);

	const toast = useCallback((newToast: Omit<Toast, 'id'>) => {
		const id = Math.random().toString(36).substring(2, 9);
		setToasts((prev) => [...prev, { ...newToast, id }]);
	}, []);

	const dismiss = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	const remind = useCallback((dirty: boolean, onSave?: () => void, onReset?: () => void, isSaving?: boolean) => {
		setReminder({ dirty, onSave, onReset, isSaving });
	}, []);

	return (
		<ToastContext.Provider value={{ toast, dismiss, remind }}>
			{children}

			{/* The Toast Portal / Container */}
			<div className="fixed left-4 right-4 z-[9999] flex flex-col sm:left-auto sm:right-4" style={{ bottom: 'var(--ui-gap)', right: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				<AnimatePresence>
					{toasts.map((t) => (
						<ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
					))}
				</AnimatePresence>
			</div>

			{/* Reminder Bar */}
			<AnimatePresence>
				{reminder.dirty && (
					<motion.div
						initial={{ opacity: 0, y: 50, scale: 0.95 }}
						animate={shake ? { x: [-10, 10, -10, 10, 0], opacity: 1, y: 0, scale: 1 } : { opacity: 1, y: 0, scale: 1, x: 0 }}
						exit={{ opacity: 0, y: 50, scale: 0.95 }}
						transition={{ duration: shake ? 0.4 : 0.3, type: shake ? 'tween' : 'spring', stiffness: 300, damping: 30 }}
						className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-3xl flex items-center justify-between overflow-hidden rounded-[2rem] border border-(--border)/20 bg-(--foreground)/50 backdrop-blur-xl shadow-2xl p-4 px-6 text-(--text)"
					>
						<div className="flex flex-col ml-2">
							<span className="font-bold text-sm tracking-wide">Careful — you have unsaved changes!</span>
						</div>
						<div className="flex items-center gap-4">
							<button
								onClick={() => reminder.onReset?.()}
								disabled={reminder.isSaving}
								className="text-sm font-medium hover:underline text-(--text-muted) hover:text-(--text) transition-colors"
							>
								Reset
							</button>
							<button
								onClick={() => reminder.onSave?.()}
								disabled={reminder.isSaving}
								className="text-sm font-bold bg-(--accent) hover:bg-(--hover-accent) text-white px-5 py-2.5 rounded-xl transition-colors shadow-[0_0_15px_color-mix(in_srgb,var(--accent)_40%,transparent)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
							>
								{reminder.isSaving && <span className="animate-spin inline-block border-2 border-white/30 border-t-white rounded-full w-4 h-4" />}
								Save Changes
							</button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</ToastContext.Provider>
	);
}

// -----------------------------------------------------------------------------
// Internal Toast Item
// -----------------------------------------------------------------------------

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
	const duration = toast.duration || 3000;

	useEffect(() => {
		const timer = setTimeout(onDismiss, duration);
		return () => clearTimeout(timer);
	}, [duration, onDismiss]);

	const icons = {
		success: <CheckCircle className="text-green-400" size={20} />,
		error: <AlertCircle className="text-red-400" size={20} />,
		info: <Info className="text-(--accent)" size={20} />,
	};

	const progressColors = {
		success: 'bg-green-400',
		error: 'bg-red-400',
		info: 'bg-(--accent)',
	};

	const icon = icons[toast.type || 'info'];
	const progressColor = progressColors[toast.type || 'info'];

	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 50, scale: 0.9 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
			className="pointer-events-auto relative flex w-full sm:w-[350px] items-start overflow-hidden rounded-2xl border border-(--border)/10 bg-(--foreground) shadow-xl backdrop-blur-md"
			style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}
		>
			<div className="mt-0.5 shrink-0">{icon}</div>
			<div className="min-w-0 flex-1 pb-1">
				<h4 className="break-words text-sm font-medium text-(--text)">{toast.title}</h4>
				{toast.description && <p className="mt-1 break-words text-sm text-(--text-muted)">{toast.description}</p>}
			</div>
			<button onClick={onDismiss} className="shrink-0 rounded-lg p-1 text-(--text-muted) transition-colors hover:bg-(--background) hover:text-(--text)">
				<X size={16} />
			</button>
			{/* Animated Progress Bar */}
			<motion.div
				initial={{ width: '100%' }}
				animate={{ width: '0%' }}
				transition={{ duration: duration / 1000, ease: 'linear' }}
				className={`absolute bottom-0 left-0 h-[3px] ${progressColor}`}
			/>
		</motion.div>
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
