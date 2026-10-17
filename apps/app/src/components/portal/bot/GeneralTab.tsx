/** @format */
'use client';

import { useState } from 'react';
import { Settings } from 'lucide-react';
import { Input } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import ReactMarkdown from 'react-markdown';

interface GeneralTabProps {
	botConfig: any;
	setBotConfig: (config: any) => void;
	availableTags: string[];
}

export default function GeneralTab({ botConfig, setBotConfig, availableTags }: GeneralTabProps) {
	const { t } = useDictionary();
	const [markdownPreview, setMarkdownPreview] = useState(false);

	return (
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
					<div className="flex items-center justify-between">
						<label className="text-sm font-bold text-(--text)">{t('app.portal.bot.general.longDesc')}</label>
						<div className="flex items-center bg-(--foreground)/30 border border-(--border)/10 rounded-lg p-1 text-xs">
							<button
								onClick={() => setMarkdownPreview(false)}
								className={`px-3 py-1 rounded-md transition-colors ${!markdownPreview ? 'bg-(--accent) text-white shadow-sm' : 'text-(--text-muted) hover:text-(--text)'}`}
							>
								{t('app.portal.info.write')}
							</button>
							<button
								onClick={() => setMarkdownPreview(true)}
								className={`px-3 py-1 rounded-md transition-colors ${markdownPreview ? 'bg-(--accent) text-white shadow-sm' : 'text-(--text-muted) hover:text-(--text)'}`}
							>
								{t('app.portal.info.preview')}
							</button>
						</div>
					</div>

					{markdownPreview ? (
						<div className="w-full min-h-[120px] rounded-xl border border-(--border)/10 bg-(--background)/50 p-6 text-sm overflow-auto prose max-w-none prose-headings:font-fredoka">
							{botConfig.info ? <ReactMarkdown>{botConfig.info}</ReactMarkdown> : <span className="text-(--text-muted) italic">{t('app.portal.info.nothingToPreview')}</span>}
						</div>
					) : (
						<textarea
							value={botConfig.info || ''}
							onChange={(e) => setBotConfig({ ...botConfig, info: e.target.value })}
							placeholder={t('app.portal.bot.general.longDescPlaceholder')}
							className="w-full min-h-[120px] rounded-xl border border-(--border)/10 bg-(--foreground)/30 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-(--accent)"
						/>
					)}
				</div>
				<div className="flex flex-col gap-2">
					<label className="text-sm font-bold text-(--text)">{t('app.portal.bot.general.tags')}</label>
					<div className="flex flex-wrap gap-2 mb-1">
						{botConfig.tags?.map((tag: string, i: number) => (
							<span key={i} className="px-2 py-1 bg-(--accent)/10 text-(--accent) text-xs font-semibold rounded-md flex items-center gap-1 border border-(--accent)/20 shadow-sm">
								{tag}
								<button
									onClick={() => setBotConfig({ ...botConfig, tags: botConfig.tags.filter((_: any, idx: number) => idx !== i) })}
									className="hover:text-red-500 transition-colors ml-1"
								>
									×
								</button>
							</span>
						))}
					</div>
					<Input
						placeholder={t('app.portal.bot.general.tagsPlaceholder')}
						list="available-tags"
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault();
								const val = e.currentTarget.value.trim();
								if (val && !(botConfig.tags || []).includes(val)) {
									setBotConfig({ ...botConfig, tags: [...(botConfig.tags || []), val] });
									e.currentTarget.value = '';
								}
							}
						}}
					/>
					<datalist id="available-tags">
						{availableTags
							.filter((t) => !(botConfig.tags || []).includes(t))
							.map((tag) => (
								<option key={tag} value={tag} />
							))}
					</datalist>
				</div>
			</div>
		</div>
	);
}
