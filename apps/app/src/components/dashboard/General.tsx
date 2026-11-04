/** @format */
'use client';

import { useState } from 'react';
import { Settings, Bot, ExternalLink, Tag, Plus, X, ShieldCheck, Globe } from 'lucide-react';
import { Input, Markdown } from '@xernerx/ui';
import { useDictionary, useEnvironment } from '@xernerx/providers';

const PRESET_SERVER_TAGS = ['Community', 'Gaming', 'Chill', 'Developer', 'Anime', 'Music', 'Art', 'Tech', 'Roleplay', 'Giveaways', 'Study', 'Esports'];

interface GeneralProps {
	guildConfig: any;
	setGuildConfig: (config: any) => void;
}

export default function General({ guildConfig, setGuildConfig }: GeneralProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const [tagInput, setTagInput] = useState('');

	const currentTags: string[] = Array.isArray(guildConfig.tags) ? guildConfig.tags : [];

	const handleToggleTag = (tag: string) => {
		const normalized = tag.trim();
		if (!normalized) return;
		if (currentTags.includes(normalized)) {
			setGuildConfig({ ...guildConfig, tags: currentTags.filter((item) => item !== normalized) });
		} else if (currentTags.length < 12) {
			setGuildConfig({ ...guildConfig, tags: [...currentTags, normalized] });
		}
	};

	const handleAddCustomTag = () => {
		const cleaned = tagInput.trim().replace(/^#/, '');
		if (!cleaned) return;
		if (!currentTags.includes(cleaned) && currentTags.length < 12) {
			setGuildConfig({ ...guildConfig, tags: [...currentTags, cleaned] });
		}
		setTagInput('');
	};

	return (
		<>
			{/* Compact Server Sync & Bot Connection Bar */}
			<div
				className={`flex flex-col lg:flex-row lg:items-center justify-between rounded-3xl backdrop-blur-md border shadow-sm ${
					guildConfig.bot ? 'bg-(--foreground)/30 border-(--border)/20' : 'bg-(--accent)/5 border-(--accent)/25'
				}`}
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
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
							<h3 className="text-sm font-extrabold text-(--text) tracking-wide uppercase">{guildConfig.bot ? t('app.dashboard.text2') : t('app.dashboard.botNotConnected')}</h3>
							<span
								className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
									guildConfig.bot ? 'bg-(--accent-green)/15 text-(--accent-green) border-(--accent-green)/30' : 'bg-(--background)/60 text-(--text-muted) border-(--border)/15'
								}`}
							>
								<span className={`w-1.5 h-1.5 rounded-full ${guildConfig.bot ? 'bg-(--accent-green)' : 'bg-(--text-muted)'}`} />
								{t('app.dashboard.text4')}: {guildConfig.bot ? t('common.yes') : t('common.no')}
							</span>
						</div>
						<p className="text-xs text-(--text-muted) mt-0.5 line-clamp-1">{guildConfig.bot ? t('app.dashboard.text3') : t('app.dashboard.botNotConnectedDesc')}</p>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2 shrink-0">
					<div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-(--background)/60 border border-(--border)/10 text-xs">
						<ShieldCheck className={`w-3.5 h-3.5 ${guildConfig.verified ? 'text-(--accent)' : 'text-(--text-muted)'}`} />
						<span className="text-(--text-muted) font-medium">{t('app.dashboard.text5')}:</span>
						<span className="font-bold text-(--text)">{guildConfig.verified ? t('common.yes') : t('common.no')}</span>
					</div>
					<div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-(--background)/60 border border-(--border)/10 text-xs">
						<Globe className="w-3.5 h-3.5 text-(--accent)" />
						<span className="text-(--text-muted) font-medium">{t('app.dashboard.text6')}:</span>
						<span className="font-bold font-mono text-(--text)">{guildConfig.locale || 'en-US'}</span>
					</div>
					{!guildConfig.bot && (
						<a
							href={getEnvUrl('https://xernerx.com/invite/xernerx')}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-extrabold bg-(--accent) text-(--text-active) hover:bg-(--hover-accent) transition-all shadow-sm"
						>
							<Bot className="w-4 h-4" />
							{t('app.dashboard.inviteXernerxBot')}
							<ExternalLink className="w-3.5 h-3.5 opacity-80" />
						</a>
					)}
				</div>
			</div>

			{/* Server Info Card */}
			<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-3xl shadow-xl" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				<div className="flex items-center gap-3 text-(--text) font-extrabold text-sm tracking-widest uppercase">
					<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
						<Settings className="w-4 h-4" />
					</div>
					{t('app.dashboard.text7')}
				</div>

				<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
					<div className="flex flex-col gap-2">
						<label className="text-sm font-bold text-(--text)">{t('app.dashboard.text8')}</label>
						<Input value={guildConfig.description || ''} onChange={(e) => setGuildConfig({ ...guildConfig, description: e.target.value })} placeholder={t('app.dashboard.placeholder1')} />
					</div>
					<Markdown
						editable
						label={t('app.dashboard.text9')}
						value={guildConfig.info || ''}
						onChange={(val) => setGuildConfig({ ...guildConfig, info: val })}
						placeholder={t('app.dashboard.placeholder2')}
						emptyText={t('app.portal.info.nothingToPreview')}
						rows={4}
					/>

					{/* Community & Discovery Tags */}
					<div className="pt-2 border-t border-(--border)/10 flex flex-col gap-3">
						<div className="flex items-center justify-between gap-2">
							<div>
								<label className="text-sm font-bold text-(--text) flex items-center gap-1.5">
									<Tag className="w-4 h-4 text-(--accent)" />
									{t('app.dashboard.tagsLabel')}
								</label>
								<p className="text-xs text-(--text-muted) mt-0.5">{t('app.dashboard.tagsDesc')}</p>
							</div>
							<span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-(--background)/60 border border-(--border)/10 text-(--text-muted)">{currentTags.length} / 12</span>
						</div>

						{currentTags.length > 0 && (
							<div className="flex flex-wrap gap-2">
								{currentTags.map((tag) => (
									<span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
										#{tag}
										<button type="button" onClick={() => handleToggleTag(tag)} className="hover:text-(--text) transition-colors" aria-label={`Remove ${tag}`}>
											<X className="w-3.5 h-3.5" />
										</button>
									</span>
								))}
							</div>
						)}

						<div className="flex items-center gap-2">
							<div className="flex-1">
								<Input
									value={tagInput}
									onChange={(e) => setTagInput(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault();
											handleAddCustomTag();
										}
									}}
									placeholder={t('app.dashboard.tagsPlaceholder')}
								/>
							</div>
							<button
								type="button"
								onClick={handleAddCustomTag}
								disabled={!tagInput.trim() || currentTags.length >= 12}
								className="px-4 py-2.5 rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30 hover:bg-(--accent) hover:text-(--text-active) disabled:opacity-40 transition-all text-xs font-bold inline-flex items-center gap-1.5 shrink-0"
							>
								<Plus className="w-4 h-4" />
								{t('common.add')}
							</button>
						</div>

						<div className="flex flex-wrap gap-1.5 pt-1">
							{PRESET_SERVER_TAGS.map((preset) => {
								const active = currentTags.includes(preset);
								return (
									<button
										key={preset}
										type="button"
										onClick={() => handleToggleTag(preset)}
										className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
											active
												? 'bg-(--accent) text-(--text-active) border-(--accent) shadow-sm'
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
		</>
	);
}
