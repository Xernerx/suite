/** @format */
'use client';

import { CircleFlag } from 'react-circle-flags';
import { Selector } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
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
		case 'nl':
			return 'nl';
		default:
			return localeCode;
	}
};

export default function Language() {
	const router = useRouter();
	const { currentLocale, currentLanguage, locales, t } = useDictionary();

	const handleLanguageChange = (code: string) => {
		if (currentLocale === code) return;
		setLocaleCookie(code);
		router.refresh();
	};

	const languageOptions = locales.map((lang: { code: string; label: string; coverage: number }) => {
		const countryCode = getFlagCode(lang.code);

		return {
			value: lang.code,
			label: (
				<div className='flex items-center gap-2.5'>
					<CircleFlag countryCode={countryCode} className='h-4 w-4' />
					<span className='font-medium'>{lang.label}</span>
				</div>
			),
			badge: (
				<span className={`text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full ${lang.coverage === 100 ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
					{lang.coverage}%
				</span>
			),
		};
	});

	const coverageDescription = t('auth.language.coverage.description', { coverage: currentLanguage?.coverage ?? 0 });

	return (
		<div className='flex flex-col gap-4 w-full max-w-4xl mx-auto'>
			{/* Main Selector */}
			<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-sm'>
				<div className='flex flex-col'>
					<h3 className='text-base font-semibold text-(--text)'>{t('auth.language.title')}</h3>
					<p className='text-xs text-(--text-muted) mt-0.5'>{t('auth.language.description')}</p>
				</div>

				<div className='w-full sm:w-64'>
					<Selector value={currentLocale} options={languageOptions} onChange={handleLanguageChange} />
				</div>
			</div>

			{/* Translation Invite Banner */}
			{currentLanguage?.coverage < 100 && (
				<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-yellow-500/20 bg-yellow-500/5 shadow-sm transition-all'>
					<div className='flex flex-col'>
						<h3 className='text-base font-semibold text-yellow-600 dark:text-yellow-500'>{t('auth.language.coverage.title')}</h3>
						<p className='text-xs text-(--text-muted) mt-0.5 max-w-xl'>{coverageDescription}</p>
					</div>

					<a
						href='https://github.com/xernerx'
						target='_blank'
						rel='noopener noreferrer'
						className='w-full sm:w-auto px-5 py-2 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-500/20 text-xs font-semibold rounded-2xl transition-colors text-center whitespace-nowrap'>
						Contribute
					</a>
				</div>
			)}
		</div>
	);
}
