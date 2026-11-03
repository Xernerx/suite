/** @format */
'use client';

import { useState } from 'react';
import { Settings, Server, Bot, ExternalLink, Tag, Plus, X } from 'lucide-react';
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
			{/* Server Sync Data Card */}
			{guildConfig.bot ? (
				<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-3xl shadow-xl h-min" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
					<div className="flex items-center gap-3 text-(--text) font-extrabold text-sm tracking-widest uppercase">
						<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
							<Server className="w-4 h-4" />
						</div>
						{t('app.dashboard.text2')}
					</div>
					<p className="text-xs text-(--text-muted) p-4 bg-(--accent)/5 rounded-2xl border border-(--accent)/10 text-(--accent)">{t('app.dashboard.text3')}</p>

					<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
						<div className="flex flex-col gap-2">
							<label className="text-sm font-bold text-(--text) ml-1">{t('app.dashboard.text4')}</label>
							<div className="bg-(--background)/50 border border-(--border)/10 rounded-2xl px-5 py-3.5 flex items-center gap-3 text-(--text-muted) cursor-not-allowed opacity-70">
								<Settings className="w-5 h-5 opacity-50" />
								{guildConfig.bot ? t('common.yes') : t('common.no')}
							</div>
						</div>
						<div className="flex flex-col gap-2">
							<label className="text-sm font-bold text-(--text) ml-1">{t('app.dashboard.text5')}</label>
							<div className="bg-(--background)/50 border border-(--border)/10 rounded-2xl px-5 py-3.5 flex items-center gap-3 text-(--text-muted) cursor-not-allowed opacity-70">
								<Settings className="w-5 h-5 opacity-50" />
								{guildConfig.verified ? t('common.yes') : t('common.no')}
							</div>
						</div>
						<div className="flex flex-col gap-2">
							<label className="text-sm font-bold text-(--text) ml-1">{t('app.dashboard.text6')}</label>
							<div className="bg-(--background)/50 border border-(--border)/10 rounded-2xl px-5 py-3.5 flex items-center gap-3 text-(--text-muted) cursor-not-allowed opacity-70">
								<Settings className="w-5 h-5 opacity-50" />
								{guildConfig.locale || 'en-US'}
							</div>
						</div>
					</div>
				</div>
			) : (
				<div className="flex flex-col items-center text-center justify-center bg-(--accent)/5 border border-(--accent)/20 rounded-[2rem] p-10 shadow-xl h-min animate-in fade-in zoom-in-95 duration-300">
					<div className="w-16 h-16 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent) mb-4 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_20%,transparent)]">
						<Server className="w-8 h-8" />
					</div>
					<h3 className="text-xl font-extrabold text-(--text) mb-2">{t('app.dashboard.botNotConnected')}</h3>
					<p className="text-sm text-(--text-muted) mb-6 max-w-sm">{t('app.dashboard.botNotConnectedDesc')}</p>
					<div className="flex flex-wrap items-center justify-center gap-3">
						<a
							href={getEnvUrl('https://xernerx.com/invite/xernerx')}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold bg-(--accent) text-(--text-active) hover:bg-(--hover-accent) transition-all shadow-sm"
						>
							<Bot className="w-4 h-4" />
							{t('app.dashboard.inviteXernerxBot')}
							<ExternalLink className="w-3.5 h-3.5 opacity-80" />
						</a>
					</div>
				</div>
			)}

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
