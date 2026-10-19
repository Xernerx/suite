/** @format */
'use client';

import React from 'react';
import { Input } from '@xernerx/ui';
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

	return (
		<div
			className="flex flex-col"
			style={{
				gap: 'var(--ui-gap)',
			}}
		>
			<div className="relative w-full">
				<Input variant="search" shortcut={true} placeholder={t('admin.translations.review.searchPlaceholder')} value={reviewSearch} onChange={(e) => setReviewSearch(e.target.value)} />
			</div>

			<div
				className="flex flex-col"
				style={{
					gap: 'var(--ui-gap)',
				}}
			>
				{filteredReviewKeys.length === 0 ? (
					<div className="flex flex-col items-center justify-center rounded-3xl border border-(--border)/10 bg-(--foreground) py-16 text-center">
						<p className="text-sm text-(--text-muted)">{t('admin.translations.review.noKeysFound')}</p>
					</div>
				) : (
					filteredReviewKeys.map((key) => {
						const isMissing = !targetDict[key] || targetDict[key].trim() === '';
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
								<div className="flex items-center justify-between">
									<span className="text-xs font-mono text-(--accent)">{key}</span>
									{isMissing && (
										<span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border text-amber-500 bg-amber-500/10 border-amber-500/20">
											{t('admin.translations.review.missingKey')}
										</span>
									)}
								</div>
								<p className="text-sm font-medium text-(--text) bg-(--background)/50 backdrop-blur-md p-3.5 rounded-2xl border border-(--border)/10">{sourceText}</p>
								<input
									type="text"
									value={targetText}
									onChange={(e) => onInputChange(key, e.target.value)}
									placeholder={t('admin.translations.review.translateInto', {
										locale: selectedLocale,
									})}
									className="w-full rounded-2xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md px-4 py-2.5 text-sm text-(--text) outline-none transition focus:border-(--accent) focus:ring-2 focus:ring-(--accent)"
								/>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
}
