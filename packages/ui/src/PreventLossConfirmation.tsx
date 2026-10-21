/** @format */
'use client';

import { useEffect, useRef, useState } from 'react';
import { useDictionary } from '@xernerx/providers';
import { Confirm } from './Confirm';
import { useRouter } from 'next/navigation';

export interface PreventLossConfirmationProps {
	/** Whether the navigation block should be active (e.g. isDirty === true) */
	active: boolean;
	title?: string;
	description?: string;
	confirmText?: string;
	cancelText?: string;
}

export function PreventLossConfirmation({ active, title, description, confirmText, cancelText }: PreventLossConfirmationProps) {
	const { t } = useDictionary();
	const router = useRouter();
	const [showConfirm, setShowConfirm] = useState(false);
	const [pendingUrl, setPendingUrl] = useState<string | null>(null);

	// Used to temporarily bypass the block once the user hits "Leave Page"
	const bypassRef = useRef(false);

	// 1. Handle Hard Reloads & Tab Closes (Triggers Native Browser Dialog)
	useEffect(() => {
		if (!active) return;

		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (bypassRef.current) return;
			e.preventDefault();
			e.returnValue = ''; // Required by browsers to trigger the native confirmation
		};

		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	}, [active]);

	// 2. Handle Soft Navigations via Anchor tags / Next.js <Link>
	useEffect(() => {
		if (!active) return;

		const handleAnchorClick = (e: MouseEvent) => {
			if (bypassRef.current) return;

			const target = (e.target as HTMLElement).closest('a');
			if (!target || !target.href) return;

			// Handle internal links without breaking cross-domain links
			try {
				const targetUrl = new URL(target.href);
				const currentUrl = new URL(window.location.href);

				// If navigating to a different internal page (ignores #hash changes on the same page)
				if (targetUrl.origin === currentUrl.origin && targetUrl.pathname !== currentUrl.pathname) {
					e.preventDefault();
					e.stopPropagation();
					setPendingUrl(target.href);
					setShowConfirm(true);
				}
			} catch (err) {
				// Invalid URLs can be ignored
			}
		};

		// Use capture phase to intercept the click BEFORE Next.js handles it
		document.addEventListener('click', handleAnchorClick, true);
		return () => document.removeEventListener('click', handleAnchorClick, true);
	}, [active]);

	// 3. Handle Programmatic Navigation via router.push()
	useEffect(() => {
		if (!active) return;

		const originalPushState = window.history.pushState;

		// Monkey-patch pushState to catch programmatic routing
		window.history.pushState = function (...args) {
			if (bypassRef.current) {
				return originalPushState.apply(window.history, args);
			}

			const url = args[2];
			if (url) {
				const targetPath = url.toString();
				// Block if it's changing the path
				if (targetPath !== window.location.pathname) {
					setPendingUrl(targetPath);
					setShowConfirm(true);
					return;
				}
			}
			return originalPushState.apply(window.history, args);
		};

		return () => {
			window.history.pushState = originalPushState;
		};
	}, [active]);

	const handleConfirmLeave = () => {
		setShowConfirm(false);
		if (pendingUrl) {
			// Enable bypass and forcefully navigate to where they were trying to go
			bypassRef.current = true;
			router.push(pendingUrl);
		}
	};

	return (
		<Confirm
			open={showConfirm}
			onOpenChange={setShowConfirm}
			title={title || t('common.preventLoss.title')}
			description={description || t('common.preventLoss.description')}
			confirmText={confirmText || t('common.preventLoss.confirmText')}
			cancelText={cancelText || t('common.preventLoss.cancelText')}
			onConfirm={handleConfirmLeave}
		/>
	);
}
