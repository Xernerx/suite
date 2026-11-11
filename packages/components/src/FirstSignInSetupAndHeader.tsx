/** @format */
'use client';

import { Selector } from '@xernerx/ui';
import { useDictionary, useTheme } from '@xernerx/providers';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Building2, ChevronLeft, Eye, Gift, Globe, Languages, LayoutDashboard, LayoutGrid, Lock, Monitor, Moon, Search, Store, Sun, User as UserIcon } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React from 'react';

export type PrivacyTier = 'public' | 'limited' | 'private';
export type HeaderBuildStepId = 'logo' | 'mobile-tray' | 'search' | 'dashboard' | 'portal' | 'store' | 'drawer' | 'alerts' | 'profile';

const setLocaleCookie = (code: string) => {
	if (typeof document === 'undefined') return;
	const domain = process.env.NEXT_PUBLIC_DOMAIN || 'xernerx.com';
	if (typeof window !== 'undefined' && window.location.hostname.endsWith(domain)) {
		document.cookie = `NEXT_LOCALE=${code}; domain=.${domain}; path=/; max-age=31536000; SameSite=Lax`;
	} else {
		document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000; SameSite=Lax`;
	}
};

export function FirstSignInSetupScene({
	privacy,
	onPrivacyChange,
	selectedLocale,
	onLocaleChange,
}: {
	privacy: PrivacyTier;
	onPrivacyChange: (next: PrivacyTier) => void;
	selectedLocale: string;
	onLocaleChange: (next: string) => void;
	discordLocale?: string;
}) {
	const { t, locales } = useDictionary();
	const { theme, setTheme } = useTheme();
	const router = useRouter();

	const safeLocales: Array<{ code: string; label: string; coverage?: number }> =
		Array.isArray(locales) && locales.length > 0
			? locales
			: [
					{ code: 'en-GB', label: 'English (UK)' },
					{ code: 'en-US', label: 'English (US)' },
					{ code: 'nl', label: 'Nederlands' },
					{ code: 'es', label: 'Español' },
					{ code: 'fr', label: 'Français' },
					{ code: 'ru', label: 'Русский' },
					{ code: 'se', label: 'Svenska' },
				];

	const languageOptions = safeLocales.map((l) => ({
		value: l.code,
		label: l.label,
	}));

	const handleSelectLanguage = (code: string) => {
		if (!code) return;
		onLocaleChange(code);
		setLocaleCookie(code);
		try {
			router.refresh();
		} catch {}
	};

	const privacyTiers: Array<{
		id: PrivacyTier;
		icon: React.ElementType;
		title: string;
		badge: string;
		desc: string;
		whereYouShowUp: string;
	}> = [
		{
			id: 'public',
			icon: Globe,
			title: t('components.firstSignIn.setup.publicTitle'),
			badge: t('components.firstSignIn.setup.publicBadge'),
			desc: t('components.firstSignIn.setup.publicDesc'),
			whereYouShowUp: t('components.firstSignIn.setup.publicWhere'),
		},
		{
			id: 'limited',
			icon: Eye,
			title: t('components.firstSignIn.setup.limitedTitle'),
			badge: t('components.firstSignIn.setup.limitedBadge'),
			desc: t('components.firstSignIn.setup.limitedDesc'),
			whereYouShowUp: t('components.firstSignIn.setup.limitedWhere'),
		},
		{
			id: 'private',
			icon: Lock,
			title: t('components.firstSignIn.setup.privateTitle'),
			badge: t('components.firstSignIn.setup.privateBadge'),
			desc: t('components.firstSignIn.setup.privateDesc'),
			whereYouShowUp: t('components.firstSignIn.setup.privateWhere'),
		},
	];

	const selectedTier = privacyTiers.find((tier) => tier.id === privacy) || privacyTiers[0];
	const SelectedTierIcon = selectedTier.icon;
	const privacyOptions = privacyTiers.map((tier) => ({
		value: tier.id,
		label: `${tier.title} — ${tier.badge}`,
	}));

	return (
		<motion.div
			key="scene-setup"
			initial={{ opacity: 0, y: 28, scale: 0.96 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: -24, scale: 0.96 }}
			transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
			className="flex flex-col items-center text-center w-full"
			style={{ gap: 'var(--ui-gap)' }}
		>
			<div className="flex flex-col items-center max-w-2xl">
				<h2 className="text-2xl sm:text-5xl font-extrabold text-(--text) tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('components.firstSignIn.setup.heading')}
				</h2>
				<p className="text-xs sm:text-base text-(--text-muted) mt-1.5 leading-relaxed">{t('components.firstSignIn.setup.subtitle')}</p>
			</div>

			{/* Privacy Selector + Selected Tier Card */}
			<div className="relative z-50 w-full rounded-3xl bg-(--background)/80 backdrop-blur-2xl border border-(--accent)/35 p-4 sm:p-5 text-left shadow-[0_0_28px_color-mix(in_srgb,var(--accent)_18%,transparent)] flex flex-col gap-3">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="flex items-start gap-3 min-w-0">
						<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-(--accent) text-white border border-(--accent) shadow-sm">
							<SelectedTierIcon size={20} />
						</div>
						<div className="min-w-0">
							<h3 className="text-base font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('components.firstSignIn.setup.privacySelectorTitle')}
							</h3>
							<p className="text-xs text-(--text-muted) mt-0.5 leading-relaxed">{selectedTier.desc}</p>
						</div>
					</div>
					<div className="w-full sm:w-64 shrink-0">
						<Selector value={privacy} options={privacyOptions} onChange={(val) => onPrivacyChange(val as PrivacyTier)} />
					</div>
				</div>

				<div className="rounded-2xl bg-(--foreground)/55 border border-(--border)/15 px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
					<span className="shrink-0 text-[11px] font-extrabold uppercase tracking-wider text-(--accent)">{t('components.firstSignIn.setup.whereYouShowUpLabel')}</span>
					<span className="text-xs text-(--text) font-medium leading-snug">{selectedTier.whereYouShowUp}</span>
				</div>
			</div>

			{/* Language & Theme Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 w-full text-left">
				<div className="relative z-40 flex flex-col justify-between gap-3.5 rounded-3xl bg-(--background)/80 backdrop-blur-2xl border border-(--border)/15 p-4 sm:p-5 shadow-xl">
					<div className="flex items-start gap-3">
						<div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
							<Languages size={20} />
						</div>
						<div className="flex-1 min-w-0">
							<h4 className="text-sm sm:text-base font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('components.firstSignIn.setup.languageTitle')}
							</h4>
							<p className="text-xs text-(--text-muted) mt-0.5 leading-relaxed">{t('components.firstSignIn.setup.languageDesc')}</p>
						</div>
					</div>
					<div className="w-full">
						<Selector value={selectedLocale} options={languageOptions} onChange={handleSelectLanguage} />
					</div>
				</div>

				<div className="flex flex-col justify-between gap-3.5 rounded-3xl bg-(--background)/80 backdrop-blur-2xl border border-(--border)/15 p-4 sm:p-5 shadow-xl">
					<div className="flex items-start gap-3">
						<div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
							{theme === 'light' ? <Sun size={20} /> : theme === 'dark' ? <Moon size={20} /> : <Monitor size={20} />}
						</div>
						<div className="flex-1 min-w-0">
							<h4 className="text-sm sm:text-base font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('components.firstSignIn.setup.themeTitle')}
							</h4>
							<p className="text-xs text-(--text-muted) mt-0.5 leading-relaxed">{t('components.firstSignIn.setup.themeDesc')}</p>
						</div>
					</div>
					<div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-(--foreground)/60 border border-(--border)/15 p-1.5 w-full">
						{(
							[
								{ id: 'system', icon: Monitor, label: t('components.firstSignIn.setup.themeSystem') },
								{ id: 'dark', icon: Moon, label: t('components.firstSignIn.setup.themeDark') },
								{ id: 'light', icon: Sun, label: t('components.firstSignIn.setup.themeLight') },
							] as const
						).map((mode) => {
							const ModeIcon = mode.icon;
							const active = theme === mode.id;
							return (
								<button
									key={mode.id}
									type="button"
									onClick={() => setTheme(mode.id)}
									className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold transition-all cursor-pointer ${
										active ? 'bg-(--accent) text-white shadow-sm' : 'text-(--text-muted) hover:text-(--text)'
									}`}
								>
									<ModeIcon size={14} />
									<span>{mode.label}</span>
								</button>
							);
						})}
					</div>
				</div>
			</div>
		</motion.div>
	);
}

export function FirstSignInHeaderScene({
	headerSteps,
	headerStepIndex,
	setHeaderStepIndex,
	avatarUrl,
	displayName,
}: {
	headerSteps: HeaderBuildStepId[];
	headerStepIndex: number;
	setHeaderStepIndex: (step: number) => void;
	avatarUrl: string | null;
	displayName: string;
}) {
	const { t } = useDictionary();
	const currentStepId: HeaderBuildStepId = headerSteps[headerStepIndex] || 'logo';

	const stepMeta: Record<HeaderBuildStepId, { icon: React.ElementType; title: string; desc: string; kbd?: string }> = {
		logo: {
			icon: Globe,
			title: t('components.firstSignIn.navigation.sub0Title'),
			desc: t('components.firstSignIn.navigation.sub0Desc'),
			kbd: 'Ctrl + .',
		},
		'mobile-tray': {
			icon: ChevronLeft,
			title: t('components.firstSignIn.navigation.mobileTrayTitle'),
			desc: t('components.firstSignIn.navigation.mobileTrayDesc'),
		},
		search: {
			icon: Search,
			title: t('components.firstSignIn.navigation.paletteTitle'),
			desc: t('components.firstSignIn.navigation.paletteDesc'),
			kbd: 'Ctrl + K',
		},
		dashboard: {
			icon: LayoutDashboard,
			title: t('components.firstSignIn.navigation.shortcutDashboardTitle'),
			desc: t('components.firstSignIn.navigation.shortcutDashboardDesc'),
		},
		portal: {
			icon: Building2,
			title: t('components.firstSignIn.navigation.shortcutPortalTitle'),
			desc: t('components.firstSignIn.navigation.shortcutPortalDesc'),
		},
		store: {
			icon: Store,
			title: t('components.firstSignIn.navigation.shortcutStoreTitle'),
			desc: t('components.firstSignIn.navigation.shortcutStoreDesc'),
		},
		drawer: {
			icon: LayoutGrid,
			title: t('components.firstSignIn.navigation.appDrawerTitle'),
			desc: t('components.firstSignIn.navigation.appDrawerDesc'),
			kbd: 'Ctrl + Space',
		},
		alerts: {
			icon: Bell,
			title: t('components.firstSignIn.navigation.alertsTitle'),
			desc: t('components.firstSignIn.navigation.alertsDesc'),
			kbd: 'Ctrl + I',
		},
		profile: {
			icon: Gift,
			title: t('components.firstSignIn.navigation.profileTitle'),
			desc: t('components.firstSignIn.navigation.profileDesc'),
			kbd: 'Ctrl + ,',
		},
	};

	const activeMeta = stepMeta[currentStepId] || stepMeta.logo;
	const ActiveIcon = activeMeta.icon;
	const hasDashboardShortcut = headerSteps.includes('dashboard');
	const hasPortalShortcut = headerSteps.includes('portal');

	return (
		<motion.div
			key="scene-header"
			initial={{ opacity: 0, y: 24, scale: 0.97 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: -20, scale: 0.97 }}
			transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
			className="flex flex-col items-center text-center max-w-2xl mx-auto w-full"
		>
			<AnimatePresence mode="wait">
				<motion.div
					key={`header-sub-${currentStepId}`}
					initial={{ opacity: 0, y: 14, scale: 0.98 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, y: -14, scale: 0.98 }}
					transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
					className="w-full rounded-3xl bg-(--background)/85 backdrop-blur-2xl border border-(--accent)/35 p-5 sm:p-7 text-left shadow-[0_0_32px_color-mix(in_srgb,var(--accent)_18%,transparent)]"
				>
					<div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
						{currentStepId === 'profile' ? (
							<div className="relative shrink-0">
								{avatarUrl ? (
									<Image src={avatarUrl} alt={displayName} width={52} height={52} unoptimized className="w-13 h-13 rounded-2xl border-2 border-(--accent)" />
								) : (
									<div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/35">
										<UserIcon size={26} />
									</div>
								)}
								<span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-(--accent-orange) text-white shadow-md">
									<Gift size={11} />
								</span>
							</div>
						) : currentStepId === 'store' ? (
							<div className="flex items-center gap-2 shrink-0">
								{hasDashboardShortcut && (
									<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/40 shadow-sm">
										<LayoutDashboard size={20} />
									</div>
								)}
								{hasPortalShortcut && (
									<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/40 shadow-sm">
										<Building2 size={20} />
									</div>
								)}
								<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-(--accent) text-white border border-(--accent) shadow-md">
									<Store size={20} />
								</div>
							</div>
						) : (
							<div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/35">
								<ActiveIcon size={26} />
							</div>
						)}

						<div className="flex-1 min-w-0 w-full">
							<div className="flex items-center justify-between gap-3 mb-1.5">
								<h3 className="text-xl sm:text-2xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{activeMeta.title}
								</h3>
								<div className="flex items-center gap-2 shrink-0">
									{activeMeta.kbd && (
										<kbd className="rounded-xl bg-(--foreground) border border-(--accent)/30 px-2.5 py-0.5 font-mono text-xs font-extrabold text-(--accent) whitespace-nowrap">
											{activeMeta.kbd}
										</kbd>
									)}
									<div className="flex items-center gap-1.5">
										{headerSteps.map((stepId, idx) => (
											<button
												key={stepId}
												type="button"
												onClick={() => setHeaderStepIndex(idx)}
												aria-label={`Step ${idx + 1}`}
												className={`h-2 rounded-full transition-all cursor-pointer ${
													headerStepIndex === idx
														? 'w-5 bg-(--accent)'
														: headerStepIndex > idx
															? 'w-2 bg-(--accent)/50 hover:bg-(--accent)/80'
															: 'w-2 bg-(--border)/40 hover:bg-(--border)/70'
												}`}
											/>
										))}
									</div>
								</div>
							</div>
							<p className="text-xs sm:text-sm text-(--text-muted) leading-relaxed">{activeMeta.desc}</p>
						</div>
					</div>
				</motion.div>
			</AnimatePresence>
		</motion.div>
	);
}
