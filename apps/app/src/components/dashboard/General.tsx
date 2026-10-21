/** @format */
'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Settings, Server } from 'lucide-react';
import { Input } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

interface GeneralProps {
	guildConfig: any;
	setGuildConfig: (config: any) => void;
}

export default function General({ guildConfig, setGuildConfig }: GeneralProps) {
	const { t } = useDictionary();
	const [markdownPreview, setMarkdownPreview] = useState(false);

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
					<p className="text-sm text-(--text-muted) mb-6 max-w-sm">{t('app.dashboard.text3')}</p>
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
					<div className="flex flex-col gap-2">
						<div className="flex items-center justify-between">
							<label className="text-sm font-bold text-(--text)">{t('app.dashboard.text9')}</label>
							<div className="flex items-center bg-(--foreground)/30 border border-(--border)/10 rounded-lg p-1 text-xs">
								<button
									type="button"
									onClick={() => setMarkdownPreview(false)}
									className={`px-3 py-1 rounded-xl transition-colors ${!markdownPreview ? 'bg-(--accent) text-white shadow-sm' : 'text-(--text-muted) hover:text-(--text)'}`}
								>
									{t('app.portal.info.write')}
								</button>
								<button
									type="button"
									onClick={() => setMarkdownPreview(true)}
									className={`px-3 py-1 rounded-xl transition-colors ${markdownPreview ? 'bg-(--accent) text-white shadow-sm' : 'text-(--text-muted) hover:text-(--text)'}`}
								>
									{t('app.portal.info.preview')}
								</button>
							</div>
						</div>

						{markdownPreview ? (
							<div className="w-full min-h-[120px] rounded-xl border border-(--border)/10 bg-(--background)/50 p-6 text-sm overflow-auto prose max-w-none prose-headings:font-fredoka">
								{guildConfig.info ? <ReactMarkdown>{guildConfig.info}</ReactMarkdown> : <span className="text-(--text-muted) italic">{t('app.portal.info.nothingToPreview')}</span>}
							</div>
						) : (
							<Input
								variant="textarea"
								value={guildConfig.info || ''}
								onChange={(e) => setGuildConfig({ ...guildConfig, info: e.target.value })}
								placeholder={t('app.dashboard.placeholder2')}
								rows={4}
								className="resize-none min-h-[120px]"
							/>
						)}
					</div>
				</div>
			</div>
		</>
	);
}
