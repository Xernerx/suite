/** @format */

'use client';

import { Copy, Minus, Square, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePlatform, useTheme } from '@xernerx/providers';

export type WindowControlsStyle = 'system' | 'windows' | 'macos' | 'xernerx';

export function useWindowControlsStyle(): {
	windowControls: WindowControlsStyle;
	effectiveControls: 'windows' | 'macos' | 'xernerx';
	effectiveAlignment: 'left' | 'right';
	isRightAligned: boolean;
} {
	const { platform } = usePlatform();
	const { preferences } = useTheme();
	const [windowControls, setWindowControls] = useState<WindowControlsStyle>('system');

	useEffect(() => {
		const electronBridge = (window as any).electron;
		if (electronBridge?.metadata?.windowControls) {
			setWindowControls(electronBridge.metadata.windowControls);
		}
		electronBridge?.getMetadata?.()?.then?.((meta: any) => {
			if (meta?.windowControls) setWindowControls(meta.windowControls);
		});

		const handleMetaUpdate = (e: Event) => {
			const detail = (e as CustomEvent)?.detail;
			if (detail?.windowControls) {
				setWindowControls(detail.windowControls);
			}
		};
		window.addEventListener('xernerx:metadata-updated', handleMetaUpdate);
		return () => window.removeEventListener('xernerx:metadata-updated', handleMetaUpdate);
	}, []);

	const effectiveControls = windowControls === 'system' ? (platform === 'macos' ? 'macos' : 'windows') : windowControls;
	const effectiveAlignment: 'left' | 'right' =
		preferences.alignment === 'right' ? 'right' : preferences.alignment === 'left' ? 'left' : effectiveControls === 'macos' || platform === 'macos' ? 'right' : 'left';

	return {
		windowControls,
		effectiveControls,
		effectiveAlignment,
		isRightAligned: effectiveAlignment === 'right',
	};
}

export function HeaderWindowControls({ isApp, effectiveControls }: { isApp: boolean; effectiveControls: 'windows' | 'macos' | 'xernerx' }) {
	const [maximized, setMaximized] = useState(false);

	async function toggleMaximize() {
		const electron = (window as any).electron;
		await electron?.maximize?.();
		setMaximized(Boolean(await electron?.isMaximized?.()));
	}

	useEffect(() => {
		const electronBridge = (window as any).electron;
		electronBridge?.isMaximized?.()?.then?.((val: boolean) => setMaximized(Boolean(val)));
	}, []);

	return (
		<div className={`${isApp ? 'flex' : 'hidden [.is-electron_&]:flex'} group/controls items-center ${effectiveControls === 'windows' ? 'gap-4' : 'gap-2'}`}>
			{effectiveControls === 'macos' ? (
				<>
					<button
						type="button"
						aria-label="Minimize"
						title="Minimize"
						onClick={() => (window as any).electron?.minimize?.()}
						className="group/btn h-3.5 w-3.5 rounded-full bg-(--border)/35 hover:bg-(--accent-orange) text-(--background) flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
					>
						<Minus size={9} strokeWidth={3} className="opacity-0 group-hover/btn:opacity-100 transition-opacity" />
					</button>
					<button
						type="button"
						aria-label="Maximize"
						title="Maximize"
						onClick={toggleMaximize}
						className="group/btn h-3.5 w-3.5 rounded-full bg-(--border)/35 hover:bg-(--accent-green) text-(--background) flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
					>
						{maximized ? (
							<Copy size={7} strokeWidth={3} className="opacity-0 group-hover/btn:opacity-100 transition-opacity" />
						) : (
							<Square size={7} strokeWidth={3} className="opacity-0 group-hover/btn:opacity-100 transition-opacity" />
						)}
					</button>
					<button
						type="button"
						aria-label="Close"
						title="Close"
						onClick={() => (window as any).electron?.close?.()}
						className="group/btn h-3.5 w-3.5 rounded-full bg-(--accent-red)/60 hover:bg-(--accent-red) text-(--background) flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
					>
						<X size={9} strokeWidth={3} className="opacity-0 group-hover/btn:opacity-100 transition-opacity" />
					</button>
				</>
			) : effectiveControls === 'xernerx' ? (
				<>
					<button
						type="button"
						aria-label="Minimize"
						title="Minimize"
						onClick={() => (window as any).electron?.minimize?.()}
						className="h-8 w-8 rounded-full bg-(--foreground)/50 border border-(--border)/15 flex items-center justify-center text-(--text-muted) hover:bg-(--accent)/20 hover:border-(--accent)/40 hover:text-(--accent) transition-all cursor-pointer"
					>
						<Minus size={14} strokeWidth={2.5} />
					</button>
					<button
						type="button"
						aria-label="Maximize"
						title="Maximize"
						onClick={toggleMaximize}
						className="h-8 w-8 rounded-full bg-(--foreground)/50 border border-(--border)/15 flex items-center justify-center text-(--text-muted) hover:bg-(--accent)/20 hover:border-(--accent)/40 hover:text-(--accent) transition-all cursor-pointer"
					>
						{maximized ? <Copy size={13} /> : <Square size={11} />}
					</button>
					<button
						type="button"
						aria-label="Close"
						title="Close"
						onClick={() => (window as any).electron?.close?.()}
						className="h-8 w-8 rounded-full bg-(--foreground)/50 border border-(--border)/15 flex items-center justify-center text-(--text-muted) hover:bg-(--accent-red)/20 hover:border-(--accent-red)/40 hover:text-(--accent-red) transition-all cursor-pointer"
					>
						<X size={14} strokeWidth={2.5} />
					</button>
				</>
			) : (
				<>
					<button type="button" aria-label="Minimize" title="Minimize" className="text-(--text) cursor-pointer hover:text-(--accent)" onClick={() => (window as any).electron?.minimize?.()}>
						<Minus size={20} />
					</button>

					<button type="button" aria-label="Maximize" title="Maximize" className="text-(--text) cursor-pointer hover:text-(--accent)" onClick={toggleMaximize}>
						{maximized ? <Copy size={20} /> : <Square size={14} />}
					</button>

					<button type="button" aria-label="Close" title="Close" className="text-(--text) cursor-pointer hover:text-(--accent-red)" onClick={() => (window as any).electron?.close?.()}>
						<X size={20} />
					</button>
				</>
			)}
		</div>
	);
}
