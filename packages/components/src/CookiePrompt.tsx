/** @format */
'use client';

import React, { useEffect, useState } from 'react';
import { type CookiePreferences, useCookie } from '@xernerx/providers';
import { Button, Toggle } from '@xernerx/ui';

export function CookiePrompt() {
	const { preferences, updatePreferences } = useCookie();
	const [isMounted, setIsMounted] = useState(false);
	const [showManage, setShowManage] = useState(false);

	// Local state for the toggles before the user hits "Save"
	const [localPrefs, setLocalPrefs] = useState<CookiePreferences>({
		essential: true,
		functional: true,
		analytics: false,
		marketing: false,
	});

	useEffect(() => {
		setIsMounted(true);
	}, []);

	// Hide the prompt if we haven't mounted or if the user already saved their choices
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
		if (key === 'essential') return; // Cannot toggle essential
		setLocalPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
	};

	return (
		<div className='fixed bottom-4 left-4 z-[100] w-[calc(100%-2rem)] max-w-md rounded-2xl border border-(--border)/10 bg-(--foreground) p-6 shadow-2xl md:bottom-8 md:left-8'>
			<div className='flex flex-col gap-4'>
				<div>
					<h3 className='text-lg font-semibold text-(--accent)'>Cookie Preferences</h3>
					<p className='mt-2 text-sm text-(--text-muted)'>We use cookies to ensure your session stays secure, remember your theme, and help us improve the app.</p>
				</div>

				{/* Manage Preferences Dropdown */}
				{showManage && (
					<div className='flex flex-col gap-3 rounded-xl bg-(--background) p-4'>
						<PreferenceToggle label='Essential' description='Required for sessions and security.' checked={true} disabled={true} onChange={() => {}} />
						<PreferenceToggle label='Functional' description='Remembers your theme and layout state.' checked={localPrefs.functional} onChange={() => togglePref('functional')} />
						<PreferenceToggle label='Analytics' description='Helps us track errors and traffic.' checked={localPrefs.analytics} onChange={() => togglePref('analytics')} />
					</div>
				)}

				{/* Action Buttons */}
				<div className='mt-2 flex flex-col gap-2'>
					{showManage ? (
						<Button variant='primary' onClick={handleSavePreferences} className='w-full'>
							Save My Preferences
						</Button>
					) : (
						<>
							<Button variant='primary' onClick={handleAcceptAll} className='w-full'>
								Accept All
							</Button>
							<div className='flex gap-2'>
								<Button variant='secondary' onClick={handleEssentialOnly} className='flex-1'>
									Essential Only
								</Button>
								<Button variant='secondary' onClick={() => setShowManage(true)} className='flex-1'>
									Manage
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
			<div className='flex flex-col'>
				<span className='text-sm font-medium text-(--text)'>{label}</span>
				<span className='text-xs text-(--text-muted)'>{description}</span>
			</div>
			<Toggle checked={checked} disabled={disabled} onChange={onChange} />
		</label>
	);
}
