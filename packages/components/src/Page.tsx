/** @format */
'use client';

import { useDictionary, useEnvironment, useLoading, usePlatform, useSidebar, useTheme, useToast, useUser } from '@xernerx/providers';
import { XernerxDotLogo } from '@xernerx/feedback';
import { UploadCloud } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

import { Footer } from './Footer';
import { Header } from './Header';
import { useWindowControlsStyle } from './HeaderWindowControls';
import NextTopLoader from 'nextjs-toploader';
import { Sidebar } from './Sidebar';

export function Page({ children }: { children: React.ReactNode }) {
	const { device } = usePlatform();
	const { state } = useSidebar();
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
	const [entryLoading, setEntryLoading] = useState(true);
	const [isDragUploading, setIsDragUploading] = useState(false);
	const [stagePreview, setStagePreview] = useState(false);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const onStagePreview = (e: Event) => {
			const detail = (e as CustomEvent<{ active?: boolean }>).detail;
			setStagePreview(Boolean(detail?.active));
		};
		window.addEventListener('xernerx:stage-preview', onStagePreview);
		return () => window.removeEventListener('xernerx:stage-preview', onStagePreview);
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

				const uploadRes = await fetch(getEnvUrl(`https://cdn.xernerx.com/upload/${userId}`), {
					method: 'POST',
					body: formData,
					credentials: 'include',
				});

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
						toast({
							type: 'success',
							title,
							description: desc,
						});
						bridge?.notify?.({
							title,
							body: isWatch ? desc : t('account.preferences.desktop.captureUploadedDesc'),
							link: cdnUrl,
							force: true,
						});
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
			bridge
				.syncDailyGiftSchedule({
					nextClaimAt: credits.giftIn || null,
					streak: typeof credits.streak === 'number' ? credits.streak : 0,
				})
				.catch(() => {});
		}
	}, [userLoading, (discordUser as any)?.credits?.giftIn, (discordUser as any)?.credits?.streak]);

	useEffect(() => {
		const timer = setTimeout(() => setEntryLoading(false), 520);
		return () => clearTimeout(timer);
	}, []);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const bridge = (window as any).electron;
		if (!bridge) return;

		const applyPowerState = (powerState: any) => {
			if (!powerState || typeof powerState !== 'object') return;
			const active = Boolean(powerState.effectiveBatterySaver);
			setIsBatterySaverActive(active);
			if (typeof document !== 'undefined') {
				document.documentElement.classList.toggle('reduce-motion', active || Boolean(uiPreferences?.reducedMotion));
			}
		};

		bridge
			.getPowerState?.()
			?.then?.(applyPowerState)
			?.catch?.(() => {});
		const unsubPower = bridge.onPowerStateChange?.(applyPowerState);
		return () => {
			unsubPower?.();
		};
	}, [uiPreferences?.reducedMotion]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const bridge = (window as any).electron;
		if (!bridge?.onQuickCapture) return;

		const unsubCapture = bridge.onQuickCapture(async (payload: { dataUrl: string; filename: string; sourceType: 'screen' | 'clipboard' | 'watch-folder'; timestamp: number }) => {
			if (!payload?.dataUrl) return;
			const userId = (activeUser as any)?.id;

			if (!userId) {
				toast({
					type: 'success',
					title: t('account.preferences.desktop.captureClipboardTitle'),
					description: t('account.preferences.desktop.captureClipboardDesc'),
				});
				bridge.notify?.({
					title: t('account.preferences.desktop.captureClipboardTitle'),
					body: t('account.preferences.desktop.captureClipboardDesc'),
					force: true,
				});
				return;
			}

			try {
				const blobRes = await fetch(payload.dataUrl);
				const blob = await blobRes.blob();
				const file = new File([blob], payload.filename || `xernerx-capture-${Date.now()}.png`, { type: blob.type || 'image/png' });
				const uploaded = await uploadFileToDesktopCdn(file, payload.sourceType || 'screen');
				if (uploaded) return;
			} catch {}

			toast({
				type: 'success',
				title: t('account.preferences.desktop.captureClipboardTitle'),
				description: t('account.preferences.desktop.captureClipboardDesc'),
			});
			bridge.notify?.({
				title: t('account.preferences.desktop.captureClipboardTitle'),
				body: t('account.preferences.desktop.captureClipboardDesc'),
				force: true,
			});
		});

		return () => {
			unsubCapture?.();
		};
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
					action: {
						label: t('account.preferences.desktop.clipboardGuardKeep'),
						onClick: () => {
							bridge.cancelClipboardGuard?.();
						},
					},
				});
			} else if (payload.event === 'cancelled') {
				toast({
					type: 'info',
					title: t('account.preferences.desktop.clipboardGuardCancelledTitle'),
					description: t('account.preferences.desktop.clipboardGuardCancelledDesc'),
				});
			} else if (payload.event === 'cleared') {
				toast({
					type: 'info',
					title: t('account.preferences.desktop.clipboardGuardClearedTitle'),
					description: t('account.preferences.desktop.clipboardGuardClearedDesc'),
				});
			}
		});

		const handleCopyEvent = () => {
			setTimeout(async () => {
				try {
					const sel = window.getSelection()?.toString()?.trim() || '';
					if (sel && /^(?:xrx_|xrn_)[A-Za-z0-9._-]{12,}$/.test(sel)) {
						await bridge.guardClipboardSecret?.(sel, 60000);
					}
				} catch {}
			}, 60);
		};
		window.addEventListener('copy', handleCopyEvent);

		return () => {
			unsubGuard?.();
			window.removeEventListener('copy', handleCopyEvent);
		};
	}, [t, toast]);

	const isFixedWatermarkApp =
		typeof window !== 'undefined' &&
		(['4000', '4001', '4005'].includes(window.location.port) ||
			['xernerx.com', 'dev.xernerx.com', 'canary.xernerx.com'].includes(window.location.hostname) ||
			window.location.hostname.startsWith('www.') ||
			window.location.hostname.startsWith('api.') ||
			window.location.hostname.startsWith('docs.'));

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
	const isFeedbackVariant = dotVariant === '404' || dotVariant === 'error' || dotVariant === 'lock';
	const targetVariant = isFeedbackVariant || stagePreview ? dotVariant : matrixType !== 'default' && matrixType !== 'blank' ? matrixType : dotVariant;

	const effectiveVariant = activeLoading ? 'full' : targetVariant;
	const effectiveRipple = activeLoading
		? true
		: isBatterySaverActive
			? false
			: stagePreview
				? matrixAnim !== 'static'
				: matrixAnim === 'always'
					? true
					: matrixAnim === 'static'
						? false
						: backgroundMode === 'sticky-ripple';
	const effectiveBlank = activeLoading
		? false
		: stagePreview
			? false
			: isBatterySaverActive
				? true
				: matrixType === 'blank'
					? true
					: matrixType !== 'default'
						? false
						: matrixAnim === 'always'
							? false
							: backgroundMode === 'blank';

	// Footer only renders when the sidebar is hidden
	const showFooter = state === 'hidden';

	return (
		<div
			className="relative flex h-screen w-full flex-col overflow-hidden bg-(--background)"
			style={{ height: 'calc(100vh / var(--ui-zoom, 1))' }}
			onDragOver={(e) => {
				if (typeof window === 'undefined' || !(window as any).electron) return;
				if ((e.shiftKey || e.altKey) && e.dataTransfer?.types?.includes('Files')) {
					e.preventDefault();
					setIsDragUploading(true);
				}
			}}
			onDragLeave={(e) => {
				if (e.currentTarget === e.target) {
					setIsDragUploading(false);
				}
			}}
			onDrop={async (e) => {
				if (!isDragUploading) return;
				e.preventDefault();
				setIsDragUploading(false);
				const droppedFile = e.dataTransfer?.files?.[0];
				if (droppedFile) {
					await uploadFileToDesktopCdn(droppedFile);
				}
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
			{/* Header stays completely fixed at the top */}
			<Header />

			{/* Middle layout container filling the screen */}
			<div className={`flex flex-1 overflow-hidden ${isRightAligned ? 'flex-row-reverse' : ''}`}>
				<NextTopLoader color="var(--accent)" showSpinner={false} shadow="none" height={3} />

				<Sidebar />

				{/* Scrollable Content Area with a prominent, symmetrical radial and linear accent gradient */}
				<div
					id="main-scroll-container"
					className={`relative h-full flex-1 ${isLoading || stagePreview ? 'overflow-hidden' : 'overflow-y-auto'} shadow-inner
                        ${device === 'mobile' || state === 'hidden' ? 'rounded-t-xl' : isRightAligned ? 'rounded-tr-xl' : 'rounded-tl-xl'} 
                    `}
					style={{
						background:
							'radial-gradient(circle at 50% 15%, color-mix(in srgb, var(--accent) 30%, var(--foreground)) 0%, var(--foreground) 75%), linear-gradient(135deg, color-mix(in srgb, var(--accent) 20%, var(--foreground)) 0%, var(--foreground) 50%, color-mix(in srgb, var(--accent) 20%, var(--foreground)) 100%)',
					}}
				>
					{/* Centralized AppLayout Dot-Matrix Loading & Sticky Stage */}
					<div className="sticky top-0 left-0 w-full h-0 overflow-visible pointer-events-none z-0">
						<div className="relative flex flex-col items-center justify-center w-full" style={{ height: 'calc(100vh / var(--ui-zoom, 1) - 3.5rem)' }}>
							<XernerxDotLogo variant={effectiveVariant} backgroundMode ripple={effectiveRipple} blank={effectiveBlank} subdued={!isLoading && !stagePreview} />
							{isLoading && message && <div className="absolute bottom-14 font-medium text-(--accent) text-sm">{message}</div>}
						</div>
					</div>

					<div
						className={`relative z-10 flex flex-col transition-opacity duration-500 ${showFooter ? 'min-h-full justify-between' : ''} ${
							isLoading ? 'opacity-0 pointer-events-none select-none' : 'opacity-100'
						}`}
					>
						<main className="relative z-10" style={{ padding: 'var(--ui-gap)' }}>
							{children}
						</main>

						{/* Rendered only when sidebar is hidden, acting as an extra scrollable element */}
						{showFooter && <Footer />}
					</div>
				</div>
			</div>
		</div>
	);
}
