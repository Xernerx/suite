/** @format */
'use client';

import { Confirm, Selector } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast, useUser } from '@xernerx/providers';
import { useEffect, useState } from 'react';

import { CircleFlag } from 'react-circle-flags';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const setLocaleCookie = (code: string) => {
	const domain = process.env.NEXT_PUBLIC_DOMAIN || 'xernerx.com';
	document.cookie = `NEXT_LOCALE=${code}; domain=.${domain}; path=/; max-age=31536000; SameSite=Lax; Secure`;
};

const getFlagCode = (localeCode: string) => {
	switch (localeCode) {
		case 'en-GB':
			return 'uk';
		case 'en-US':
			return 'us';
		default:
			return localeCode;
	}
};

export default function Language() {
	const { t } = useDictionary();
	const router = useRouter();
	const { user } = useUser();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { currentLocale, currentLanguage, locales } = useDictionary();

	const [isRequesting, setIsRequesting] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [hasTranslationPermission, setHasTranslationPermission] = useState(false);
	const [isCheckingRoles, setIsCheckingRoles] = useState(false);

	const [translatorAppConfig, setTranslatorAppConfig] = useState('translator');
	const [hasPendingApplication, setHasPendingApplication] = useState(false);
	const [isCheckingApplication, setIsCheckingApplication] = useState(true);

	useEffect(() => {
		const checkApplicationStatus = async () => {
			if (!user?.id) {
				setIsCheckingApplication(false);
				return;
			}
			try {
				let appConfigId = 'translator';
				const setRes = await fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/translator_app_config'), { credentials: 'include', cache: 'no-store' });
				if (setRes.ok) {
					const data = await setRes.json();
					if (data?.value) {
						appConfigId = data.value;
						setTranslatorAppConfig(appConfigId);
					}
				}

				const dispatchRes = await fetch(getEnvUrl(`https://api.xernerx.com/secure/dispatch?senderId=${user.id}&type=${appConfigId}&status=pending`), { credentials: 'include' });
				if (dispatchRes.ok) {
					const dispatches = await dispatchRes.json();
					if (dispatches && dispatches.length > 0) {
						setHasPendingApplication(true);
					}
				}
			} catch (err) {
				console.error('Failed to check application status:', err);
			} finally {
				setIsCheckingApplication(false);
			}
		};

		checkApplicationStatus();
	}, [user?.id, getEnvUrl]);

	// Default to the user's saved preference first, then fallback to the cookie/context locale
	const activeLocale = user?.preferences?.locale || currentLocale;

	// Fetch full role objects to check permissions
	useEffect(() => {
		const checkPermissions = async () => {
			if (!user?.roles || !Array.isArray(user.roles) || user.roles.length === 0) {
				setHasTranslationPermission(false);
				return;
			}

			setIsCheckingRoles(true);
			try {
				const rolePromises = user.roles.map(async (roleItem: any) => {
					const roleId = typeof roleItem === 'string' ? roleItem : roleItem.id;
					if (!roleId) return null;

					const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/core/${roleId}`), {
						credentials: 'include',
					});

					if (res.ok) {
						return await res.json();
					}
					return null;
				});

				const fetchedRoles = await Promise.all(rolePromises);

				// Check if ANY of their roles have the translation permission set to true
				const hasPerm = fetchedRoles.some((role) => role?.permissions?.translations === true);
				setHasTranslationPermission(hasPerm);
			} catch (err) {
				console.error('Failed to verify role permissions:', err);
			} finally {
				setIsCheckingRoles(false);
			}
		};

		checkPermissions();
	}, [user?.roles, getEnvUrl]);

	const handleConfirmRequest = async () => {
		setIsRequesting(true);

		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/applications/submit`), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					configId: translatorAppConfig,
					answers: { locale: currentLocale },
				}),
			});

			if (!res.ok) {
				const errData = await res.json();
				throw new Error(errData.error || t('account.language.coverage.requestFailed'));
			}

			toast({
				title: t('account.language.coverage.requestSuccess'),
				type: 'success',
			});
			setShowConfirm(false);
			setHasPendingApplication(true);
		} catch (err: any) {
			toast({
				title: err.message,
				type: 'error',
			});
		} finally {
			setIsRequesting(false);
		}
	};

	const handleLanguageChange = async (code: string) => {
		if (code === 'contribute') {
			if (hasTranslationPermission) {
				window.open(getEnvUrl('https://admin.xernerx.com'));
				return;
			}

			if (!user?.id) {
				toast({ title: t('account.language.coverage.notLoggedIn'), type: 'error' });
				return;
			}
			setShowConfirm(true);
			return;
		}

		if (activeLocale === code) return;

		// Set the cookie for the middleware/next-intl context
		setLocaleCookie(code);

		// Save the preference to the database so it persists across devices/cleared cookies
		if (user?.id) {
			try {
				await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${user.id}`), {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({
						preferences: {
							...(user.preferences || {}),
							locale: code,
						},
					}),
				});
			} catch (err: any) {
				console.error('Failed to sync language preference to user profile:', err);
				toast({ type: 'error', title: 'Failed to sync language', description: err.message });
			}
		}

		router.refresh();
	};

	const languageOptions = [
		...locales.map((lang: { code: string; label: string; coverage: number }) => {
			const countryCode = getFlagCode(lang.code);

			return {
				value: lang.code,
				label: (
					<div className="flex items-center gap-2.5">
						<CircleFlag countryCode={countryCode} className="h-4 w-4 shrink-0" />
						<span className="font-medium">{lang.label}</span>
					</div>
				),
				badge: (
					<span
						className={`text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full ${lang.coverage === 100 ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}
					>
						{lang.coverage}%
					</span>
				),
			};
		}),
	];

	const coverageDescription = t('account.language.coverage.description', { coverage: currentLanguage?.coverage ?? 0 });

	// Discord read-only locale indicator (uncoupled from the app's internal locale)
	const discordLocale = user?.locale || 'en-US';
	const discordCountryCode = getFlagCode(discordLocale);
	const discordLanguageLabel = locales.find((l: { code: string; label: string }) => l.code === discordLocale)?.label || discordLocale;

	return (
		<div
			className="flex flex-col max-w-7xl mx-auto w-full"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
			}}
		>
			<Confirm
				open={showConfirm}
				variant="primary"
				onOpenChange={setShowConfirm}
				title={t('account.language.coverage.confirmTitle')}
				description={t('account.language.coverage.confirmPrompt', { language: currentLanguage?.label || currentLocale })}
				confirmText={t('common.buttons.proceed')}
				cancelText={t('common.buttons.cancel')}
				onConfirm={handleConfirmRequest}
				loading={isRequesting}
			/>

			{/* Page Header (Hero) */}
			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
				<h1 className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('account.language.headerTitle')}
				</h1>
				<p className="text-sm text-(--text-muted)">{t('account.language.headerDescription')}</p>
			</div>

			<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
				{/* Unified Main Card Wrapper */}
				<div className="relative z-50 flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm">
					{/* Top Section: Main Selector */}
					<div className="relative z-50 flex flex-col sm:flex-row sm:items-center justify-between" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
						<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
							<h3 className="text-base font-semibold text-(--text)">{t('account.language.title')}</h3>
							<p className="text-xs text-(--text-muted)">{t('account.language.description')}</p>
						</div>

						<div className="w-full sm:w-64">
							{/* Uses the correctly defaulted activeLocale */}
							<Selector value={activeLocale} options={languageOptions} onChange={handleLanguageChange} />
						</div>
					</div>

					{/* Bottom Section: Translation Invite Banner */}
					{currentLanguage?.coverage < 100 && (
						<div
							className="flex flex-col sm:flex-row sm:items-center justify-between bg-yellow-500/5 border-t border-yellow-500/10 transition-all rounded-b-[calc(1.5rem-1px)]"
							style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
						>
							<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
								<h3 className="text-base font-semibold text-yellow-600 dark:text-yellow-500">{t('account.language.coverage.title')}</h3>
								<p className="text-xs text-(--text-muted) max-w-xl">{coverageDescription}</p>
							</div>

							<button
								onClick={() => {
									if (hasTranslationPermission) {
										window.open(getEnvUrl('https://admin.xernerx.com'));
										return;
									}
									if (!user?.id) {
										toast({ title: t('account.language.coverage.notLoggedIn'), type: 'error' });
										return;
									}
									setShowConfirm(true);
								}}
								disabled={(isRequesting || isCheckingRoles || isCheckingApplication || hasPendingApplication) && !hasTranslationPermission}
								className="w-full sm:w-auto flex justify-center items-center gap-2 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-500/20 text-xs font-semibold rounded-2xl transition-colors text-center whitespace-nowrap cursor-pointer disabled:opacity-50"
								style={{ padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)' }}
							>
								{(isRequesting || isCheckingRoles || isCheckingApplication) && !hasTranslationPermission && <Loader2 size={14} className="animate-spin" />}
								{hasTranslationPermission ? t('account.language.coverage.adminButton') : hasPendingApplication ? 'Application Pending' : t('account.language.coverage.button')}
							</button>
						</div>
					)}
				</div>

				{/* Discord Visual Language Section */}
				<div
					className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
					style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
				>
					<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<h3 className="text-base font-semibold text-(--text)">{t('account.language.discord.title')}</h3>
						<p className="text-xs text-(--text-muted)">{t('account.language.discord.description')}</p>
					</div>

					<div className="w-full sm:w-64 flex items-center gap-2.5 rounded-xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm p-3">
						<CircleFlag countryCode={discordCountryCode} className="h-4 w-4 shrink-0" />
						<span className="text-sm font-medium text-(--text) truncate">{discordLanguageLabel}</span>
					</div>
				</div>
			</div>
		</div>
	);
}
