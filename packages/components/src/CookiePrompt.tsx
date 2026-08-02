/** @format */
'use client';

import { useEffect, useState } from 'react';
import { type CookiePreferences, useCookie, useDictionary } from '@xernerx/providers';
import { Button, Toggle } from '@xernerx/ui';

export function CookiePrompt() {
	const { preferences, updatePreferences } = useCookie();
	const { t } = useDictionary();

	const [isMounted, setIsMounted] = useState(false);
	const [showManage, setShowManage] = useState(false);

	const [localPrefs, setLocalPrefs] = useState<CookiePreferences>({
		essential: true,
		functional: true,
		analytics: false,
		marketing: false,
	});

	useEffect(() => {
		setIsMounted(true);
	}, []);

	if (!isMounted || preferences !== null) return null;

	const handleAcceptAll = () => {
		updatePreferences({
			essential: true,
			functional: true,
			analytics: true,
			marketing: true,
		});
	};

	const handleEssentialOnly = () => {
		updatePreferences({
			essential: true,
			functional: false,
			analytics: false,
			marketing: false,
		});
	};

	const handleSavePreferences = () => {
		updatePreferences(localPrefs);
	};

	const togglePref = (key: keyof CookiePreferences) => {
		if (key === 'essential') return;
		setLocalPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
	};

	return (
		<div
			className="fixed z-[100] w-[calc(100%-2rem)] max-w-md rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-2xl"
			style={{
				bottom: 'var(--ui-gap)',
				left: 'var(--ui-gap)',
				padding: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
			}}
		>
			<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<h3 className="text-lg font-semibold text-(--accent)">{t('common.cookiePrompt.title', {}, 'Cookie Preferences')}</h3>
					<p className="text-sm text-(--text-muted)">
						{t('common.cookiePrompt.description', {}, 'We use cookies to ensure your session stays secure, remember your theme, and help us improve the app.')}
					</p>
				</div>

				{/* Manage Preferences Dropdown */}
				{showManage && (
					<div className="flex flex-col rounded-2xl bg-(--background) border border-(--border)/10" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
						<PreferenceToggle
							label={t('common.cookiePrompt.manage.essential.label', {}, 'Essential')}
							description={t('common.cookiePrompt.manage.essential.description', {}, 'Required for sessions and security.')}
							checked={true}
							disabled={true}
							onChange={() => {}}
						/>
						<PreferenceToggle
							label={t('common.cookiePrompt.manage.functional.label', {}, 'Functional')}
							description={t('common.cookiePrompt.manage.functional.description', {}, 'Remembers your theme and layout state.')}
							checked={localPrefs.functional}
							onChange={() => togglePref('functional')}
						/>
						<PreferenceToggle
							label={t('common.cookiePrompt.manage.analytics.label', {}, 'Analytics')}
							description={t('common.cookiePrompt.manage.analytics.description', {}, 'Helps us track errors and traffic.')}
							checked={localPrefs.analytics}
							onChange={() => togglePref('analytics')}
						/>
					</div>
				)}

				{/* Action Buttons */}
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					{showManage ? (
						<Button variant="primary" onClick={handleSavePreferences} className="w-full">
							{t('common.cookiePrompt.buttons.save', {}, 'Save My Preferences')}
						</Button>
					) : (
						<>
							<Button variant="primary" onClick={handleAcceptAll} className="w-full">
								{t('common.cookiePrompt.buttons.acceptAll', {}, 'Accept All')}
							</Button>
							<div className="flex" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
								<Button variant="secondary" onClick={handleEssentialOnly} className="flex-1">
									{t('common.cookiePrompt.buttons.essentialOnly', {}, 'Essential Only')}
								</Button>
								<Button variant="secondary" onClick={() => setShowManage(true)} className="flex-1">
									{t('common.cookiePrompt.buttons.manage', {}, 'Manage')}
								</Button>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}

// Sub-component for the individual toggle rows
function PreferenceToggle({ label, description, checked, disabled = false, onChange }: { label: string; description: string; checked: boolean; disabled?: boolean; onChange: () => void }) {
	return (
		<label className={`flex cursor-pointer items-start justify-between gap-4 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
			<div className="flex flex-col">
				<span className="text-sm font-medium text-(--text)">{label}</span>
				<span className="text-xs text-(--text-muted)">{description}</span>
			</div>
			<Toggle checked={checked} disabled={disabled} onChange={onChange} />
		</label>
	);
}
