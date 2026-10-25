/** @format */
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useDictionary, useEnvironment, usePlatform, useSession, useSupport, useToast, useUser } from '@xernerx/providers';
import { Button, Toggle } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import { Link as LinkIcon, CheckCircle2, ExternalLink, Code2, AtSign, Video, Tv, Shield, Music, Gamepad2, MessageCircle, Unplug, Plus, Lock, UserPlus } from 'lucide-react';

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
	},
	{
		id: 'twitch',
		name: 'Twitch',
		icon: Tv,
	},
	{
		id: 'youtube',
		name: 'YouTube',
		icon: Video,
	},
	{
		id: 'twitter',
		name: 'X (Twitter)',
		icon: AtSign,
	},
	{
		id: 'spotify',
		name: 'Spotify',
		icon: Music,
	},
	{
		id: 'steam',
		name: 'Steam',
		icon: Gamepad2,
	},
	{
		id: 'reddit',
		name: 'Reddit',
		icon: MessageCircle,
	},
] as const;

export default function Connections() {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { type } = usePlatform();
	const { data: session } = useSession();
	const { user: discordUser, mutate } = useUser();
	const { toast } = useToast();
	const supportCtx = useSupport();

	const isApplication = type === 'application';
	const activeUser = discordUser || session?.user;
	const userId = (activeUser as any)?.id;

	const [loading, setLoading] = useState(true);
	const [connections, setConnections] = useState<ConnectedAccount[]>([]);
	const [busyProvider, setBusyProvider] = useState<string | null>(null);
	const [discordRpcEnabled, setDiscordRpcEnabled] = useState(true);

	useEffect(() => {
		if (!isApplication || typeof window === 'undefined') return;
		const bridge = (window as any).electron;
		const applyMeta = (meta: any) => {
			if (meta && typeof meta === 'object' && typeof meta.discordRpc === 'boolean') {
				setDiscordRpcEnabled(meta.discordRpc);
			}
		};
		if (bridge?.metadata) applyMeta(bridge.metadata);
		bridge
			?.getMetadata?.()
			?.then?.(applyMeta)
			?.catch?.(() => {});
		const unsub = bridge?.onMetadataUpdated?.(applyMeta);
		const handleMetaEvent = (e: Event) => applyMeta((e as CustomEvent)?.detail);
		window.addEventListener('xernerx:metadata-updated', handleMetaEvent);
		return () => {
			window.removeEventListener('xernerx:metadata-updated', handleMetaEvent);
			unsub?.();
		};
	}, [isApplication]);

	const handleToggleDiscordRpc = async (val: boolean | React.ChangeEvent<HTMLInputElement>) => {
		const next = typeof val === 'boolean' ? val : val.target.checked;
		setDiscordRpcEnabled(next);
		const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		try {
			const updated = await bridge?.updateMetadata?.({ discordRpc: next });
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('xernerx:metadata-updated', { detail: updated || { discordRpc: next } }));
			}
			toast({ type: 'success', title: t('account.preferences.toast.updated') });
		} catch {}
	};

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
		window.location.assign(`/api/connections/${providerId}`);
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
		<div
			className="flex flex-col max-w-7xl mx-auto w-full"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
			}}
		>
			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
				<h1 className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm flex items-center gap-3" style={{ fontFamily: 'var(--font-fredoka)' }}>
					<LinkIcon className="text-(--accent)" size={32} />
					{t('account.connections.title')}
				</h1>
				<p className="text-sm text-(--text-muted)">{t('account.connections.description')}</p>
			</div>

			{/* Primary Required Login: Discord OAuth2 */}
			<div className="rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm flex flex-col" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between" style={{ gap: 'var(--ui-gap)' }}>
					<div className="flex items-center gap-4">
						<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30 shrink-0">
							<Shield size={28} />
						</div>
						<div>
							<div className="flex flex-wrap items-center gap-2">
								<h2 className="text-lg font-bold text-(--text)">Discord</h2>
								<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/25">
									<CheckCircle2 size={12} />
									{t('account.connections.connected')}
								</span>
								<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-(--accent)/15 text-(--accent) border border-(--accent)/25">
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
						<div className="flex flex-wrap items-center gap-2 shrink-0">
							{supportCtx && (
								<Button variant={supportCtx.isMember ? 'secondary' : 'primary'} onClick={() => supportCtx.triggerDiscordAction()} className="flex items-center gap-2 shrink-0">
									{supportCtx.isMember ? <MessageCircle size={15} /> : <UserPlus size={15} />}
									{supportCtx.isMember ? t('common.supportprovider.description') : t('common.supportprovider.joinButton')}
								</Button>
							)}
							<Button variant="secondary" onClick={() => window.open(`${getEnvUrl('https://app.xernerx.com')}/users/${userId}`, '_blank')} className="flex items-center gap-2 shrink-0">
								<ExternalLink size={15} />
								{t('account.profile.viewPublicProfile')}
							</Button>
						</div>
					)}
				</div>

				{isApplication && (
					<div className="flex items-center justify-between pt-3 border-t border-(--border)/10 gap-4">
						<div className="flex items-center gap-3 min-w-0">
							<div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25 shrink-0">
								<Gamepad2 size={16} />
							</div>
							<div className="flex flex-col min-w-0">
								<span className="text-sm font-semibold text-(--text)">{t('account.preferences.desktopItems.discordRpc.title')}</span>
								<span className="text-xs text-(--text-muted)">{t('account.preferences.desktopItems.discordRpc.description')}</span>
							</div>
						</div>
						<Toggle checked={discordRpcEnabled} onChange={handleToggleDiscordRpc} suppressHydrationWarning />
					</div>
				)}
			</div>

			{/* Optional OAuth Connections Grid */}
			<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.2)' }}>
					<h2 className="text-xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('account.connections.availableTitle')}
					</h2>
					<p className="text-xs text-(--text-muted)">{t('account.connections.availableDesc')}</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--ui-gap)' }}>
					{OAUTH_PROVIDERS.map((provider) => {
						const IconComponent = provider.icon;
						const connected = connections.find((c) => c.provider === provider.id);
						const isBusy = busyProvider === provider.id;

						return (
							<div
								key={provider.id}
								className={`flex flex-col justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm transition-all ${
									!OAUTH_WORKFLOWS_ENABLED ? 'opacity-50 grayscale pointer-events-none select-none' : ''
								}`}
								style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
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
											<div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-(--accent)/25 bg-(--accent)/15 text-(--accent) shrink-0">
												<IconComponent size={22} />
											</div>
										)}
										<div className="min-w-0">
											<div className="flex items-center gap-2">
												<h3 className="text-base font-bold text-(--text) truncate">{provider.name}</h3>
												{connected && (
													<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/25">
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
															aria-label={`${provider.name}: ${connected.displayName || connected.username}`}
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
											className="flex items-center gap-1.5 text-(--accent-red) shrink-0 text-xs px-3 py-1.5"
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
										<Toggle checked={connected.showOnProfile !== false} onChange={(e) => handleToggleVisibility(provider.id, e.target.checked)} />
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
