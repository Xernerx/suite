/** @format */
'use client';

import React from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button, Input } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

interface TranslationNewTabProps {
	missingKeys: string[];
	newIndex: number;
	setNewIndex: React.Dispatch<React.SetStateAction<number>>;
	sourceDict: Record<string, string>;
	targetDict: Record<string, string>;
	onInputChange: (key: string, value: string) => void;
	selectedLocale: string;
	currentLocaleObj?: { code: string; label: string; coverage: number };
	onSwitchToReview: () => void;
}

export function TranslationNewTab({ missingKeys, newIndex, setNewIndex, sourceDict, targetDict, onInputChange, selectedLocale, currentLocaleObj, onSwitchToReview }: TranslationNewTabProps) {
	const { t } = useDictionary();

	if (missingKeys.length === 0) {
		return (
			<div
				className="flex flex-col items-center justify-center rounded-3xl border border-(--border)/10 bg-(--foreground) text-center shadow-sm"
				style={{
					padding: 'calc(var(--ui-gap) * 2.5)',
					gap: 'var(--ui-gap)',
				}}
			>
				<div className="flex items-center justify-center rounded-full bg-(--accent-green)/10 text-(--accent-green) w-16 h-16">
					<Check size={32} />
				</div>
				<div className="flex flex-col gap-1">
					<h3 className="text-xl font-bold text-(--text)">{t('admin.translations.new.allCaughtUp')}</h3>
					<p className="text-sm text-(--text-muted)">
						{t('admin.translations.new.noMissingKeys', {
							locale: currentLocaleObj?.label || selectedLocale,
						})}
					</p>
				</div>
				<Button onClick={onSwitchToReview} className="rounded-xl px-5 py-2.5">
					{t('admin.translations.new.reviewExistingButton')}
				</Button>
			</div>
		);
	}

	const currentKey = missingKeys[newIndex] || missingKeys[0];
	const sourceText = sourceDict[currentKey];
	const currentVal = targetDict[currentKey] || '';

	return (
		<div
			className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
			style={{
				padding: 'calc(var(--ui-gap) * 1.5)',
				gap: 'var(--ui-gap)',
			}}
		>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="text-xs font-mono text-(--accent)">{currentKey}</span>
				</div>
				<span className="text-xs font-medium text-(--text-muted)">
					{t('admin.translations.new.cardCounter', {
						current: newIndex + 1,
						total: missingKeys.length,
					})}
				</span>
			</div>

			<div
				className="flex flex-col"
				style={{
					gap: 'calc(var(--ui-gap) * 0.5)',
				}}
			>
				<label className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">
					{t('admin.translations.new.translateInstruction', {
						locale: currentLocaleObj?.label || selectedLocale,
					})}
				</label>
				<p className="text-base font-medium text-(--text) bg-(--background)/50 backdrop-blur-md p-4 rounded-2xl border border-(--border)/10">{sourceText}</p>
			</div>

			<div
				className="flex flex-col"
				style={{
					gap: 'calc(var(--ui-gap) * 0.5)',
				}}
			>
				<label className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">{t('admin.translations.new.yourTranslation')}</label>
				<Input
					type="text"
					value={currentVal}
					onChange={(e) => onInputChange(currentKey, e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter' && newIndex < missingKeys.length - 1) {
							setNewIndex((prev) => prev + 1);
						}
					}}
					autoFocus
					placeholder={t('admin.translations.new.typePlaceholder')}
				/>
			</div>

			<div className="flex items-center justify-between pt-2">
				<Button
					onClick={() => setNewIndex((prev) => Math.max(0, prev - 1))}
					disabled={newIndex === 0}
					className="gap-2 rounded-xl px-4 py-2 border border-(--border)/20 bg-transparent text-(--text) hover:bg-(--border)/5 disabled:opacity-40"
				>
					<ArrowLeft size={16} />
					{t('admin.translations.new.previous')}
				</Button>

				<Button
					onClick={() => {
						if (newIndex < missingKeys.length - 1) {
							setNewIndex((prev) => prev + 1);
						} else {
							onSwitchToReview();
						}
					}}
					className="gap-2 rounded-xl px-5 py-2.5"
				>
					{newIndex < missingKeys.length - 1 ? t('admin.translations.new.next') : t('admin.translations.new.finish')}
					<ArrowRight size={16} />
				</Button>
			</div>
		</div>
	);
}
