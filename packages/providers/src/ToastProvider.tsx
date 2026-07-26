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
}

const ToastContext = createContext<ToastContextType | null>(null);

// -----------------------------------------------------------------------------
// Provider
// -----------------------------------------------------------------------------

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const toast = useCallback((newToast: Omit<Toast, 'id'>) => {
		const id = Math.random().toString(36).substring(2, 9);
		setToasts((prev) => [...prev, { ...newToast, id }]);
	}, []);

	const dismiss = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	return (
		<ToastContext.Provider value={{ toast, dismiss }}>
			{children}

			{/* The Toast Portal / Container */}
			<div className='fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 md:bottom-8 md:right-8'>
				<AnimatePresence>
					{toasts.map((t) => (
						<ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
					))}
				</AnimatePresence>
			</div>
		</ToastContext.Provider>
	);
}

// -----------------------------------------------------------------------------
// Internal Toast Item
// -----------------------------------------------------------------------------

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
	const duration = toast.duration || 5000;

	useEffect(() => {
		const timer = setTimeout(onDismiss, duration);
		return () => clearTimeout(timer);
	}, [duration, onDismiss]);

	const icons = {
		success: <CheckCircle className='text-green-400' size={20} />,
		error: <AlertCircle className='text-red-400' size={20} />,
		// Updated to use your theme accent variable
		info: <Info className='text-accent' size={20} />,
	};

	const progressColors = {
		success: 'bg-green-400',
		error: 'bg-red-400',
		// Updated to use your theme accent variable
		info: 'bg-accent',
	};

	const icon = icons[toast.type || 'info'];
	const progressColor = progressColors[toast.type || 'info'];

	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 50, scale: 0.9 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
			// Swapped hardcoded hexes for your global border and foreground variables
			className='pointer-events-auto relative flex w-[350px] items-start gap-3 overflow-hidden rounded-xl border border-(--border)/10 bg-(--foreground) p-4 shadow-xl backdrop-blur-md'>
			<div className='mt-0.5 shrink-0'>{icon}</div>

			<div className='min-w-0 flex-1 pb-1'>
				<h4 className='break-words text-sm font-medium text-(--text)'>{toast.title}</h4>
				{toast.description && <p className='mt-1 break-words text-sm text-(--text-muted)'>{toast.description}</p>}
			</div>

			<button
				onClick={onDismiss}
				// Swapped hover background to --background so it subtly contrasts the foreground toast
				className='shrink-0 rounded-md p-1 text-(--text-muted) transition-colors hover:bg-(--background) hover:text-(--text)'>
				<X size={16} />
			</button>

			{/* Animated Progress Bar */}
			<motion.div initial={{ width: '100%' }} animate={{ width: '0%' }} transition={{ duration: duration / 1000, ease: 'linear' }} className={`absolute bottom-0 left-0 h-[3px] ${progressColor}`} />
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
