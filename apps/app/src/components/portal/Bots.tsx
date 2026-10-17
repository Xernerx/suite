/** @format */
'use client';

import { Globe, Link2, Terminal, Webhook } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useDictionary } from '@xernerx/providers';

import GeneralView from '@/components/portal/bots/GeneralView';
import LinksView from '@/components/portal/bots/LinksView';
import WebhooksView from '@/components/portal/bots/WebhooksView';
import CommandsView from '@/components/portal/bots/CommandsView';

export default function Bots() {
	const { t } = useDictionary();

	const views = [
		{ id: 'general', label: t('app.portal.bot.tabs.general'), icon: <Globe className="h-4 w-4" /> },
		{ id: 'links', label: t('app.portal.bot.tabs.links'), icon: <Link2 className="h-4 w-4" /> },
		{ id: 'webhooks', label: t('app.portal.bot.tabs.webhooks'), icon: <Webhook className="h-4 w-4" /> },
		{ id: 'commands', label: t('app.portal.bot.tabs.commands'), icon: <Terminal className="h-4 w-4" /> },
	];

	const [bots, setBots] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
	const [view, setView] = useState<'general' | 'links' | 'webhooks' | 'commands'>('general');
	const [profile, setProfile] = useState<any | null>(null);
	const [profileLoading, setProfileLoading] = useState(false);
	const [orgs, setOrgs] = useState<any[]>([]);

	useEffect(() => {
		(async () => {
			try {
				setLoading(true);

				const botsData = await fetch('/api/v1/bots').then((res) => res.json());

				const users = await Promise.all(
					botsData.map((bot: any) =>
						fetch(`/api/v1/discord/users/${bot.id}/profile`)
							.then((res) => res.json())
							.then((data) => data.user)
							.catch(() => null)
					)
				);

				const merged = botsData.map((bot: any, i: number) => ({
					...bot,
					user: users[i],
				}));

				setBots(merged);

				// auto select first bot
				if (merged.length > 0) {
					setSelectedBotId(merged[0].id);
				}
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	useEffect(() => {
		if (!selectedBotId) return;

		(async () => {
			try {
				setProfileLoading(true);

				const res = await fetch(`/api/v1/bots/${selectedBotId}/profile`);

				if (res.status === 404) {
					// create empty profile if missing
					await fetch(`/api/v1/bots/${selectedBotId}/profile`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({}),
					});

					const retry = await fetch(`/api/v1/bots/${selectedBotId}/profile`);
					const data = await retry.json();
					setProfile(data);
					return;
				}

				const data = await res.json();
				setProfile(data);
			} finally {
				setProfileLoading(false);
			}
		})();
	}, [selectedBotId]);

	useEffect(() => {
		(async () => {
			try {
				const data = await fetch('/api/v1/organizations').then((r) => r.json());
				setOrgs(data);
			} catch {
				setOrgs([]);
			}
		})();
	}, []);

	if (loading) {
		return (
			<div className="text-sm" style={{ color: 'color-mix(in srgb, var(--text-main) 60%, transparent)' }}>
				{t('app.portal.bots.loading')}
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			{/* selector */}
			<div className="flex gap-2 overflow-x-auto overflow-y-hidden">
				{bots.map((bot) => {
					const isSelected = selectedBotId === bot.id;

					const avatar = bot.user?.avatar
						? `https://cdn.discordapp.com/avatars/${bot.id}/${bot.user.avatar}.png?size=256`
						: `https://cdn.discordapp.com/embed/avatars/${Number(bot.id) % 5}.png`;

					const name = bot.user?.global_name || bot.user?.username || t('common.unknownBot');

					return (
						<button
							key={bot.id}
							type="button"
							onClick={() => setSelectedBotId(bot.id)}
							className="group shrink-0 rounded-3xl border p-1 transition hover:scale-[1.03]"
							style={{
								borderColor: isSelected ? 'color-mix(in srgb, var(--text-main) 18%, var(--border))' : 'transparent',
								background: isSelected ? 'color-mix(in srgb, var(--text-main) 8%, transparent)' : 'transparent',
							}}
							title={name}
						>
							<Image className="h-20 w-20 rounded-2xl object-cover transition" style={{ opacity: isSelected ? 1 : 0.82 }} src={avatar} alt={name} width={80} height={80} />
						</button>
					);
				})}
			</div>
			{/* selected bot info */}
			{selectedBotId && (
				<div
					className="rounded-3xl border p-6"
					style={{
						borderColor: 'var(--border)',
						background: 'color-mix(in srgb, var(--bg-panel) 78%, transparent)',
					}}
				>
					{/* sub tabs */}
					<div className="mb-6 flex gap-2 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
						{views.map((v) => (
							<button
								key={v.id}
								onClick={() => setView(v.id as any)}
								className="flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition"
								style={{
									borderColor: view === v.id ? 'var(--text-main)' : 'var(--border)',
									background: view === v.id ? 'color-mix(in srgb, var(--text-main) 8%, transparent)' : 'transparent',
									color: 'var(--text-main)',
								}}
							>
								{v.icon}
								{v.label}
							</button>
						))}
					</div>

					{/* views */}
					{profileLoading ? (
						<div className="text-sm opacity-60">{t('app.portal.bots.loadingProfile')}</div>
					) : profile ? (
						<>
							{view === 'general' && <GeneralView profile={profile} setProfile={setProfile} id={selectedBotId!} orgs={orgs} />}
							{view === 'links' && <LinksView profile={profile} setProfile={setProfile} id={selectedBotId!} />}
							{view === 'webhooks' && <WebhooksView profile={profile} setProfile={setProfile} id={selectedBotId!} />}
							{view === 'commands' && <CommandsView profile={profile} setProfile={setProfile} id={selectedBotId!} />}
						</>
					) : null}
				</div>
			)}
		</div>
	);
}
