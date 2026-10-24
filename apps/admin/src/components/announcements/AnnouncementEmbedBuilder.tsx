/** @format */
'use client';

import React from 'react';
import Image from 'next/image';
import { Plus, Trash } from 'lucide-react';
import { Button, Input } from '@xernerx/ui';
import { useDictionary, useUser } from '@xernerx/providers';
import type { EmbedData } from './types';

interface AnnouncementEmbedBuilderProps {
	embeds: EmbedData[];
	setEmbeds: React.Dispatch<React.SetStateAction<EmbedData[]>>;
}

export function AnnouncementEmbedBuilder({ embeds, setEmbeds }: AnnouncementEmbedBuilderProps) {
	const { t } = useDictionary();
	const { user } = useUser();

	const addEmbed = () => {
		const avatarUrl = user?.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : undefined;
		setEmbeds([
			...embeds,
			{
				title: '',
				description: '',
				color: '#8b7cf6',
				fields: [],
				author: { name: '' },
				footer: {
					text: user?.username || user?.global_name || '',
					icon_url: avatarUrl,
				},
				timestamp: new Date().toISOString(),
			},
		]);
	};

	const updateEmbed = (index: number, key: string, val: any) => {
		const arr = [...embeds];
		(arr[index] as any)[key] = val;
		setEmbeds(arr);
	};

	const removeEmbed = (index: number) => setEmbeds(embeds.filter((_, i) => i !== index));

	const addField = (embedIndex: number) => {
		const arr = [...embeds];
		if (!arr[embedIndex].fields) arr[embedIndex].fields = [];
		arr[embedIndex].fields!.push({ name: '', value: '', inline: false });
		setEmbeds(arr);
	};

	const updateField = (embedIndex: number, fieldIndex: number, key: string, val: any) => {
		const arr = [...embeds];
		(arr[embedIndex].fields![fieldIndex] as any)[key] = val;
		setEmbeds(arr);
	};

	const removeField = (embedIndex: number, fieldIndex: number) => {
		const arr = [...embeds];
		arr[embedIndex].fields = arr[embedIndex].fields!.filter((_: any, i: number) => i !== fieldIndex);
		setEmbeds(arr);
	};

	return (
		<div className="flex flex-col gap-2 mt-4">
			<h3 className="font-semibold text-(--text) text-sm mb-2">{t('admin.dashboard.announcements.builderTitle')}</h3>

			{embeds.map((emb, eIdx) => (
				<div key={eIdx} className="relative flex group max-w-xl">
					{/* The left color pillar */}
					<div
						className="w-1.5 rounded-l-xl relative shrink-0 cursor-pointer transition-transform hover:scale-x-150 origin-left"
						style={{ backgroundColor: typeof emb.color === 'string' ? emb.color : '#202225' }}
					>
						<Input
							type="color"
							className="absolute inset-0 opacity-0 cursor-pointer w-[200%] h-full -ml-2 !p-0 !border-none"
							value={typeof emb.color === 'string' ? emb.color : '#000000'}
							onChange={(e) => updateEmbed(eIdx, 'color', e.target.value)}
							title={t('admin.dashboard.announcements.changeColor')}
						/>
					</div>

					{/* The embed body */}
					<div className="bg-(--background) border border-(--border)/10 rounded-r-xl p-4 flex flex-col gap-1 flex-1 relative min-w-0">
						<button type="button" onClick={() => removeEmbed(eIdx)} className="absolute top-2 right-2 text-(--accent-red) opacity-0 group-hover:opacity-100 transition-opacity">
							<Trash size={14} />
						</button>

						{/* Author */}
						<div className="flex items-center gap-2 text-xs font-semibold mb-1">
							<Input
								placeholder={t('admin.dashboard.announcements.authorName')}
								value={emb.author?.name || ''}
								onChange={(e) => updateEmbed(eIdx, 'author', { ...emb.author, name: e.target.value })}
								className="!bg-transparent !border-none !p-0 !rounded-none !ring-0 outline-none w-full placeholder:text-(--text-muted) text-(--text) font-bold"
							/>
						</div>
						<Input
							placeholder={t('admin.dashboard.announcements.embedTitle')}
							value={emb.title || ''}
							onChange={(e) => updateEmbed(eIdx, 'title', e.target.value)}
							className="text-base font-bold text-(--accent) !bg-transparent !border-none !p-0 !rounded-none !ring-0 outline-none w-full mb-1 placeholder:text-(--text-muted)"
						/>
						<Input
							variant="textarea"
							placeholder={t('admin.dashboard.announcements.embedDesc')}
							value={emb.description || ''}
							onChange={(e) => updateEmbed(eIdx, 'description', e.target.value)}
							className="!bg-transparent !border-none !p-0 !rounded-none !ring-0 outline-none w-full text-sm text-(--text-muted) placeholder:text-(--text-muted)/50 resize-none min-h-[40px]"
						/>

						{/* Fields */}
						{emb.fields && emb.fields.length > 0 && (
							<div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
								{emb.fields.map((f, fIdx) => (
									<div key={fIdx} className={`flex flex-col relative group/field ${f.inline ? 'w-[30%]' : 'w-full'}`}>
										<Input
											placeholder={t('admin.dashboard.announcements.fieldName')}
											value={f.name}
											onChange={(e) => updateField(eIdx, fIdx, 'name', e.target.value)}
											className="!bg-transparent !border-none !p-0 !rounded-none !ring-0 outline-none font-semibold text-sm text-(--text) placeholder:text-(--text-muted)"
										/>
										<Input
											variant="textarea"
											placeholder={t('admin.dashboard.announcements.fieldValue')}
											value={f.value}
											onChange={(e) => updateField(eIdx, fIdx, 'value', e.target.value)}
											className="!bg-transparent !border-none !p-0 !rounded-none !ring-0 outline-none text-sm text-(--text-muted) placeholder:text-(--text-muted)/50 resize-none min-h-[30px]"
										/>

										<div className="absolute -top-6 -right-2 opacity-0 group-hover/field:opacity-100 flex gap-2 bg-(--foreground) border border-(--border)/10 rounded-xl p-1.5 shadow-lg z-10">
											<button
												type="button"
												onClick={() => updateField(eIdx, fIdx, 'inline', !f.inline)}
												className={`text-[10px] font-bold ${f.inline ? 'text-(--accent-green)' : 'text-(--text-muted)'}`}
											>
												{t('admin.dashboard.announcements.inline')}
											</button>
											<button type="button" onClick={() => removeField(eIdx, fIdx)} className="text-(--accent-red) text-[10px]">
												<Trash size={12} />
											</button>
										</div>
									</div>
								))}
							</div>
						)}
						<button type="button" onClick={() => addField(eIdx)} className="text-xs font-medium text-(--accent) hover:text-(--accent) text-left w-fit mt-1">
							{t('admin.dashboard.announcements.addField')}
						</button>

						{/* Footer */}
						<div className="mt-3 pt-2 flex items-center gap-2 text-xs">
							{emb.footer?.icon_url && (
								<Image
									src={emb.footer.icon_url}
									alt={t('admin.dashboard.announcements.footerIconAlt')}
									width={20}
									height={20}
									unoptimized
									className="w-5 h-5 rounded-full object-cover"
								/>
							)}
							<div className="flex flex-1 items-center gap-1.5 min-w-0 justify-start">
								<Input
									placeholder={t('admin.dashboard.announcements.footerText')}
									value={emb.footer?.text || ''}
									onChange={(e) => updateEmbed(eIdx, 'footer', { ...emb.footer, text: e.target.value })}
									className="!bg-transparent !border-none !p-0 !rounded-none !ring-0 outline-none text-(--text-muted) placeholder:text-(--text-muted)/50 text-[11px]"
									size={Math.max(14, emb.footer?.text?.length || 0)}
								/>
								{emb.timestamp && (
									<>
										<span className="text-(--text-muted) text-[11px] shrink-0 font-bold">•</span>
										<span className="text-(--text-muted) text-[11px] shrink-0 whitespace-nowrap">{new Date(emb.timestamp).toLocaleDateString()}</span>
									</>
								)}
							</div>
						</div>
					</div>
				</div>
			))}

			{embeds.length < 10 && (
				<Button type="button" variant="ghost" onClick={addEmbed} style={{ alignSelf: 'flex-start' }} className="text-xs mt-1">
					<Plus size={14} className="mr-1" /> {t('admin.dashboard.announcements.addEmbed')}
				</Button>
			)}
		</div>
	);
}
