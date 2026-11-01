/** @format */

'use client';

import { Columns2, Copy, Minus, PanelLeft, PanelRight, Square, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDictionary, usePlatform, useTheme } from '@xernerx/providers';

export type WindowControlsStyle = 'system' | 'windows' | 'macos' | 'xernerx' | 'capsule' | 'squircle' | 'minimal';
export type EffectiveWindowControlsStyle = Exclude<WindowControlsStyle, 'system'>;

export function useWindowControlsStyle(): {
	windowControls: WindowControlsStyle;
	effectiveControls: EffectiveWindowControlsStyle;
	effectiveAlignment: 'left' | 'right';
	isRightAligned: boolean;
} {
	const { platform } = usePlatform();
	const { preferences } = useTheme();
	const [electronControls, setElectronControls] = useState<WindowControlsStyle>('system');

	useEffect(() => {
		const electronBridge = (window as any).electron;
		if (electronBridge?.metadata?.windowControls) {
			setElectronControls(electronBridge.metadata.windowControls);
		}
		electronBridge?.getMetadata?.()?.then?.((meta: any) => {
			if (meta?.windowControls) setElectronControls(meta.windowControls);
		});

		const handleMetaUpdate = (e: Event) => {
			const detail = (e as CustomEvent)?.detail;
			if (detail?.windowControls) {
				setElectronControls(detail.windowControls);
			}
		};
		const unsubscribe = electronBridge?.onMetadataUpdated?.((meta: any) => {
			if (meta?.windowControls) {
				setElectronControls(meta.windowControls);
			}
		});
		window.addEventListener('xernerx:metadata-updated', handleMetaUpdate);
		return () => {
			window.removeEventListener('xernerx:metadata-updated', handleMetaUpdate);
			unsubscribe?.();
		};
	}, []);

	const windowControls: WindowControlsStyle = preferences.windowControls && preferences.windowControls !== 'system' ? preferences.windowControls : electronControls;
	const effectiveControls: EffectiveWindowControlsStyle = windowControls === 'system' ? (platform === 'macos' ? 'macos' : 'windows') : windowControls;
	const effectiveAlignment: 'left' | 'right' =
		preferences.alignment === 'right' ? 'right' : preferences.alignment === 'left' ? 'left' : effectiveControls === 'macos' || platform === 'macos' ? 'right' : 'left';

	return {
		windowControls,
		effectiveControls,
		effectiveAlignment,
		isRightAligned: effectiveAlignment === 'right',
	};
}

export function HeaderWindowControls({ isApp, effectiveControls }: { isApp: boolean; effectiveControls: EffectiveWindowControlsStyle }) {
	const { t } = useDictionary();
	const [maximized, setMaximized] = useState(false);
	const [dockedSide, setDockedSide] = useState<'left' | 'right' | null>(null);

	async function toggleMaximize() {
		const electron = (window as any).electron;
		await electron?.maximize?.();
		setMaximized(Boolean(await electron?.isMaximized?.()));
	}

	async function cycleDockedMode() {
		const electron = (window as any).electron;
		if (!electron?.setDockedMode) return;
		const res = await electron.setDockedMode();
		if (res && typeof res === 'object') {
			setDockedSide(res.side || null);
		}
	}

	useEffect(() => {
		const electronBridge = (window as any).electron;
		electronBridge?.isMaximized?.()?.then?.((val: boolean) => setMaximized(Boolean(val)));
		electronBridge?.getDockedState?.()?.then?.((st: any) => {
			if (st && typeof st === 'object') setDockedSide(st.side || null);
		});
		const unsubDock = electronBridge?.onDockedStateChange?.((st: any) => {
			if (st && typeof st === 'object') setDockedSide(st.side || null);
		});
		return () => {
			unsubDock?.();
		};
	}, []);

	const dockTitle = dockedSide ? t('account.preferences.desktop.dockRestore') : t('account.preferences.desktop.dockToggle');
	const DockIcon = dockedSide === 'left' ? PanelLeft : dockedSide === 'right' ? PanelRight : Columns2;
	const isGlassPill = effectiveControls === 'xernerx' || effectiveControls === 'capsule' || effectiveControls === 'squircle';
	const shapeClass = effectiveControls === 'squircle' ? 'rounded-xl' : 'rounded-full';
	const btnSizeClass = effectiveControls === 'capsule' ? 'h-7 w-7' : 'h-8 w-8';

	return (
		<div
			className={`${isApp ? 'flex' : 'hidden [.is-electron_&]:flex'} group/controls items-center ${
				effectiveControls === 'windows' ? 'gap-4' : effectiveControls === 'capsule' ? 'gap-1 rounded-full bg-(--foreground)/50 border border-(--border)/15 px-1.5 py-0.5' : 'gap-2'
			}`}
		>
			<button
				type="button"
				aria-label={dockTitle}
				title={dockTitle}
				onClick={cycleDockedMode}
				className={
					isGlassPill
						? `${btnSizeClass} ${shapeClass} ${effectiveControls === 'capsule' ? '' : 'border'} flex items-center justify-center transition-all cursor-pointer ${
								dockedSide
									? 'bg-(--accent)/20 border-(--accent)/40 text-(--accent)'
									: effectiveControls === 'capsule'
										? 'text-(--text-muted) hover:bg-(--accent)/20 hover:text-(--accent)'
										: 'bg-(--foreground)/50 border-(--border)/15 text-(--text-muted) hover:bg-(--accent)/20 hover:border-(--accent)/40 hover:text-(--accent)'
							}`
						: effectiveControls === 'macos' || effectiveControls === 'minimal'
							? `h-6 w-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
									dockedSide ? 'bg-(--accent)/20 border border-(--accent)/40 text-(--accent)' : 'text-(--text-muted) hover:text-(--accent) hover:bg-(--foreground)/50'
								}`
							: `flex items-center justify-center transition-colors cursor-pointer ${dockedSide ? 'text-(--accent)' : 'text-(--text) hover:text-(--accent)'}`
				}
			>
				<DockIcon size={effectiveControls === 'windows' ? 18 : isGlassPill ? 15 : 13} />
			</button>
			{effectiveControls === 'macos' || effectiveControls === 'minimal' ? (
				<>
					<button
						type="button"
						aria-label={t('common.window.minimize')}
						title={t('common.window.minimize')}
						onClick={() => (window as any).electron?.minimize?.()}
						className={`group/btn h-3.5 w-3.5 rounded-full ${
							effectiveControls === 'minimal' ? 'bg-(--accent)/35 hover:bg-(--accent)' : 'bg-(--border)/35 hover:bg-(--accent-orange)'
						} text-(--background) flex items-center justify-center transition-all hover:scale-110 cursor-pointer`}
					>
						<Minus size={9} strokeWidth={3} className="opacity-0 group-hover/btn:opacity-100 transition-opacity" />
					</button>
					<button
						type="button"
						aria-label={t('common.window.maximize')}
						title={t('common.window.maximize')}
						onClick={toggleMaximize}
						className={`group/btn h-3.5 w-3.5 rounded-full ${
							effectiveControls === 'minimal' ? 'bg-(--accent)/55 hover:bg-(--accent)' : 'bg-(--border)/35 hover:bg-(--accent-green)'
						} text-(--background) flex items-center justify-center transition-all hover:scale-110 cursor-pointer`}
					>
						{maximized ? (
							<Copy size={7} strokeWidth={3} className="opacity-0 group-hover/btn:opacity-100 transition-opacity" />
						) : (
							<Square size={7} strokeWidth={3} className="opacity-0 group-hover/btn:opacity-100 transition-opacity" />
						)}
					</button>
					<button
						type="button"
						aria-label={t('common.close')}
						title={t('common.close')}
						onClick={() => (window as any).electron?.close?.()}
						className="group/btn h-3.5 w-3.5 rounded-full bg-(--accent-red)/60 hover:bg-(--accent-red) text-(--background) flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
					>
						<X size={9} strokeWidth={3} className="opacity-0 group-hover/btn:opacity-100 transition-opacity" />
					</button>
				</>
			) : isGlassPill ? (
				<>
					<button
						type="button"
						aria-label={t('common.window.minimize')}
						title={t('common.window.minimize')}
						onClick={() => (window as any).electron?.minimize?.()}
						className={`${btnSizeClass} ${shapeClass} ${
							effectiveControls === 'capsule' ? 'hover:bg-(--accent)/20' : 'bg-(--foreground)/50 border border-(--border)/15 hover:bg-(--accent)/20 hover:border-(--accent)/40'
						} flex items-center justify-center text-(--text-muted) hover:text-(--accent) transition-all cursor-pointer`}
					>
						<Minus size={14} strokeWidth={2.5} />
					</button>
					<button
						type="button"
						aria-label={t('common.window.maximize')}
						title={t('common.window.maximize')}
						onClick={toggleMaximize}
						className={`${btnSizeClass} ${shapeClass} ${
							effectiveControls === 'capsule' ? 'hover:bg-(--accent)/20' : 'bg-(--foreground)/50 border border-(--border)/15 hover:bg-(--accent)/20 hover:border-(--accent)/40'
						} flex items-center justify-center text-(--text-muted) hover:text-(--accent) transition-all cursor-pointer`}
					>
						{maximized ? <Copy size={13} /> : <Square size={11} />}
					</button>
					<button
						type="button"
						aria-label={t('common.close')}
						title={t('common.close')}
						onClick={() => (window as any).electron?.close?.()}
						className={`${btnSizeClass} ${shapeClass} ${
							effectiveControls === 'capsule'
								? 'hover:bg-(--accent-red)/20'
								: 'bg-(--foreground)/50 border border-(--border)/15 hover:bg-(--accent-red)/20 hover:border-(--accent-red)/40'
						} flex items-center justify-center text-(--text-muted) hover:text-(--accent-red) transition-all cursor-pointer`}
					>
						<X size={14} strokeWidth={2.5} />
					</button>
				</>
			) : (
				<>
					<button
						type="button"
						aria-label={t('common.window.minimize')}
						title={t('common.window.minimize')}
						className="text-(--text) cursor-pointer hover:text-(--accent)"
						onClick={() => (window as any).electron?.minimize?.()}
					>
						<Minus size={20} />
					</button>

					<button
						type="button"
						aria-label={t('common.window.maximize')}
						title={t('common.window.maximize')}
						className="text-(--text) cursor-pointer hover:text-(--accent)"
						onClick={toggleMaximize}
					>
						{maximized ? <Copy size={20} /> : <Square size={14} />}
					</button>

					<button
						type="button"
						aria-label={t('common.close')}
						title={t('common.close')}
						className="text-(--text) cursor-pointer hover:text-(--accent-red)"
						onClick={() => (window as any).electron?.close?.()}
					>
						<X size={20} />
					</button>
				</>
			)}
		</div>
	);
}
