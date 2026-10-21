/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Copy, Home, RotateCw, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useDictionary, useToast } from '@xernerx/providers';
import { Input } from '@xernerx/ui';

export function SubSelector({ name, options, defaultValue }: { name: string; options: string[]; defaultValue: string }) {
	const [isOpen, setIsOpen] = useState(false);
	const [value, setValue] = useState(defaultValue);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		};
		if (isOpen) {
			window.addEventListener('click', handleClickOutside);
		}
		return () => window.removeEventListener('click', handleClickOutside);
	}, [isOpen]);

	return (
		<div ref={ref} className="relative flex items-center">
			<input type="hidden" name={name} value={value} />
			<div className="text-sm font-medium text-(--text) cursor-pointer hover:text-(--accent) transition-colors flex items-center select-none" onClick={() => setIsOpen(!isOpen)}>
				{value}
			</div>

			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, y: -5, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -5, scale: 0.95 }}
						transition={{ duration: 0.15 }}
						className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 bg-(--background) border border-(--border)/10 rounded-xl shadow-xl overflow-hidden min-w-[120px] z-[9999] flex flex-col p-1"
					>
						{options.map((option) => (
							<div
								key={option}
								className={`px-3 py-1.5 text-sm font-medium rounded-xl cursor-pointer transition-colors ${value === option ? 'bg-(--accent)/10 text-(--accent)' : 'text-(--text) hover:bg-(--foreground)'}`}
								onClick={() => {
									setValue(option);
									setIsOpen(false);
								}}
							>
								{option}
							</div>
						))}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

interface HeaderOmnibarProps {
	isOpen: boolean;
	onClose: () => void;
	urlState: { pre: string; env: string; path: string };
	resolveOmnibarUrl: (pre: string, env: string, rawPath: string) => string;
}

export function HeaderOmnibar({ isOpen, onClose, urlState, resolveOmnibarUrl }: HeaderOmnibarProps) {
	const { t } = useDictionary();
	const { toast } = useToast();
	const urlFormRef = useRef<HTMLFormElement>(null);
	const [urlCopied, setUrlCopied] = useState(false);

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
					animate={{ height: 44, opacity: 1, transitionEnd: { overflow: 'visible' } }}
					exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
					transition={{ type: 'spring', stiffness: 400, damping: 30 }}
					className="flex items-center w-full shrink-0 bg-(--background) px-4 gap-3 relative z-[999]"
				>
					<div className="flex items-center gap-1">
						<button
							type="button"
							aria-label="Back"
							title="Back"
							onClick={() => window.history.back()}
							className="text-(--text-muted) hover:text-(--text) hover:bg-(--foreground) p-1.5 rounded-xl transition-all"
						>
							<ArrowLeft size={16} strokeWidth={2.5} />
						</button>
						<button
							type="button"
							aria-label="Forward"
							title="Forward"
							onClick={() => window.history.forward()}
							className="text-(--text-muted) hover:text-(--text) hover:bg-(--foreground) p-1.5 rounded-xl transition-all"
						>
							<ArrowRight size={16} strokeWidth={2.5} />
						</button>
						<button
							type="button"
							aria-label="Reload"
							title="Reload"
							onClick={() => window.location.reload()}
							className="text-(--text-muted) hover:text-(--text) hover:bg-(--foreground) p-1.5 rounded-xl transition-all"
						>
							<RotateCw size={16} strokeWidth={2.5} />
						</button>
						<button
							type="button"
							aria-label="Home"
							title="Home"
							onClick={() => (window.location.href = '/')}
							className="text-(--text-muted) hover:text-(--text) hover:bg-(--foreground) p-1.5 rounded-xl transition-all ml-1"
						>
							<Home size={16} strokeWidth={2.5} />
						</button>
					</div>

					<form
						ref={urlFormRef}
						className="flex flex-1 items-center bg-(--foreground) rounded-full h-[30px] px-3 border border-(--border)/10 ml-1 focus-within:ring-2 focus-within:ring-(--accent)/20 focus-within:border-(--accent) transition-all shadow-sm"
						onSubmit={(e) => {
							e.preventDefault();
							const pre = (e.currentTarget.elements.namedItem('pre') as HTMLSelectElement).value;
							const env = (e.currentTarget.elements.namedItem('env') as HTMLSelectElement).value;
							const path = (e.currentTarget.elements.namedItem('path') as HTMLInputElement).value;

							window.location.href = resolveOmnibarUrl(pre, env, path);
						}}
					>
						<span className="text-(--text-muted) select-none text-sm font-medium pr-1">https://</span>
						<SubSelector name="pre" options={['app', 'www', 'api', 'cdn', 'docs', 'admin', 'account', 'store', 'info']} defaultValue={urlState.pre} />
						<span className="text-(--text-muted) select-none text-sm font-medium px-0.5">.</span>
						<SubSelector name="env" options={['public', 'canary', 'dev']} defaultValue={urlState.env} />
						<span className="text-(--text-muted) select-none text-sm font-medium pl-0.5 pr-2">.xernerx.com</span>
						<Input
							key={urlState.path}
							name="path"
							type="text"
							placeholder="/path"
							className="!bg-transparent !border-none !p-0 !rounded-none !ring-0 outline-none text-sm font-medium w-full text-(--text) placeholder:text-(--text-muted)/70"
							autoFocus
							defaultValue={urlState.path}
						/>
					</form>

					<div className="flex items-center gap-1">
						<button
							type="button"
							aria-label={t('components.header.copyUrl')}
							title={t('components.header.copyUrl')}
							onClick={() => {
								const form = urlFormRef.current;
								let targetUrl = typeof window !== 'undefined' ? window.location.href : '';
								if (form) {
									const pre = (form.elements.namedItem('pre') as HTMLInputElement)?.value || urlState.pre;
									const env = (form.elements.namedItem('env') as HTMLInputElement)?.value || urlState.env;
									const path = (form.elements.namedItem('path') as HTMLInputElement)?.value || '';
									targetUrl = resolveOmnibarUrl(pre, env, path);
								}
								navigator.clipboard.writeText(targetUrl).then(() => {
									setUrlCopied(true);
									toast({ type: 'success', title: t('components.header.urlCopied'), description: targetUrl });
									setTimeout(() => setUrlCopied(false), 2000);
								});
							}}
							className="text-(--text-muted) hover:text-(--text) hover:bg-(--foreground) p-1.5 rounded-xl transition-all cursor-pointer"
						>
							{urlCopied ? <Check size={16} strokeWidth={2.5} className="text-(--accent-green)" /> : <Copy size={16} strokeWidth={2.5} />}
						</button>

						<button
							type="button"
							aria-label="Close"
							title="Close"
							onClick={onClose}
							className="text-(--text-muted) hover:text-(--accent-red) hover:bg-(--accent-red)/10 p-1.5 rounded-xl transition-all cursor-pointer"
						>
							<X size={16} strokeWidth={2.5} />
						</button>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
