/** @format */
'use client';

import { Input, MultiSelector } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

interface IssuesHeaderFiltersProps {
	search: string;
	setSearch: (val: string) => void;
	selectedProducts: string[];
	setSelectedProducts: (val: string[]) => void;
	availableProducts: string[];
	resolveBot: (itemOrProd: any) => { id: string; name: string; avatarUrl: string | null } | null;
	selectedStatuses: string[];
	setSelectedStatuses: (val: string[]) => void;
	hasUser: boolean;
}

export function IssuesHeaderFilters({
	search,
	setSearch,
	selectedProducts,
	setSelectedProducts,
	availableProducts,
	resolveBot,
	selectedStatuses,
	setSelectedStatuses,
	hasUser,
}: IssuesHeaderFiltersProps) {
	const { t } = useDictionary();

	return (
		<div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 mb-8 border-b border-(--border)/10 relative z-30">
			<div className="flex flex-col gap-1.5">
				<h1 className="text-3xl sm:text-4xl font-black tracking-tight text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('info.bugs.title')}
				</h1>
				<p className="text-sm sm:text-base text-(--text-muted) max-w-2xl">{t('info.bugs.description')}</p>
			</div>

			<div className="flex flex-col gap-1.5 w-full lg:w-auto">
				<div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto">
					<div className="w-full sm:w-96 xl:w-[26rem]">
						<Input variant="search" shortcut={true} placeholder={t('info.bugs.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
					</div>
					<MultiSelector
						className="w-full sm:w-auto shrink-0"
						placeholder={t('info.bugs.allProducts')}
						value={selectedProducts}
						onChange={setSelectedProducts}
						options={availableProducts.map((prod) => {
							const botInfo = resolveBot(prod);
							return {
								value: prod,
								label: botInfo ? botInfo.name : prod,
							};
						})}
					/>
					<MultiSelector
						className="w-full sm:w-auto shrink-0"
						searchable={false}
						placeholder={t('info.bugs.filters.all')}
						value={selectedStatuses}
						onChange={setSelectedStatuses}
						options={[
							{ value: 'verified', label: t('info.bugs.filters.verified'), color: 'var(--accent)' },
							{ value: 'submitted', label: t('info.bugs.filters.submitted'), color: 'var(--accent-orange)' },
							{ value: 'release', label: t('info.bugs.filters.release'), color: 'var(--accent-green)' },
							...(hasUser ? [{ value: 'mine', label: t('info.bugs.filters.mine'), color: 'var(--text-muted)' }] : []),
						]}
					/>
				</div>
				<p className="text-xs text-(--text-muted) px-2">{t('info.bugs.startTyping')}</p>
			</div>
		</div>
	);
}
