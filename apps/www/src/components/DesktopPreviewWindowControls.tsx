/** @format */

'use client';

import { Columns2, Copy, Minus, PanelLeft, PanelRight, Square, X } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';

export type PreviewControlStyle = 'windows' | 'xernerx' | 'capsule' | 'squircle' | 'minimal' | 'macos';

export function DesktopPreviewWindowControls({
	controlStyle,
	cycleControls,
	maximized,
	onToggleMaximize,
	dockedSide,
	onCycleDock,
}: {
	controlStyle: PreviewControlStyle;
	cycleControls: () => void;
	maximized: boolean;
	onToggleMaximize: () => void;
	dockedSide: 'left' | 'right' | null;
	onCycleDock: () => void;
}) {
	const { t } = useDictionary();
	const DockIcon = dockedSide === 'left' ? PanelLeft : dockedSide === 'right' ? PanelRight : Columns2;
	const isGlassPill = controlStyle === 'xernerx' || controlStyle === 'capsule' || controlStyle === 'squircle';
	const shapeClass = controlStyle === 'squircle' ? 'rounded-xl' : 'rounded-full';
	const btnSizeClass = controlStyle === 'capsule' ? 'h-7 w-7' : 'h-8 w-8';
	const dockTitle = dockedSide ? t('account.preferences.desktop.dockRestore') : t('account.preferences.desktop.dockToggle');

	return (
		<div
			className={`flex group/controls items-center ${
				controlStyle === 'windows' ? 'gap-4' : controlStyle === 'capsule' ? 'gap-1 rounded-full bg-(--foreground)/50 border border-(--border)/15 px-1.5 py-0.5' : 'gap-2'
			}`}
		>
			<button
				type="button"
				title={dockTitle}
				aria-label={dockTitle}
				onClick={onCycleDock}
				className={`active:scale-95 focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2 ${
					isGlassPill
						? `${btnSizeClass} ${shapeClass} ${controlStyle === 'capsule' ? '' : 'border'} flex items-center justify-center transition-all cursor-pointer ${
								dockedSide
									? 'bg-(--accent)/20 border-(--accent)/40 text-(--accent)'
									: controlStyle === 'capsule'
										? 'text-(--text-muted) hover:bg-(--accent)/20 hover:text-(--accent)'
										: 'bg-(--foreground)/50 border-(--border)/15 text-(--text-muted) hover:bg-(--accent)/20 hover:border-(--accent)/40 hover:text-(--accent)'
							}`
						: controlStyle === 'macos' || controlStyle === 'minimal'
							? `h-6 w-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
									dockedSide ? 'bg-(--accent)/20 border border-(--accent)/40 text-(--accent)' : 'text-(--text-muted) hover:text-(--accent) hover:bg-(--foreground)/50'
								}`
							: `flex items-center justify-center transition-colors cursor-pointer ${dockedSide ? 'text-(--accent)' : 'text-(--text) hover:text-(--accent)'}`
				}`}
			>
				<DockIcon size={controlStyle === 'windows' ? 18 : isGlassPill ? 15 : 13} />
			</button>

			{controlStyle === 'macos' || controlStyle === 'minimal' ? (
				<>
					<button
						type="button"
						title={t('www.download.preview.cycleControlsHint', { style: controlStyle })}
						aria-label={t('common.window.minimize')}
						onClick={cycleControls}
						className={`group/btn h-3.5 w-3.5 rounded-full ${
							controlStyle === 'minimal' ? 'bg-(--accent)/35 hover:bg-(--accent)' : 'bg-(--border)/35 hover:bg-(--accent-orange)'
						} text-(--background) flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer`}
					>
						<Minus size={9} strokeWidth={3} className="opacity-0 group-hover/btn:opacity-100 transition-opacity" />
					</button>
					<button
						type="button"
						title={t('common.window.maximize')}
						aria-label={t('common.window.maximize')}
						onClick={onToggleMaximize}
						className={`group/btn h-3.5 w-3.5 rounded-full ${
							controlStyle === 'minimal' ? 'bg-(--accent)/55 hover:bg-(--accent)' : 'bg-(--border)/35 hover:bg-(--accent-green)'
						} text-(--background) flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer`}
					>
						{maximized ? (
							<Copy size={7} strokeWidth={3} className="opacity-0 group-hover/btn:opacity-100 transition-opacity" />
						) : (
							<Square size={7} strokeWidth={3} className="opacity-0 group-hover/btn:opacity-100 transition-opacity" />
						)}
					</button>
					<button
						type="button"
						title={t('www.download.preview.cycleControlsHint', { style: controlStyle })}
						aria-label={t('common.close')}
						onClick={cycleControls}
						className="group/btn h-3.5 w-3.5 rounded-full bg-(--accent-red)/60 hover:bg-(--accent-red) text-(--background) flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer"
					>
						<X size={9} strokeWidth={3} className="opacity-0 group-hover/btn:opacity-100 transition-opacity" />
					</button>
				</>
			) : isGlassPill ? (
				<>
					<button
						type="button"
						title={t('www.download.preview.cycleControlsHint', { style: controlStyle })}
						aria-label={t('common.window.minimize')}
						onClick={cycleControls}
						className={`${btnSizeClass} ${shapeClass} ${
							controlStyle === 'capsule' ? 'hover:bg-(--accent)/20' : 'bg-(--foreground)/50 border border-(--border)/15 hover:bg-(--accent)/20 hover:border-(--accent)/40'
						} flex items-center justify-center text-(--text-muted) hover:text-(--accent) transition-all active:scale-95 cursor-pointer`}
					>
						<Minus size={14} strokeWidth={2.5} />
					</button>
					<button
						type="button"
						title={t('common.window.maximize')}
						aria-label={t('common.window.maximize')}
						onClick={onToggleMaximize}
						className={`${btnSizeClass} ${shapeClass} ${
							controlStyle === 'capsule' ? 'hover:bg-(--accent)/20' : 'bg-(--foreground)/50 border border-(--border)/15 hover:bg-(--accent)/20 hover:border-(--accent)/40'
						} flex items-center justify-center text-(--text-muted) hover:text-(--accent) transition-all active:scale-95 cursor-pointer`}
					>
						{maximized ? <Copy size={13} /> : <Square size={11} />}
					</button>
					<button
						type="button"
						title={t('www.download.preview.cycleControlsHint', { style: controlStyle })}
						aria-label={t('common.close')}
						onClick={cycleControls}
						className={`${btnSizeClass} ${shapeClass} ${
							controlStyle === 'capsule' ? 'hover:bg-(--accent-red)/20' : 'bg-(--foreground)/50 border border-(--border)/15 hover:bg-(--accent-red)/20 hover:border-(--accent-red)/40'
						} flex items-center justify-center text-(--text-muted) hover:text-(--accent-red) transition-all active:scale-95 cursor-pointer`}
					>
						<X size={14} strokeWidth={2.5} />
					</button>
				</>
			) : (
				<>
					<button
						type="button"
						title={t('www.download.preview.cycleControlsHint', { style: controlStyle })}
						aria-label={t('common.window.minimize')}
						onClick={cycleControls}
						className="text-(--text) cursor-pointer hover:text-(--accent) active:scale-95 transition-transform"
					>
						<Minus size={20} />
					</button>
					<button
						type="button"
						title={t('common.window.maximize')}
						aria-label={t('common.window.maximize')}
						onClick={onToggleMaximize}
						className="text-(--text) cursor-pointer hover:text-(--accent) active:scale-95 transition-transform"
					>
						{maximized ? <Copy size={18} /> : <Square size={14} />}
					</button>
					<button
						type="button"
						title={t('www.download.preview.cycleControlsHint', { style: controlStyle })}
						aria-label={t('common.close')}
						onClick={cycleControls}
						className="text-(--text) cursor-pointer hover:text-(--accent-red) active:scale-95 transition-transform"
					>
						<X size={20} />
					</button>
				</>
			)}
		</div>
	);
}
