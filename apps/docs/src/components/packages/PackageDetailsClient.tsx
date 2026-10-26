/** @format */
'use client';

import { ArrowLeft, Box, Code, FileCode2, Layers, X } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { PackageDocSidebar } from '@/components/packages/PackageDocSidebar';
import { PackageInstallBar } from '@/components/packages/PackageInstallBar';
import { VersionSelector } from '@/components/packages/VersionSelector';
import { useDictionary, useEnvironment, useSidebar } from '@xernerx/providers';
import { Input } from '@xernerx/ui';

const BUNDLED_SUBPACKAGES = ['@xernerx/framework', '@xernerx/commands', '@xernerx/stats', '@xernerx/terminal', '@xernerx/websocket'];

export function PackageDetailsClient({ data, availableVersions, pkgName, version }: { data: any; availableVersions: string[]; pkgName: string; version: string }) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { view, setView } = useSidebar();
	const [searchQuery, setSearchQuery] = useState('');

	const changelogMarkdown = useMemo(() => {
		const doc = Array.isArray(data?.documents) ? data.documents.find((d: any) => d.name === 'CHANGELOG') : null;
		if (!doc || !Array.isArray(doc.content)) return '';
		return doc.content
			.map((part: any) => part?.text || '')
			.join('')
			.replace(/<!--\s*@format\s*-->/g, '')
			.replace(/^#\s+[^\r\n]+\r?\n*/gm, '')
			.trim();
	}, [data]);

	if (!data) {
		return (
			<div className="max-w-4xl mx-auto py-12 px-6 lg:px-8 w-full text-center">
				<div className="rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md p-8 space-y-4">
					<h1 className="text-2xl font-bold text-(--accent-red)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('docs.packages.details.packageNotFound')}
					</h1>
					<p className="text-sm text-(--text-muted)">
						{t('docs.packages.details.couldNotLoadDocsFor')}{' '}
						<code className="font-mono text-(--accent)">
							{pkgName}@{version}
						</code>
						.
					</p>
					<Link
						href="/packages"
						className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold bg-(--accent)/15 hover:bg-(--accent) text-(--accent) hover:text-white border border-(--accent)/30 transition-colors"
					>
						<ArrowLeft size={14} />
						<span>{t('docs.packages.details.returnToPackages')}</span>
					</Link>
				</div>
			</div>
		);
	}

	const extractItems = (node: any, targetKind: number): any[] => {
		let items: any[] = [];
		if (node.kind === targetKind) items.push(node);
		if (node.children && Array.isArray(node.children)) {
			for (const child of node.children) {
				items = items.concat(extractItems(child, targetKind));
			}
		}
		return items;
	};

	const classes = extractItems(data, 128);
	const interfaces = extractItems(data, 256);
	const functions = extractItems(data, 64);
	const hasChangelog = changelogMarkdown.length > 0;

	const q = searchQuery.trim().toLowerCase();
	const matchesSymbol = (item: any) => {
		if (!q) return true;
		if (item.name?.toLowerCase().includes(q)) return true;
		const children = item.children || [];
		return children.some((child: any) => child.name?.toLowerCase().includes(q));
	};

	const filteredClasses = classes.filter(matchesSymbol);
	const filteredInterfaces = interfaces.filter(matchesSymbol);
	const filteredFunctions = functions.filter(matchesSymbol);

	const activeView = view || 'all';
	const showClasses = (activeView === 'all' || activeView === 'classes') && filteredClasses.length > 0;
	const showInterfaces = (activeView === 'all' || activeView === 'interfaces') && filteredInterfaces.length > 0;
	const showFunctions = (activeView === 'all' || activeView === 'functions') && filteredFunctions.length > 0;

	const renderComment = (comment: any) => {
		if (!comment) return null;
		const summary = comment.summary && Array.isArray(comment.summary) ? comment.summary.map((s: any) => s.text).join('') : comment.shortText || null;
		const blockTags = (comment.blockTags || []).filter((tag: any) => tag?.tag !== '@format');
		if (!summary && blockTags.length === 0) return null;

		return (
			<div className="flex flex-col gap-1.5">
				{summary && <span className="break-words">{summary}</span>}
				{blockTags.length > 0 && (
					<div className="flex flex-col gap-1.5 mt-1 border-t border-(--border)/10 pt-2">
						{blockTags.map((tag: any, idx: number) => (
							<div key={idx} className="flex gap-2">
								<span className="font-semibold text-(--accent) text-[10px] uppercase tracking-wider shrink-0 pt-0.5">{tag.tag.replace('@', '')}</span>
								<span className="text-sm opacity-90 break-words">{tag.content?.map((c: any) => c.text).join('')}</span>
							</div>
						))}
					</div>
				)}
			</div>
		);
	};

	const sidebarItems = [
		...classes.map((c: any) => ({ label: c.name, href: `#class-${c.name}`, category: t('docs.packages.details.classes') })),
		...interfaces.map((i: any) => ({ label: i.name, href: `#interface-${i.name}`, category: t('docs.packages.details.interfaces') })),
		...functions.map((f: any) => ({ label: f.name, href: `#function-${f.name}`, category: t('docs.packages.details.functions') })),
	];

	const kindTabs = [
		{ id: 'all', label: t('docs.packages.details.all'), count: classes.length + interfaces.length + functions.length },
		...(classes.length > 0 ? [{ id: 'classes', label: t('docs.packages.details.classes'), count: classes.length }] : []),
		...(interfaces.length > 0 ? [{ id: 'interfaces', label: t('docs.packages.details.interfaces'), count: interfaces.length }] : []),
		...(functions.length > 0 ? [{ id: 'functions', label: t('docs.packages.details.functions'), count: functions.length }] : []),
	];

	const renderMemberTableAndMethods = (children: any[]) => {
		const properties = children.filter((child: any) => child.kind === 1024);
		const methods = children.filter((child: any) => child.kind === 2048);

		return (
			<>
				{properties.length > 0 && (
					<div>
						<h4 className="text-xs font-bold text-(--text-muted) uppercase tracking-wider mb-2.5">{t('docs.packages.details.properties')}</h4>
						<div className="overflow-x-auto rounded-2xl border border-(--border)/10 bg-(--background)/50">
							<table className="w-full text-left text-sm">
								<thead className="bg-(--foreground)/40 text-(--text-muted) border-b border-(--border)/10">
									<tr>
										<th className="px-4 py-3 font-bold">{t('docs.packages.details.property')}</th>
										<th className="px-4 py-3 font-bold">{t('docs.packages.details.type')}</th>
										<th className="px-4 py-3 font-bold">{t('docs.packages.details.description')}</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-(--border)/10">
									{properties.map((prop: any) => (
										<tr key={prop.id} className="hover:bg-(--foreground)/20 transition-colors">
											<td className="px-4 py-3.5 whitespace-nowrap">
												<code className="text-(--accent) font-mono font-bold">{prop.name}</code>
											</td>
											<td className="px-4 py-3.5 whitespace-nowrap">
												{prop.type ? (
													<span className="text-xs px-2 py-0.5 rounded-xl bg-(--foreground)/70 text-(--text-muted) font-mono border border-(--border)/10">
														{prop.type.name || prop.type.type || 'any'}
													</span>
												) : (
													<span className="text-(--text-muted)">-</span>
												)}
											</td>
											<td className="px-4 py-3.5 text-(--text-muted)">
												{renderComment(prop.comment) || <span className="opacity-50 italic">{t('docs.packages.details.noDescription')}</span>}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{methods.length > 0 && (
					<div>
						<h4 className="text-xs font-bold text-(--text-muted) uppercase tracking-wider mb-2.5">{t('docs.packages.details.methods')}</h4>
						<div className="space-y-2.5">
							{methods.map((method: any) => (
								<div key={method.id} className="bg-(--background)/50 border border-(--border)/10 rounded-2xl p-4 flex flex-col gap-2">
									<div className="flex items-center gap-2">
										<code className="text-sm text-(--accent) font-mono font-bold">{method.name}()</code>
									</div>
									{renderComment(method.signatures?.[0]?.comment) && <div className="text-sm text-(--text-muted)">{renderComment(method.signatures[0].comment)}</div>}
								</div>
							))}
						</div>
					</div>
				)}
			</>
		);
	};

	return (
		<div className="max-w-(--page-width) mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full selection:bg-(--accent) selection:text-white">
			<PackageDocSidebar
				items={sidebarItems}
				hasClasses={classes.length > 0}
				hasInterfaces={interfaces.length > 0}
				hasFunctions={functions.length > 0}
				hasChangelog={hasChangelog}
				changelogHref={hasChangelog ? `${getEnvUrl('https://info.xernerx.com/changelog')}#${pkgName.toLowerCase()}` : undefined}
			/>

			{/* Clean Top Page Header */}
			<motion.div
				initial={{ opacity: 1, y: 0 }}
				animate={{ opacity: 1, y: 0 }}
				className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-(--border)/10"
			>
				<div className="flex flex-col gap-2">
					<div className="flex flex-wrap items-center gap-3">
						<h1 className="text-3xl md:text-4xl font-extrabold tracking-tight font-mono text-(--accent)">{pkgName}</h1>
						<span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-(--accent)/15 text-(--accent) border border-(--accent)/30">v{version}</span>
						{pkgName === 'xernerx' && (
							<span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-(--accent) text-white border border-(--accent)">
								<Layers size={12} />
								<span>{t('docs.packages.page.collectionBadge')}</span>
							</span>
						)}
					</div>

					<div className="flex flex-wrap items-center gap-2 mt-1">
						<PackageInstallBar pkgName={pkgName} version={version} />
					</div>
				</div>

				<VersionSelector versions={availableVersions} currentVersion={version} pkgName={pkgName} />
			</motion.div>

			{/* Collection Banner for `xernerx` */}
			{pkgName === 'xernerx' && (
				<div className="rounded-3xl border border-(--accent)/30 bg-(--accent)/10 backdrop-blur-md p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="flex flex-col gap-1">
						<span className="text-xs font-extrabold uppercase tracking-wider text-(--accent)">{t('docs.packages.details.collectionBannerTitle')}</span>
						<p className="text-xs sm:text-sm text-(--text-muted)">{t('docs.packages.details.collectionBannerDesc')}</p>
					</div>
					<div className="flex flex-wrap items-center gap-1.5">
						{BUNDLED_SUBPACKAGES.map((sub) => (
							<Link
								key={sub}
								href={`/packages/${sub}`}
								className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-(--background)/80 text-(--accent) border border-(--accent)/25 hover:bg-(--accent) hover:text-white transition-colors"
							>
								{sub}
							</Link>
						))}
					</div>
				</div>
			)}

			{/* Search & Symbol Kind Filter Bar */}
			<div className="rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm mb-8" style={{ padding: 'var(--ui-gap)' }}>
				<div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
					<div className="flex-1 min-w-0">
						<Input variant="search" shortcut={true} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('docs.packages.search.placeholder')} />
					</div>

					<div className="flex flex-wrap items-center gap-1.5">
						{kindTabs.map((tab) => {
							const isActive = activeView === tab.id;
							return (
								<button
									key={tab.id}
									type="button"
									onClick={() => setView(tab.id)}
									className={`px-3 py-1.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider border transition-all cursor-pointer inline-flex items-center gap-1.5 ${
										isActive
											? 'bg-(--accent) text-white border-(--accent) shadow-sm'
											: 'bg-(--background)/60 text-(--text-muted) border-(--border)/15 hover:text-(--text) hover:border-(--accent)/30'
									}`}
								>
									<span>{tab.label}</span>
									<span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-(--foreground)/70 text-(--text-muted)'}`}>{tab.count}</span>
								</button>
							);
						})}

						{(q.length > 0 || activeView !== 'all') && (
							<button
								type="button"
								onClick={() => {
									setSearchQuery('');
									setView('all');
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

			<div className="space-y-12">
				{/* CLASSES */}
				{showClasses && (
					<section className="space-y-6">
						<div className="flex items-center gap-2.5">
							<Box size={20} className="text-(--accent)" />
							<h2 className="text-2xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('docs.packages.details.classes')}
							</h2>
							<span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-(--foreground)/50 text-(--text-muted) border border-(--border)/10">{filteredClasses.length}</span>
						</div>

						<div className="space-y-6">
							{filteredClasses.map((c: any) => {
								const classChildren = c.children || [];
								const constructors = classChildren.filter((child: any) => child.kind === 512);

								return (
									<div
										key={c.id}
										id={`class-${c.name}`}
										className="rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden scroll-mt-28"
										style={{ padding: 'var(--ui-gap)' }}
									>
										<div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-(--border)/10">
											<h3 className="text-xl font-bold text-(--text) flex items-center gap-2.5 font-mono">
												<span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
													<FileCode2 size={18} />
												</span>
												<span>{c.name}</span>
											</h3>
											<span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
												{t('docs.packages.details.classBadge')}
											</span>
										</div>

										{renderComment(c.comment) && <div className="text-sm text-(--text-muted) mb-6">{renderComment(c.comment)}</div>}

										<div className="space-y-6">
											{constructors.length > 0 && (
												<div>
													<h4 className="text-xs font-bold text-(--text-muted) uppercase tracking-wider mb-2.5">{t('docs.packages.details.constructor')}</h4>
													<div className="space-y-2.5">
														{constructors.map((constructor: any) => (
															<div key={constructor.id} className="bg-(--background)/50 border border-(--border)/10 rounded-2xl p-4">
																<code className="text-sm text-(--accent) font-mono font-bold">new {c.name}()</code>
																{renderComment(constructor.signatures?.[0]?.comment) && (
																	<div className="text-sm text-(--text-muted) mt-2">{renderComment(constructor.signatures[0].comment)}</div>
																)}
															</div>
														))}
													</div>
												</div>
											)}

											{renderMemberTableAndMethods(classChildren)}
										</div>
									</div>
								);
							})}
						</div>
					</section>
				)}

				{/* INTERFACES */}
				{showInterfaces && (
					<section className="space-y-6">
						<div className="flex items-center gap-2.5">
							<FileCode2 size={20} className="text-(--accent)" />
							<h2 className="text-2xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('docs.packages.details.interfaces')}
							</h2>
							<span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-(--foreground)/50 text-(--text-muted) border border-(--border)/10">{filteredInterfaces.length}</span>
						</div>

						<div className="space-y-6">
							{filteredInterfaces.map((i: any) => (
								<div
									key={i.id}
									id={`interface-${i.name}`}
									className="rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden scroll-mt-28"
									style={{ padding: 'var(--ui-gap)' }}
								>
									<div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-(--border)/10">
										<h3 className="text-xl font-bold text-(--text) flex items-center gap-2.5 font-mono">
											<span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
												<FileCode2 size={18} />
											</span>
											<span>{i.name}</span>
										</h3>
										<span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
											{t('docs.packages.details.interfaceBadge')}
										</span>
									</div>

									{renderComment(i.comment) && <div className="text-sm text-(--text-muted) mb-6">{renderComment(i.comment)}</div>}

									<div className="space-y-6">{renderMemberTableAndMethods(i.children || [])}</div>
								</div>
							))}
						</div>
					</section>
				)}

				{/* FUNCTIONS */}
				{showFunctions && (
					<section className="space-y-6">
						<div className="flex items-center gap-2.5">
							<Code size={20} className="text-(--accent)" />
							<h2 className="text-2xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('docs.packages.details.functions')}
							</h2>
							<span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-(--foreground)/50 text-(--text-muted) border border-(--border)/10">{filteredFunctions.length}</span>
						</div>

						<div className="space-y-4">
							{filteredFunctions.map((fn: any) => (
								<div
									key={fn.id}
									id={`function-${fn.name}`}
									className="rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden scroll-mt-28"
									style={{ padding: 'var(--ui-gap)' }}
								>
									<div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-(--border)/10">
										<code className="text-lg font-bold text-(--accent) font-mono">{fn.name}()</code>
										<span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
											{t('docs.packages.details.functionBadge')}
										</span>
									</div>
									{renderComment(fn.signatures?.[0]?.comment || fn.comment) && (
										<div className="text-sm text-(--text-muted)">{renderComment(fn.signatures?.[0]?.comment || fn.comment)}</div>
									)}
								</div>
							))}
						</div>
					</section>
				)}
			</div>
		</div>
	);
}
