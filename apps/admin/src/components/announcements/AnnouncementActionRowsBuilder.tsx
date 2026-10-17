/** @format */
'use client';

import React from 'react';
import { Plus, Trash } from 'lucide-react';
import { Button } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import type { ComponentRow } from './types';

interface AnnouncementActionRowsBuilderProps {
	components: ComponentRow[];
	setComponents: React.Dispatch<React.SetStateAction<ComponentRow[]>>;
}

export function AnnouncementActionRowsBuilder({ components, setComponents }: AnnouncementActionRowsBuilderProps) {
	const { t } = useDictionary();

	const addActionRow = () => setComponents([...components, { type: 1, components: [] }]);
	const removeActionRow = (index: number) => setComponents(components.filter((_, i) => i !== index));

	const addButtonToRow = (rowIndex: number) => {
		const arr = [...components];
		arr[rowIndex].components.push({ type: 2, style: 1, label: t('admin.dashboard.announcements.newButton'), custom_id: `btn_${Date.now()}` });
		setComponents(arr);
	};

	const updateButton = (rowIndex: number, btnIndex: number, key: string, val: any) => {
		const arr = [...components];
		(arr[rowIndex].components[btnIndex] as any)[key] = val;
		setComponents(arr);
	};

	const removeButton = (rowIndex: number, btnIndex: number) => {
		const arr = [...components];
		arr[rowIndex].components = arr[rowIndex].components.filter((_, i) => i !== btnIndex);
		setComponents(arr);
	};

	return (
		<div className="flex flex-col gap-2 mt-4">
			{components.map((row, rIdx) => (
				<div key={rIdx} className="flex gap-2 flex-wrap items-center relative group max-w-xl">
					{row.components.map((btn, bIdx) => {
						const styleColors: Record<number, string> = {
							1: 'bg-[#5865F2] hover:bg-[#4752C4]',
							2: 'bg-[#4F545C] hover:bg-[#40444B]',
							3: 'bg-[#2D7D46] hover:bg-[#236337]',
							4: 'bg-[#D83C3E] hover:bg-[#A12D2F]',
							5: 'bg-[#4F545C] hover:bg-[#40444B]',
						};

						return (
							<div
								key={bIdx}
								className={`relative flex items-center ${styleColors[btn.style] || styleColors[2]} text-white px-3 py-1.5 rounded font-medium text-sm transition-colors group/btn`}
							>
								<input
									placeholder={t('admin.dashboard.announcements.label')}
									value={btn.label || ''}
									onChange={(e) => updateButton(rIdx, bIdx, 'label', e.target.value)}
									className="bg-transparent outline-none w-full text-center placeholder:text-white/50 w-20"
								/>

								{/* Editor Popout */}
								<div className="absolute bottom-10 left-0 bg-(--foreground) border border-(--border)/10 p-3 rounded-lg hidden group-hover/btn:flex flex-col gap-2 z-20 w-48 shadow-xl">
									<label className="text-[10px] uppercase font-bold text-(--text-muted)">{t('admin.dashboard.announcements.buttonStyle')}</label>
									<select
										value={btn.style}
										onChange={(e) => updateButton(rIdx, bIdx, 'style', parseInt(e.target.value))}
										className="bg-(--background) text-xs outline-none p-1 rounded text-(--text)"
									>
										<option value={1}>{t('admin.dashboard.announcements.stylePrimary')}</option>
										<option value={2}>{t('admin.dashboard.announcements.styleSecondary')}</option>
										<option value={3}>{t('admin.dashboard.announcements.styleSuccess')}</option>
										<option value={4}>{t('admin.dashboard.announcements.styleDanger')}</option>
										<option value={5}>{t('admin.dashboard.announcements.styleLink')}</option>
									</select>
									<label className="text-[10px] uppercase font-bold text-(--text-muted) mt-1">
										{btn.style === 5 ? t('admin.dashboard.announcements.url') : t('admin.dashboard.announcements.customId')}
									</label>
									{btn.style === 5 ? (
										<input
											placeholder="https://..."
											value={btn.url || ''}
											onChange={(e) => updateButton(rIdx, bIdx, 'url', e.target.value)}
											className="bg-(--background) p-1 rounded text-xs outline-none placeholder:text-(--text-muted) text-(--text)"
										/>
									) : (
										<input
											placeholder="custom_id"
											value={btn.custom_id || ''}
											onChange={(e) => updateButton(rIdx, bIdx, 'custom_id', e.target.value)}
											className="bg-(--background) p-1 rounded text-xs outline-none placeholder:text-(--text-muted) text-(--text)"
										/>
									)}
									<button type="button" onClick={() => removeButton(rIdx, bIdx)} className="text-red-400 text-xs text-left mt-1 hover:text-red-300">
										<Trash size={12} className="inline mr-1 -mt-0.5" /> {t('admin.dashboard.announcements.removeButton')}
									</button>
								</div>
							</div>
						);
					})}

					{row.components.length < 5 && (
						<button
							type="button"
							onClick={() => addButtonToRow(rIdx)}
							className="text-[#4F545C] hover:text-(--text) flex items-center justify-center w-8 h-8 rounded border border-dashed border-[#4F545C] transition-colors"
						>
							<Plus size={16} />
						</button>
					)}

					<button type="button" onClick={() => removeActionRow(rIdx)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
						<Trash size={14} />
					</button>
				</div>
			))}

			{components.length < 5 && (
				<Button type="button" variant="ghost" onClick={addActionRow} style={{ alignSelf: 'flex-start' }} className="text-xs mt-1">
					<Plus size={14} className="mr-1" /> {t('admin.dashboard.announcements.addActionRow')}
				</Button>
			)}
		</div>
	);
}
