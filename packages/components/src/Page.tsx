/** @format */
'use client';

import { useDictionary, useEnvironment, useLoading, usePlatform, useShortcuts, useSidebar, useTheme, useToast, useUser } from '@xernerx/providers';
import { AmbientStageCanvas, CursorFxCanvas, XernerxDotLogo } from '@xernerx/feedback';
import { Button } from '@xernerx/ui';
import { Eye, Lock, Megaphone, ShieldCheck, UploadCloud, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

import { BlacklistGate } from './BlacklistGate';
import { FirstSignInOnboarding, type OnboardingStageState } from './FirstSignInOnboarding';
import { Footer } from './Footer';
import { GiveawayBanner } from './GiveawayBanner';
import { Header } from './Header';
import { useWindowControlsStyle } from './HeaderWindowControls';
import NextTopLoader from 'nextjs-toploader';
import { Sidebar } from './Sidebar';

const PORT_APP_APPS = ['www', 'api', 'cdn', 'account', 'app', 'docs', 'admin', 'info', 'store', 'portal', 'hosting', 'haste', 'blog'];

export function Page({ children }: { children: React.ReactNode }) {
	const { device } = usePlatform();
	const { state } = useSidebar();
	const { isContentHidden, setContentHidden } = useShortcuts();
	const { isRightAligned } = useWindowControlsStyle();
	const { isLoading, message, backgroundMode, dotVariant } = useLoading();
	const { uiPreferences } = useTheme();
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { user: discordUser, loading: userLoading } = useUser();
	const { data: session } = useSession();
	const activeUser = discordUser || session?.user;

	const [isBatterySaverActive, setIsBatterySaverActive] = useState(false);
	const [isSystemIdle, setIsSystemIdle] = useState(false);
	const [privacyShieldLocked, setPrivacyShieldLocked] = useState(false);
	const [entryLoading] = useState(false);
	const [isDragUploading, setIsDragUploading] = useState(false);
	const [stagePreview, setStagePreview] = useState(false);
	const [onboardingStage, setOnboardingStage] = useState<OnboardingStageState>(() =>
		typeof window !== 'undefined' && (window as any).__xernerxOnboardingStage ? (window as any).__xernerxOnboardingStage : { active: false, phase: 'welcome' }
	);
	const [introStage, setIntroStage] = useState<{ active: boolean; variant?: any; renderStyle?: any }>({ active: false });
	const [isFixedWatermarkApp, setIsFixedWatermarkApp] = useState(false);
	const [activeAnnouncement, setActiveAnnouncement] = useState<any | null>(null);
	const [nowMs, setNowMs] = useState(() => Date.now());

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const clock = setInterval(() => setNowMs(Date.now()), 30000);
		const host = window.location.hostname;
		const portIdx = Number(window.location.port) - 4000;
		const isLocalHost = host === 'localhost' || host === '127.0.0.1' || /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(host);
		let appPre = 'app';
		if (isLocalHost && PORT_APP_APPS[portIdx]) appPre = PORT_APP_APPS[portIdx];
		else PORT_APP_APPS.forEach((p) => host.startsWith(`${p}.`) && (appPre = p));

		fetch(getEnvUrl(`https://api.xernerx.com/secure/announcements?activeOnly=true&app=${encodeURIComponent(appPre)}`), { credentials: 'include' })
			.then((res) => (res.ok ? res.json() : []))
			.then((list: any[]) => {
				if (!Array.isArray(list) || list.length === 0) return setActiveAnnouncement(null);
				const dismissed: string[] = JSON.parse(localStorage.getItem('xernerx-dismissed-announcements') || '[]');
				const match = list.find((a) => a?.id && !dismissed.includes(a.id) && a?.expiresAt && new Date(a.expiresAt).getTime() > Date.now());
				setActiveAnnouncement(match || null);
			})
			.catch(() => {});

		return () => clearInterval(clock);
	}, [getEnvUrl]);

	const dismissBanner = (id: string) => {
		try {
			const dismissed: string[] = JSON.parse(localStorage.getItem('xernerx-dismissed-announcements') || '[]');
			if (!dismissed.includes(id)) localStorage.setItem('xernerx-dismissed-announcements', JSON.stringify([...dismissed, id]));
		} catch {}
		setActiveAnnouncement(null);
	};

	const bannerExpiresMs = activeAnnouncement?.expiresAt ? new Date(activeAnnouncement.expiresAt).getTime() : 0;
	const bannerMinsLeft = bannerExpiresMs > nowMs ? Math.max(1, Math.floor((bannerExpiresMs - nowMs) / 60000)) : 0;

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const fixed =
			['4000', '4001', '4005'].includes(window.location.port) ||
			['xernerx.com', 'dev.xernerx.com', 'canary.xernerx.com'].includes(window.location.hostname) ||
			window.location.hostname.startsWith('www.') ||
			window.location.hostname.startsWith('api.') ||
			window.location.hostname.startsWith('docs.');
		setIsFixedWatermarkApp(fixed);
	}, []);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const onStagePreview = (e: Event) => setStagePreview(Boolean((e as CustomEvent<{ active?: boolean }>).detail?.active));
		const onOnboardingStage = (e: Event) => {
			const detail = (e as CustomEvent<OnboardingStageState>).detail;
			if (detail && typeof detail.active === 'boolean') {
				setOnboardingStage(detail);
			}
		};
		const onIntroStage = (e: Event) => {
			const detail = (e as CustomEvent<{ active: boolean; variant?: any; renderStyle?: any }>).detail;
			if (detail && typeof detail.active === 'boolean') {
				setIntroStage(detail);
			}
		};
		const preventWindowScroll = () => {
			if (window.scrollY !== 0 || window.scrollX !== 0) window.scrollTo(0, 0);
		};
		window.addEventListener('xernerx:stage-preview', onStagePreview);
		window.addEventListener('xernerx:onboarding-stage', onOnboardingStage);
		window.addEventListener('xernerx:intro-stage', onIntroStage);
		window.addEventListener('scroll', preventWindowScroll, { passive: true });
		return () => {
			window.removeEventListener('xernerx:stage-preview', onStagePreview);
			window.removeEventListener('xernerx:onboarding-stage', onOnboardingStage);
			window.removeEventListener('xernerx:intro-stage', onIntroStage);
			window.removeEventListener('scroll', preventWindowScroll);
		};
	}, []);

	const uploadFileToDesktopCdn = useCallback(
		async (file: File, sourceType: 'screen' | 'clipboard' | 'watch-folder' = 'screen') => {
			const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
			const userId = (activeUser as any)?.id;
			if (!userId) return false;

			try {
				bridge?.setProgressBar?.(0.35, 'normal');
				const formData = new FormData();
				formData.append('file', file);
				formData.append('privacy', 'limited');
				formData.append('folder', 'Desktop Captures');
				formData.append('tags', JSON.stringify(sourceType === 'watch-folder' ? ['desktop', 'watch-folder'] : ['desktop', 'capture']));

				const uploadRes = await fetch(getEnvUrl(`https://cdn.xernerx.com/upload/${userId}`), { method: 'POST', body: formData, credentials: 'include' });

				if (uploadRes.ok) {
					bridge?.setProgressBar?.(1, 'normal');
					setTimeout(() => bridge?.setProgressBar?.(-1, 'none'), 650);
					const data = await uploadRes.json();
					const cdnUrl = data?.url ? getEnvUrl(data.url) : '';
					if (cdnUrl) {
						await bridge?.writeClipboardText?.(cdnUrl);
						try {
							await navigator.clipboard.writeText(cdnUrl);
						} catch {}
						const isWatch = sourceType === 'watch-folder';
						const title = isWatch ? t('account.preferences.desktop.watchFolderUploadedTitle') : t('account.preferences.desktop.captureUploadedTitle');
						const desc = isWatch ? t('account.preferences.desktop.watchFolderUploadedDesc', { filename: file.name }) : cdnUrl;
						toast({ type: 'success', title, description: desc });
						bridge?.notify?.({ title, body: isWatch ? desc : t('account.preferences.desktop.captureUploadedDesc'), link: cdnUrl, force: true });
						return true;
					}
				}
			} catch {}
			bridge?.setProgressBar?.(-1, 'none');
			return false;
		},
		[activeUser, getEnvUrl, t, toast]
	);

	useEffect(() => {
		if (typeof window === 'undefined' || userLoading) return;
		const bridge = (window as any).electron;
		if (!bridge?.syncDailyGiftSchedule) return;
		const credits = (discordUser as any)?.credits;
		if (credits) {
			bridge.syncDailyGiftSchedule({ nextClaimAt: credits.giftIn || null, streak: typeof credits.streak === 'number' ? credits.streak : 0 }).catch(() => {});
		}
	}, [userLoading, (discordUser as any)?.credits?.giftIn, (discordUser as any)?.credits?.streak]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const bridge = (window as any).electron;
		if (!bridge) return;

		const applyPowerState = (powerState: any) => {
			if (!powerState || typeof powerState !== 'object') return;
			const active = Boolean(powerState.effectiveBatterySaver);
			setIsBatterySaverActive(active);
			if (typeof document !== 'undefined') document.documentElement.classList.toggle('reduce-motion', active || Boolean(uiPreferences?.reducedMotion));
		};

		bridge
			.getPowerState?.()
			?.then?.(applyPowerState)
			?.catch?.(() => {});
		const unsubPower = bridge.onPowerStateChange?.(applyPowerState);

		const applyIdleState = (idleState: any) => {
			if (!idleState || typeof idleState !== 'object') return;
			setIsSystemIdle(Boolean(idleState.isIdle));
			setPrivacyShieldLocked(Boolean(idleState.shieldActive));
		};
		bridge
			.getIdleState?.()
			?.then?.(applyIdleState)
			?.catch?.(() => {});
		const unsubIdle = bridge.onIdleStateChange?.(applyIdleState);

		return () => {
			unsubPower?.();
			unsubIdle?.();
		};
	}, [uiPreferences?.reducedMotion]);

	const handleUnlockPrivacyShield = useCallback(async () => {
		const bridge = (window as any).electron;
		try {
			if (bridge?.verifyBiometrics) {
				const bio = await bridge.verifyBiometrics(t('account.preferences.desktop.biometricPromptPrivacy'));
				if (bio && bio.verified === false) return;
			}
			setPrivacyShieldLocked(false);
			await bridge?.unlockPrivacyShield?.();
		} catch {
			setPrivacyShieldLocked(false);
		}
	}, [t]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const bridge = (window as any).electron;
		if (!bridge?.onQuickCapture) return;

		const unsubCapture = bridge.onQuickCapture(async (payload: { dataUrl: string; filename: string; sourceType: 'screen' | 'clipboard' | 'watch-folder'; timestamp: number }) => {
			if (!payload?.dataUrl) return;
			const userId = (activeUser as any)?.id;
			const notifyFallback = () => {
				toast({ type: 'success', title: t('account.preferences.desktop.captureClipboardTitle'), description: t('account.preferences.desktop.captureClipboardDesc') });
				bridge.notify?.({ title: t('account.preferences.desktop.captureClipboardTitle'), body: t('account.preferences.desktop.captureClipboardDesc'), force: true });
			};

			if (!userId) return notifyFallback();

			try {
				const blobRes = await fetch(payload.dataUrl);
				const blob = await blobRes.blob();
				const file = new File([blob], payload.filename || `xernerx-capture-${Date.now()}.png`, { type: blob.type || 'image/png' });
				if (await uploadFileToDesktopCdn(file, payload.sourceType || 'screen')) return;
			} catch {}

			notifyFallback();
		});

		return () => unsubCapture?.();
	}, [activeUser, t, toast, uploadFileToDesktopCdn]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const bridge = (window as any).electron;
		if (!bridge?.onClipboardGuardState) return;

		const unsubGuard = bridge.onClipboardGuardState((payload: { active: boolean; expiresAt: number | null; ttlMs: number; event: 'guarded' | 'cleared' | 'cancelled' }) => {
			if (!payload) return;
			if (payload.event === 'guarded') {
				const seconds = Math.max(1, Math.round((payload.ttlMs || 60000) / 1000));
				toast({
					type: 'warning',
					title: t('account.preferences.desktop.clipboardGuardTitle'),
					description: t('account.preferences.desktop.clipboardGuardDesc', { seconds }),
					duration: 12000,
					action: { label: t('account.preferences.desktop.clipboardGuardKeep'), onClick: () => bridge.cancelClipboardGuard?.() },
				});
			} else if (payload.event === 'cancelled') {
				toast({ type: 'info', title: t('account.preferences.desktop.clipboardGuardCancelledTitle'), description: t('account.preferences.desktop.clipboardGuardCancelledDesc') });
			} else if (payload.event === 'cleared') {
				toast({ type: 'info', title: t('account.preferences.desktop.clipboardGuardClearedTitle'), description: t('account.preferences.desktop.clipboardGuardClearedDesc') });
			}
		});

		const handleCopyEvent = () => {
			setTimeout(async () => {
				try {
					const sel = window.getSelection()?.toString()?.trim() || '';
					if (sel && /^(?:xrx_|xrn_)[A-Za-z0-9._-]{12,}$/.test(sel)) await bridge.guardClipboardSecret?.(sel, 60000);
				} catch {}
			}, 60);
		};
		window.addEventListener('copy', handleCopyEvent);

		return () => {
			unsubGuard?.();
			window.removeEventListener('copy', handleCopyEvent);
		};
	}, [t, toast]);

	const stage = isFixedWatermarkApp ? 'default' : uiPreferences?.dotMatrixStage || 'default';
	const matrixType = isFixedWatermarkApp
		? 'default'
		: uiPreferences?.dotMatrixType && uiPreferences.dotMatrixType !== 'default'
			? uiPreferences.dotMatrixType
			: stage === 'orbit'
				? 'orbit'
				: stage === 'blank'
					? 'blank'
					: 'default';
	const matrixAnim = isFixedWatermarkApp ? 'animate' : uiPreferences?.dotMatrixAnimation || (stage === 'ripple' ? 'always' : 'animate');

	const activeLoading = isLoading || entryLoading;
	const effectiveStagePreview = stagePreview || isContentHidden;
	const isLivePageTour = onboardingStage.active && (onboardingStage.phase === 'dashboard' || onboardingStage.phase === 'portal' || onboardingStage.phase === 'explore');
	const isReadyPhase = onboardingStage.active && onboardingStage.phase === 'ready';
	const isHeaderMovedOffScreen =
		onboardingStage.active && (onboardingStage.phase === 'welcome' || onboardingStage.phase === 'who-we-are' || onboardingStage.phase === 'setup' || onboardingStage.phase === 'tour-choice');
	const isFeedbackVariant = dotVariant === '404' || dotVariant === 'error' || dotVariant === 'lock';
	const effectiveRenderStyle =
		introStage.active && introStage.renderStyle ? introStage.renderStyle : isFixedWatermarkApp || isFeedbackVariant ? 'dots' : uiPreferences?.dotMatrixRenderStyle || 'dots';
	const targetVariant = isFeedbackVariant
		? dotVariant
		: matrixType !== 'default' && matrixType !== 'blank'
			? matrixType
			: effectiveRenderStyle !== 'dots' && dotVariant === 'full'
				? 'orbit'
				: dotVariant;

	const effectiveVariant = introStage.active && introStage.variant ? introStage.variant : activeLoading ? 'full' : targetVariant;
	const effectiveRipple =
		introStage.active || activeLoading
			? true
			: isBatterySaverActive || isSystemIdle || privacyShieldLocked
				? false
				: effectiveStagePreview
					? matrixAnim !== 'static'
					: matrixAnim === 'always' || effectiveRenderStyle !== 'dots'
						? true
						: matrixAnim === 'static'
							? false
							: backgroundMode === 'sticky-ripple';
	const effectiveBlank =
		introStage.active || activeLoading
			? false
			: effectiveStagePreview
				? false
				: isBatterySaverActive || isSystemIdle || privacyShieldLocked
					? true
					: matrixType === 'blank'
						? true
						: matrixType !== 'default' || effectiveRenderStyle !== 'dots'
							? false
							: matrixAnim === 'always'
								? false
								: backgroundMode === 'blank';

	const showFooter = state === 'hidden' && !introStage.active;

	return (
		<div
			className="fixed inset-0 flex h-dvh w-full flex-col overflow-hidden overscroll-none bg-(--background)"
			style={{ height: 'calc(100dvh / var(--ui-zoom, 1))' }}
			onDragOver={(e) => {
				if (typeof window === 'undefined' || !(window as any).electron) return;
				if ((e.shiftKey || e.altKey) && e.dataTransfer?.types?.includes('Files')) {
					e.preventDefault();
					setIsDragUploading(true);
				}
			}}
			onDragLeave={(e) => {
				if (e.currentTarget === e.target) setIsDragUploading(false);
			}}
			onDrop={async (e) => {
				if (!isDragUploading) return;
				e.preventDefault();
				setIsDragUploading(false);
				const droppedFile = e.dataTransfer?.files?.[0];
				if (droppedFile) await uploadFileToDesktopCdn(droppedFile);
			}}
		>
			{isDragUploading && (
				<div className="pointer-events-none fixed inset-4 z-50 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-(--accent) bg-(--background)/80 backdrop-blur-md shadow-2xl">
					<div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30 mb-3">
						<UploadCloud size={32} />
					</div>
					<span className="text-lg font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('account.preferences.desktop.dropUploadTitle')}
					</span>
					<span className="text-xs text-(--text-muted)">{t('account.preferences.desktop.dropUploadDesc')}</span>
				</div>
			)}
			{privacyShieldLocked && (
				<div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-(--background)/90 backdrop-blur-2xl p-6 text-center select-none">
					<div className="flex flex-col items-center max-w-md rounded-3xl border border-(--border)/15 bg-(--foreground)/40 p-8 shadow-2xl" style={{ gap: 'var(--ui-gap)' }}>
						<div className="w-40">
							<XernerxDotLogo variant="lock" width={200} height={150} ripple={false} showAmbientField={false} />
						</div>
						<div className="flex flex-col items-center gap-1.5">
							<span className="inline-flex items-center gap-1.5 rounded-full bg-(--accent)/15 border border-(--accent)/30 px-3 py-1 text-[11px] font-bold text-(--accent)">
								<ShieldCheck size={13} />
								{t('account.preferences.desktop.privacyShieldBadge')}
							</span>
							<h2 className="text-xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('account.preferences.desktop.privacyShieldTitle')}
							</h2>
							<p className="text-xs text-(--text-muted)">{t('account.preferences.desktop.privacyShieldDesc')}</p>
						</div>
						<Button variant="primary" onClick={handleUnlockPrivacyShield} className="w-full flex items-center justify-center gap-2 rounded-2xl">
							<Lock size={15} />
							<span>{t('account.preferences.desktop.privacyShieldUnlock')}</span>
						</Button>
					</div>
				</div>
			)}
			<div
				className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] shrink-0 z-[60] ${
					isHeaderMovedOffScreen ? '-translate-y-full opacity-0 pointer-events-none max-h-0 overflow-hidden' : 'translate-y-0 opacity-100 max-h-24'
				}`}
			>
				<Header />
			</div>
			{!isFixedWatermarkApp && !isBatterySaverActive && !isSystemIdle && !privacyShieldLocked && uiPreferences?.cursorFx && uiPreferences.cursorFx !== 'default' && (
				<CursorFxCanvas fx={uiPreferences.cursorFx} />
			)}

			<div className={`flex flex-1 min-h-0 overflow-hidden ${isRightAligned ? 'flex-row-reverse' : ''}`}>
				<NextTopLoader color="var(--accent)" showSpinner={false} shadow="none" height={3} />
				<Sidebar />

				<div
					id="main-scroll-container"
					className={`relative h-full min-h-0 flex-1 ${
						activeLoading || effectiveStagePreview || introStage.active || (onboardingStage.active && !isLivePageTour) ? 'overflow-hidden' : 'overflow-y-auto overscroll-y-contain'
					} shadow-inner ${device === 'mobile' || state === 'hidden' ? 'rounded-t-xl' : isRightAligned ? 'rounded-tr-xl' : 'rounded-tl-xl'}`}
					style={{
						WebkitOverflowScrolling: 'touch',
						background:
							'radial-gradient(circle at 50% 15%, color-mix(in srgb, var(--accent) 30%, var(--foreground)) 0%, var(--foreground) 75%), linear-gradient(135deg, color-mix(in srgb, var(--accent) 20%, var(--foreground)) 0%, var(--foreground) 50%, color-mix(in srgb, var(--accent) 20%, var(--foreground)) 100%)',
					}}
				>
					<div className="sticky top-0 left-0 w-full h-0 overflow-visible pointer-events-none z-0">
						<div className="relative flex flex-col items-center justify-center w-full" style={{ height: 'calc(100dvh / var(--ui-zoom, 1) - 3.5rem - env(safe-area-inset-top, 0px))' }}>
							<div className="absolute inset-0 pointer-events-none">
								<AmbientStageCanvas scene={isFixedWatermarkApp || isBatterySaverActive || isSystemIdle || privacyShieldLocked ? 'default' : uiPreferences?.ambientScene || 'default'} />
							</div>
							<XernerxDotLogo
								variant={effectiveVariant}
								renderStyle={effectiveRenderStyle}
								backgroundMode
								ripple={effectiveRipple || onboardingStage.active || introStage.active}
								blank={effectiveBlank}
								subdued={(!activeLoading && !effectiveStagePreview && !onboardingStage.active && !introStage.active) || isLivePageTour || isReadyPhase}
								vivid={introStage.active}
							/>
							{activeLoading && message && <div className="absolute bottom-14 font-medium text-(--accent) text-sm">{message}</div>}
						</div>
					</div>

					<div className="sticky top-0 left-0 w-full h-0 overflow-visible pointer-events-none z-30">
						<div className="relative w-full pointer-events-none" style={{ height: 'calc(100dvh / var(--ui-zoom, 1) - 50px - env(safe-area-inset-top, 0px))' }}>
							<FirstSignInOnboarding />
						</div>
					</div>

					<div
						className={`relative z-10 flex flex-col transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${showFooter ? 'min-h-full justify-between' : ''} ${
							isLivePageTour || isReadyPhase
								? 'translate-y-0 scale-100 opacity-100 pb-72'
								: activeLoading || effectiveStagePreview || onboardingStage.active
									? 'translate-y-24 scale-95 opacity-0 pointer-events-none select-none'
									: 'translate-y-0 scale-100 opacity-100'
						}`}
					>
						<main
							className="relative z-10"
							style={{
								paddingTop: 'var(--ui-gap)',
								paddingBottom: showFooter ? 'var(--ui-gap)' : 'calc(var(--ui-gap) + env(safe-area-inset-bottom, 0px))',
								paddingLeft: 'calc(var(--ui-gap) + env(safe-area-inset-left, 0px))',
								paddingRight: 'calc(var(--ui-gap) + env(safe-area-inset-right, 0px))',
							}}
						>
							{activeAnnouncement && bannerMinsLeft > 0 && (
								<div
									className="max-w-(--page-width) mx-auto w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-(--accent)/15 border border-(--accent)/30 backdrop-blur-md text-xs text-(--text) shadow-sm"
									style={{ marginBottom: 'var(--ui-gap)' }}
								>
									<div className="flex items-center gap-2 min-w-0">
										<Megaphone size={14} className="text-(--accent) shrink-0" />
										<span className="font-bold truncate">{activeAnnouncement.title}</span>
										{activeAnnouncement.message?.content && <span className="text-(--text-muted) truncate hidden sm:inline">— {activeAnnouncement.message.content}</span>}
										{(activeAnnouncement.link || activeAnnouncement.blogSlug) && (
											<Link
												href={getEnvUrl(activeAnnouncement.link || `https://blog.xernerx.com/${activeAnnouncement.blogSlug}`)}
												className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-(--accent) text-(--background) hover:opacity-90 transition-opacity shrink-0"
											>
												{t('blog.card.readMore')}
											</Link>
										)}
									</div>
									<button
										type="button"
										onClick={() => dismissBanner(activeAnnouncement.id)}
										aria-label={t('common.close')}
										className="text-(--text-muted) hover:text-(--text) cursor-pointer shrink-0"
									>
										<X size={14} />
									</button>
								</div>
							)}
							<GiveawayBanner />
							<BlacklistGate>{children}</BlacklistGate>
						</main>

						{showFooter && <Footer />}
					</div>

					{effectiveStagePreview && (
						<div
							className="fixed left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-(--background)/85 backdrop-blur-xl border border-(--accent)/35 p-1.5 shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_25%,transparent)]"
							style={{ bottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}
						>
							<button
								type="button"
								onClick={() => {
									setStagePreview(false);
									setContentHidden(false);
									window.dispatchEvent(new CustomEvent('xernerx:construct-complete'));
								}}
								className="inline-flex items-center gap-2 rounded-full bg-(--accent) hover:bg-(--hover-accent) text-(--text-active) px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer shadow-sm"
							>
								<Eye size={14} />
								<span>{t('account.appearance.showUi')}</span>
								<kbd className="ml-1 rounded-full bg-(--background)/30 px-2 py-0.5 text-[10px] font-mono">Alt + H / Esc</kbd>
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
