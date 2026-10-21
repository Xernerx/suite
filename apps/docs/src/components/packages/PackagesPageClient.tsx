/** @format */
'use client';

import { ArrowRight, Box, Check, Copy, GitBranch, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { PackagesSearch, SearchIndexItem } from '@/components/packages/PackagesSearch';
import { PackagesSidebar } from '@/components/packages/PackagesSidebar';
import { useDictionary } from '@xernerx/providers';

export function PackagesPageClient({ packages, index }: { packages: any[]; index: SearchIndexItem[] }) {
	const { t } = useDictionary();
	const [query, setQuery] = useState('');
	const [copiedPkg, setCopiedPkg] = useState<string | null>(null);

	const q = query.trim().toLowerCase();
	const filteredPackages = q ? packages.filter((pkg) => pkg.name.toLowerCase().includes(q) || (pkg.description && pkg.description.toLowerCase().includes(q))) : packages;

	const handleCopyInstall = (pkgName: string) => {
		navigator.clipboard.writeText(`pnpm add ${pkgName}`);
		setCopiedPkg(pkgName);
		setTimeout(() => setCopiedPkg(null), 1800);
	};

	return (
		<div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full selection:bg-(--accent) selection:text-white relative">
			<PackagesSidebar packages={packages} />

			{/* Clean Top Page Header */}
			<motion.div initial={{ opacity: 1, y: 0 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2 pb-6 mb-6 border-b border-(--border)/10">
				<div className="flex flex-wrap items-center gap-3">
					<h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('docs.packages.page.title')}
					</h1>
					<span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-(--accent)/15 text-(--accent) border border-(--accent)/30">@xernerx/*</span>
				</div>
				<p className="text-sm sm:text-base text-(--text-muted) leading-relaxed max-w-3xl">{t('docs.packages.page.description')}</p>
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
						const isCopied = copiedPkg === pkg.name;
						const symbolCount = index.filter((item) => item.packageName === pkg.name).length;

						return (
							<div
								key={pkg.name}
								className="flex flex-col justify-between bg-(--background)/50 border border-(--border)/10 rounded-2xl p-5 hover:border-(--accent)/40 hover:bg-(--background)/80 transition-all gap-4"
							>
								<div className="flex flex-col gap-2.5">
									<div className="flex items-center justify-between gap-2 flex-wrap">
										<Link href={`/packages/${pkg.name}/${pkg.versions[0]}`} className="text-lg font-bold font-mono text-(--accent) hover:underline">
											{pkg.name}
										</Link>
										<div className="flex items-center gap-1.5">
											<span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/30">
												v{pkg.versions[0]}
											</span>
											{symbolCount > 0 && (
												<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-(--foreground)/60 text-(--text-muted) border border-(--border)/10">
													{t('docs.packages.page.overview.symbolsCount', { count: symbolCount })}
												</span>
											)}
										</div>
									</div>

									<p className="text-xs sm:text-sm text-(--text-muted) leading-relaxed">{pkg.description}</p>

									{/* 1-Click Install Command Bar */}
									<div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-(--foreground)/40 border border-(--border)/10 mt-1">
										<div className="flex items-center gap-2 min-w-0">
											<Terminal size={13} className="text-(--accent) shrink-0" />
											<code className="text-xs font-mono text-(--text) truncate">pnpm add {pkg.name}</code>
										</div>
										<button
											type="button"
											onClick={() => handleCopyInstall(pkg.name)}
											className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-(--background)/70 hover:bg-(--accent)/15 text-(--text-muted) hover:text-(--accent) border border-(--border)/10 transition-colors cursor-pointer shrink-0"
										>
											{isCopied ? <Check size={11} className="text-(--accent-green)" /> : <Copy size={11} />}
											<span>{isCopied ? t('docs.api.common.copied') : t('app.widgets.copy')}</span>
										</button>
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
