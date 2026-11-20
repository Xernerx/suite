/** @format */

'use client';

import { Layers } from 'lucide-react';
import React, { useId } from 'react';
import { useDictionary } from '@xernerx/providers';

export function SuiteComparisonTable() {
	const { t } = useDictionary();
	const captionId = useId();

	const colCapability = t('www.comparison.columns.capability');
	const colFree = t('www.comparison.columns.free');
	const colPasses = t('www.comparison.columns.passes');
	const colDeveloper = t('www.comparison.columns.developer');
	const colTraditional = t('www.comparison.columns.traditional');

	const rows = [
		{
			id: 'audience',
			label: t('www.comparison.rows.audience.label'),
			free: t('www.comparison.rows.audience.free'),
			passes: t('www.comparison.rows.audience.passes'),
			developer: t('www.comparison.rows.audience.developer'),
			traditional: t('www.comparison.rows.audience.traditional'),
		},
		{
			id: 'pricing',
			label: t('www.comparison.rows.pricing.label'),
			free: t('www.comparison.rows.pricing.free'),
			passes: t('www.comparison.rows.pricing.passes'),
			developer: t('www.comparison.rows.pricing.developer'),
			traditional: t('www.comparison.rows.pricing.traditional'),
		},
		{
			id: 'identity',
			label: t('www.comparison.rows.identity.label'),
			free: t('www.comparison.rows.identity.free'),
			passes: t('www.comparison.rows.identity.passes'),
			developer: t('www.comparison.rows.identity.developer'),
			traditional: t('www.comparison.rows.identity.traditional'),
		},
		{
			id: 'privacy',
			label: t('www.comparison.rows.privacy.label'),
			free: t('www.comparison.rows.privacy.free'),
			passes: t('www.comparison.rows.privacy.passes'),
			developer: t('www.comparison.rows.privacy.developer'),
			traditional: t('www.comparison.rows.privacy.traditional'),
		},
		{
			id: 'config',
			label: t('www.comparison.rows.config.label'),
			free: t('www.comparison.rows.config.free'),
			passes: t('www.comparison.rows.config.passes'),
			developer: t('www.comparison.rows.config.developer'),
			traditional: t('www.comparison.rows.config.traditional'),
		},
	];

	const tableLabelVars = {
		'--label-2': JSON.stringify(colFree),
		'--label-3': JSON.stringify(colPasses),
		'--label-4': JSON.stringify(colDeveloper),
		'--label-5': JSON.stringify(colTraditional),
	} as React.CSSProperties;

	return (
		<section className="w-full flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 1.25)' }}>
			<div className="flex flex-col gap-2 max-w-3xl">
				<div className="inline-flex items-center gap-2 self-start rounded-full bg-(--accent)/10 border border-(--accent)/30 px-3 py-1 text-xs font-bold text-(--accent)">
					<Layers size={13} className="shrink-0" />
					<span>{t('www.comparison.badge')}</span>
				</div>
				<h2 className="text-3xl md:text-4xl font-extrabold text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('www.comparison.title')}
				</h2>
				<p className="text-sm sm:text-base text-(--text-muted) leading-relaxed">{t('www.comparison.subtitle')}</p>
			</div>

			<div
				tabIndex={0}
				role="region"
				aria-labelledby={captionId}
				className="xernerx-responsive-table-wrapper rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm focus:outline-hidden focus-visible:ring-2 focus-visible:ring-(--accent)"
			>
				<table style={tableLabelVars} className="text-left text-sm">
					<caption id={captionId} className="sr-only">
						{t('www.comparison.caption')}
					</caption>
					<thead>
						<tr className="bg-(--foreground)/70 text-(--text) border-b border-(--border)/10">
							<th scope="col" className="px-5 py-4 text-xs font-extrabold uppercase tracking-wider text-(--text-muted) border-b border-(--border)/10 min-w-[160px]">
								{colCapability}
							</th>
							<th scope="col" className="px-5 py-4 text-xs font-extrabold uppercase tracking-wider text-(--text) border-b border-(--border)/10 min-w-[180px]">
								{colFree}
							</th>
							<th scope="col" className="px-5 py-4 text-xs font-extrabold uppercase tracking-wider text-(--accent) bg-(--accent)/10 border-b border-(--accent)/30 min-w-[190px]">
								{colPasses}
							</th>
							<th scope="col" className="px-5 py-4 text-xs font-extrabold uppercase tracking-wider text-(--text) border-b border-(--border)/10 min-w-[190px]">
								{colDeveloper}
							</th>
							<th scope="col" className="px-5 py-4 text-xs font-extrabold uppercase tracking-wider text-(--text-muted) border-b border-(--border)/10 min-w-[180px]">
								{colTraditional}
							</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr key={row.id} className="hover:bg-(--foreground)/40 transition-colors">
								<th
									scope="row"
									className="px-5 py-4 text-sm font-bold text-(--text) border-b border-(--border)/10 align-top whitespace-nowrap"
									style={{ fontFamily: 'var(--font-fredoka)' }}
								>
									{row.label}
								</th>
								<td className="px-5 py-4 text-xs sm:text-sm text-(--text-muted) leading-relaxed border-b border-(--border)/10 align-top">{row.free}</td>
								<td className="px-5 py-4 text-xs sm:text-sm text-(--text) font-medium leading-relaxed bg-(--accent)/5 border-b border-(--accent)/15 align-top">{row.passes}</td>
								<td className="px-5 py-4 text-xs sm:text-sm text-(--text-muted) leading-relaxed border-b border-(--border)/10 align-top">{row.developer}</td>
								<td className="px-5 py-4 text-xs sm:text-sm text-(--text-muted)/80 leading-relaxed border-b border-(--border)/10 align-top">{row.traditional}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</section>
	);
}
