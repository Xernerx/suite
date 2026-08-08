/** @format */
'use client';

import { Confirm, Selector } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast, useUser } from '@xernerx/providers';
import { useEffect, useState } from 'react';

import { CircleFlag } from 'react-circle-flags';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const setLocaleCookie = (code: string) => {
	document.cookie = `NEXT_LOCALE=${code}; domain=.xernerx.com; path=/; max-age=31536000; SameSite=Lax; Secure`;
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
	const router = useRouter();
	const { user } = useUser();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { currentLocale, currentLanguage, locales, t } = useDictionary();

	const [isRequesting, setIsRequesting] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [hasTranslationPermission, setHasTranslationPermission] = useState(false);
	const [isCheckingRoles, setIsCheckingRoles] = useState(false);

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

					const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/roles/${roleId}`), {
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
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/content/applications`), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					userId: user?.id,
					type: 'translator',
					metadata: { locale: currentLocale },
				}),
			});

			if (!res.ok) {
				const errData = await res.json();
				throw new Error(errData.error || t('auth.language.coverage.requestFailed'));
			}

			toast({
				title: t('auth.language.coverage.requestSuccess'),
				type: 'success',
			});
			setShowConfirm(false);
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
				toast({ title: t('auth.language.coverage.notLoggedIn'), type: 'error' });
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
			} catch (err) {
				console.error('Failed to sync language preference to user profile:', err);
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

	const coverageDescription = t('auth.language.coverage.description', { coverage: currentLanguage?.coverage ?? 0 });

	// Discord read-only locale indicator (uncoupled from the app's internal locale)
	const discordLocale = user?.locale || 'en-US';
	const discordCountryCode = getFlagCode(discordLocale);
	const discordLanguageLabel = locales.find((l: { code: string; label: string }) => l.code === discordLocale)?.label || discordLocale;

	return (
		<div
			className="flex flex-col max-w-4xl mx-auto w-full"
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
				title={t('auth.language.coverage.confirmTitle')}
				description={t('auth.language.coverage.confirmPrompt', { language: currentLanguage?.label || currentLocale })}
				confirmText={t('common.buttons.proceed')}
				cancelText={t('common.buttons.cancel')}
				onConfirm={handleConfirmRequest}
				loading={isRequesting}
			/>

			{/* Page Header (Hero) */}
			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
				<h1 className="text-3xl font-black tracking-tight text-(--text)">{t('auth.language.headerTitle')}</h1>
				<p className="text-sm text-(--text-muted)">{t('auth.language.headerDescription')}</p>
			</div>

			<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
				{/* Unified Main Card Wrapper */}
				<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-sm">
					{/* Top Section: Main Selector */}
					<div className="flex flex-col sm:flex-row sm:items-center justify-between" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
						<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
							<h3 className="text-base font-semibold text-(--text)">{t('auth.language.title')}</h3>
							<p className="text-xs text-(--text-muted)">{t('auth.language.description')}</p>
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
								<h3 className="text-base font-semibold text-yellow-600 dark:text-yellow-500">{t('auth.language.coverage.title')}</h3>
								<p className="text-xs text-(--text-muted) max-w-xl">{coverageDescription}</p>
							</div>

							<button
								onClick={() => {
									if (hasTranslationPermission) {
										window.open(getEnvUrl('https://admin.xernerx.com'));
										return;
									}
									if (!user?.id) {
										toast({ title: t('auth.language.coverage.notLoggedIn'), type: 'error' });
										return;
									}
									setShowConfirm(true);
								}}
								disabled={(isRequesting || isCheckingRoles) && !hasTranslationPermission}
								className="w-full sm:w-auto flex justify-center items-center gap-2 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-500/20 text-xs font-semibold rounded-2xl transition-colors text-center whitespace-nowrap cursor-pointer disabled:opacity-50"
								style={{ padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)' }}
							>
								{(isRequesting || isCheckingRoles) && !hasTranslationPermission && <Loader2 size={14} className="animate-spin" />}
								{hasTranslationPermission ? t('auth.language.coverage.adminButton') : t('auth.language.coverage.button')}
							</button>
						</div>
					)}
				</div>

				{/* Discord Visual Language Section */}
				<div
					className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-sm"
					style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
				>
					<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<h3 className="text-base font-semibold text-(--text)">{t('auth.language.discord.title')}</h3>
						<p className="text-xs text-(--text-muted)">{t('auth.language.discord.description')}</p>
					</div>

					<div className="w-full sm:w-64 flex items-center gap-2.5 rounded-2xl border border-(--border)/10 bg-(--background)" style={{ padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)' }}>
						<CircleFlag countryCode={discordCountryCode} className="h-4 w-4 shrink-0" />
						<span className="text-sm font-medium text-(--text) truncate">{discordLanguageLabel}</span>
					</div>
				</div>
			</div>
		</div>
	);
}
