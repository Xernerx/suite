/** @format */
'use client';

import React from 'react';
import { BookOpen, ListOrdered, Sparkles } from 'lucide-react';
import { Selector } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

interface TranslationTabsProps {
	activeTab: 'welcome' | 'new' | 'review';
	setActiveTab: (tab: 'welcome' | 'new' | 'review') => void;
	missingKeysCount: number;
}

export function TranslationTabs({ activeTab, setActiveTab, missingKeysCount }: TranslationTabsProps) {
	const { t } = useDictionary();

	const newEntriesLabel =
		typeof t('admin.translations.tabs.newEntries') === 'string' ? t('admin.translations.tabs.newEntries').replace(/\s*\(\{count\}\)/g, '') : t('admin.translations.tabs.newEntries');

	const reviewExistingLabel =
		typeof t('admin.translations.tabs.reviewExisting') === 'string' ? t('admin.translations.tabs.reviewExisting').replace(/\s*\(\{count\}\)/g, '') : t('admin.translations.tabs.reviewExisting');

	return (
		<>
			{/* Mobile Tab Selector */}
			<div className="relative z-10 sm:hidden w-full">
				<Selector
					items={true}
					value={activeTab}
					onChange={(val) => {
						if (val === 'new' && missingKeysCount === 0) return;
						setActiveTab(val as any);
					}}
					options={[
						{
							value: 'welcome',
							label: (
								<div className="flex items-center gap-2">
									<BookOpen size={16} />
									{t('admin.translations.tabs.introduction')}
								</div>
							),
						},
						{
							value: 'new',
							label: (
								<div className={`flex items-center gap-2 ${missingKeysCount === 0 ? 'opacity-50' : ''}`}>
									<Sparkles size={16} />
									{newEntriesLabel}
								</div>
							),
						},
						{
							value: 'review',
							label: (
								<div className="flex items-center gap-2">
									<ListOrdered size={16} />
									{reviewExistingLabel}
								</div>
							),
						},
					]}
				/>
			</div>

			{/* Desktop Tab Buttons */}
			<div
				className="hidden sm:flex items-center overflow-x-auto hide-scrollbar rounded-2xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md p-1.5 shadow-sm"
				style={{
					gap: 'calc(var(--ui-gap) * 0.5)',
				}}
			>
				<button
					type="button"
					onClick={() => setActiveTab('welcome')}
					className={`shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
						activeTab === 'welcome' ? 'bg-(--accent) text-white shadow-sm' : 'text-(--text-muted) hover:text-(--text) hover:bg-(--border)/5'
					}`}
				>
					<BookOpen size={16} />
					{t('admin.translations.tabs.introduction')}
				</button>
				<button
					type="button"
					onClick={() => setActiveTab('new')}
					disabled={missingKeysCount === 0}
					className={`shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
						missingKeysCount === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
					} ${activeTab === 'new' ? 'bg-(--accent) text-white shadow-sm' : 'text-(--text-muted) hover:text-(--text) hover:bg-(--border)/5'}`}
				>
					<Sparkles size={16} />
					{newEntriesLabel}
				</button>
				<button
					type="button"
					onClick={() => setActiveTab('review')}
					className={`shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
						activeTab === 'review' ? 'bg-(--accent) text-white shadow-sm' : 'text-(--text-muted) hover:text-(--text) hover:bg-(--border)/5'
					}`}
				>
					<ListOrdered size={16} />
					{reviewExistingLabel}
				</button>
			</div>
		</>
	);
}
