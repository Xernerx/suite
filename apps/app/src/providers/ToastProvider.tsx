/** @format */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { X } from 'lucide-react';

type ToastType = 'info' | 'error' | 'warning' | 'success';

type ToastContextType = {
	toast: (message: string, type: ToastType) => void;
};

type ToastItem = {
	id: number;
	message: string;
	type: ToastType;
};

const ToastContext = createContext<ToastContextType | null>(null);

const TOAST_DURATION = 3500; // 3.5 seconds

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<ToastItem[]>([]);

	const toast = useCallback((message: string, type: ToastType) => {
		const id = Date.now() + Math.random();

		setToasts((prev) => [...prev, { id, message, type }]);

		window.setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id));
		}, TOAST_DURATION);
	}, []);

	const removeToast = useCallback((id: number) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	const value = useMemo(() => ({ toast }), [toast]);

	return (
		<ToastContext.Provider value={value}>
			{children}

			<div className="pointer-events-none fixed inset-x-0 bottom-6 z-[9999] flex justify-center px-4">
				<div className="flex w-full max-w-md flex-col items-center gap-2">
					{/* AnimatePresence enables exit animations for items removed from the array */}
					<AnimatePresence mode="popLayout">
						{toasts.map((item) => (
							<Toast key={item.id} id={item.id} message={item.message} type={item.type} onClose={removeToast} />
						))}
					</AnimatePresence>
				</div>
			</div>
		</ToastContext.Provider>
	);
}

function Toast({ id, message, type, onClose }: { id: number; message: string; type: ToastType; onClose: (id: number) => void }) {
	const styles = {
		info: {
			card: 'border-[#2a2a32] bg-[#141418] text-white',
			bar: 'bg-white/30',
		},
		error: {
			card: 'border-red-500/30 bg-red-500/10 text-red-200',
			bar: 'bg-red-500/50',
		},
		warning: {
			card: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-200',
			bar: 'bg-yellow-500/50',
		},
		success: {
			card: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
			bar: 'bg-emerald-500/50',
		},
	};

	return (
		<motion.div
			layout // Smoothly animates repositioning when other toasts disappear
			initial={{ opacity: 0, y: 15, scale: 0.95 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: 15, scale: 0.95, transition: { duration: 0.2 } }}
			transition={{ type: 'spring', stiffness: 300, damping: 25 }}
			className={`pointer-events-auto relative w-full overflow-hidden rounded-2xl border px-4 pb-3 pt-4 shadow-2xl backdrop-blur-md ${styles[type].card}`}
		>
			{/* Progress Bar Animation */}
			<motion.div
				initial={{ scaleX: 1 }}
				animate={{ scaleX: 0 }}
				transition={{ duration: TOAST_DURATION / 1000, ease: 'linear' }}
				className={`absolute left-0 top-0 h-1 w-full origin-left ${styles[type].bar}`}
			/>

			<div className="flex items-center justify-between gap-3">
				<div className="flex min-w-0 flex-col">
					<span className="text-xs font-medium uppercase tracking-[0.16em] opacity-60">{type}</span>
					<p className="truncate text-sm font-medium">{message}</p>
				</div>

				<button type="button" onClick={() => onClose(id)} className="group cursor-pointer rounded-lg p-1 transition hover:bg-white/10" aria-label="Close notification">
					<X className="h-4 w-4 opacity-60 transition group-hover:opacity-100" />
				</button>
			</div>
		</motion.div>
	);
}

export function useToast() {
	const ctx = useContext(ToastContext);

	if (!ctx) throw new Error('ToastProvider missing');

	return ctx;
}
