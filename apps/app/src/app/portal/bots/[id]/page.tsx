'use client';

import { Bot, Save, Settings, Link2, Shield, AlertTriangle, Trash2, Building2, Compass, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { Button, Input, Modal, Selector, Tabs, Confirm, Toggle } from '@xernerx/ui';
import { useDictionary, useEnvironment, useSession, useSidebar, useToast } from '@xernerx/providers';
import { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { Loading } from '@xernerx/feedback';
import { useRouter, useParams } from 'next/navigation';

export default function PortalBotPage() {
	const params = useParams();
	const botId = params.id as string;

	const { data: session } = useSession();
	const { getEnvUrl, isReady: envReady } = useEnvironment();
	const { t } = useDictionary();
	const { show, setView, setNavItems, clearNavItems } = useSidebar();
	const { toast, remind } = useToast();
	const router = useRouter();

	const [botConfig, setBotConfig] = useState<any>(null);
	const [originalBotConfig, setOriginalBotConfig] = useState<any>(null);
	const [organizations, setOrganizations] = useState<any[]>([]);
	const [configLoading, setConfigLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
	const [activeTab, setActiveTab] = useState('general');

	const isDirty = JSON.stringify(botConfig) !== JSON.stringify(originalBotConfig);

	useEffect(() => {
		if (!envReady || !session || !botId) return;
		show();
		setView(`bot-${botId}`);

		const fetchConfig = async () => {
			setConfigLoading(true);
			try {
				const [botRes, orgsRes, botsRes] = await Promise.all([
					fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${botId}/profile`), { credentials: 'include' }),
					fetch(getEnvUrl(`https://api.xernerx.com/secure/organizations?user=${(session as any).user.id}`), { credentials: 'include' }),
					fetch(getEnvUrl(`https://api.xernerx.com/secure/bots?owner=${(session as any).user.id}`), { credentials: 'include' }),
				]);

				let currentBotData = null;
				if (botRes.ok) {
					const data = await botRes.json();
					currentBotData = data;
					setBotConfig({
						...data,
						links: data.links || {},
					});
					setOriginalBotConfig({
						...data,
						links: data.links || {},
					});
				} else {
					router.push('/portal');
					return;
				}

				if (orgsRes.ok) {
					setOrganizations(await orgsRes.json());
				}

				if (botsRes.ok && currentBotData) {
					const allBots = await botsRes.json();
					const relatedBots = allBots.filter((b: any) =>
						currentBotData.organization && currentBotData.organization !== 'null' && currentBotData.organization !== 'undefined'
							? b.organization === currentBotData.organization
							: !b.organization || b.organization === 'null' || b.organization === 'undefined'
					);

					const botsWithDiscord = await Promise.all(
						relatedBots.map(async (b: any) => {
							try {
								const res = await fetch(getEnvUrl(`https://api.xernerx.com/core/users/${b.id}/discord`));
								if (res.ok) {
									b.discord = await res.json();
								}
							} catch (e) {
								console.error(`Failed to fetch discord user for ${b.id}`, e);
							}
							return b;
						})
					);

					const staticItems = [
						{ label: t('app.portal.nav.explore'), href: '/', icon: Compass as any, category: t('app.portal.categories.navigation') },
						{ label: t('app.portal.nav.dashboard'), href: '/dashboard', icon: LayoutDashboard as any, category: t('app.portal.categories.navigation') },
						{ label: t('app.portal.bot.nav.back'), href: '/portal', icon: ArrowLeft as any, category: t('app.portal.categories.navigation') },
					];

					setNavItems([
						...staticItems,
						...botsWithDiscord.map((b: any) => ({
							label: b.discord?.global_name || b.discord?.username || b.name,
							onClick: () => router.push(`/portal/bots/${b.id}`, { scroll: false }),
							category:
								currentBotData.organization && currentBotData.organization !== 'null' && currentBotData.organization !== 'undefined'
									? t('app.portal.bot.categories.orgBots')
									: t('app.portal.bot.categories.personalBots'),
							icon: b.discord?.avatar
								? () => <img src={`https://cdn.discordapp.com/avatars/${b.id}/${b.discord.avatar}.png`} alt={b.name} className="w-5 h-5 rounded-md object-cover" />
								: () => <div className="w-5 h-5 rounded-md bg-(--foreground) flex items-center justify-center text-[10px]">{(b.name || 'B').charAt(0)}</div>,
							view: `bot-${b.id}`,
						})),
					]);
				}
			} catch (error) {
				console.error('Failed to fetch config', error);
			} finally {
				setConfigLoading(false);
			}
		};
		fetchConfig();

		return () => clearNavItems();
	}, [botId, session, getEnvUrl, envReady, router, show, setView, setNavItems, clearNavItems]);

	useEffect(() => {
		if (isDirty) {
			const handleSave = async () => {
				setSaving(true);
				try {
					const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${botId}/profile`), {
						method: 'PATCH',
						credentials: 'include',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(botConfig),
					});
					if (res.ok) {
						toast({ title: 'Saved successfully!', type: 'success' });
						remind(false);

						if (botConfig.organization !== originalBotConfig.organization) {
							window.location.reload();
						} else {
							setOriginalBotConfig(botConfig);
						}
					} else toast({ title: 'Failed to save', type: 'error' });
				} catch (e) {
					toast({ title: 'Error saving', type: 'error' });
				} finally {
					setSaving(false);
				}
			};

			const handleReset = () => {
				setBotConfig(originalBotConfig);
			};

			remind(true, handleSave, handleReset, saving);
		} else {
			remind(false);
		}
	}, [isDirty, saving, botConfig, originalBotConfig, botId, getEnvUrl, remind, toast]);

	const handleDelete = async () => {
		setDeleting(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${botId}/profile`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (res.ok) {
				toast({ title: 'Bot deleted', type: 'success' });
				router.push('/portal');
			} else {
				toast({ title: 'Failed to delete bot', type: 'error' });
				setDeleting(false);
				setIsConfirmDeleteOpen(false);
			}
		} catch (error) {
			toast({ title: 'Error deleting bot', type: 'error' });
			setDeleting(false);
			setIsConfirmDeleteOpen(false);
		}
	};

	if (configLoading) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center py-20 text-(--text-muted)">
				<Loading variant="default" />
			</div>
		);
	}

	if (!botConfig) return null;

	return (
		<div
			className="flex flex-col max-w-7xl mx-auto w-full"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
			}}
		>
			<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
				<div className="relative flex items-center rounded-[2rem] border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden p-8">
					<div className="relative z-10 flex items-center w-full gap-4">
						{botConfig.discord?.avatar ? (
							<img
								src={`https://cdn.discordapp.com/avatars/${botConfig.id}/${botConfig.discord.avatar}.png`}
								alt={botConfig.name}
								className="h-20 w-20 rounded-full border border-(--border)/10 object-cover shrink-0 shadow-lg"
							/>
						) : (
							<div className="flex h-20 w-20 items-center justify-center rounded-full bg-(--background)/50 shrink-0 shadow-lg border border-(--border)/10">
								<Bot className="w-8 h-8 text-(--text-muted)" />
							</div>
						)}
						<div className="flex flex-col gap-1">
							<span className="text-3xl font-extrabold text-(--text) drop-shadow-md tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{botConfig.discord?.username || botConfig.name}
							</span>
							<span className="text-sm font-medium text-(--text-muted)">ID: {botConfig.id}</span>
						</div>
					</div>
				</div>

				<div className="flex flex-col w-full gap-8 mt-4">
					<Tabs
						activeTab={activeTab}
						onChange={setActiveTab}
						tabs={[
							{ id: 'general', label: t('app.portal.bot.tabs.general') },
							{ id: 'links', label: t('app.portal.bot.tabs.links') },
							{ id: 'settings', label: t('app.portal.bot.tabs.settings') },
						]}
					/>

					{activeTab === 'general' && (
						<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-[2rem] p-8 shadow-xl">
							<div className="flex items-center gap-3 mb-6 text-(--text) font-extrabold text-sm tracking-widest uppercase">
								<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
									<Settings className="w-4 h-4" />
								</div>
								{t('app.portal.bot.general.header')}
							</div>
							<div className="flex flex-col gap-5">
								<div className="flex flex-col gap-2">
									<label className="text-sm font-bold text-(--text)">{t('app.portal.bot.general.shortDesc')}</label>
									<Input
										value={botConfig.description || ''}
										onChange={(e) => setBotConfig({ ...botConfig, description: e.target.value })}
										placeholder={t('app.portal.bot.general.shortDescPlaceholder')}
									/>
								</div>
								<div className="flex flex-col gap-2">
									<label className="text-sm font-bold text-(--text)">{t('app.portal.bot.general.longDesc')}</label>
									<textarea
										value={botConfig.info || ''}
										onChange={(e) => setBotConfig({ ...botConfig, info: e.target.value })}
										placeholder={t('app.portal.bot.general.longDescPlaceholder')}
										className="w-full min-h-[120px] rounded-xl border border-(--border)/10 bg-(--foreground)/30 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-(--accent)"
									/>
								</div>
							</div>
						</div>
					)}

					{activeTab === 'links' && (
						<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-[2rem] p-8 shadow-xl">
							<div className="flex items-center gap-3 mb-6 text-(--text) font-extrabold text-sm tracking-widest uppercase">
								<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
									<Link2 className="w-4 h-4" />
								</div>
								{t('app.portal.bot.links.header')}
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
								<div className="flex flex-col gap-2">
									<label className="text-sm font-bold text-(--text)">{t('app.portal.bot.links.invite')}</label>
									<Input
										value={botConfig.links?.invite || ''}
										onChange={(e) => setBotConfig({ ...botConfig, links: { ...botConfig.links, invite: e.target.value } })}
										placeholder="https://discord.com/oauth2/authorize..."
									/>
								</div>
								<div className="flex flex-col gap-2">
									<label className="text-sm font-bold text-(--text)">{t('app.portal.bot.links.website')}</label>
									<Input
										value={botConfig.links?.website || ''}
										onChange={(e) => setBotConfig({ ...botConfig, links: { ...botConfig.links, website: e.target.value } })}
										placeholder="https://yourwebsite.com"
									/>
								</div>
								<div className="flex flex-col gap-2">
									<label className="text-sm font-bold text-(--text)">{t('app.portal.bot.links.support')}</label>
									<Input
										value={botConfig.links?.support || ''}
										onChange={(e) => setBotConfig({ ...botConfig, links: { ...botConfig.links, support: e.target.value } })}
										placeholder="https://discord.gg/..."
									/>
								</div>
								<div className="flex flex-col gap-2">
									<label className="text-sm font-bold text-(--text)">{t('app.portal.bot.links.github')}</label>
									<Input
										value={botConfig.links?.github || ''}
										onChange={(e) => setBotConfig({ ...botConfig, links: { ...botConfig.links, github: e.target.value } })}
										placeholder="https://github.com/..."
									/>
								</div>
								<div className="flex flex-col gap-2">
									<label className="text-sm font-bold text-(--text)">{t('app.portal.bot.links.privacy')}</label>
									<Input
										value={botConfig.links?.privacy || ''}
										onChange={(e) => setBotConfig({ ...botConfig, links: { ...botConfig.links, privacy: e.target.value } })}
										placeholder="https://..."
									/>
								</div>
								<div className="flex flex-col gap-2">
									<label className="text-sm font-bold text-(--text)">{t('app.portal.bot.links.terms')}</label>
									<Input
										value={botConfig.links?.terms || ''}
										onChange={(e) => setBotConfig({ ...botConfig, links: { ...botConfig.links, terms: e.target.value } })}
										placeholder="https://..."
									/>
								</div>
							</div>
						</div>
					)}

					{activeTab === 'settings' && (
						<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
							{/* Privacy Setting Card */}
							<div
								className="relative z-40 flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
								style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
							>
								<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
									<div className="flex items-center text-(--text) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
										<Shield size={18} />
										<h3>{t('app.portal.bot.settings.privacyHeader')}</h3>
									</div>
									<div className="flex items-center gap-1 text-xs text-(--text-muted)">{t('app.portal.bot.settings.privacyDesc')}</div>
								</div>
								<div className="w-full sm:w-48 shrink-0">
									<Selector
										value={botConfig.privacy || 'private'}
										onChange={(val) => setBotConfig({ ...botConfig, privacy: val })}
										options={[
											{ label: t('app.portal.bot.settings.public'), value: 'public' },
											{ label: t('app.portal.bot.settings.private'), value: 'private' },
											{ label: t('app.portal.bot.settings.limited'), value: 'limited' },
										]}
									/>
								</div>
							</div>

							{/* Transfer Organization Card */}
							<div
								className="relative z-30 flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--accent-orange)/20 bg-(--accent-orange)/5 shadow-sm"
								style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
							>
								<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
									<div className="flex items-center text-(--accent-orange) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
										<Building2 size={18} />
										<h3>{t('app.portal.bot.settings.transferHeader')}</h3>
									</div>
									<p className="text-xs text-(--accent-orange)/80">{t('app.portal.bot.settings.transferDesc')}</p>
								</div>
								<div className="w-full sm:w-64 shrink-0">
									<Selector
										value={botConfig.organization || ''}
										onChange={(val) => setBotConfig({ ...botConfig, organization: val })}
										options={[
											{ label: t('app.portal.bot.settings.noOrg'), value: '' },
											...organizations.map((org) => ({
												label: org.name,
												value: org._id,
											})),
										]}
									/>
								</div>
							</div>

							{/* Reset Data Card */}
							<div
								className="relative z-20 flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--accent-orange)/20 bg-(--accent-orange)/5 shadow-sm"
								style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
							>
								<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
									<div className="flex items-center text-(--accent-orange) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
										<AlertTriangle size={18} />
										<h3>{t('app.portal.bot.settings.resetHeader')}</h3>
									</div>
									<p className="text-xs text-(--accent-orange)/80">{t('app.portal.bot.settings.resetDesc')}</p>
								</div>
								<button
									onClick={() => setBotConfig({ ...botConfig, description: '', info: '', links: {} })}
									className="flex items-center justify-center rounded-xl bg-(--accent-orange) text-sm font-medium text-white transition-colors hover:bg-(--accent-orange)/80 shrink-0 shadow-sm"
									style={{
										padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
										gap: 'calc(var(--ui-gap) * 0.5)',
									}}
								>
									<Trash2 size={16} />
									<span>{t('app.portal.bot.settings.resetBtn')}</span>
								</button>
							</div>

							{/* Delete Application Card */}
							<div
								className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--accent-red)/20 bg-(--accent-red)/5 shadow-sm"
								style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
							>
								<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
									<div className="flex items-center text-(--accent-red) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
										<AlertTriangle size={18} />
										<h3>{t('app.portal.bot.settings.deleteHeader')}</h3>
									</div>
									<p className="text-xs text-(--accent-red)/80">{t('app.portal.bot.settings.deleteDesc')}</p>
								</div>
								<button
									onClick={() => setIsConfirmDeleteOpen(true)}
									className="flex items-center justify-center rounded-xl bg-(--accent-red) text-sm font-medium text-white transition-colors hover:bg-(--accent-red)/80 shrink-0 shadow-sm disabled:opacity-50 disabled:pointer-events-none"
									style={{
										padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
										gap: 'calc(var(--ui-gap) * 0.5)',
									}}
								>
									<Trash2 size={16} />
									<span>{t('app.portal.bot.settings.deleteBtn')}</span>
								</button>
							</div>
						</div>
					)}
				</div>
			</div>

			<Confirm
				open={isConfirmDeleteOpen}
				onOpenChange={setIsConfirmDeleteOpen}
				onConfirm={handleDelete}
				title={t('app.portal.bot.modals.delete.title')}
				description={t('app.portal.bot.modals.delete.desc')}
				loading={deleting}
			/>
		</div>
	);
}
