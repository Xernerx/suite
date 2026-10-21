/** @format */
'use client';

import { Button, Modal } from '@xernerx/ui';
import React, { useEffect, useState } from 'react';
import { useDictionary, useEnvironment, useUser } from '@xernerx/providers';

import { signOut } from 'next-auth/react';

export function TermsPrompt() {
	const { t } = useDictionary();
	const { user, mutate, loading } = useUser();
	const { getEnvUrl } = useEnvironment();
	const [isOpen, setIsOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	// These dates are automatically bumped by the `suite commit` script
	const TERMS_VERSION = new Date('2026-10-21T00:00:00Z').getTime();
	const PRIVACY_VERSION = new Date('2026-10-21T00:00:00Z').getTime();

	useEffect(() => {
		// Don't block the screen if they are currently trying to read the policies!
		if (typeof window !== 'undefined' && (window.location.pathname === '/privacy' || window.location.pathname === '/terms' || window.location.pathname === '/cookies')) {
			setIsOpen(false);
			return;
		}

		if (!loading && user) {
			const userTermsTime = user.agreedTerms ? new Date(user.agreedTerms).getTime() : 0;
			const userPrivacyTime = user.agreedPrivacy ? new Date(user.agreedPrivacy).getTime() : 0;

			if (userTermsTime < TERMS_VERSION || userPrivacyTime < PRIVACY_VERSION) {
				setIsOpen(true);
			} else {
				setIsOpen(false);
			}
		} else {
			setIsOpen(false);
		}
	}, [user, loading]);

	const handleAgree = async () => {
		if (!user?.id) return;
		setSubmitting(true);
		try {
			const url = getEnvUrl(`https://api.xernerx.com/secure/users/${user.id}`);
			const now = new Date().toISOString();
			const res = await fetch(url, {
				method: 'PATCH',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					agreedTerms: now,
					agreedPrivacy: now,
				}),
			});

			if (res.ok) {
				await mutate(); // Refresh user context
				setIsOpen(false);
			} else {
				console.error('Failed to update agreements');
			}
		} catch (error) {
			console.error('Network error updating agreements', error);
		} finally {
			setSubmitting(false);
		}
	};

	const handleDecline = () => {
		// Immediately sign out
		const authLoginUrl = getEnvUrl('https://account.xernerx.com/login');
		signOut({ callbackUrl: authLoginUrl });
	};

	if (!isOpen) return null;

	return (
		<Modal open={isOpen} onOpenChange={() => {}} title={t('components.termsPrompt.title')} maxWidth="max-w-lg">
			<div className="space-y-4">
				<p className="text-(--text-muted)">{t('components.termsPrompt.description')}</p>
				<ul className="list-disc pl-5 text-(--text-muted) space-y-1">
					<li>
						<a href={getEnvUrl('https://www.xernerx.com/terms')} target="_blank" rel="noopener noreferrer" className="text-(--accent) hover:underline">
							{t('components.termsPrompt.termsLink')}
						</a>
					</li>
					<li>
						<a href={getEnvUrl('https://www.xernerx.com/privacy')} target="_blank" rel="noopener noreferrer" className="text-(--accent) hover:underline">
							{t('components.termsPrompt.privacyLink')}
						</a>
					</li>
				</ul>
				<p className="text-(--text-muted) text-sm">{t('components.termsPrompt.warning')}</p>
				<div className="flex justify-end gap-3 mt-6">
					<Button variant="secondary" onClick={handleDecline} disabled={submitting}>
						{t('components.termsPrompt.decline')}
					</Button>
					<Button variant="primary" onClick={handleAgree} disabled={submitting}>
						{submitting ? t('components.termsPrompt.saving') : t('components.termsPrompt.agree')}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
