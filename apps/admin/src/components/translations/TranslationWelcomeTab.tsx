/** @format */
'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ListOrdered, Sparkles } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';

interface TranslationWelcomeTabProps {
	selectedLocale: string;
	currentLocaleObj?: { code: string; label: string; coverage: number };
	missingKeysCount: number;
	onSelectTab: (tab: 'new' | 'review') => void;
}

export function TranslationWelcomeTab({ selectedLocale, currentLocaleObj, missingKeysCount, onSelectTab }: TranslationWelcomeTabProps) {
	const { t } = useDictionary();

	return (
		<div
			className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
			style={{
				padding: 'calc(var(--ui-gap) * 1.5)',
				gap: 'var(--ui-gap)',
			}}
		>
			<div
				className="flex flex-col"
				style={{
					gap: 'calc(var(--ui-gap) * 0.5)',
				}}
			>
				<h2 className="text-2xl font-black tracking-tight text-(--text)">{t('admin.translations.welcome.title')}</h2>
				<p className="text-sm text-(--text-muted) leading-relaxed">
					{t('admin.translations.welcome.descStart')}
					<span className="font-semibold text-(--text)">{t('admin.translations.welcome.english')}</span>
					{t('admin.translations.welcome.descMiddle')}
					<span className="font-semibold text-(--text)">{currentLocaleObj?.label || selectedLocale}</span>.
				</p>
			</div>

			{/* New Guide Section */}
			<div
				className="flex flex-col rounded-2xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md p-5"
				style={{
					gap: 'calc(var(--ui-gap) * 0.75)',
				}}
			>
				<h3 className="text-sm font-bold text-(--text)">{t('admin.translations.welcome.guide.title')}</h3>
				<ul
					className="flex flex-col text-xs text-(--text-muted) list-disc list-outside ml-4"
					style={{
						gap: 'calc(var(--ui-gap) * 0.4)',
					}}
				>
					<li>{t('admin.translations.welcome.guide.step1')}</li>
					<li>{t('admin.translations.welcome.guide.step2')}</li>
					<li>{t('admin.translations.welcome.guide.step3')}</li>
					<li>{t('admin.translations.welcome.guide.step4')}</li>
					<li>{t('admin.translations.welcome.guide.step5')}</li>
					<li className="leading-relaxed">
						{t('admin.translations.welcome.guide.step6Part1')}
						<Link href="https://admin.canary.xernerx.com?view=translations" className="text-(--accent) font-medium hover:underline">
							{t('admin.translations.welcome.guide.step6Link')}
						</Link>
						{t('admin.translations.welcome.guide.step6Part2')}
					</li>
				</ul>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div
					className="flex flex-col rounded-2xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md p-5"
					style={{
						gap: 'calc(var(--ui-gap) * 0.5)',
					}}
				>
					<div className="flex items-center gap-2 text-(--accent) font-bold text-sm">
						<Sparkles size={18} />
						{t('admin.translations.welcome.newEntriesTitle')}
					</div>
					<p className="text-xs text-(--text-muted)">{t('admin.translations.welcome.newEntriesDesc')}</p>
					<button
						type="button"
						onClick={() => onSelectTab('new')}
						className="mt-2 flex items-center justify-between rounded-xl bg-(--accent)/10 px-4 py-2.5 text-xs font-semibold text-(--accent) hover:bg-(--accent)/20 transition cursor-pointer"
					>
						<span>
							{t('admin.translations.welcome.startTranslating', {
								count: missingKeysCount,
							})}
						</span>
						<ArrowRight size={14} />
					</button>
				</div>

				<div
					className="flex flex-col rounded-2xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md p-5"
					style={{
						gap: 'calc(var(--ui-gap) * 0.5)',
					}}
				>
					<div className="flex items-center gap-2 text-(--accent) font-bold text-sm">
						<ListOrdered size={18} />
						{t('admin.translations.welcome.reviewTitle')}
					</div>
					<p className="text-xs text-(--text-muted)">{t('admin.translations.welcome.reviewDesc')}</p>
					<button
						type="button"
						onClick={() => onSelectTab('review')}
						className="mt-2 flex items-center justify-between rounded-xl border border-(--border)/20 px-4 py-2.5 text-xs font-semibold text-(--text) hover:bg-(--border)/5 transition cursor-pointer"
					>
						<span>{t('admin.translations.welcome.browseAll')}</span>
						<ArrowRight size={14} />
					</button>
				</div>
			</div>

			<div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-600 dark:text-amber-400">
				<CheckCircle2 size={20} className="shrink-0" />
				<span>
					{t('admin.translations.welcome.footerPart1')}
					<strong className="font-semibold">{t('admin.translations.welcome.footerBold')}</strong>
					{t('admin.translations.welcome.footerPart2')}
				</span>
			</div>
		</div>
	);
}
