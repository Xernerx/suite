/** @format */

'use client';

import { useState } from 'react';
import { Activity, Bot, Check, Copy, ExternalLink, FileText, Globe, Lock, MessageSquare, Rocket, Server, Settings as SettingsIcon, ShieldCheck, Sparkles, Tag, Users, X } from 'lucide-react';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { Button, Input, Markdown, Tabs, Toggle } from '@xernerx/ui';
import { DesktopPreviewExplore, DesktopPreviewLeaderboard } from './DesktopPreviewExplore';
import type { PreviewMainView } from './DesktopPreviewSidebar';
import type { PreviewGuildConfig, PreviewGuildItem } from './useDesktopPreviewData';

const PRESET_SERVER_TAGS = ['Community', 'Gaming', 'Chill', 'Developer', 'Anime', 'Music', 'Art', 'Tech'];

export type DashboardPreviewTab = 'info' | 'stats' | 'links' | 'virtue' | 'applications' | 'settings';

interface DesktopPreviewStageProps {
	isRightAligned: boolean;
	activeView: PreviewMainView;
	setActiveView: (view: PreviewMainView) => void;
	activeGuild: PreviewGuildItem;
	guildConfig: PreviewGuildConfig;
	setGuildConfig: (next: PreviewGuildConfig) => void;
	activeTab: DashboardPreviewTab;
	setActiveTab: (tab: DashboardPreviewTab) => void;
	guilds: PreviewGuildItem[];
	onSelectServer: (id: string) => void;
}

export function DesktopPreviewStage({
	isRightAligned,
	activeView,
	setActiveView,
	activeGuild,
	guildConfig,
	setGuildConfig,
	activeTab,
	setActiveTab,
	guilds,
	onSelectServer,
}: DesktopPreviewStageProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const [copiedGuildId, setCopiedGuildId] = useState(false);
	const [iconFailed, setIconFailed] = useState(false);
	const [virtueAnnounce, setVirtueAnnounce] = useState(true);
	const [appsOpen, setAppsOpen] = useState(true);
	const [activeMetric, setActiveMetric] = useState<'members' | 'messages' | 'bots' | 'boosts'>('members');
	const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | '3m' | 'all'>('7d');

	const appHost = getEnvUrl('https://app.xernerx.com')
		.replace(/^https?:\/\//, '')
		.replace(/\/$/, '');

	const isExplore = activeView === 'explore';

	const handleCopyGuildId = () => {
		navigator.clipboard?.writeText?.(activeGuild.id).catch(() => {});
		setCopiedGuildId(true);
		setTimeout(() => setCopiedGuildId(false), 1800);
	};

	const handleToggleTag = (tag: string) => {
		const current = guildConfig.tags;
		if (current.includes(tag)) {
			setGuildConfig({ ...guildConfig, tags: current.filter((item) => item !== tag) });
		} else if (current.length < 12) {
			setGuildConfig({ ...guildConfig, tags: [...current, tag] });
		}
	};

	return (
		<div
			className={`relative h-full min-h-0 flex-1 overflow-y-auto overscroll-y-contain shadow-inner ${isExplore ? 'rounded-t-xl' : isRightAligned ? 'rounded-tr-xl' : 'rounded-tl-xl'}`}
			style={{
				background:
					'radial-gradient(circle at 50% 15%, color-mix(in srgb, var(--accent) 30%, var(--foreground)) 0%, var(--foreground) 75%), linear-gradient(135deg, color-mix(in srgb, var(--accent) 20%, var(--foreground)) 0%, var(--foreground) 50%, color-mix(in srgb, var(--accent) 20%, var(--foreground)) 100%)',
			}}
		>
			<main className="relative z-10 flex flex-col max-w-(--page-width) mx-auto w-full p-5 gap-4">
				{isExplore ? (
					<DesktopPreviewExplore guilds={guilds} onOpenDashboard={() => setActiveView('server')} onOpenLeaderboard={() => setActiveView('leaderboard')} onSelectServer={onSelectServer} />
				) : activeView === 'leaderboard' ? (
					<DesktopPreviewLeaderboard onBackToExplore={() => setActiveView('explore')} />
				) : (
					<>
						{/* 1. DashboardGuildHeader (Exact apps/app/src/components/dashboard/DashboardGuildHeader.tsx) */}
						<div className="relative flex items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden p-4 gap-4">
							{activeGuild.bannerUrl && (
								<div
									className="absolute inset-0 z-0 opacity-20"
									style={{
										backgroundImage: `url(${activeGuild.bannerUrl})`,
										backgroundSize: 'cover',
										backgroundPosition: 'center',
									}}
								/>
							)}
							<div className="relative z-10 flex items-center gap-4 min-w-0">
								{activeGuild.iconUrl && !iconFailed ? (
									<img
										src={activeGuild.iconUrl}
										alt={activeGuild.name}
										onError={() => setIconFailed(true)}
										className="h-20 w-20 rounded-full border border-(--border)/10 object-cover shrink-0 shadow-lg"
										draggable={false}
									/>
								) : (
									<div className="flex h-20 w-20 items-center justify-center rounded-full bg-(--background)/50 shrink-0 shadow-lg border border-(--border)/10">
										<Server className="w-8 h-8 text-(--text-muted)" />
									</div>
								)}
								<div className="flex flex-col gap-1.5 min-w-0">
									<span className="text-3xl font-extrabold text-(--text) drop-shadow-md tracking-tight truncate" style={{ fontFamily: 'var(--font-fredoka)' }}>
										{activeGuild.name}
									</span>
									<button
										type="button"
										onClick={handleCopyGuildId}
										className="inline-flex items-center gap-1.5 w-fit text-xs font-mono text-(--text-muted) hover:text-(--text) bg-(--background)/60 hover:bg-(--background) px-2.5 py-1 rounded-lg border border-(--border)/10 transition-colors cursor-pointer active:scale-95 focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
									>
										<span>
											{t('app.dashboard.text1')} {activeGuild.id}
										</span>
										{copiedGuildId ? <Check className="w-3.5 h-3.5 text-(--accent-green)" /> : <Copy className="w-3.5 h-3.5" />}
									</button>
								</div>
							</div>

							<div className="relative z-10 flex items-center gap-2 shrink-0">
								<Button variant="primary" className="gap-2">
									<Rocket className="w-4 h-4" />
									{t('app.boost.boostServerBtn')}
								</Button>
								<Button variant="secondary" className="gap-2">
									<ExternalLink className="w-4 h-4" />
									{t('app.portal.workspace.viewPublicProfile')}
								</Button>
							</div>
						</div>

						{/* 2. Official @xernerx/ui 6-Tab Bar */}
						<Tabs
							activeTab={activeTab}
							onChange={(next) => setActiveTab(next as DashboardPreviewTab)}
							tabs={[
								{ id: 'info', label: t('app.dashboard.tabs.info') },
								{ id: 'stats', label: t('app.dashboard.tabs.stats') },
								{ id: 'links', label: t('app.dashboard.tabs.links') },
								{ id: 'virtue', label: t('app.dashboard.tabs.virtue') },
								{ id: 'applications', label: t('app.dashboard.tabs.applications') },
								{ id: 'settings', label: t('app.dashboard.tabs.settings') },
							]}
						/>

						{/* 3. Authentic Tab Panels */}
						{activeTab === 'info' && (
							<div className="flex flex-col gap-4">
								{/* Server Sync & Bot Connection Bar (Exact General.tsx) */}
								<div
									className={`flex items-center justify-between rounded-3xl backdrop-blur-md border shadow-sm p-4 gap-4 ${
										guildConfig.bot ? 'bg-(--foreground)/30 border-(--border)/20' : 'bg-(--accent)/5 border-(--accent)/25'
									}`}
								>
									<div className="flex items-center gap-3.5 min-w-0">
										<div
											className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
												guildConfig.bot ? 'bg-(--accent-green)/15 text-(--accent-green) border-(--accent-green)/30' : 'bg-(--accent)/15 text-(--accent) border-(--accent)/30'
											}`}
										>
											<Bot className="w-5 h-5" />
										</div>
										<div className="flex flex-col min-w-0">
											<div className="flex items-center gap-2 flex-wrap">
												<h3 className="text-sm font-extrabold text-(--text) tracking-wide uppercase">
													{guildConfig.bot ? t('app.dashboard.text2') : t('app.dashboard.botNotConnected')}
												</h3>
												<span
													className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
														guildConfig.bot
															? 'bg-(--accent-green)/15 text-(--accent-green) border-(--accent-green)/30'
															: 'bg-(--background)/60 text-(--text-muted) border-(--border)/15'
													}`}
												>
													<span className={`w-1.5 h-1.5 rounded-full ${guildConfig.bot ? 'bg-(--accent-green)' : 'bg-(--text-muted)'}`} />
													{t('app.dashboard.text4')}: {guildConfig.bot ? t('common.yes') : t('common.no')}
												</span>
											</div>
											<p className="text-xs text-(--text-muted) mt-0.5 line-clamp-1">{t('app.dashboard.text3')}</p>
										</div>
									</div>

									<div className="flex items-center gap-2 shrink-0">
										<div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-(--background)/60 border border-(--border)/10 text-xs">
											<ShieldCheck className={`w-3.5 h-3.5 ${guildConfig.verified ? 'text-(--accent)' : 'text-(--text-muted)'}`} />
											<span className="text-(--text-muted) font-medium">{t('app.dashboard.text5')}:</span>
											<span className="font-bold text-(--text)">{guildConfig.verified ? t('common.yes') : t('common.no')}</span>
										</div>
										<div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-(--background)/60 border border-(--border)/10 text-xs">
											<Globe className="w-3.5 h-3.5 text-(--accent)" />
											<span className="text-(--text-muted) font-medium">{t('app.dashboard.text6')}:</span>
											<span className="font-bold font-mono text-(--text)">{guildConfig.locale}</span>
										</div>
									</div>
								</div>

								{/* Server Info Card (Exact General.tsx with Description + Extended Markdown + Tags) */}
								<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-3xl shadow-xl p-4 gap-4">
									<div className="flex items-center gap-3 text-(--text) font-extrabold text-sm tracking-widest uppercase">
										<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
											<SettingsIcon className="w-4 h-4" />
										</div>
										{t('app.dashboard.text7')}
									</div>

									<div className="flex flex-col gap-2">
										<label className="text-sm font-bold text-(--text)">{t('app.dashboard.text8')}</label>
										<Input
											value={guildConfig.description}
											onChange={(e) => setGuildConfig({ ...guildConfig, description: e.target.value })}
											placeholder={t('app.dashboard.placeholder1')}
										/>
									</div>

									<Markdown
										editable
										label={t('app.dashboard.text9')}
										value={guildConfig.info}
										onChange={(val) => setGuildConfig({ ...guildConfig, info: val })}
										placeholder={t('app.dashboard.placeholder2')}
										emptyText={t('app.portal.info.nothingToPreview')}
										rows={3}
									/>

									<div className="pt-3 border-t border-(--border)/10 flex flex-col gap-2.5">
										<div className="flex items-center justify-between gap-2">
											<div>
												<span className="text-sm font-bold text-(--text) flex items-center gap-1.5">
													<Tag className="w-4 h-4 text-(--accent)" />
													{t('app.dashboard.tagsLabel')}
												</span>
												<p className="text-xs text-(--text-muted) mt-0.5">{t('app.dashboard.tagsDesc')}</p>
											</div>
											<span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-(--background)/60 border border-(--border)/10 text-(--text-muted)">
												{guildConfig.tags.length} / 12
											</span>
										</div>

										{guildConfig.tags.length > 0 && (
											<div className="flex flex-wrap gap-2">
												{guildConfig.tags.map((tag) => (
													<span
														key={tag}
														className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-(--accent)/15 text-(--accent) border border-(--accent)/30"
													>
														#{tag}
														<button
															type="button"
															onClick={() => handleToggleTag(tag)}
															className="hover:text-(--text) transition-colors cursor-pointer"
															aria-label={t('common.close')}
														>
															<X className="w-3.5 h-3.5" />
														</button>
													</span>
												))}
											</div>
										)}

										<div className="flex flex-wrap gap-1.5">
											{PRESET_SERVER_TAGS.map((preset) => {
												const active = guildConfig.tags.includes(preset);
												return (
													<button
														key={preset}
														type="button"
														onClick={() => handleToggleTag(preset)}
														className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border cursor-pointer active:scale-95 focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2 ${
															active
																? 'bg-(--accent) text-(--accent-contrast) border-(--accent) shadow-sm'
																: 'bg-(--background)/50 text-(--text-muted) border-(--border)/10 hover:border-(--accent)/30 hover:text-(--text)'
														}`}
													>
														{preset}
													</button>
												);
											})}
										</div>
									</div>
								</div>
							</div>
						)}

						{activeTab === 'stats' && (
							<div className="flex flex-col gap-4">
								<div className="grid grid-cols-4 gap-4">
									{(
										[
											{ id: 'members', label: t('app.dashboard.stats.members'), val: guildConfig.stats.members.toLocaleString(), Icon: Users },
											{ id: 'messages', label: t('app.dashboard.stats.messages'), val: guildConfig.stats.messages.toLocaleString(), Icon: MessageSquare },
											{ id: 'bots', label: t('app.dashboard.stats.bots'), val: guildConfig.stats.bots.toLocaleString(), Icon: Bot },
											{ id: 'boosts', label: t('app.dashboard.stats.boosts'), val: guildConfig.stats.boosts.toLocaleString(), Icon: Activity },
										] as const
									).map((m) => {
										const isActive = activeMetric === m.id;
										return (
											<button
												key={m.id}
												type="button"
												onClick={() => setActiveMetric(m.id)}
												className={`bg-(--foreground)/40 border p-5 rounded-3xl flex flex-col items-center justify-center gap-2 backdrop-blur-md transition-all cursor-pointer ${
													isActive
														? 'border-(--accent) shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_20%,transparent)]'
														: 'border-(--border)/10 hover:border-(--accent)/50'
												}`}
											>
												<m.Icon className="w-5 h-5 text-(--accent)" />
												<span className="text-2xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
													{m.val}
												</span>
												<span className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">{m.label}</span>
											</button>
										);
									})}
								</div>

								<div className="rounded-3xl bg-(--foreground)/35 backdrop-blur-md border border-(--border)/15 p-5 flex flex-col gap-3">
									<div className="flex items-center justify-between gap-4">
										<span className="text-sm font-extrabold uppercase tracking-wider text-(--text)">{t(`app.dashboard.stats.${activeMetric}`)}</span>
										<Tabs
											size="sm"
											fullWidth={false}
											activeTab={timeframe}
											onChange={(tf) => setTimeframe(tf as any)}
											tabs={[
												{ id: '24h', label: '24h' },
												{ id: '7d', label: '7d' },
												{ id: '30d', label: '1m' },
												{ id: '3m', label: '3m' },
												{ id: 'all', label: t('app.bots.stats.all') },
											]}
										/>
									</div>
									<svg viewBox="0 0 600 110" className="w-full h-28 overflow-visible">
										<defs>
											<linearGradient id="xrxPreviewChartGrad" x1="0" y1="0" x2="0" y2="1">
												<stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
												<stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
											</linearGradient>
										</defs>
										<path d="M0,88 C95,82 140,62 230,58 C320,54 390,34 490,26 L600,16 L600,108 L0,108 Z" fill="url(#xrxPreviewChartGrad)" />
										<path d="M0,88 C95,82 140,62 230,58 C320,54 390,34 490,26 L600,16" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
									</svg>
								</div>
							</div>
						)}

						{activeTab === 'links' && (
							<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-3xl shadow-xl p-4 gap-4">
								<div className="flex items-center gap-3 text-(--text) font-extrabold text-sm tracking-widest uppercase">
									<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
										<Globe className="w-4 h-4" />
									</div>
									{t('app.dashboard.links.title')}
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="flex flex-col gap-2">
										<label className="text-sm font-bold text-(--text)">{t('app.dashboard.links.inviteUrl')}</label>
										<Input
											value={guildConfig.links.invite}
											onChange={(e) => setGuildConfig({ ...guildConfig, links: { ...guildConfig.links, invite: e.target.value } })}
											placeholder={t('app.dashboard.links.invitePlaceholder')}
										/>
									</div>
									<div className="flex flex-col gap-2">
										<label className="text-sm font-bold text-(--text)">{t('app.dashboard.links.website')}</label>
										<Input
											value={guildConfig.links.website}
											onChange={(e) => setGuildConfig({ ...guildConfig, links: { ...guildConfig.links, website: e.target.value } })}
											placeholder={t('app.dashboard.links.websitePlaceholder')}
										/>
									</div>
								</div>
							</div>
						)}

						{activeTab === 'virtue' && (
							<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-3xl shadow-xl p-4 gap-4">
								<div className="flex items-center gap-3 text-(--text) font-extrabold text-sm tracking-widest uppercase">
									<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
										<Sparkles className="w-4 h-4" />
									</div>
									{t('app.dashboard.virtue.title')}
								</div>
								<div className="flex items-center justify-between rounded-2xl bg-(--background)/50 border border-(--border)/10 p-4">
									<div className="flex flex-col gap-0.5">
										<span className="text-sm font-bold text-(--text)">{t('app.dashboard.virtue.announceLevelUps')}</span>
										<span className="text-xs text-(--text-muted)">{t('app.dashboard.virtue.announceLevelUpsDesc')}</span>
									</div>
									<Toggle checked={virtueAnnounce} onChange={(v) => setVirtueAnnounce(typeof v === 'boolean' ? v : v.target.checked)} />
								</div>
							</div>
						)}

						{activeTab === 'applications' && (
							<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-3xl shadow-xl p-4 gap-4">
								<div className="flex items-center gap-3 text-(--text) font-extrabold text-sm tracking-widest uppercase">
									<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
										<FileText className="w-4 h-4" />
									</div>
									{t('app.dashboard.applications.title')}
								</div>
								<div className="flex items-center justify-between rounded-2xl bg-(--background)/50 border border-(--border)/10 p-4">
									<div className="flex flex-col gap-0.5">
										<span className="text-sm font-bold text-(--text)">{t('app.dashboard.applications.positions.title')}</span>
										<span className="text-xs text-(--text-muted)">{t('app.dashboard.applications.positions.subtitle')}</span>
									</div>
									<Toggle checked={appsOpen} onChange={(v) => setAppsOpen(typeof v === 'boolean' ? v : v.target.checked)} />
								</div>
							</div>
						)}

						{activeTab === 'settings' && (
							<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-3xl shadow-xl p-4 gap-4">
								<div className="flex items-center justify-between gap-4">
									<div className="flex items-center gap-3 text-(--text) font-extrabold text-sm tracking-widest uppercase">
										<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
											<Lock className="w-4 h-4" />
										</div>
										{t('app.dashboard.settings.vanitySlugTitle')}
									</div>
									<div className="flex items-center gap-1.5">
										{(['public', 'limited', 'private'] as const).map((tier) => (
											<button
												key={tier}
												type="button"
												onClick={() => setGuildConfig({ ...guildConfig, privacy: tier })}
												className={`rounded-full px-3 py-1 text-xs font-bold border transition-colors cursor-pointer ${
													guildConfig.privacy === tier
														? 'bg-(--accent) text-(--accent-contrast) border-(--accent)'
														: 'bg-(--background)/50 text-(--text-muted) border-(--border)/10 hover:text-(--text)'
												}`}
											>
												{t(`app.dashboard.settings.${tier}`)}
											</button>
										))}
									</div>
								</div>
								<div className="flex items-center gap-2 rounded-2xl bg-(--background)/50 border border-(--border)/10 px-4 py-2.5 font-mono text-xs">
									<span className="text-(--text-muted)">{appHost}/servers/</span>
									<span className="font-bold text-(--accent)">{guildConfig.vanitySlug || activeGuild.id}</span>
								</div>
							</div>
						)}
					</>
				)}
			</main>
		</div>
	);
}
