/** @format */
'use client';

import React, { useState, useEffect } from 'react';
import { useUser, useEnvironment } from '@xernerx/providers';
import { Modal, Button } from '@xernerx/ui';
import { signOut } from 'next-auth/react';

export function TermsPrompt() {
	const { user, mutate, loading } = useUser();
	const { getEnvUrl } = useEnvironment();
	const [isOpen, setIsOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	// These dates are automatically bumped by the `suite commit` script
	const TERMS_VERSION = new Date('2026-08-30T00:00:00Z').getTime();
	const PRIVACY_VERSION = new Date('2026-08-30T00:00:00Z').getTime();

	useEffect(() => {
		console.log('[TermsPrompt] Evaluating state:', { loading, user });

		// Don't block the screen if they are currently trying to read the policies!
		if (typeof window !== 'undefined' && (window.location.pathname === '/privacy' || window.location.pathname === '/terms')) {
			setIsOpen(false);
			return;
		}

		if (!loading && user) {
			const userTermsTime = user.agreedTerms ? new Date(user.agreedTerms).getTime() : 0;
			const userPrivacyTime = user.agreedPrivacy ? new Date(user.agreedPrivacy).getTime() : 0;

			if (userTermsTime < TERMS_VERSION || userPrivacyTime < PRIVACY_VERSION) {
				console.log('[TermsPrompt] User needs to agree. Opening modal.');
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
			const baseUrl = getEnvUrl('https://api.xernerx.com/');
			const now = new Date().toISOString();
			const res = await fetch(`${baseUrl}secure/users/${user.id}`, {
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
		<Modal open={isOpen} onOpenChange={() => {}} title="Terms & Privacy Agreement" maxWidth="max-w-lg">
			<div className="space-y-4">
				<p className="text-(--text-muted)">We've updated our Terms of Service and Privacy Policy. To continue using Xernerx Studios services, you must review and agree to these documents.</p>
				<ul className="list-disc pl-5 text-(--text-muted) space-y-1">
					<li>
						<a href={getEnvUrl('https://www.xernerx.com/terms')} target="_blank" rel="noreferrer" className="text-(--accent) hover:underline">
							Terms of Service
						</a>
					</li>
					<li>
						<a href={getEnvUrl('https://www.xernerx.com/privacy')} target="_blank" rel="noreferrer" className="text-(--accent) hover:underline">
							Privacy Policy
						</a>
					</li>
				</ul>
				<p className="text-(--text-muted) text-sm">If you do not agree, you will be signed out and unable to access authenticated services.</p>
				<div className="flex justify-end gap-3 mt-6">
					<Button variant="secondary" onClick={handleDecline} disabled={submitting}>
						Decline & Sign Out
					</Button>
					<Button variant="primary" onClick={handleAgree} disabled={submitting}>
						{submitting ? 'Saving...' : 'I Agree'}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
