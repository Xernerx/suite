/** @format */
'use client';

import { useDictionary, useEnvironment, useSession, useSidebar, useSupport, useUser } from '@xernerx/providers';
import { Badge, Button, Selector } from '@xernerx/ui';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, LayoutDashboard, LifeBuoy, LogIn, Terminal, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import BotOnboardingIntroScene from '@/components/bots/BotOnboardingIntroScene';

interface BotOnboardingFlowProps {
	bot: any;
	setBot?: React.Dispatch<React.SetStateAction<any>>;
	id: string;
	initialGuildId?: string | null;
	initialPermissions?: string | null;
	initialForceTour?: boolean;
}

const LOCAL_ONBOARDED_BOTS_KEY = 'xernerx_onboarded_bots';

function readLocalOnboardedBots(): string[] {
	if (typeof window === 'undefined') return [];
	try {
		const raw = localStorage.getItem(LOCAL_ONBOARDED_BOTS_KEY);
		const parsed = raw ? JSON.parse(raw) : [];
		return Array.isArray(parsed) ? parsed.map((v) => String(v).toLowerCase()) : [];
	} catch {
		return [];
	}
}

function addLocalOnboardedBot(identifiers: string[]) {
	if (typeof window === 'undefined') return;
	try {
		const existing = readLocalOnboardedBots();
		const merged = Array.from(new Set([...existing, ...identifiers.filter(Boolean).map((v) => String(v).toLowerCase())]));
		localStorage.setItem(LOCAL_ONBOARDED_BOTS_KEY, JSON.stringify(merged));
	} catch {}
}

export default function BotOnboardingFlow({ bot, id, initialGuildId, initialForceTour = false }: BotOnboardingFlowProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { data: session, status } = useSession();
	const { user, mutate } = useUser();
	const { hide } = useSidebar();
	const supportCtx = useSupport();
	const router = useRouter();

	const resolvedBotId = String(bot?.id || id);
	const botSlugLower = String(bot?.vanitySlug || id).toLowerCase();
	const isVirtue = useMemo(() => resolvedBotId === '1484880634844287138' || botSlugLower === 'virtue', [resolvedBotId, botSlugLower]);
	const hasDashboard = useMemo(() => Boolean(isVirtue || bot?.hasSuiteDashboard || bot?.links?.dashboard), [isVirtue, bot?.hasSuiteDashboard, bot?.links?.dashboard]);

	const [localOnboarded, setLocalOnboarded] = useState<string[]>(() => readLocalOnboardedBots());
	const [isIntroPlaying, setIsIntroPlaying] = useState<boolean>(true);
	const claimedBonusRef = useRef<string | null>(null);

	const isRepeatInvite = useMemo(() => {
		if (initialForceTour) return false;
		const serverBots: string[] = Array.isArray((user as any)?.onboarding?.onboardedBots) ? (user as any).onboarding.onboardedBots.map((v: any) => String(v).toLowerCase()) : [];
		const candidates = [resolvedBotId.toLowerCase(), botSlugLower, String(id).toLowerCase()].filter(Boolean);
		return candidates.some((c) => serverBots.includes(c) || localOnboarded.includes(c));
	}, [user, localOnboarded, resolvedBotId, botSlugLower, id, initialForceTour]);

	const isAuthenticated = status === 'authenticated' && Boolean((session as any)?.user?.id || user?.id);

	const [savingStep, setSavingStep] = useState(false);
	const [managedGuilds, setManagedGuilds] = useState<{ id: string; name: string; iconUrl?: string | null }[]>([]);
	const [selectedGuildId, setSelectedGuildId] = useState<string>(initialGuildId || '');

	const botDisplayName = bot?.discord?.global_name || bot?.discord?.username || bot?.name || id;
	const avatarUrl = bot?.discord?.avatar
		? `https://cdn.discordapp.com/avatars/${bot.id}/${bot.discord.avatar}.png?size=256`
		: bot?.avatar
			? String(bot.avatar).startsWith('http')
				? bot.avatar
				: `https://cdn.discordapp.com/avatars/${bot.id}/${bot.avatar}.png?size=256`
			: null;

	const sampleSlashCommands = useMemo<{ name: string; description: string }[]>(() => {
		if (!Array.isArray(bot?.commands)) return [];
		return bot.commands
			.filter((c: any) => c && c.name && (!c.type || Number(c.type) === 1))
			.slice(0, 6)
			.map((c: any) => ({ name: String(c.name), description: String(c.description || '') }));
	}, [bot?.commands]);

	useEffect(() => {
		hide();
	}, [hide]);

	// Award +100 Credits for each unique bot invite (botId + guildId)
	useEffect(() => {
		const uid = user?.id || (session as any)?.user?.id;
		if (!uid || !resolvedBotId) return;
		const effectiveGuildKey = initialGuildId || 'initial';
		const claimKey = `${uid}:${resolvedBotId}:${effectiveGuildKey}`;
		if (claimedBonusRef.current === claimKey) return;
		claimedBonusRef.current = claimKey;

		fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${uid}`), {
			method: 'PATCH',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				action: 'claim_bot_invite_bonus',
				botId: resolvedBotId,
				botName: botDisplayName,
				guildId: effectiveGuildKey,
			}),
		})
			.then(async (res) => {
				if (!res.ok) return;
				const data = await res.json().catch(() => ({}));
				if (data?.bonusGranted) {
					await mutate();
				}
			})
			.catch(() => {});
	}, [user?.id, (session as any)?.user?.id, resolvedBotId, initialGuildId, botDisplayName, getEnvUrl, mutate]);

	// Fetch manageable Discord servers for the Server Selector / Dashboard
	useEffect(() => {
		const uid = (session as any)?.user?.id || user?.id;
		const accessToken = (session as any)?.accessToken;
		if (!uid) return;

		fetch(getEnvUrl(`https://api.xernerx.com/core/users/${uid}/discord/guilds`), {
			headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
			credentials: 'include',
		})
			.then((res) => (res.ok ? res.json() : []))
			.then((data: any[]) => {
				if (!Array.isArray(data)) return;
				const managed = data.filter((g) => {
					try {
						const perms = BigInt(g.permissions || 0);
						return (perms & BigInt(0x8)) === BigInt(0x8) || (perms & BigInt(0x20)) === BigInt(0x20);
					} catch {
						return false;
					}
				});
				setManagedGuilds(managed);
				if (initialGuildId && managed.some((g) => g.id === initialGuildId)) {
					setSelectedGuildId(initialGuildId);
				} else if (!selectedGuildId && managed.length > 0) {
					setSelectedGuildId(managed[0].id);
				}
			})
			.catch(() => {});
	}, [(session as any)?.user?.id, (session as any)?.accessToken, user?.id, getEnvUrl, initialGuildId, selectedGuildId]);

	const persistOnboardingCompletion = useCallback(async () => {
		const identifiers = [resolvedBotId, botSlugLower, String(id)].filter(Boolean);
		addLocalOnboardedBot(identifiers);
		setLocalOnboarded(readLocalOnboardedBots());

		const uid = user?.id || (session as any)?.user?.id;
		if (!uid) return;
		setSavingStep(true);
		try {
			const existingOnboarding = (user as any)?.onboarding || {};
			const prevBots = Array.isArray(existingOnboarding.onboardedBots) ? existingOnboarding.onboardedBots : [];
			await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${uid}`), {
				method: 'PATCH',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					onboarding: {
						...existingOnboarding,
						...(hasDashboard ? { dashboardTourCompleted: true } : {}),
						onboardedBots: Array.from(new Set([...prevBots, resolvedBotId, botSlugLower])),
					},
				}),
			});
			await mutate();
		} catch {
			// non-blocking
		} finally {
			setSavingStep(false);
		}
	}, [resolvedBotId, botSlugLower, id, user, session, getEnvUrl, hasDashboard, mutate]);

	const handleSignInRedirect = () => {
		if (typeof window === 'undefined') return;
		try {
			localStorage.setItem('xernerx_post_first_signin_return_url', window.location.href);
		} catch {}
		const loginBase = getEnvUrl('https://account.xernerx.com/login');
		window.location.href = `${loginBase}?redirect=${encodeURIComponent(window.location.href)}`;
	};

	const handleLaunchDestination = async (target: 'dashboard' | 'botProfile', withDashboardTour = false) => {
		if (target === 'dashboard' && !isAuthenticated) {
			handleSignInRedirect();
			return;
		}
		await persistOnboardingCompletion();
		if (target === 'dashboard') {
			const targetGuild = selectedGuildId || initialGuildId || '';
			if (isVirtue || bot?.hasSuiteDashboard || !bot?.links?.dashboard) {
				const query = new URLSearchParams();
				if (targetGuild) query.set('guild', targetGuild);
				if (isVirtue) query.set('tab', 'virtue');
				if (withDashboardTour) query.set('xrx_bot_tour', botDisplayName);
				router.push(`/dashboard?${query.toString()}`);
				return;
			}
			if (bot?.links?.dashboard) {
				if (bot.links.dashboard.startsWith('http')) {
					window.location.href = bot.links.dashboard;
				} else {
					const sep = bot.links.dashboard.includes('?') ? '&' : '?';
					router.push(`${bot.links.dashboard}${withDashboardTour ? `${sep}xrx_bot_tour=${encodeURIComponent(botDisplayName)}` : ''}`);
				}
				return;
			}
		}
		router.push(`/bots/${id}?skipOnboarding=1`);
	};

	const matchedInvitedGuild = managedGuilds.find((g) => g.id === (selectedGuildId || initialGuildId)) || null;

	return (
		<div className="min-h-[calc(100dvh-60px)] flex flex-col items-center justify-center py-6 px-4 max-w-(--page-width) mx-auto w-full" style={{ gap: 'var(--ui-gap)' }}>
			{/* Circular Orbital Effect — Bumps up higher once complete */}
			<BotOnboardingIntroScene
				botDisplayName={botDisplayName}
				avatarUrl={avatarUrl}
				verified={Boolean(bot?.verified)}
				guildName={matchedInvitedGuild?.name || null}
				compact={!isIntroPlaying}
				onComplete={() => setIsIntroPlaying(false)}
			/>

			{/* 2 Destination Cards + Join Support Server Bar — Slide in underneath the bumped-up circle */}
			<AnimatePresence>
				{!isIntroPlaying && (
					<motion.div
						key="bot-onboarding-cards-and-support"
						initial={{ opacity: 0, y: 28 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 16 }}
						transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
						className="w-full max-w-2xl flex flex-col"
						style={{ gap: 'var(--ui-gap)' }}
					>
						{/* 2 Cards Side-by-Side */}
						<div className="grid grid-cols-1 sm:grid-cols-2 w-full" style={{ gap: 'var(--ui-gap)' }}>
							{/* Card 1: Bot Profile */}
							<motion.div
								initial={{ opacity: 0, y: 24, scale: 0.96 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								transition={{ duration: 0.4, delay: 0.04, type: 'spring', stiffness: 200, damping: 20 }}
								className="flex flex-col justify-between rounded-3xl bg-(--foreground)/35 hover:bg-(--foreground)/50 backdrop-blur-xl border border-(--border)/15 hover:border-(--accent)/45 transition-all p-5 sm:p-6 text-left shadow-sm"
								style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}
							>
								<div className="flex flex-col gap-3">
									<div className="flex items-center justify-between gap-2">
										<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
											<Terminal size={20} />
										</div>
										<Badge variant="muted">{t('app.bots.tabs.profile')}</Badge>
									</div>
									<div>
										<h3 className="text-lg font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
											{t('app.bots.onboarding.repeat.profileCardTitle', { name: botDisplayName })}
										</h3>
										<p className="text-xs text-(--text-muted) mt-1 leading-relaxed">{t('app.bots.onboarding.repeat.profileCardDesc')}</p>
									</div>
								</div>

								<Button variant="secondary" onClick={() => handleLaunchDestination('botProfile', false)} isLoading={savingStep} className="w-full justify-center gap-2 mt-2">
									<span>{t('app.bots.onboarding.repeat.profileCardBtn')}</span>
									<ArrowRight size={15} />
								</Button>
							</motion.div>

							{/* Card 2: Server Dashboard (or Slash Commands Quick Start if no dashboard) */}
							{hasDashboard ? (
								<motion.div
									initial={{ opacity: 0, y: 24, scale: 0.96 }}
									animate={{ opacity: 1, y: 0, scale: 1 }}
									transition={{ duration: 0.4, delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
									className="flex flex-col justify-between rounded-3xl bg-(--foreground)/35 hover:bg-(--foreground)/50 backdrop-blur-xl border border-(--accent)/35 hover:border-(--accent)/60 transition-all p-5 sm:p-6 text-left shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_15%,transparent)]"
									style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}
								>
									<div className="flex flex-col gap-3">
										<div className="flex items-center justify-between gap-2">
											<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
												<LayoutDashboard size={20} />
											</div>
											<Badge variant="accent">{t('app.bots.onboarding.repeat.dashboardCardTitle')}</Badge>
										</div>
										<div>
											<h3 className="text-lg font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
												{t('app.bots.onboarding.repeat.dashboardCardTitle')}
											</h3>
											<p className="text-xs text-(--text-muted) mt-1 leading-relaxed">{t('app.bots.onboarding.repeat.dashboardCardDesc', { name: botDisplayName })}</p>
										</div>

										{isAuthenticated && managedGuilds.length > 0 && (
											<div className="pt-1">
												<Selector
													value={selectedGuildId}
													onChange={(val) => setSelectedGuildId(String(val))}
													options={managedGuilds.map((g) => ({ label: g.name, value: g.id }))}
												/>
											</div>
										)}
									</div>

									{!isAuthenticated ? (
										<Button variant="primary" onClick={handleSignInRedirect} className="w-full justify-center gap-2 mt-2">
											<LogIn size={15} />
											<span>{t('app.bots.onboarding.signin.signInButton')}</span>
											<ArrowRight size={15} />
										</Button>
									) : (
										<Button
											variant="primary"
											onClick={() => handleLaunchDestination('dashboard', !isRepeatInvite)}
											isLoading={savingStep}
											className="w-full justify-center gap-2 mt-2"
										>
											<LayoutDashboard size={15} />
											<span>{t('app.bots.onboarding.repeat.dashboardCardBtn')}</span>
											<ArrowRight size={15} />
										</Button>
									)}
								</motion.div>
							) : (
								<motion.div
									initial={{ opacity: 0, y: 24, scale: 0.96 }}
									animate={{ opacity: 1, y: 0, scale: 1 }}
									transition={{ duration: 0.4, delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
									className="flex flex-col justify-between rounded-3xl bg-(--foreground)/35 backdrop-blur-xl border border-(--border)/15 p-5 sm:p-6 text-left shadow-sm"
									style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}
								>
									<div className="flex flex-col gap-3">
										<div className="flex items-center justify-between gap-2">
											<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
												<Terminal size={20} />
											</div>
										</div>
										<div>
											<h3 className="text-lg font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
												{t('app.bots.onboarding.thankYou.commandsPreviewTitle')}
											</h3>
											<p className="text-xs text-(--text-muted) mt-1 leading-relaxed">{t('app.bots.onboarding.thankYou.commandsPreviewDesc', { name: botDisplayName })}</p>
										</div>
										{sampleSlashCommands.length > 0 && (
											<div className="flex flex-wrap gap-1.5 pt-1">
												{sampleSlashCommands.map((cmd) => (
													<span
														key={cmd.name}
														title={cmd.description}
														className="rounded-xl bg-(--background)/65 border border-(--accent)/25 px-2.5 py-1 font-mono text-xs font-bold text-(--accent)"
													>
														/{cmd.name}
													</span>
												))}
											</div>
										)}
									</div>
								</motion.div>
							)}
						</div>

						{/* Join Support Server Bar */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.4, delay: 0.16, type: 'spring', stiffness: 200, damping: 22 }}
							className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-3xl bg-(--foreground)/35 backdrop-blur-xl border border-(--border)/15 px-5 py-3.5 text-center sm:text-left shadow-sm"
						>
							<div className="flex flex-col sm:flex-row items-center gap-3">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
									<LifeBuoy size={18} />
								</div>
								<div>
									<div className="text-sm font-extrabold text-(--text)">{t('components.firstSignIn.support.joinCardTitle')}</div>
									<p className="text-xs text-(--text-muted) leading-snug">{t('components.firstSignIn.support.joinCardDesc')}</p>
								</div>
							</div>

							<div className="shrink-0">
								{supportCtx?.isMember ? (
									<span className="inline-flex items-center gap-1.5 rounded-full bg-(--accent-green)/15 border border-(--accent-green)/30 px-3.5 py-1.5 text-xs font-bold text-(--accent-green)">
										<CheckCircle2 size={14} />
										<span>{t('components.firstSignIn.support.alreadyJoined')}</span>
									</span>
								) : isAuthenticated ? (
									<Button
										variant="secondary"
										onClick={() => supportCtx?.joinServer()}
										isLoading={Boolean(supportCtx?.isJoining)}
										className="gap-1.5 text-xs border border-(--accent)/35 text-(--accent)"
									>
										<UserPlus size={14} />
										<span>{t('components.firstSignIn.support.oneClickJoinBtn')}</span>
									</Button>
								) : (
									<Button variant="secondary" onClick={handleSignInRedirect} className="gap-1.5 text-xs">
										<LogIn size={14} />
										<span>{t('app.bots.onboarding.support.signInToJoin')}</span>
									</Button>
								)}
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
