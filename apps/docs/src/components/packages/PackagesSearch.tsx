/** @format */
'use client';

import { useState } from 'react';
import { FileCode2, Package, ChevronRight, X } from 'lucide-react';
import Link from 'next/link';
import { useDictionary } from '@xernerx/providers';
import { Input } from '@xernerx/ui';

export type SearchIndexItem = {
	name: string;
	kind: string; // 'Class' | 'Interface' | 'Function'
	packageName: string;
	version: string;
	href: string;
};

interface PackagesSearchProps {
	index: SearchIndexItem[];
	query?: string;
	onQueryChange?: (q: string) => void;
}

const SYMBOL_FILTERS = ['ALL', 'Class', 'Interface', 'Function'] as const;

export function PackagesSearch({ index, query: controlledQuery, onQueryChange }: PackagesSearchProps) {
	const [internalQuery, setInternalQuery] = useState('');
	const [kindFilter, setKindFilter] = useState<string>('ALL');
	const { t } = useDictionary();

	const query = controlledQuery !== undefined ? controlledQuery : internalQuery;
	const setQuery = (val: string) => {
		if (onQueryChange) onQueryChange(val);
		else setInternalQuery(val);
	};

	const q = query.trim().toLowerCase();
	const isFiltering = q.length > 0 || kindFilter !== 'ALL';

	const results =
		q.length > 1 || kindFilter !== 'ALL'
			? index
					.filter((item) => {
						if (kindFilter !== 'ALL' && item.kind !== kindFilter) return false;
						if (!q) return true;
						return item.name.toLowerCase().includes(q) || item.packageName.toLowerCase().includes(q);
					})
					.slice(0, 12)
			: [];

	return (
		<div className="mb-8 relative z-30">
			<div className="rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm" style={{ padding: 'var(--ui-gap)' }}>
				<div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
					<div className="flex-1 min-w-0">
						<Input variant="search" shortcut={true} placeholder={t('docs.packages.search.placeholder')} value={query} onChange={(e) => setQuery(e.target.value)} />
					</div>

					<div className="flex flex-wrap items-center gap-1.5">
						{SYMBOL_FILTERS.map((kind) => {
							const isActive = kindFilter === kind;
							return (
								<button
									key={kind}
									type="button"
									onClick={() => setKindFilter(kind)}
									className={`px-3 py-1.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider border transition-all cursor-pointer ${
										isActive
											? 'bg-(--accent) text-white border-(--accent) shadow-sm'
											: 'bg-(--background)/60 text-(--text-muted) border-(--border)/15 hover:text-(--text) hover:border-(--accent)/30'
									}`}
								>
									{kind}
								</button>
							);
						})}

						{isFiltering && (
							<button
								type="button"
								onClick={() => {
									setQuery('');
									setKindFilter('ALL');
								}}
								className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-2xl text-xs font-bold bg-(--accent-red)/15 text-(--accent-red) border border-(--accent-red)/30 hover:bg-(--accent-red)/25 transition-colors cursor-pointer"
							>
								<X size={13} />
								<span>{t('docs.api.common.clearFilters')}</span>
							</button>
						)}
					</div>
				</div>
			</div>

			{(q.length > 1 || kindFilter !== 'ALL') && (
				<div className="mt-3 rounded-3xl border border-(--border)/15 bg-(--foreground)/40 backdrop-blur-xl shadow-lg overflow-hidden max-h-96 overflow-y-auto">
					{results.length > 0 ? (
						<div className="divide-y divide-(--border)/10">
							{results.map((result, i) => (
								<Link
									key={`${result.packageName}-${result.name}-${i}`}
									href={result.href}
									className="flex items-center justify-between px-4 py-3.5 bg-(--background)/40 hover:bg-(--background)/80 transition-colors"
								>
									<div className="flex items-center gap-3 min-w-0">
										<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
											<FileCode2 size={18} />
										</div>
										<div className="min-w-0">
											<div className="flex items-center gap-2 flex-wrap">
												<span className="font-bold text-sm text-(--text) font-mono">{result.name}</span>
												<span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-(--accent)/15 text-(--accent) border-(--accent)/30">
													{result.kind}
												</span>
											</div>
											<div className="flex items-center gap-1.5 text-xs text-(--text-muted) mt-0.5">
												<Package size={12} />
												<span className="font-mono">
													{result.packageName}@{result.version}
												</span>
											</div>
										</div>
									</div>
									<ChevronRight size={16} className="text-(--text-muted) shrink-0" />
								</Link>
							))}
						</div>
					) : (
						<div className="p-6 text-center text-sm text-(--text-muted)">{t('docs.packages.search.noResults', { query })}</div>
					)}
				</div>
			)}
		</div>
	);
}
