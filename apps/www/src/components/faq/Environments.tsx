/** @format */
'use client';

import { CollapsibleCard } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

export default function Environments() {
	const { t } = useDictionary();

	return (
		<div className="flex flex-col max-w-3xl mx-auto w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<h1 className="text-3xl font-black tracking-tight text-(--text)">{t('faq.environments.title')}</h1>

			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
				<CollapsibleCard
					message={t('faq.environments.card.title')}
					description={
						<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
							<p className="text-(--text) leading-relaxed">{t('faq.environments.card.description')}</p>
							<div className="overflow-x-auto rounded-2xl border border-(--border)/10">
								<table className="w-full text-left border-collapse">
									<thead>
										<tr className="border-b border-(--border)/10 bg-(--background)/50">
											<th className="p-3 text-xs font-bold uppercase tracking-wider text-(--text)">{t('faq.environments.table.header.environment')}</th>
											<th className="p-3 text-xs font-bold uppercase tracking-wider text-(--text)">{t('faq.environments.table.header.description')}</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-(--border)/10">
										<tr>
											<td className="p-3 font-semibold text-(--text)">{t('faq.environments.table.release.label')}</td>
											<td className="p-3 text-(--text-muted)">{t('faq.environments.table.release.description')}</td>
										</tr>
										<tr>
											<td className="p-3 font-semibold text-(--text)">{t('faq.environments.table.canary.label')}</td>
											<td className="p-3 text-(--text-muted)">{t('faq.environments.table.canary.description')}</td>
										</tr>
										<tr>
											<td className="p-3 font-semibold text-(--text)">{t('faq.environments.table.dev.label')}</td>
											<td className="p-3 text-(--text-muted)">{t('faq.environments.table.dev.description')}</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					}
				/>
			</div>
		</div>
	);
}
