/** @format */
'use client';

import { Box, GitBranch, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { PackagesSearch } from './PackagesSearch';
import { PackagesSidebar } from './PackagesSidebar';
import { useDictionary } from '@xernerx/providers';

export function PackagesPageClient({ packages, index }: { packages: any[]; index: any[] }) {
	const { t } = useDictionary();

	return (
		<div className="max-w-7xl mx-auto py-12 px-6 lg:px-8 w-full selection:bg-(--accent) selection:text-white relative">
			<PackagesSidebar />

			<div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
				<h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-(--text) mb-4 drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('docs.packages.page.title')}
				</h1>
				<p className="text-lg text-(--text-muted) leading-relaxed mb-8">{t('docs.packages.page.description')}</p>
			</div>

			<PackagesSearch index={index} />

			<div className="space-y-16">
				{/* OVERVIEW SECTION */}
				<section id="overview" className="space-y-6 scroll-mt-24">
					<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
						<Box className="text-(--accent)" size={24} /> {t('docs.packages.page.overview.title')}
					</h2>
					<p className="text-(--text-muted) mb-6">{t('docs.packages.page.overview.description')}</p>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{packages.map((pkg) => (
							<div key={pkg.name} className="flex flex-col bg-(--foreground)/30 border border-(--border)/10 rounded-2xl p-6 hover:border-(--accent)/50 transition-colors">
								<h3 className="text-xl font-bold text-(--text) mb-2 font-mono text-(--accent)">{pkg.name}</h3>
								<p className="text-sm text-(--text-muted) mb-4">{pkg.description}</p>
								<div className="flex items-center gap-2 text-sm text-(--text-muted) mb-6">
									<GitBranch size={14} />
									<span>{t('docs.packages.page.overview.versionsAvailable').replace('{count}', pkg.versions.length.toString())}</span>
								</div>
								<div className="mt-auto flex items-center justify-between">
									<span className="text-xs bg-(--background) px-2 py-1 rounded text-(--text-muted) border border-(--border)/10">
										{t('docs.packages.page.overview.latest')} {pkg.versions[0]}
									</span>
									<Link href={`/packages/${pkg.name}/${pkg.versions[0]}`} className="text-sm font-bold text-(--accent) hover:text-(--accent)/80 flex items-center gap-1">
										{t('docs.packages.page.overview.viewDocs')} <ChevronRight size={16} />
									</Link>
								</div>
							</div>
						))}
						{packages.length === 0 && (
							<div className="col-span-full p-8 text-center text-(--text-muted) border border-(--border)/10 border-dashed rounded-2xl">{t('docs.packages.page.overview.noPackages')}</div>
						)}
					</div>
				</section>
			</div>
		</div>
	);
}
