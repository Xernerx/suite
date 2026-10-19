/** @format */
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useDictionary, useEnvironment, useSession, useToast, useUser } from '@xernerx/providers';
import { Button, Toggle } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import { Link as LinkIcon, CheckCircle2, ExternalLink, Code2, AtSign, Video, Tv, Shield, Music, Gamepad2, MessageCircle, Unplug, Plus, Lock } from 'lucide-react';

interface ConnectedAccount {
	provider: string;
	id: string;
	username: string;
	displayName?: string;
	avatar?: string;
	url?: string;
	showOnProfile: boolean;
	connectedAt?: string;
}

// Set to true once OAuth application credentials & workflows are configured
const OAUTH_WORKFLOWS_ENABLED = false;

const OAUTH_PROVIDERS = [
	{
		id: 'github',
		name: 'GitHub',
		icon: Code2,
		accentClass: 'bg-zinc-500/15 text-(--text) border-zinc-500/30',
	},
	{
		id: 'twitch',
		name: 'Twitch',
		icon: Tv,
		accentClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
	},
	{
		id: 'youtube',
		name: 'YouTube',
		icon: Video,
		accentClass: 'bg-red-500/15 text-red-400 border-red-500/30',
	},
	{
		id: 'twitter',
		name: 'X (Twitter)',
		icon: AtSign,
		accentClass: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
	},
	{
		id: 'spotify',
		name: 'Spotify',
		icon: Music,
		accentClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
	},
	{
		id: 'steam',
		name: 'Steam',
		icon: Gamepad2,
		accentClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
	},
	{
		id: 'reddit',
		name: 'Reddit',
		icon: MessageCircle,
		accentClass: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
	},
] as const;

export default function Connections() {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { data: session } = useSession();
	const { user: discordUser, mutate } = useUser();
	const { toast } = useToast();

	const activeUser = discordUser || session?.user;
	const userId = (activeUser as any)?.id;

	const [loading, setLoading] = useState(true);
	const [connections, setConnections] = useState<ConnectedAccount[]>([]);
	const [busyProvider, setBusyProvider] = useState<string | null>(null);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const params = new URLSearchParams(window.location.search);
		const connected = params.get('connected');
		const error = params.get('error');
		const provider = params.get('provider') || '';

		if (connected) {
			toast({
				type: 'success',
				title: t('account.connections.oauthSuccess', { provider: connected.toUpperCase() }),
			});
			params.delete('connected');
			window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
		} else if (error) {
			const msg = error === 'not_configured' ? t('account.connections.oauthNotConfigured', { provider: provider.toUpperCase() }) : t('account.connections.oauthError');
			toast({
				type: 'error',
				title: msg,
			});
			params.delete('error');
			params.delete('provider');
			window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
		}
	}, [toast, t]);

	useEffect(() => {
		if (!isReady || !userId) {
			setLoading(false);
			return;
		}
		fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${userId}`), { credentials: 'include', cache: 'no-store' })
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (Array.isArray(data?.connections)) {
					setConnections(data.connections);
				}
			})
			.catch(() => {})
			.finally(() => setLoading(false));
	}, [isReady, userId, getEnvUrl]);

	const handleConnect = (providerId: string) => {
		setBusyProvider(providerId);
		window.location.href = `/api/connections/${providerId}`;
	};

	const handleDisconnect = async (providerId: string) => {
		setBusyProvider(providerId);
		try {
			const res = await fetch(`/api/connections/${providerId}`, {
				method: 'DELETE',
				credentials: 'include',
			});
			if (!res.ok) throw new Error(t('account.connections.disconnectError'));
			const data = await res.json();
			setConnections(Array.isArray(data.connections) ? data.connections : []);
			if (mutate) mutate();
			toast({ type: 'success', title: t('account.connections.disconnectSuccess') });
		} catch (err: any) {
			toast({ type: 'error', title: err.message || t('account.connections.disconnectError') });
		} finally {
			setBusyProvider(null);
		}
	};

	const handleToggleVisibility = async (providerId: string, showOnProfile: boolean) => {
		setConnections((prev) => prev.map((c) => (c.provider === providerId ? { ...c, showOnProfile } : c)));
		try {
			const res = await fetch(`/api/connections/${providerId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ showOnProfile }),
			});
			if (!res.ok) throw new Error(t('account.connections.saveError'));
			if (mutate) mutate();
		} catch (err: any) {
			toast({ type: 'error', title: err.message || t('account.connections.saveError') });
		}
	};

	if (loading) return <Loading />;

	return (
		<div className="flex flex-col max-w-5xl mx-auto w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<div>
				<h1 className="text-3xl font-bold text-(--text) flex items-center gap-3" style={{ fontFamily: 'var(--font-fredoka)' }}>
					<LinkIcon className="text-(--accent)" size={28} />
					{t('account.connections.title')}
				</h1>
				<p className="text-sm text-(--text-muted) mt-1">{t('account.connections.description')}</p>
			</div>

			{/* Primary Required Login: Discord OAuth2 */}
			<div className="p-6 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5865F2]/15 text-[#5865F2] border border-[#5865F2]/30 shrink-0">
						<Shield size={28} />
					</div>
					<div>
						<div className="flex flex-wrap items-center gap-2">
							<h3 className="text-lg font-bold text-(--text)">Discord</h3>
							<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
								<CheckCircle2 size={12} />
								{t('account.connections.connected')}
							</span>
							<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#5865F2]/15 text-[#5865F2] border border-[#5865F2]/25">
								<Lock size={11} />
								{t('account.connections.primaryIdentity')}
							</span>
						</div>
						<p className="text-xs text-(--text-muted) mt-1">
							{(activeUser as any)?.global_name || (activeUser as any)?.name} (@{(activeUser as any)?.username || 'discord'}) • ID: <code className="font-mono">{userId}</code>
						</p>
					</div>
				</div>

				{userId && (
					<Button variant="secondary" onClick={() => window.open(`${getEnvUrl('https://app.xernerx.com')}/users/${userId}`, '_blank')} className="flex items-center gap-2 shrink-0">
						<ExternalLink size={15} />
						{t('account.profile.viewPublicProfile')}
					</Button>
				)}
			</div>

			{/* Optional OAuth Connections Grid */}
			<div className="flex flex-col gap-4">
				<div>
					<h2 className="text-xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('account.connections.availableTitle')}
					</h2>
					<p className="text-xs text-(--text-muted) mt-0.5">{t('account.connections.availableDesc')}</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{OAUTH_PROVIDERS.map((provider) => {
						const IconComponent = provider.icon;
						const connected = connections.find((c) => c.provider === provider.id);
						const isBusy = busyProvider === provider.id;

						return (
							<div
								key={provider.id}
								className={`flex flex-col justify-between gap-4 p-5 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md transition-all ${
									!OAUTH_WORKFLOWS_ENABLED ? 'opacity-50 grayscale pointer-events-none select-none' : ''
								}`}
							>
								<div className="flex items-start justify-between gap-3">
									<div className="flex items-center gap-3.5 min-w-0">
										{connected?.avatar ? (
											<Image
												src={connected.avatar}
												alt={connected.username}
												width={48}
												height={48}
												unoptimized
												className="h-12 w-12 rounded-2xl border border-(--border)/15 object-cover shrink-0"
											/>
										) : (
											<div className={`flex h-12 w-12 items-center justify-center rounded-2xl border shrink-0 ${provider.accentClass}`}>
												<IconComponent size={22} />
											</div>
										)}
										<div className="min-w-0">
											<div className="flex items-center gap-2">
												<h3 className="text-base font-bold text-(--text) truncate">{provider.name}</h3>
												{connected && (
													<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
														<CheckCircle2 size={10} />
														{t('account.connections.verifiedBadge')}
													</span>
												)}
											</div>
											{connected ? (
												<div className="flex items-center gap-2 mt-0.5">
													<span className="text-xs font-medium text-(--text) truncate">{connected.displayName || connected.username}</span>
													{connected.url && (
														<a
															href={connected.url}
															target="_blank"
															rel="noopener noreferrer"
															className="text-(--accent) hover:underline inline-flex items-center gap-0.5 text-xs"
														>
															<ExternalLink size={11} />
														</a>
													)}
												</div>
											) : (
												<p className="text-xs text-(--text-muted) mt-0.5">{t('account.connections.notConnected')}</p>
											)}
										</div>
									</div>

									{connected ? (
										<Button
											variant="secondary"
											onClick={() => handleDisconnect(provider.id)}
											disabled={!OAUTH_WORKFLOWS_ENABLED || isBusy}
											className="flex items-center gap-1.5 text-red-400 shrink-0 text-xs px-3 py-1.5"
										>
											<Unplug size={13} />
											{t('account.connections.disconnect')}
										</Button>
									) : (
										<Button
											onClick={() => handleConnect(provider.id)}
											disabled={!OAUTH_WORKFLOWS_ENABLED || isBusy}
											className="flex items-center gap-1.5 shrink-0 text-xs px-3.5 py-2"
										>
											<Plus size={14} />
											{t('account.connections.connectButton')}
										</Button>
									)}
								</div>

								{connected && (
									<div className="flex items-center justify-between pt-3 border-t border-(--border)/10">
										<span className="text-xs text-(--text-muted)">{t('account.connections.showOnProfile')}</span>
										<Toggle checked={connected.showOnProfile !== false} onChange={(val) => handleToggleVisibility(provider.id, val)} />
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
