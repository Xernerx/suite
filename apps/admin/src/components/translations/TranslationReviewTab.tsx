/** @format */
'use client';

import React, { useMemo, useState } from 'react';
import { Copy, Filter } from 'lucide-react';
import { Button, Input } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

interface TranslationReviewTabProps {
	reviewSearch: string;
	setReviewSearch: (search: string) => void;
	filteredReviewKeys: string[];
	sourceDict: Record<string, string>;
	targetDict: Record<string, string>;
	onInputChange: (key: string, value: string) => void;
	selectedLocale: string;
}

export function TranslationReviewTab({ reviewSearch, setReviewSearch, filteredReviewKeys, sourceDict, targetDict, onInputChange, selectedLocale }: TranslationReviewTabProps) {
	const { t } = useDictionary();
	const [missingOnly, setMissingOnly] = useState(false);

	const { totalCount, translatedCount, missingCount, completionPercent } = useMemo(() => {
		const keys = Object.keys(sourceDict);
		const total = keys.length;
		const translated = keys.filter((k) => targetDict[k] && String(targetDict[k]).trim() !== '').length;
		const missing = total - translated;
		const percent = total > 0 ? Math.round((translated / total) * 100) : 100;
		return { totalCount: total, translatedCount: translated, missingCount: missing, completionPercent: percent };
	}, [sourceDict, targetDict]);

	const displayedKeys = useMemo(() => {
		if (!missingOnly) return filteredReviewKeys;
		return filteredReviewKeys.filter((key) => !targetDict[key] || String(targetDict[key]).trim() === '');
	}, [filteredReviewKeys, missingOnly, targetDict]);

	return (
		<div
			className="flex flex-col"
			style={{
				gap: 'var(--ui-gap)',
			}}
		>
			<div
				className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{
					padding: 'var(--ui-gap)',
					gap: 'calc(var(--ui-gap) * 0.75)',
				}}
			>
				<div className="flex flex-wrap items-center justify-between gap-2">
					<span className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">
						{t('admin.translations.review.completionProgress', {
							translated: translatedCount,
							total: totalCount,
							percent: completionPercent,
						})}
					</span>
					<span className={`text-xs font-bold ${completionPercent === 100 ? 'text-emerald-500' : 'text-amber-500'}`}>{completionPercent}%</span>
				</div>
				<div className="h-2.5 w-full overflow-hidden rounded-full bg-(--background)/80 border border-(--border)/10">
					<div
						className={`h-full rounded-full transition-all duration-300 ${completionPercent === 100 ? 'bg-emerald-500' : 'bg-(--accent)'}`}
						style={{ width: `${Math.min(100, Math.max(0, completionPercent))}%` }}
					/>
				</div>
			</div>

			<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
				<div className="relative flex-1">
					<Input variant="search" shortcut={true} placeholder={t('admin.translations.review.searchPlaceholder')} value={reviewSearch} onChange={(e) => setReviewSearch(e.target.value)} />
				</div>
				<Button variant={missingOnly ? 'primary' : 'secondary'} onClick={() => setMissingOnly((prev) => !prev)} className="gap-2 rounded-2xl px-4 py-2.5 shrink-0">
					<Filter size={15} />
					{t('admin.translations.review.missingOnly', { count: missingCount })}
				</Button>
			</div>

			<div
				className="flex flex-col"
				style={{
					gap: 'var(--ui-gap)',
				}}
			>
				{displayedKeys.length === 0 ? (
					<div className="flex flex-col items-center justify-center rounded-3xl border border-(--border)/10 bg-(--foreground) py-16 text-center">
						<p className="text-sm text-(--text-muted)">{t('admin.translations.review.noKeysFound')}</p>
					</div>
				) : (
					displayedKeys.map((key) => {
						const isMissing = !targetDict[key] || String(targetDict[key]).trim() === '';
						const sourceText = String(sourceDict[key] || '');
						const targetText = String(targetDict[key] || '');
						return (
							<div
								key={key}
								className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
								style={{
									padding: 'var(--ui-gap)',
									gap: 'calc(var(--ui-gap) * 0.5)',
								}}
							>
								<div className="flex flex-wrap items-center justify-between gap-2">
									<span className="text-xs font-mono text-(--accent)">{key}</span>
									<div className="flex items-center gap-2">
										{isMissing && (
											<span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border text-amber-500 bg-amber-500/10 border-amber-500/20">
												{t('admin.translations.review.missingKey')}
											</span>
										)}
										<button
											type="button"
											onClick={() => onInputChange(key, sourceText)}
											className="inline-flex items-center gap-1.5 rounded-full border border-(--border)/15 bg-(--background)/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-(--text-muted) hover:border-(--accent)/40 hover:text-(--text) transition-colors cursor-pointer"
										>
											<Copy size={11} />
											{t('admin.translations.review.copySource')}
										</button>
									</div>
								</div>
								<p className="text-sm font-medium text-(--text) bg-(--background)/50 backdrop-blur-md p-3.5 rounded-2xl border border-(--border)/10">{sourceText}</p>
								<Input
									type="text"
									value={targetText}
									onChange={(e) => onInputChange(key, e.target.value)}
									placeholder={t('admin.translations.review.translateInto', {
										locale: selectedLocale,
									})}
								/>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
}
