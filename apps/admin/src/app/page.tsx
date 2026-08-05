/** @format */
'use client';

import Users from '@/components/Users';
import { useEffect } from 'react';
import { useSidebar } from '@xernerx/providers';

export default function Home() {
	const { show, setNavItems, view, setView } = useSidebar();

	useEffect(() => {
		setView('users');

		setNavItems([
			{
				label: 'Users',
				view: 'users',
			},
			{
				label: 'Tokens',
				view: 'tokens',
			},
		]);

		show();
	}, [setView, setNavItems, show]);

	return (
		<div
			className="flex flex-col max-w-7xl mx-auto w-full"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
			}}
		>
			{view === 'users' && <Users />}
			{view === 'tokens' && (
				<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-sm" style={{ padding: 'var(--ui-gap)' }}>
					<h1 className="text-2xl font-black tracking-tight text-(--text) mb-1">API Tokens</h1>
					<p className="text-sm text-(--text-muted)">Manage organization access tokens and API keys.</p>
				</div>
			)}
		</div>
	);
}
