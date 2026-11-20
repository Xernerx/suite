/** @format */

'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, Columns2, Globe, Layers, Maximize2, Minimize2, Users } from 'lucide-react';
import { useDictionary, useEnvironment, usePlatform } from '@xernerx/providers';
import { DesktopPreviewHeader, type PreviewControlStyle } from './DesktopPreviewHeader';
import { DesktopPreviewOverlay } from './DesktopPreviewOverlay';
import { DesktopPreviewSidebar, type PreviewMainView } from './DesktopPreviewSidebar';
import { DesktopPreviewStage, type DashboardPreviewTab } from './DesktopPreviewStage';
import { PREVIEW_CRESTS, useDesktopPreviewData, usePreviewGuildConfig } from './useDesktopPreviewData';

const VIRTUAL_WIDTH = 1140;
const VIRTUAL_HEIGHT = 700;

export function DesktopInteractivePreview({
	platform: platformProp,
	maximized = false,
	onToggleMaximize,
}: {
	platform?: 'windows' | 'macos' | 'linux';
	maximized?: boolean;
	onToggleMaximize?: () => void;
}) {
	const { t } = useDictionary();
	const { environment } = useEnvironment();
	const { platform: detectedPlatform } = usePlatform();
	const liveData = useDesktopPreviewData();

	const effectivePlatform: 'windows' | 'macos' | 'linux' = platformProp || (detectedPlatform === 'macos' ? 'macos' : detectedPlatform === 'linux' ? 'linux' : 'windows');
	const modKey = effectivePlatform === 'macos' ? '⌘' : 'Ctrl';

	const viewportFrameRef = useRef<HTMLDivElement>(null);
	const hasSyncedLiveGuildRef = useRef(false);
	const [scale, setScale] = useState<number | null>(null);

	const [localMaximized, setLocalMaximized] = useState(false);
	const [dockedSide, setDockedSide] = useState<'left' | 'right' | null>(null);
	const [activeAccount, setActiveAccount] = useState<'main' | 'alt'>('main');
	const [activeView, setActiveView] = useState<PreviewMainView>('server');
	const [selectedServerId, setSelectedServerId] = useState<string>(liveData.guilds[0]?.id || '687429190165069838');
	const [activeTab, setActiveTab] = useState<DashboardPreviewTab>('info');
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [userMenuOpen, setUserMenuOpen] = useState(false);
	const [claimed, setClaimed] = useState(false);
	const [overlayOpen, setOverlayOpen] = useState(false);
	const [ghostMode, setGhostMode] = useState(false);
	const [overlayOpacity, setOverlayOpacity] = useState<1 | 0.85 | 0.7 | 0.5>(1);
	const [osToastOpen, setOsToastOpen] = useState(false);
	const [omnibarOpen, setOmnibarOpen] = useState(false);
	const [rpcEnabled, setRpcEnabled] = useState(true);
	const [controlStyle, setControlStyle] = useState<PreviewControlStyle>('windows');
	const [hasCustomControlStyle, setHasCustomControlStyle] = useState(false);
	const [crestIdx, setCrestIdx] = useState(0);

	const isMaximized = onToggleMaximize ? maximized : localMaximized;
	const handleToggleMaximize = () => {
		setDockedSide(null);
		if (onToggleMaximize) onToggleMaximize();
		else setLocalMaximized((v) => !v);
	};

	const handleCycleDock = () => {
		setDockedSide((prev) => (prev === null ? 'left' : prev === 'left' ? 'right' : null));
	};

	useEffect(() => {
		const el = viewportFrameRef.current;
		if (!el) return;
		const updateScale = () => {
			const w = el.clientWidth;
			if (w > 0) setScale(Math.min(1, w / VIRTUAL_WIDTH));
		};
		updateScale();
		const observer = new ResizeObserver(updateScale);
		observer.observe(el);
		return () => observer.disconnect();
	}, [isMaximized]);

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				setUserMenuOpen(false);
				setOmnibarOpen(false);
				setOsToastOpen(false);
			}
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, []);

	useEffect(() => {
		setCrestIdx(liveData.savedCrestIdx);
	}, [liveData.savedCrestIdx]);

	useEffect(() => {
		setClaimed(liveData.isGiftInitiallyClaimed);
	}, [liveData.isGiftInitiallyClaimed]);

	// Select the signed-in user's #1 managed Discord server automatically once live guilds arrive
	useEffect(() => {
		if (liveData.hasLiveGuilds && !hasSyncedLiveGuildRef.current && liveData.guilds.length > 0) {
			hasSyncedLiveGuildRef.current = true;
			setSelectedServerId(liveData.guilds[0].id);
			return;
		}
		if (liveData.guilds.length > 0 && !liveData.guilds.some((g) => g.id === selectedServerId)) {
			setSelectedServerId(liveData.guilds[0].id);
		}
	}, [liveData.hasLiveGuilds, liveData.guilds, selectedServerId]);

	useEffect(() => {
		if (hasCustomControlStyle) return;
		if (liveData.savedWindowControls) {
			setControlStyle(liveData.savedWindowControls);
		} else {
			setControlStyle(effectivePlatform === 'macos' ? 'macos' : 'windows');
		}
	}, [effectivePlatform, liveData.savedWindowControls, hasCustomControlStyle]);

	const activeGuild = liveData.guilds.find((g) => g.id === selectedServerId) || liveData.guilds[0];
	const { config: guildConfig, setConfig: setGuildConfig } = usePreviewGuildConfig(activeGuild);

	const isRightAligned = liveData.savedAlignment === 'right' ? true : liveData.savedAlignment === 'left' ? false : controlStyle === 'macos';
	const sidebarHidden = activeView === 'explore';
	const activeRoutePath = activeView === 'explore' ? '/' : activeView === 'leaderboard' ? '/leaderboard' : `/dashboard?guild=${activeGuild?.id || '687429190165069838'}&tab=${activeTab}`;

	const cycleControls = () => {
		const order: PreviewControlStyle[] = ['windows', 'xernerx', 'capsule', 'squircle', 'minimal', 'macos'];
		setHasCustomControlStyle(true);
		setControlStyle((prev) => order[(order.indexOf(prev) + 1) % order.length]);
	};

	const handleSelectServer = (id: string) => {
		hasSyncedLiveGuildRef.current = true;
		setSelectedServerId(id);
		setActiveView('server');
	};

	const handleSwitchAccount = () => {
		setActiveAccount((prev) => (prev === 'main' ? 'alt' : 'main'));
		setClaimed(false);
	};

	const effectiveScale = scale ?? 0.62;
	const dockedWidth = dockedSide ? 820 : VIRTUAL_WIDTH;

	return (
		<div className="@container relative w-full flex flex-col gap-3" style={{ containerType: 'inline-size' }}>
			{/* Ambient Accent Glow Behind Window */}
			<div
				className="pointer-events-none absolute -inset-4 rounded-3xl opacity-30 blur-2xl transition-all duration-500"
				style={{
					background: 'radial-gradient(circle at 50% 42%, var(--accent), transparent 72%)',
				}}
			/>

			{/* Scaled True-Proportion Frameless Electron Window (1140x700 -> 100% Container Width) */}
			<div
				ref={viewportFrameRef}
				className="relative w-full rounded-2xl border border-(--border)/15 bg-(--background)/45 shadow-[0_24px_60px_rgba(0,0,0,0.5),0_0_32px_color-mix(in_srgb,var(--accent)_18%,transparent)] overflow-hidden"
				style={scale !== null ? { height: `${Math.round(VIRTUAL_HEIGHT * scale)}px` } : { aspectRatio: `${VIRTUAL_WIDTH} / ${VIRTUAL_HEIGHT}` }}
			>
				<div
					className={`relative flex bg-(--background)/35 overflow-hidden transition-opacity duration-150 ${
						dockedSide === 'right' ? 'justify-end' : 'justify-start'
					} ${scale === null ? 'opacity-0' : 'opacity-100'}`}
					style={{
						width: `${VIRTUAL_WIDTH}px`,
						height: `${VIRTUAL_HEIGHT}px`,
						transform: `scale(${effectiveScale})`,
						transformOrigin: 'top left',
					}}
				>
					<div
						className={`relative flex flex-col h-full bg-(--background) transition-[width] duration-300 ${dockedSide ? 'border-x border-(--border)/15 shadow-2xl' : ''}`}
						style={{ width: `${dockedWidth}px` }}
					>
						<DesktopPreviewHeader
							controlStyle={controlStyle}
							isRightAligned={isRightAligned}
							cycleControls={cycleControls}
							maximized={isMaximized}
							onToggleMaximize={handleToggleMaximize}
							dockedSide={dockedSide}
							onCycleDock={handleCycleDock}
							sidebarHidden={sidebarHidden}
							sidebarCollapsed={sidebarCollapsed || Boolean(dockedSide)}
							setSidebarCollapsed={setSidebarCollapsed}
							omnibarOpen={omnibarOpen}
							setOmnibarOpen={setOmnibarOpen}
							pinnedSubdomains={liveData.pinnedSubdomains}
							modKey={modKey}
							environment={environment}
							activeRoutePath={activeRoutePath}
							onSelectView={setActiveView}
							userMenuOpen={userMenuOpen}
							setUserMenuOpen={setUserMenuOpen}
							osToastOpen={osToastOpen}
							setOsToastOpen={setOsToastOpen}
							setOverlayOpen={setOverlayOpen}
							activeAccount={activeAccount}
							onSwitchAccount={handleSwitchAccount}
							rpcEnabled={rpcEnabled}
							setRpcEnabled={setRpcEnabled}
							claimed={claimed}
							setClaimed={setClaimed}
							userData={liveData}
						/>

						<div className={`flex flex-1 min-h-0 overflow-hidden ${isRightAligned ? 'flex-row-reverse' : ''}`}>
							{!sidebarHidden && (
								<DesktopPreviewSidebar
									sidebarCollapsed={sidebarCollapsed || Boolean(dockedSide)}
									isRightAligned={isRightAligned}
									activeView={activeView}
									setActiveView={setActiveView}
									guilds={liveData.guilds}
									selectedServerId={activeGuild?.id || '687429190165069838'}
									onSelectServer={handleSelectServer}
									showShortcutHints={liveData.showShortcutHints}
									userMenuOpen={userMenuOpen}
									setUserMenuOpen={setUserMenuOpen}
									osToastOpen={osToastOpen}
									setOsToastOpen={setOsToastOpen}
									setOmnibarOpen={setOmnibarOpen}
									setOverlayOpen={setOverlayOpen}
									activeAccount={activeAccount}
									onSwitchAccount={handleSwitchAccount}
									rpcEnabled={rpcEnabled}
									setRpcEnabled={setRpcEnabled}
									claimed={claimed}
									setClaimed={setClaimed}
									userData={liveData}
								/>
							)}

							{activeGuild && (
								<DesktopPreviewStage
									key={activeGuild.id}
									isRightAligned={isRightAligned}
									activeView={activeView}
									setActiveView={setActiveView}
									activeGuild={activeGuild}
									guildConfig={guildConfig}
									setGuildConfig={setGuildConfig}
									activeTab={activeTab}
									setActiveTab={setActiveTab}
									guilds={liveData.guilds}
									onSelectServer={handleSelectServer}
								/>
							)}
						</div>

						<DesktopPreviewOverlay
							platform={effectivePlatform}
							controlStyle={controlStyle}
							osToastOpen={osToastOpen}
							setOsToastOpen={setOsToastOpen}
							overlayOpen={overlayOpen}
							setOverlayOpen={setOverlayOpen}
							ghostMode={ghostMode}
							setGhostMode={setGhostMode}
							overlayOpacity={overlayOpacity}
							setOverlayOpacity={setOverlayOpacity}
							claimed={claimed}
							setClaimed={setClaimed}
							streakDays={liveData.streakDays}
							tickerBots={liveData.tickerBots}
						/>
					</div>
				</div>
			</div>

			{/* External Desktop Playground Controls Bar */}
			<div className="relative z-10 flex flex-wrap items-center justify-center gap-1.5 rounded-2xl bg-(--background)/60 backdrop-blur-md border border-(--border)/10 px-2.5 py-2">
				<button
					type="button"
					onClick={() => {
						if (!sidebarHidden) setSidebarCollapsed(false);
						setUserMenuOpen((v) => !v);
					}}
					className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer active:scale-95 focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2 ${
						userMenuOpen
							? 'bg-(--accent) text-(--accent-contrast) border-(--accent)'
							: 'bg-(--foreground)/45 border-(--border)/15 text-(--text-muted) hover:text-(--text) hover:border-(--accent)/35'
					}`}
				>
					<Users size={12} />
					<span>{t('www.download.preview.userCardToggle')}</span>
				</button>

				<button
					type="button"
					onClick={() => setOverlayOpen((v) => !v)}
					className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer active:scale-95 focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2 ${
						overlayOpen
							? 'bg-(--accent) text-(--accent-contrast) border-(--accent)'
							: 'bg-(--foreground)/45 border-(--border)/15 text-(--text-muted) hover:text-(--text) hover:border-(--accent)/35'
					}`}
				>
					<Layers size={12} />
					<span>{t('www.download.preview.overlayToggle')}</span>
				</button>

				<button
					type="button"
					onClick={() => setOmnibarOpen((v) => !v)}
					className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer active:scale-95 focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2 ${
						omnibarOpen
							? 'bg-(--accent) text-(--accent-contrast) border-(--accent)'
							: 'bg-(--foreground)/45 border-(--border)/15 text-(--text-muted) hover:text-(--text) hover:border-(--accent)/35'
					}`}
				>
					<Globe size={12} />
					<span>{t('www.download.preview.omnibarToggle')}</span>
				</button>

				<button
					type="button"
					onClick={cycleControls}
					title={t('www.download.preview.cycleControlsHint', { style: controlStyle })}
					className="inline-flex items-center gap-1.5 rounded-full border bg-(--foreground)/45 border-(--border)/15 text-(--text-muted) hover:text-(--text) hover:border-(--accent)/35 px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer active:scale-95 focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
				>
					<Columns2 size={12} className="text-(--accent)" />
					<span>{t('www.download.preview.chromeLabel', { style: controlStyle })}</span>
				</button>

				<button
					type="button"
					onClick={() => setCrestIdx((prev) => (prev + 1) % PREVIEW_CRESTS.length)}
					title={t('www.download.preview.crestHint')}
					className="inline-flex items-center gap-1.5 rounded-full border bg-(--foreground)/45 border-(--border)/15 text-(--text-muted) hover:text-(--text) hover:border-(--accent)/35 px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer active:scale-95 focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
				>
					<img
						src={PREVIEW_CRESTS[crestIdx]?.src || '/icon.png'}
						alt={`Xernerx Desktop App ${PREVIEW_CRESTS[crestIdx]?.id || 'default'} crest icon`}
						className="h-3.5 w-3.5 object-contain"
						draggable={false}
					/>
					<span>{t('www.download.preview.crestLabel')}</span>
				</button>

				<button
					type="button"
					onClick={() => setOsToastOpen((v) => !v)}
					className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer active:scale-95 focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2 ${
						osToastOpen
							? 'bg-(--accent) text-(--accent-contrast) border-(--accent)'
							: 'bg-(--foreground)/45 border-(--border)/15 text-(--text-muted) hover:text-(--text) hover:border-(--accent)/35'
					}`}
				>
					<Bell size={12} />
					<span>{t('www.download.preview.osAlertToggle')}</span>
				</button>

				<button
					type="button"
					onClick={handleToggleMaximize}
					title={t('common.window.maximize')}
					aria-label={t('common.window.maximize')}
					className={`inline-flex items-center justify-center rounded-full border p-1.5 transition-all cursor-pointer active:scale-95 focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2 ${
						isMaximized
							? 'bg-(--accent) text-(--accent-contrast) border-(--accent)'
							: 'bg-(--foreground)/45 border-(--border)/15 text-(--text-muted) hover:text-(--text) hover:border-(--accent)/35'
					}`}
				>
					{isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
				</button>

				{liveData.isSignedIn && (
					<span className="hidden @[660px]:inline-flex items-center gap-1.5 rounded-full bg-(--accent-green)/12 border border-(--accent-green)/30 px-2.5 py-1 text-[10px] font-extrabold text-(--accent-green)">
						<span className="h-1.5 w-1.5 rounded-full bg-(--accent-green) animate-pulse" />
						<span>{t('www.download.preview.liveUserSynced')}</span>
					</span>
				)}
			</div>
		</div>
	);
}
