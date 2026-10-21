/** @format */
'use client';

import React from 'react';
import { Plus, Trash } from 'lucide-react';
import { Button, Input, Selector } from '@xernerx/ui';
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
							1: 'bg-(--accent) hover:bg-(--hover-accent) text-white',
							2: 'bg-(--foreground) hover:bg-(--foreground)/80 text-(--text) border border-(--border)/10',
							3: 'bg-(--accent-green) hover:opacity-90 text-white',
							4: 'bg-(--accent-red) hover:opacity-90 text-white',
							5: 'bg-(--foreground) hover:bg-(--foreground)/80 text-(--text) border border-(--border)/10',
						};

						return (
							<div key={bIdx} className={`relative flex items-center ${styleColors[btn.style] || styleColors[2]} px-3 py-1.5 rounded-xl font-medium text-sm transition-colors group/btn`}>
								<Input
									placeholder={t('admin.dashboard.announcements.label')}
									value={btn.label || ''}
									onChange={(e) => updateButton(rIdx, bIdx, 'label', e.target.value)}
									className="!bg-transparent !border-none !p-0 !rounded-none !ring-0 outline-none text-center placeholder:opacity-50 w-20"
								/>

								{/* Editor Popout */}
								<div className="absolute bottom-10 left-0 bg-(--foreground) border border-(--border)/10 p-3 rounded-2xl hidden group-hover/btn:flex flex-col gap-2 z-20 w-56 shadow-xl">
									<label className="text-[10px] uppercase font-bold text-(--text-muted)">{t('admin.dashboard.announcements.buttonStyle')}</label>
									<Selector
										value={String(btn.style)}
										onChange={(val) => updateButton(rIdx, bIdx, 'style', parseInt(val, 10))}
										options={[
											{ value: '1', label: t('admin.dashboard.announcements.stylePrimary') },
											{ value: '2', label: t('admin.dashboard.announcements.styleSecondary') },
											{ value: '3', label: t('admin.dashboard.announcements.styleSuccess') },
											{ value: '4', label: t('admin.dashboard.announcements.styleDanger') },
											{ value: '5', label: t('admin.dashboard.announcements.styleLink') },
										]}
									/>
									<label className="text-[10px] uppercase font-bold text-(--text-muted) mt-1">
										{btn.style === 5 ? t('admin.dashboard.announcements.url') : t('admin.dashboard.announcements.customId')}
									</label>
									{btn.style === 5 ? (
										<Input placeholder="https://..." value={btn.url || ''} onChange={(e) => updateButton(rIdx, bIdx, 'url', e.target.value)} className="text-xs" />
									) : (
										<Input placeholder="custom_id" value={btn.custom_id || ''} onChange={(e) => updateButton(rIdx, bIdx, 'custom_id', e.target.value)} className="text-xs" />
									)}
									<button type="button" onClick={() => removeButton(rIdx, bIdx)} className="text-(--accent-red) text-xs text-left mt-1 hover:opacity-80 cursor-pointer">
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
							className="text-(--text-muted) hover:text-(--text) flex items-center justify-center w-8 h-8 rounded-xl border border-dashed border-(--border)/30 transition-colors"
						>
							<Plus size={16} />
						</button>
					)}

					<button type="button" onClick={() => removeActionRow(rIdx)} className="text-(--accent-red) opacity-0 group-hover:opacity-100 transition-opacity ml-2">
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
