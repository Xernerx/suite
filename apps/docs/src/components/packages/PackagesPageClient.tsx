/** @format */
'use client';

import { ArrowRight, Box, FileText, GitBranch, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { PackageInstallBar } from '@/components/packages/PackageInstallBar';
import { PackagesSearch, SearchIndexItem } from '@/components/packages/PackagesSearch';
import { PackagesSidebar } from '@/components/packages/PackagesSidebar';
import { useDictionary, useEnvironment } from '@xernerx/providers';

export function PackagesPageClient({ packages, index }: { packages: any[]; index: SearchIndexItem[] }) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const [query, setQuery] = useState('');
	const [scopeFilter, setScopeFilter] = useState<'all' | 'collection' | 'modular'>('all');

	const q = query.trim().toLowerCase();
	const filteredPackages = packages.filter((pkg) => {
		if (scopeFilter === 'collection' && !pkg.isCollection) return false;
		if (scopeFilter === 'modular' && pkg.isCollection) return false;
		if (!q) return true;
		return pkg.name.toLowerCase().includes(q) || (pkg.description && pkg.description.toLowerCase().includes(q));
	});

	return (
		<div className="max-w-(--page-width) mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full selection:bg-(--accent) selection:text-white relative">
			<PackagesSidebar packages={packages} />

			{/* Clean Top Page Header */}
			<motion.div initial={{ opacity: 1, y: 0 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2 pb-6 mb-6 border-b border-(--border)/10">
				<div className="flex flex-wrap items-center gap-2.5">
					<h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('docs.packages.page.title')}
					</h1>
					<span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-(--accent) text-white border border-(--accent) shadow-xs">xernerx</span>
					<span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-(--accent)/15 text-(--accent) border border-(--accent)/30">@xernerx/*</span>
				</div>
				<p className="text-sm sm:text-base text-(--text-muted) leading-relaxed max-w-3xl">{t('docs.packages.page.description')}</p>

				{/* Scope Filter Pills (`All`, `xernerx`, `@xernerx/*`) */}
				<div className="flex flex-wrap items-center gap-2 pt-2">
					{(
						[
							{ id: 'all', label: t('docs.packages.page.filterAll') },
							{ id: 'collection', label: t('docs.packages.page.filterCollection') },
							{ id: 'modular', label: t('docs.packages.page.filterModular') },
						] as const
					).map((tab) => {
						const isActive = scopeFilter === tab.id;
						return (
							<button
								key={tab.id}
								type="button"
								onClick={() => setScopeFilter(tab.id)}
								className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
									isActive
										? 'bg-(--accent) text-white border-(--accent) shadow-xs'
										: 'bg-(--foreground)/40 text-(--text-muted) border-(--border)/10 hover:text-(--text) hover:border-(--accent)/30'
								}`}
							>
								{tab.label}
							</button>
						);
					})}
				</div>
			</motion.div>

			<PackagesSearch index={index} query={query} onQueryChange={setQuery} />

			{/* OVERVIEW SECTION */}
			<section id="overview" className="rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm scroll-mt-28" style={{ padding: 'var(--ui-gap)' }}>
				<div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-(--border)/10">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
							<Box size={20} />
						</div>
						<div>
							<h2 className="text-xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('docs.packages.page.overview.title')}
							</h2>
							<p className="text-xs text-(--text-muted)">{t('docs.packages.page.overview.description')}</p>
						</div>
					</div>
					<span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-(--background)/70 text-(--text-muted) border border-(--border)/10">{filteredPackages.length}</span>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{filteredPackages.map((pkg) => {
						const symbolCount = index.filter((item) => item.packageName === pkg.name).length;
						const isCollection = Boolean(pkg.isCollection);

						return (
							<div
								key={pkg.name}
								className={`flex flex-col justify-between rounded-2xl p-5 transition-all gap-4 ${
									isCollection
										? 'md:col-span-2 bg-(--accent)/8 border-2 border-(--accent)/35 hover:border-(--accent)/60 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_15%,transparent)]'
										: 'bg-(--background)/50 border border-(--border)/10 hover:border-(--accent)/40 hover:bg-(--background)/80'
								}`}
							>
								<div className="flex flex-col gap-2.5">
									<div className="flex items-center justify-between gap-2 flex-wrap">
										<div className="flex items-center gap-2 flex-wrap">
											<Link href={`/packages/${pkg.name}/${pkg.versions[0]}`} className="text-lg font-bold font-mono text-(--accent) hover:underline">
												{pkg.name}
											</Link>
											<span
												className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
													isCollection ? 'bg-(--accent) text-white border-(--accent)' : 'bg-(--foreground)/60 text-(--text-muted) border-(--border)/10'
												}`}
											>
												{isCollection && <Layers size={11} />}
												<span>{isCollection ? t('docs.packages.page.collectionBadge') : t('docs.packages.page.modularBadge')}</span>
											</span>
										</div>

										<div className="flex items-center gap-1.5 flex-wrap">
											<span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
												v{pkg.versions[0]}
											</span>
											{symbolCount > 0 && (
												<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-(--foreground)/60 text-(--text-muted) border border-(--border)/10">
													{t('docs.packages.page.overview.symbolsCount', { count: symbolCount })}
												</span>
											)}
											{pkg.hasChangelog && (
												<a
													href={`${getEnvUrl('https://info.xernerx.com/changelog')}#${pkg.name.toLowerCase()}`}
													className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-(--accent)/15 text-(--accent) border border-(--accent)/30 hover:bg-(--accent)/25 transition-colors"
												>
													<FileText size={10} />
													<span>{t('docs.packages.page.changelogBadge')}</span>
												</a>
											)}
										</div>
									</div>

									<p className="text-xs sm:text-sm text-(--text-muted) leading-relaxed">{pkg.description}</p>

									{isCollection && Array.isArray(pkg.bundledPackages) && pkg.bundledPackages.length > 0 && (
										<div className="flex flex-wrap items-center gap-1.5 pt-1">
											<span className="text-[11px] font-bold text-(--text-muted) mr-1">{t('docs.packages.page.bundlesLabel')}</span>
											{pkg.bundledPackages.map((subName: string) => {
												const matchedSub = packages.find((p) => p.name === subName);
												const targetHref = matchedSub ? `/packages/${matchedSub.name}/${matchedSub.versions[0]}` : '/packages';
												return (
													<Link
														key={subName}
														href={targetHref}
														className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-(--background)/70 text-(--accent) border border-(--accent)/25 hover:bg-(--accent)/15 transition-colors"
													>
														{subName}
													</Link>
												);
											})}
										</div>
									)}

									{/* 1-Click Install Command Bar */}
									<div className="mt-1">
										<PackageInstallBar pkgName={pkg.name} fullWidth />
									</div>
								</div>

								<div className="flex items-center justify-between pt-2 border-t border-(--border)/10">
									<div className="flex items-center gap-1.5 text-xs text-(--text-muted)">
										<GitBranch size={13} className="text-(--accent)" />
										<span>{t('docs.packages.page.overview.versionsAvailable', { count: pkg.versions.length })}</span>
									</div>
									<Link
										href={`/packages/${pkg.name}/${pkg.versions[0]}`}
										className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-(--accent)/15 hover:bg-(--accent) text-(--accent) hover:text-white border border-(--accent)/30 transition-colors"
									>
										<span>{t('docs.packages.page.overview.viewDocs')}</span>
										<ArrowRight size={13} />
									</Link>
								</div>
							</div>
						);
					})}

					{filteredPackages.length === 0 && (
						<div className="col-span-full p-8 text-center text-sm text-(--text-muted) border border-(--border)/10 border-dashed rounded-2xl">
							{t('docs.packages.page.overview.noPackages')}
						</div>
					)}
				</div>
			</section>
		</div>
	);
}
