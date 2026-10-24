/** @format */
'use client';

import { Bot, Compass, LayoutDashboard, ArrowLeft, ExternalLink, Copy, Check, Rocket } from 'lucide-react';
import { Tabs, Confirm, Button } from '@xernerx/ui';
import { useDictionary, useEnvironment, useSession, useSidebar, useToast, useUser } from '@xernerx/providers';
import { useEffect, useState } from 'react';
import { Loading } from '@xernerx/feedback';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

import GeneralTab from '@/components/portal/bot/GeneralTab';
import GrowthTelemetryTab from '@/components/portal/bot/GrowthTelemetryTab';
import LinksTab from '@/components/portal/bot/LinksTab';
import WebhooksTab from '@/components/portal/bot/WebhooksTab';
import SettingsTab from '@/components/portal/bot/SettingsTab';
import BotReleasesAndCommandsManager from '@/components/portal/BotReleasesAndCommandsManager';
import SpotlightBoostModal from '@/components/SpotlightBoostModal';

const VALID_TABS = ['general', 'releases', 'growth', 'links', 'webhooks', 'settings'];

export default function PortalBotPage() {
	const params = useParams();
	const searchParams = useSearchParams();
	const botId = params.id as string;

	const { data: session } = useSession();
	const { mutate: mutateUser } = useUser();
	const { getEnvUrl, isReady: envReady } = useEnvironment();
	const { t } = useDictionary();
	const { show, setView, setNavItems, clearNavItems } = useSidebar();
	const { toast, remind } = useToast();
	const router = useRouter();

	const [botConfig, setBotConfig] = useState<any>(null);
	const [originalBotConfig, setOriginalBotConfig] = useState<any>(null);
	const [webhookDeliveries, setWebhookDeliveries] = useState<any[]>([]);
	const [organizations, setOrganizations] = useState<any[]>([]);
	const [availableTags, setAvailableTags] = useState<string[]>([]);
	const [configLoading, setConfigLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
	const [boostModalOpen, setBoostModalOpen] = useState(false);
	const [copiedId, setCopiedId] = useState(false);

	const initialTab = searchParams.get('tab');
	const [activeTab, setActiveTab] = useState(initialTab && VALID_TABS.includes(initialTab) ? initialTab : 'general');

	useEffect(() => {
		const tabParam = searchParams.get('tab');
		if (tabParam && VALID_TABS.includes(tabParam) && tabParam !== activeTab) {
			setActiveTab(tabParam);
		}
	}, [searchParams]);

	const handleTabChange = (nextTab: string) => {
		setActiveTab(nextTab);
		router.replace(`/portal/bots/${botId}?tab=${nextTab}`, { scroll: false });
	};

	const handleCopyId = () => {
		if (!botConfig?.id) return;
		navigator.clipboard.writeText(botConfig.id);
		setCopiedId(true);
		toast({ title: t('app.portal.workspace.idCopied'), type: 'success' });
		setTimeout(() => setCopiedId(false), 2000);
	};

	const isDirty = JSON.stringify(botConfig) !== JSON.stringify(originalBotConfig);

	useEffect(() => {
		if (!envReady || !session || !botId) return;
		show();
		setView(`bot-${botId}`);

		const fetchConfig = async () => {
			setConfigLoading(true);
			try {
				const [botRes, orgsRes, botsRes, hooksRes, tagsRes] = await Promise.all([
					fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${botId}/profile`), { credentials: 'include' }),
					fetch(getEnvUrl(`https://api.xernerx.com/secure/organizations?user=${(session as any).user.id}`), { credentials: 'include' }),
					fetch(getEnvUrl(`https://api.xernerx.com/secure/bots?owner=${(session as any).user.id}`), { credentials: 'include' }),
					fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${botId}/hooks`), { credentials: 'include' }),
					fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/tags`), { credentials: 'include' }),
				]);

				let currentBotData = null;
				if (botRes.ok) {
					const data = await botRes.json();
					const hooksRaw = hooksRes.ok ? await hooksRes.json() : [];
					const hooksData = (Array.isArray(hooksRaw) ? hooksRaw : hooksRaw?.hooks || []).map((h: any) => ({
						...(h.id ? { id: h.id } : {}),
						botId: h.botId || botId,
						url: h.url,
						events: h.events || [],
					}));
					const deliveriesData = Array.isArray(hooksRaw?.deliveries) ? hooksRaw.deliveries : (Array.isArray(hooksRaw) ? hooksRaw : []).flatMap((h: any) => h.deliveries || []);
					setWebhookDeliveries(deliveriesData);

					if (tagsRes.ok) {
						setAvailableTags(await tagsRes.json());
					}

					currentBotData = data;
					setBotConfig({
						...data,
						links: data.links || {},
						hooks: hooksData,
					});
					setOriginalBotConfig(
						JSON.parse(
							JSON.stringify({
								...data,
								links: data.links || {},
								hooks: hooksData,
							})
						)
					);
				} else {
					router.push('/portal');
					return;
				}

				if (orgsRes.ok) {
					setOrganizations(await orgsRes.json());
				}

				if (currentBotData) {
					const isOrgBot = Boolean(currentBotData.organization && currentBotData.organization !== 'null' && currentBotData.organization !== 'undefined');
					let relatedBots: any[] = [];

					if (isOrgBot) {
						try {
							const orgBotsRes = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots?organization=${currentBotData.organization}`), { credentials: 'include' });
							if (orgBotsRes.ok) {
								const orgBotsData = await orgBotsRes.json();
								if (Array.isArray(orgBotsData)) relatedBots = orgBotsData;
							}
						} catch (e) {
							console.error('Failed to fetch organization bots', e);
						}
					} else if (botsRes.ok) {
						const allBots = await botsRes.json();
						if (Array.isArray(allBots)) {
							relatedBots = allBots.filter((b: any) => !b.organization || b.organization === 'null' || b.organization === 'undefined');
						}
					}

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
								? () => (
										<Image
											src={`https://cdn.discordapp.com/avatars/${b.id}/${b.discord.avatar}.png`}
											alt={b.name}
											width={20}
											height={20}
											unoptimized
											className="w-5 h-5 rounded-xl object-cover"
										/>
									)
								: () => <div className="w-5 h-5 rounded-xl bg-(--foreground) flex items-center justify-center text-[10px]">{(b.name || 'B').charAt(0)}</div>,
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
	}, [botId, session, getEnvUrl, envReady, router, show, setView, setNavItems, clearNavItems, t]);

	useEffect(() => {
		if (isDirty) {
			const handleSave = async () => {
				setSaving(true);
				try {
					const profilePayload = { ...botConfig };
					delete profilePayload.hooks; // Don't send hooks in profile payload

					const [res, hooksRes] = await Promise.all([
						fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${botId}/profile`), {
							method: 'PATCH',
							credentials: 'include',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify(profilePayload),
						}),
						fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${botId}/hooks`), {
							method: 'POST',
							credentials: 'include',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify(botConfig.hooks || []),
						}),
					]);

					if (res.ok && hooksRes.ok) {
						const updatedBot = await res.json().catch(() => null);
						const nextBotConfig = updatedBot ? { ...botConfig, ...updatedBot, hooks: botConfig.hooks } : botConfig;
						mutateUser().catch(() => null);
						toast({ title: t('common.toast.savedSuccess'), type: 'success' });
						remind(false);

						if (botConfig.organization !== originalBotConfig.organization) {
							window.location.reload();
						} else {
							setBotConfig(nextBotConfig);
							setOriginalBotConfig(JSON.parse(JSON.stringify(nextBotConfig)));
						}
					} else {
						let errorMessage = t('common.toast.saveFailed');
						if (!hooksRes.ok) {
							const hookErr = await hooksRes.json().catch(() => ({}));
							if (hookErr.error) errorMessage = hookErr.error;
						} else if (!res.ok) {
							const profileErr = await res.json().catch(() => ({}));
							if (profileErr.error) errorMessage = profileErr.error;
						}
						toast({ title: errorMessage, type: 'error' });
					}
				} catch (e: any) {
					toast({ title: e.message || t('common.toast.saveError'), type: 'error' });
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
	}, [isDirty, saving, botConfig, originalBotConfig, botId, getEnvUrl, remind, toast, t]);

	const handleDelete = async () => {
		setDeleting(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${botId}/profile`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (res.ok) {
				toast({ title: t('app.portal.bot.toast.deleted'), type: 'success' });
				router.push('/portal');
			} else {
				toast({ title: t('app.portal.bot.toast.deleteFailed'), type: 'error' });
				setDeleting(false);
				setIsConfirmDeleteOpen(false);
			}
		} catch (error) {
			toast({ title: t('app.portal.bot.toast.deleteError'), type: 'error' });
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
				<div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[2rem] border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden p-8">
					<div className="relative z-10 flex items-center gap-4">
						{botConfig.discord?.avatar ? (
							<Image
								src={`https://cdn.discordapp.com/avatars/${botConfig.id}/${botConfig.discord.avatar}.png`}
								alt={botConfig.name}
								width={80}
								height={80}
								unoptimized
								className="h-20 w-20 rounded-full border border-(--border)/10 object-cover shrink-0 shadow-lg"
							/>
						) : (
							<div className="flex h-20 w-20 items-center justify-center rounded-full bg-(--background)/50 shrink-0 shadow-lg border border-(--border)/10">
								<Bot className="w-8 h-8 text-(--text-muted)" />
							</div>
						)}
						<div className="flex flex-col gap-1.5">
							<span className="text-3xl font-extrabold text-(--text) drop-shadow-md tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{botConfig.discord?.global_name || botConfig.discord?.username || botConfig.name}
							</span>
							<button
								type="button"
								onClick={handleCopyId}
								className="inline-flex items-center gap-1.5 w-fit text-xs font-mono text-(--text-muted) hover:text-(--text) bg-(--background)/60 hover:bg-(--background) px-2.5 py-1 rounded-lg border border-(--border)/10 transition-colors cursor-pointer"
							>
								<span>{t('app.portal.workspace.id', { id: botConfig.id })}</span>
								{copiedId ? <Check className="w-3.5 h-3.5 text-(--accent-green)" /> : <Copy className="w-3.5 h-3.5" />}
							</button>
						</div>
					</div>
					<div className="relative z-10 flex flex-wrap items-center gap-2 shrink-0">
						<Button variant="primary" onClick={() => setBoostModalOpen(true)} className="gap-2">
							<Rocket className="w-4 h-4" />
							{t('app.boost.boostBotBtn')}
						</Button>
						<Link href={`/bots/${botConfig.vanitySlug || botConfig.id}`}>
							<Button variant="secondary" className="gap-2">
								<ExternalLink className="w-4 h-4" />
								{t('app.portal.workspace.viewPublicProfile')}
							</Button>
						</Link>
					</div>
				</div>

				<div className="flex flex-col w-full gap-8 mt-4">
					<Tabs
						activeTab={activeTab}
						onChange={handleTabChange}
						tabs={[
							{ id: 'general', label: t('app.portal.bot.tabs.general') },
							{ id: 'releases', label: t('app.portal.bot.tabs.releasesAndCommands') },
							{ id: 'growth', label: t('app.portal.bot.tabs.growth') },
							{ id: 'links', label: t('app.portal.bot.tabs.links') },
							{ id: 'webhooks', label: t('app.portal.bot.tabs.webhooks') },
							{ id: 'settings', label: t('app.portal.bot.tabs.settings') },
						]}
					/>

					{activeTab === 'general' && <GeneralTab botConfig={botConfig} setBotConfig={setBotConfig} availableTags={availableTags} />}

					{activeTab === 'releases' && <BotReleasesAndCommandsManager botId={botId} botConfig={botConfig} setBotConfig={setBotConfig} setOriginalBotConfig={setOriginalBotConfig} />}

					{activeTab === 'growth' && <GrowthTelemetryTab botConfig={botConfig} botId={botId} />}

					{activeTab === 'links' && <LinksTab botConfig={botConfig} setBotConfig={setBotConfig} />}

					{activeTab === 'webhooks' && <WebhooksTab botConfig={botConfig} setBotConfig={setBotConfig} deliveries={webhookDeliveries} onDeliveriesChange={setWebhookDeliveries} />}

					{activeTab === 'settings' && (
						<SettingsTab
							botConfig={botConfig}
							setBotConfig={setBotConfig}
							onVanityUnlocked={() => {
								setBotConfig((prev: any) => (prev ? { ...prev, vanityUnlocked: true } : prev));
								setOriginalBotConfig((prev: any) => (prev ? { ...prev, vanityUnlocked: true } : prev));
							}}
							organizations={organizations}
							onDeleteClick={() => setIsConfirmDeleteOpen(true)}
						/>
					)}
				</div>
			</div>

			<SpotlightBoostModal
				isOpen={boostModalOpen}
				onClose={() => setBoostModalOpen(false)}
				targetType="bot"
				targetId={botConfig.id}
				targetName={botConfig.discord?.global_name || botConfig.discord?.username || botConfig.name}
				currentBoostedUntil={botConfig.boostedUntil}
				onBoostSuccess={(boostedUntil) => {
					setBotConfig((prev: any) => (prev ? { ...prev, boostedUntil } : prev));
					setOriginalBotConfig((prev: any) => (prev ? { ...prev, boostedUntil } : prev));
					mutateUser().catch(() => null);
				}}
			/>

			<Confirm
				open={isConfirmDeleteOpen}
				onOpenChange={setIsConfirmDeleteOpen}
				onConfirm={handleDelete}
				title={t('app.portal.bot.modals.delete.title')}
				description={t('app.portal.bot.modals.delete.desc')}
				confirmKeyword={botConfig?.discord?.username || botConfig?.name || 'DELETE'}
				loading={deleting}
			/>
		</div>
	);
}
