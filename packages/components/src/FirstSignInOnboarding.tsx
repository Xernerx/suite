/** @format */
'use client';

import { Confirm } from '@xernerx/ui';
import { DEFAULT_HEADER_SUBDOMAINS, useDictionary, useEnvironment, useSidebar, useTheme, useUser, type HeaderSubdomainId } from '@xernerx/providers';
import confetti from 'canvas-confetti';
import { AnimatePresence } from 'framer-motion';
import { Bot, Building2, Compass, LayoutDashboard, Terminal } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import React, { useEffect, useRef, useState } from 'react';
import { FirstSignInIntroScene } from './FirstSignInIntroScene';
import { FirstSignInHeaderScene, FirstSignInSetupScene, type HeaderBuildStepId, type PrivacyTier } from './FirstSignInSetupAndHeader';
import { FirstSignInSidebarScene, type SidebarBuildStepId } from './FirstSignInSidebarScene';
import { DASHBOARD_TOUR_STEPS, EXPLORE_TOUR_STEPS, FirstSignInPageTourScene, PORTAL_TOUR_STEPS, type PageTourStepId } from './FirstSignInPageTours';
import { FirstSignInReadyScene, FirstSignInStageDock, FirstSignInTourChoiceScene, FirstSignInWelcomeScene, FirstSignInWhoWeAreScene } from './FirstSignInWelcomeAndPersonaScenes';

export type OnboardingStagePhase = 'welcome' | 'who-we-are' | 'setup' | 'tour-choice' | 'header' | 'sidebar' | 'dashboard' | 'portal' | 'explore' | 'ready';
export type OnboardingPersona = 'user' | 'developer' | 'both';

export interface OnboardingStageState {
	active: boolean;
	phase: OnboardingStagePhase;
	headerStepId?: HeaderBuildStepId;
	revealedHeaderItems?: string[];
	sidebarStepId?: SidebarBuildStepId;
	revealedSidebarItems?: string[];
	pageTourTarget?: PageTourStepId;
}

const VALID_TOUR_PHASES: OnboardingStagePhase[] = ['welcome', 'who-we-are', 'setup', 'tour-choice', 'header', 'sidebar', 'dashboard', 'portal', 'explore', 'ready'];

export function FirstSignInOnboarding() {
	const { t, currentLocale } = useDictionary();
	const { user, mutate, loading } = useUser();
	const { getEnvUrl } = useEnvironment();
	const { preferences, setPreference } = useTheme();
	const { state: sidebarState, toggle, hide, show, setMobileOpen, navItems, setNavItems, clearNavItems } = useSidebar();
	const router = useRouter();
	const pathname = usePathname();

	const [isOpen, setIsOpen] = useState(false);
	const [isIntroPlaying, setIsIntroPlaying] = useState(true);
	const [isManualReplay, setIsManualReplay] = useState(false);
	const [currentPhase, setCurrentPhase] = useState<OnboardingStagePhase>('welcome');
	const [headerStepIndex, setHeaderStepIndex] = useState(0);
	const [sidebarStepIndex, setSidebarStepIndex] = useState(0);
	const [pageTourStepIndex, setPageTourStepIndex] = useState(0);
	const [isBotUser, setIsBotUser] = useState(true);
	const [isDeveloper, setIsDeveloper] = useState(false);
	const [privacy, setPrivacy] = useState<PrivacyTier>('public');
	const [selectedLocale, setSelectedLocale] = useState<string>('en-GB');
	const [termsChecked, setTermsChecked] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [postponing, setPostponing] = useState(false);
	const [confirmSkipOpen, setConfirmSkipOpen] = useState(false);
	const [isMobileViewport, setIsMobileViewport] = useState(false);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const updateMobile = () => setIsMobileViewport(window.innerWidth < 768);
		updateMobile();
		window.addEventListener('resize', updateMobile);
		return () => window.removeEventListener('resize', updateMobile);
	}, []);

	const persona: OnboardingPersona = isBotUser && isDeveloper ? 'both' : isDeveloper ? 'developer' : 'user';
	const hasAnyPersonaSelected = isBotUser || isDeveloper;

	const phaseSequence: OnboardingStagePhase[] = [
		'welcome',
		'who-we-are',
		'setup',
		'tour-choice',
		'header',
		'sidebar',
		...(isBotUser ? (['dashboard'] as OnboardingStagePhase[]) : []),
		...(isDeveloper ? (['portal'] as OnboardingStagePhase[]) : []),
		'explore',
		'ready',
	];

	const stepIndexInSequence = Math.max(0, phaseSequence.indexOf(currentPhase));
	const step = stepIndexInSequence + 1;
	const totalSteps = phaseSequence.length;

	const headerSteps: HeaderBuildStepId[] = [
		'logo',
		...(isMobileViewport ? (['mobile-tray'] as HeaderBuildStepId[]) : []),
		'search',
		...(isBotUser ? (['dashboard'] as HeaderBuildStepId[]) : []),
		...(isDeveloper ? (['portal'] as HeaderBuildStepId[]) : []),
		'store',
		'drawer',
		'alerts',
		'profile',
	];
	const clampedHeaderIndex = Math.min(headerStepIndex, Math.max(0, headerSteps.length - 1));
	const activeHeaderStepId: HeaderBuildStepId = headerSteps[clampedHeaderIndex] || 'logo';
	const revealedHeaderItems: string[] = headerSteps.slice(0, clampedHeaderIndex + 1);

	const sidebarSteps: SidebarBuildStepId[] = isMobileViewport ? ['toggle', 'views', 'moved-dock'] : ['toggle', 'views', 'moved-dock', 'collapse'];
	const clampedSidebarIndex = Math.min(sidebarStepIndex, Math.max(0, sidebarSteps.length - 1));
	const activeSidebarStepId: SidebarBuildStepId = sidebarSteps[clampedSidebarIndex] || 'toggle';
	const revealedSidebarItems: string[] = sidebarSteps.slice(0, clampedSidebarIndex + 1);

	const activePageTourSteps: PageTourStepId[] =
		currentPhase === 'dashboard' ? DASHBOARD_TOUR_STEPS : currentPhase === 'portal' ? PORTAL_TOUR_STEPS : currentPhase === 'explore' ? EXPLORE_TOUR_STEPS : [];
	const clampedPageTourIndex = Math.min(pageTourStepIndex, Math.max(0, activePageTourSteps.length - 1));
	const activePageTourTarget: PageTourStepId | undefined = activePageTourSteps[clampedPageTourIndex];

	useEffect(() => {
		if (!user) return;
		if (user.privacy === 'public' || user.privacy === 'limited' || user.privacy === 'private') {
			setPrivacy(user.privacy);
		}
		const derived = user.preferences?.locale || currentLocale || 'en-GB';
		setSelectedLocale(derived);
	}, [user?.privacy, user?.preferences?.locale, currentLocale]);

	const syncPersonaHeaderShortcuts = (nextBotUser: boolean, nextDeveloper: boolean) => {
		const currentSubs: HeaderSubdomainId[] = Array.isArray(preferences.headerSubdomains) ? preferences.headerSubdomains : [...DEFAULT_HEADER_SUBDOMAINS];
		const filtered = currentSubs.filter((id) => id !== 'dashboard' && id !== 'portal' && id !== 'store');
		const nextSubs: HeaderSubdomainId[] = [...(nextBotUser ? (['dashboard'] as HeaderSubdomainId[]) : []), ...(nextDeveloper ? (['portal'] as HeaderSubdomainId[]) : []), 'store', ...filtered];
		setPreference('headerSubdomains', nextSubs);
		setPreference('developerMode', nextDeveloper);
	};

	const handleToggleBotUser = (nextVal: boolean) => {
		setIsBotUser(nextVal);
		syncPersonaHeaderShortcuts(nextVal, isDeveloper);
	};

	const handleToggleDeveloper = (nextVal: boolean) => {
		setIsDeveloper(nextVal);
		syncPersonaHeaderShortcuts(isBotUser, nextVal);
	};

	const initialSidebarHiddenRef = useRef<boolean | null>(null);
	const injectedDemoNavRef = useRef(false);

	const isInitialTermsNull = Boolean(user && (!user.agreedTerms || !user.agreedPrivacy));

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const detail: OnboardingStageState = {
			active: Boolean(isOpen && user),
			phase: currentPhase,
			headerStepId: activeHeaderStepId,
			revealedHeaderItems,
			sidebarStepId: activeSidebarStepId,
			revealedSidebarItems,
			pageTourTarget: activePageTourTarget,
		};
		(window as any).__xernerxOnboardingStage = detail;
		window.dispatchEvent(new CustomEvent<OnboardingStageState>('xernerx:onboarding-stage', { detail }));
	}, [isOpen, user, currentPhase, activeHeaderStepId, revealedHeaderItems.join(','), activeSidebarStepId, revealedSidebarItems.join(','), activePageTourTarget]);

	useEffect(() => {
		return () => {
			if (typeof window === 'undefined') return;
			const resetDetail: OnboardingStageState = { active: false, phase: 'welcome' };
			(window as any).__xernerxOnboardingStage = resetDetail;
			window.dispatchEvent(new CustomEvent<OnboardingStageState>('xernerx:onboarding-stage', { detail: resetDetail }));
		};
	}, []);

	// Orchestrate real Sidebar visibility across all onboarding phases
	useEffect(() => {
		if (!isOpen || !user) return;
		if (initialSidebarHiddenRef.current === null) {
			initialSidebarHiddenRef.current = sidebarState === 'hidden';
		}

		const shouldHideSidebar =
			currentPhase === 'welcome' ||
			currentPhase === 'who-we-are' ||
			currentPhase === 'setup' ||
			currentPhase === 'tour-choice' ||
			currentPhase === 'header' ||
			currentPhase === 'explore' ||
			currentPhase === 'ready';

		if (shouldHideSidebar) {
			if (injectedDemoNavRef.current) {
				clearNavItems();
				injectedDemoNavRef.current = false;
			}
			setMobileOpen(false);
			if (sidebarState !== 'hidden') {
				hide();
			}
		} else if (currentPhase === 'sidebar') {
			if (navItems.length === 0) {
				injectedDemoNavRef.current = true;
				setNavItems(
					persona === 'both'
						? [
								{ label: t('components.firstSignIn.demoNav.explore'), icon: Compass, view: 'explore' },
								{ label: t('components.firstSignIn.demoNav.myServers'), icon: LayoutDashboard, view: 'servers' },
								{ label: t('components.firstSignIn.demoNav.portalOverview'), icon: Terminal, view: 'overview' },
								{ label: t('components.firstSignIn.demoNav.organizations'), icon: Building2, view: 'orgs' },
								{ label: t('components.firstSignIn.demoNav.myBots'), icon: Bot, view: 'bots' },
							]
						: persona === 'developer'
							? [
									{ label: t('components.firstSignIn.demoNav.explore'), icon: Compass, view: 'explore' },
									{ label: t('components.firstSignIn.demoNav.portalOverview'), icon: Terminal, view: 'overview' },
									{ label: t('components.firstSignIn.demoNav.organizations'), icon: Building2, view: 'orgs' },
									{ label: t('components.firstSignIn.demoNav.myBots'), icon: Bot, view: 'bots' },
								]
							: [
									{ label: t('components.firstSignIn.demoNav.explore'), icon: Compass, view: 'explore' },
									{ label: t('components.firstSignIn.demoNav.portalOverview'), icon: Terminal, view: 'portal' },
									{ label: t('components.firstSignIn.demoNav.myServers'), icon: LayoutDashboard, view: 'servers' },
								]
				);
			}
			if (isMobileViewport) {
				if (sidebarState === 'hidden') {
					show();
				}
				setMobileOpen(activeSidebarStepId === 'views' || activeSidebarStepId === 'moved-dock');
			} else {
				setMobileOpen(false);
				if (activeSidebarStepId === 'collapse') {
					if (sidebarState !== 'closed') {
						toggle();
					}
				} else if (sidebarState !== 'open') {
					toggle();
				}
			}
		} else if (currentPhase === 'dashboard' || currentPhase === 'portal') {
			if (injectedDemoNavRef.current) {
				clearNavItems();
				injectedDemoNavRef.current = false;
			}
			setMobileOpen(false);
			if (sidebarState !== 'open') {
				toggle();
			}
		}
	}, [isOpen, user, currentPhase, activeSidebarStepId, isMobileViewport, persona, hide, show, toggle, setMobileOpen, clearNavItems, navItems.length, setNavItems, sidebarState, t]);

	const restoreOriginalSidebar = (forceHide = false) => {
		const hadInjectedDemoNav = injectedDemoNavRef.current;
		if (injectedDemoNavRef.current) {
			clearNavItems();
			injectedDemoNavRef.current = false;
		}
		setMobileOpen(false);
		const exploreTarget = typeof window !== 'undefined' ? new URL(getEnvUrl('https://app.xernerx.com/'), window.location.origin) : null;
		const onExplore = exploreTarget ? isOnTargetRoute(exploreTarget) : false;

		if (forceHide || onExplore || initialSidebarHiddenRef.current === true || hadInjectedDemoNav || navItems.length === 0) {
			hide();
		} else if (initialSidebarHiddenRef.current === false) {
			show();
		}
		initialSidebarHiddenRef.current = null;
	};

	useEffect(() => {
		if (isOpen && currentPhase === 'ready') {
			try {
				confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
			} catch {}
		}
	}, [isOpen, currentPhase]);

	useEffect(() => {
		const handleManualOpen = (e: Event) => {
			const detail = (e as CustomEvent<{ resume?: boolean; startPhase?: OnboardingStagePhase }>)?.detail;
			const savedPersona = (user as any)?.onboarding?.persona as OnboardingPersona | undefined;
			if (savedPersona === 'both') {
				setIsBotUser(true);
				setIsDeveloper(true);
			} else if (savedPersona === 'developer') {
				setIsBotUser(false);
				setIsDeveloper(true);
			} else if (savedPersona === 'user') {
				setIsBotUser(true);
				setIsDeveloper(false);
			}

			let localSavedPhase: OnboardingStagePhase | null = null;
			try {
				const rawLocal = localStorage.getItem('xernerx_tour_postponed') as OnboardingStagePhase | null;
				if (rawLocal && VALID_TOUR_PHASES.includes(rawLocal)) {
					localSavedPhase = rawLocal;
				}
			} catch {}

			const savedPostponedPhase = ((user as any)?.onboarding?.tourPostponedPhase as OnboardingStagePhase | undefined) || localSavedPhase || undefined;
			const shouldResumeFromTour = Boolean(detail?.resume || detail?.startPhase || (user as any)?.onboarding?.tourPostponed || localSavedPhase);
			const targetPhase: OnboardingStagePhase =
				detail?.startPhase && VALID_TOUR_PHASES.includes(detail.startPhase)
					? detail.startPhase
					: shouldResumeFromTour
						? savedPostponedPhase &&
							VALID_TOUR_PHASES.includes(savedPostponedPhase) &&
							savedPostponedPhase !== 'welcome' &&
							savedPostponedPhase !== 'who-we-are' &&
							savedPostponedPhase !== 'setup' &&
							savedPostponedPhase !== 'tour-choice'
							? savedPostponedPhase
							: 'header'
						: 'welcome';

			setHeaderStepIndex(0);
			setSidebarStepIndex(0);
			setPageTourStepIndex(0);
			setTermsChecked(Boolean(user?.agreedTerms && user?.agreedPrivacy));
			setIsIntroPlaying(targetPhase === 'welcome');
			setIsManualReplay(true);
			setIsOpen(true);
			void navigateToPhase(targetPhase, 'first');
		};
		window.addEventListener('xernerx:open-suite-tutorial', handleManualOpen);
		return () => window.removeEventListener('xernerx:open-suite-tutorial', handleManualOpen);
	}, [user]);

	// Resume cross-app tour from URL query params (?xrx_tour=...) or open on first sign-in
	useEffect(() => {
		if (typeof window === 'undefined') return;

		const path = window.location.pathname || '';
		const search = new URLSearchParams(window.location.search);
		const tourParam = search.get('xrx_tour') as OnboardingStagePhase | null;
		const personaParam = search.get('xrx_persona') as OnboardingPersona | null;
		const replayParam = search.get('xrx_replay') === '1';
		const subParam = search.get('xrx_sub');

		if (tourParam && VALID_TOUR_PHASES.includes(tourParam)) {
			if (personaParam === 'both') {
				setIsBotUser(true);
				setIsDeveloper(true);
			} else if (personaParam === 'developer') {
				setIsBotUser(false);
				setIsDeveloper(true);
			} else if (personaParam === 'user') {
				setIsBotUser(true);
				setIsDeveloper(false);
			}
			setTermsChecked(true);
			setIsIntroPlaying(false);
			setIsManualReplay(replayParam);
			setCurrentPhase(tourParam);
			if (tourParam === 'sidebar') {
				setSidebarStepIndex(subParam === 'last' ? sidebarSteps.length - 1 : 0);
			} else if (tourParam === 'dashboard' || tourParam === 'portal' || tourParam === 'explore') {
				setPageTourStepIndex(subParam === 'last' ? 3 : 0);
			}
			if (!loading && user && !(user as any).blacklisted) {
				setIsOpen(true);
			}
			return;
		}

		if (isManualReplay) return;

		const isExcludedRoute =
			/^\/(?:terms|privacy|cookies|security|login|logout|overlay)(?:\/|$)/i.test(path) ||
			search.has('xrx_bot_tour') ||
			(/^\/bots\/[^/]+$/i.test(path) && (search.has('guild_id') || search.has('code') || search.get('onboarding') === '1'));

		if (isExcludedRoute) {
			setIsOpen(false);
			return;
		}

		if (!loading && user && !(user as any).blacklisted) {
			if (!user.agreedTerms || !user.agreedPrivacy) {
				try {
					localStorage.removeItem('xernerx_tour_postponed');
					window.dispatchEvent(new CustomEvent('xernerx:tour-postponed-change', { detail: { postponed: false, phase: null } }));
				} catch {}
				if (/^\/bots\/[^/]+\/onboarding(?:\/|$)/i.test(path)) {
					try {
						localStorage.setItem('xernerx_post_first_signin_return_url', window.location.href);
					} catch {}
				}
				setIsOpen((prevOpen) => {
					if (!prevOpen) {
						setTermsChecked(false);
						setIsIntroPlaying(true);
						setCurrentPhase('welcome');
					}
					return true;
				});
			}
		} else if (!loading && !user) {
			setIsOpen(false);
		}
	}, [user, loading, isManualReplay, sidebarSteps.length, pathname]);

	const persistOnboardingState = async (mode: 'completed' | 'postponed' | 'progress' = 'completed') => {
		if (!user?.id) return true;
		if (mode === 'completed') setSubmitting(true);
		if (mode === 'postponed') setPostponing(true);
		try {
			const now = new Date().toISOString();
			const existingOnboarding = (user as any)?.onboarding || {};
			const postponedPhase = currentPhase === 'welcome' || currentPhase === 'who-we-are' || currentPhase === 'setup' || currentPhase === 'tour-choice' ? 'header' : currentPhase;

			if (typeof window !== 'undefined') {
				try {
					if (mode === 'postponed') {
						localStorage.setItem('xernerx_tour_postponed', postponedPhase);
						window.dispatchEvent(new CustomEvent('xernerx:tour-postponed-change', { detail: { postponed: true, phase: postponedPhase } }));
					} else if (mode === 'completed') {
						localStorage.removeItem('xernerx_tour_postponed');
						window.dispatchEvent(new CustomEvent('xernerx:tour-postponed-change', { detail: { postponed: false, phase: null } }));
					}
				} catch {}
			}

			const payload: Record<string, any> = {
				...(isInitialTermsNull || !user.agreedTerms || !user.agreedPrivacy
					? {
							agreedTerms: now,
							agreedPrivacy: now,
							verified: true,
						}
					: {}),
				privacy,
				preferences: {
					...(user.preferences || {}),
					locale: selectedLocale,
				},
				onboarding: {
					...existingOnboarding,
					persona,
					...(mode === 'completed'
						? {
								suiteIntroCompleted: true,
								dashboardTourCompleted: true,
								supportPromptCompleted: true,
								tourPostponed: false,
								tourPostponedPhase: null,
								completedAt: now,
							}
						: mode === 'postponed'
							? {
									suiteIntroCompleted: true,
									tourPostponed: true,
									tourPostponedPhase: postponedPhase,
									completedAt: null,
								}
							: {}),
				},
			};

			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${user.id}`), {
				method: 'PATCH',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});

			if (res.ok) {
				if (mode === 'completed' || mode === 'postponed') await mutate();
				return true;
			}
			return false;
		} catch (error) {
			console.error('Failed to persist first sign-in onboarding:', error);
			return false;
		} finally {
			if (mode === 'completed') setSubmitting(false);
			if (mode === 'postponed') setPostponing(false);
		}
	};

	const getTargetUrlForPhase = (targetPhase: OnboardingStagePhase): URL | null => {
		if (typeof window === 'undefined') return null;
		if (targetPhase === 'dashboard') {
			return new URL(getEnvUrl('https://app.xernerx.com/dashboard'), window.location.origin);
		}
		if (targetPhase === 'portal') {
			return new URL(getEnvUrl('https://portal.xernerx.com/'), window.location.origin);
		}
		if (targetPhase === 'explore' || targetPhase === 'ready') {
			return new URL(getEnvUrl('https://app.xernerx.com/'), window.location.origin);
		}
		return null;
	};

	const isOnTargetRoute = (targetUrl: URL): boolean => {
		if (typeof window === 'undefined') return false;
		if (window.location.origin !== targetUrl.origin) return false;
		const currPath = window.location.pathname.replace(/\/+$/, '') || '/';
		const destPath = targetUrl.pathname.replace(/\/+$/, '') || '/';
		return currPath === destPath;
	};

	const navigateToPhase = async (nextPhase: OnboardingStagePhase, subMode: 'first' | 'last' = 'first') => {
		if (nextPhase === 'header') setHeaderStepIndex(subMode === 'last' ? Math.max(0, headerSteps.length - 1) : 0);
		if (nextPhase === 'sidebar') setSidebarStepIndex(subMode === 'last' ? Math.max(0, sidebarSteps.length - 1) : 0);
		if (nextPhase === 'dashboard' || nextPhase === 'portal' || nextPhase === 'explore') {
			setPageTourStepIndex(subMode === 'last' ? 3 : 0);
		}

		const targetUrl = getTargetUrlForPhase(nextPhase);
		if (targetUrl && !isOnTargetRoute(targetUrl)) {
			await persistOnboardingState('progress');
			targetUrl.searchParams.set('xrx_tour', nextPhase);
			targetUrl.searchParams.set('xrx_persona', persona);
			if (isManualReplay) targetUrl.searchParams.set('xrx_replay', '1');
			if (subMode === 'last') targetUrl.searchParams.set('xrx_sub', 'last');

			if (window.location.origin === targetUrl.origin) {
				setCurrentPhase(nextPhase);
				router.push(`${targetUrl.pathname}${targetUrl.search}`);
			} else {
				window.location.href = targetUrl.toString();
			}
			return;
		}

		setCurrentPhase(nextPhase);
		if (typeof window !== 'undefined' && targetUrl) {
			const cleanUrl = new URL(window.location.href);
			cleanUrl.searchParams.set('xrx_tour', nextPhase);
			cleanUrl.searchParams.set('xrx_persona', persona);
			if (isManualReplay) cleanUrl.searchParams.set('xrx_replay', '1');
			else cleanUrl.searchParams.delete('xrx_replay');
			cleanUrl.searchParams.delete('xrx_sub');
			window.history.replaceState(null, '', `${cleanUrl.pathname}${cleanUrl.search}`);
		}
	};

	const handleNextStep = async () => {
		if (currentPhase === 'welcome') {
			if (!termsChecked && isInitialTermsNull) return;
			syncPersonaHeaderShortcuts(isBotUser, isDeveloper);
			await navigateToPhase('who-we-are');
			return;
		}
		if (currentPhase === 'who-we-are') {
			if (!hasAnyPersonaSelected) return;
			syncPersonaHeaderShortcuts(isBotUser, isDeveloper);
			await navigateToPhase('setup');
			return;
		}
		if (currentPhase === 'header' && clampedHeaderIndex < headerSteps.length - 1) {
			setHeaderStepIndex((prev) => prev + 1);
			return;
		}
		if (currentPhase === 'sidebar' && clampedSidebarIndex < sidebarSteps.length - 1) {
			setSidebarStepIndex((prev) => prev + 1);
			return;
		}
		if ((currentPhase === 'dashboard' || currentPhase === 'portal' || currentPhase === 'explore') && clampedPageTourIndex < activePageTourSteps.length - 1) {
			setPageTourStepIndex((prev) => prev + 1);
			return;
		}

		const nextPhase = phaseSequence[stepIndexInSequence + 1];
		if (nextPhase) {
			await navigateToPhase(nextPhase, 'first');
			return;
		}
		await handleFinish();
	};

	const handleBackStep = async () => {
		if (currentPhase === 'header' && clampedHeaderIndex > 0) {
			setHeaderStepIndex((prev) => prev - 1);
			return;
		}
		if (currentPhase === 'sidebar' && clampedSidebarIndex > 0) {
			setSidebarStepIndex((prev) => prev - 1);
			return;
		}
		if ((currentPhase === 'dashboard' || currentPhase === 'portal' || currentPhase === 'explore') && clampedPageTourIndex > 0) {
			setPageTourStepIndex((prev) => prev - 1);
			return;
		}

		const prevPhase = phaseSequence[stepIndexInSequence - 1];
		if (prevPhase) {
			await navigateToPhase(prevPhase, 'last');
		}
	};

	const handlePostponeTour = async () => {
		syncPersonaHeaderShortcuts(isBotUser, isDeveloper);
		await persistOnboardingState('postponed');
		restoreOriginalSidebar(true);
		setIsManualReplay(false);
		setIsOpen(false);

		if (typeof window !== 'undefined') {
			try {
				const returnUrl = localStorage.getItem('xernerx_post_first_signin_return_url');
				if (returnUrl) {
					localStorage.removeItem('xernerx_post_first_signin_return_url');
					window.location.href = returnUrl;
					return;
				}
			} catch {}

			const cleanUrl = new URL(window.location.href);
			cleanUrl.searchParams.delete('xrx_tour');
			cleanUrl.searchParams.delete('xrx_persona');
			cleanUrl.searchParams.delete('xrx_replay');
			cleanUrl.searchParams.delete('xrx_sub');
			window.history.replaceState(null, '', `${cleanUrl.pathname}${cleanUrl.search}`);
		}
	};

	const handleFinish = async () => {
		await persistOnboardingState('completed');
		restoreOriginalSidebar(true);
		setIsManualReplay(false);
		setIsOpen(false);

		if (typeof window !== 'undefined') {
			try {
				const returnUrl = localStorage.getItem('xernerx_post_first_signin_return_url');
				if (returnUrl) {
					localStorage.removeItem('xernerx_post_first_signin_return_url');
					window.location.href = returnUrl;
					return;
				}
			} catch {}

			const exploreUrl = new URL(getEnvUrl('https://app.xernerx.com/'), window.location.origin);
			if (!isOnTargetRoute(exploreUrl)) {
				window.location.href = exploreUrl.toString();
				return;
			}
			const cleanUrl = new URL(window.location.href);
			cleanUrl.searchParams.delete('xrx_tour');
			cleanUrl.searchParams.delete('xrx_persona');
			cleanUrl.searchParams.delete('xrx_replay');
			cleanUrl.searchParams.delete('xrx_sub');
			window.history.replaceState(null, '', `${cleanUrl.pathname}${cleanUrl.search}`);
		}
	};

	const handleDecline = () => {
		restoreOriginalSidebar();
		const authLoginUrl = getEnvUrl('https://account.xernerx.com/login');
		signOut({ callbackUrl: authLoginUrl });
	};

	if (!isOpen || !user) return null;

	const displayName = user.global_name || user.username || user.name || 'Explorer';
	const avatarUrl = user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${String(user.avatar).startsWith('a_') ? 'gif' : 'png'}?size=128` : user.image || null;

	const phaseLabels: Record<OnboardingStagePhase, string> = {
		welcome: t('components.firstSignIn.steps.welcome'),
		'who-we-are': t('components.firstSignIn.steps.whoWeAre'),
		setup: t('components.firstSignIn.steps.setup'),
		'tour-choice': t('components.firstSignIn.steps.tourChoice'),
		header: t('components.firstSignIn.steps.navigation'),
		sidebar: t('components.firstSignIn.steps.dashboard'),
		dashboard: t('components.firstSignIn.steps.dashboardTour'),
		portal: t('components.firstSignIn.steps.portalTour'),
		explore: t('components.firstSignIn.steps.exploreTour'),
		ready: t('components.firstSignIn.steps.support'),
	};

	const isLivePageTour = currentPhase === 'dashboard' || currentPhase === 'portal' || currentPhase === 'explore';
	const isBottomAnchored = isLivePageTour || currentPhase === 'ready' || (currentPhase === 'sidebar' && isMobileViewport);

	return (
		<div
			className={`w-full h-full flex flex-col items-center justify-between overflow-hidden px-3 py-3 sm:px-8 sm:py-5 transition-all duration-500 ${
				isLivePageTour || currentPhase === 'ready' ? 'pointer-events-none bg-gradient-to-t from-(--background) via-(--background)/65 via-30% to-transparent' : 'pointer-events-auto'
			}`}
		>
			{/* Center Stage Choreography (or Bottom-Anchored Tour Card on Live Page Tours / Ready / Mobile Sidebar) */}
			<div className={`w-full flex-1 min-h-0 flex flex-col items-center ${isBottomAnchored ? 'justify-end overflow-visible pb-1' : 'overflow-y-auto'}`}>
				<div
					className={`w-full max-w-(--page-width) mx-auto ${currentPhase === 'welcome' && isIntroPlaying ? 'h-full flex flex-col' : ''} ${
						isBottomAnchored ? 'mt-auto pt-2' : currentPhase === 'welcome' && isIntroPlaying ? 'flex-1 py-1 sm:py-2' : 'my-auto py-2 sm:py-4'
					}`}
				>
					<AnimatePresence mode="wait">
						{currentPhase === 'welcome' && isIntroPlaying && (
							<FirstSignInIntroScene key="scene-intro" displayName={displayName} username={user.username} avatarUrl={avatarUrl} onComplete={() => setIsIntroPlaying(false)} />
						)}

						{currentPhase === 'welcome' && !isIntroPlaying && (
							<FirstSignInWelcomeScene
								displayName={displayName}
								avatarUrl={avatarUrl}
								termsChecked={termsChecked}
								isInitialTermsNull={isInitialTermsNull}
								onTermsCheckedChange={setTermsChecked}
							/>
						)}

						{currentPhase === 'who-we-are' && (
							<FirstSignInWhoWeAreScene
								isBotUser={isBotUser}
								isDeveloper={isDeveloper}
								persona={persona}
								onToggleBotUser={handleToggleBotUser}
								onToggleDeveloper={handleToggleDeveloper}
							/>
						)}

						{currentPhase === 'setup' && (
							<FirstSignInSetupScene
								privacy={privacy}
								onPrivacyChange={setPrivacy}
								selectedLocale={selectedLocale}
								onLocaleChange={setSelectedLocale}
								discordLocale={(user as any)?.locale}
							/>
						)}

						{currentPhase === 'tour-choice' && (
							<FirstSignInTourChoiceScene submitting={submitting} postponing={postponing} onTakeTour={handleNextStep} onOpenSkipConfirm={() => setConfirmSkipOpen(true)} />
						)}

						{currentPhase === 'header' && (
							<FirstSignInHeaderScene
								headerSteps={headerSteps}
								headerStepIndex={clampedHeaderIndex}
								setHeaderStepIndex={setHeaderStepIndex}
								avatarUrl={avatarUrl}
								displayName={displayName}
							/>
						)}

						{currentPhase === 'sidebar' && (
							<FirstSignInSidebarScene
								sidebarSteps={sidebarSteps}
								sidebarStepIndex={clampedSidebarIndex}
								setSidebarStepIndex={setSidebarStepIndex}
								persona={persona}
								avatarUrl={avatarUrl}
								displayName={displayName}
							/>
						)}

						{(currentPhase === 'dashboard' || currentPhase === 'portal' || currentPhase === 'explore') && (
							<FirstSignInPageTourScene phase={currentPhase} steps={activePageTourSteps} stepIndex={clampedPageTourIndex} setStepIndex={setPageTourStepIndex} />
						)}

						{currentPhase === 'ready' && <FirstSignInReadyScene />}
					</AnimatePresence>
				</div>
			</div>

			{!(currentPhase === 'welcome' && isIntroPlaying) && (
				<FirstSignInStageDock
					currentPhase={currentPhase}
					step={step}
					phaseSequence={phaseSequence}
					phaseLabels={phaseLabels}
					isInitialTermsNull={isInitialTermsNull}
					termsChecked={termsChecked}
					hasAnyPersonaSelected={hasAnyPersonaSelected}
					submitting={submitting}
					postponing={postponing}
					onDecline={handleDecline}
					onBackStep={handleBackStep}
					onNavigateToPhase={(phaseId) => navigateToPhase(phaseId, 'first')}
					onOpenSkipConfirm={() => setConfirmSkipOpen(true)}
					onNextStep={handleNextStep}
				/>
			)}

			<Confirm
				open={confirmSkipOpen}
				onOpenChange={setConfirmSkipOpen}
				variant="primary"
				title={t('components.firstSignIn.skipConfirm.title')}
				description={t('components.firstSignIn.skipConfirm.description')}
				confirmText={t('components.firstSignIn.skipConfirm.confirm')}
				cancelText={t('components.firstSignIn.skipConfirm.cancel')}
				loading={postponing}
				onConfirm={async () => {
					await handlePostponeTour();
					setConfirmSkipOpen(false);
				}}
			/>
		</div>
	);
}
