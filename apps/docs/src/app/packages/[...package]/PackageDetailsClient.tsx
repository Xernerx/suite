/** @format */
// Force recompile
'use client';

import { FileCode2 } from 'lucide-react';
import Link from 'next/link';
import { PackageDocSidebar } from './PackageDocSidebar';
import { VersionSelector } from './VersionSelector';
import { useDictionary } from '@xernerx/providers';

export function PackageDetailsClient({ data, availableVersions, pkgName, version }: { data: any; availableVersions: string[]; pkgName: string; version: string }) {
	const { t } = useDictionary();

	if (!data) {
		return (
			<div className="max-w-4xl mx-auto py-12 px-6 lg:px-8 w-full text-center">
				<h1 className="text-2xl font-bold text-red-500 mb-4">{t('docs.packages.details.packageNotFound')}</h1>
				<p className="text-(--text-muted)">
					{t('docs.packages.details.couldNotLoadDocsFor')} {pkgName}@{version}.
				</p>
				<Link href="/packages" className="text-(--accent) mt-4 inline-block hover:underline">
					{t('docs.packages.details.returnToPackages')}
				</Link>
			</div>
		);
	}

	// Recursively extract all items of a specific kind
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

	const classes = extractItems(data, 128); // 128 = Class
	const interfaces = extractItems(data, 256); // 256 = Interface
	const functions = extractItems(data, 64); // 64 = Function

	const renderComment = (comment: any) => {
		if (!comment) return null;
		const summary = comment.summary && Array.isArray(comment.summary) ? comment.summary.map((s: any) => s.text).join('') : comment.shortText || null;

		const blockTags = comment.blockTags || [];

		if (!summary && blockTags.length === 0) return null;

		return (
			<div className="flex flex-col gap-1.5">
				{summary && <span className="break-words">{summary}</span>}
				{blockTags.length > 0 && (
					<div className="flex flex-col gap-1.5 mt-1 border-t border-(--border)/10 pt-2">
						{blockTags.map((tag: any, idx: number) => (
							<div key={idx} className="flex gap-2">
								<span className="font-semibold text-emerald-500/90 text-[10px] uppercase tracking-wider shrink-0 pt-0.5">{tag.tag.replace('@', '')}</span>
								<span className="text-sm opacity-90 break-words">{tag.content?.map((c: any) => c.text).join('')}</span>
							</div>
						))}
					</div>
				)}
			</div>
		);
	};

	// Create sidebar items for the symbols
	const sidebarItems = [
		...classes.map((c: any) => ({ label: c.name, href: `#class-${c.name}`, category: t('docs.packages.details.classes') })),
		...interfaces.map((i: any) => ({ label: i.name, href: `#interface-${i.name}`, category: t('docs.packages.details.interfaces') })),
		...functions.map((f: any) => ({ label: f.name, href: `#function-${f.name}`, category: t('docs.packages.details.functions') })),
	];

	return (
		<div className="max-w-7xl mx-auto py-12 px-6 lg:px-8 w-full selection:bg-(--accent) selection:text-white">
			<PackageDocSidebar items={sidebarItems} />

			<div className="animate-in fade-in slide-in-from-bottom-4 duration-500 border-b border-(--border)/10 pb-12 mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
				<h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-(--text) font-mono text-(--accent)">{pkgName}</h1>

				<VersionSelector versions={availableVersions} currentVersion={version} pkgName={pkgName} />
			</div>

			<div className="space-y-16">
				{classes.length > 0 && (
					<section>
						<h2 className="text-3xl font-bold text-(--text) mb-8">{t('docs.packages.details.classes')}</h2>
						<div className="space-y-8">
							{classes.map((c: any) => {
								const classChildren = c.children || [];
								const properties = classChildren.filter((child: any) => child.kind === 1024);
								const methods = classChildren.filter((child: any) => child.kind === 2048);
								const constructors = classChildren.filter((child: any) => child.kind === 512);

								return (
									<div key={c.id} id={`class-${c.name}`} className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl p-6 scroll-mt-24">
										<h3 className="text-2xl font-bold text-(--text) mb-2 flex items-center gap-2">
											<FileCode2 className="text-blue-400" size={20} />
											{c.name}
										</h3>

										{renderComment(c.comment) && <div className="text-(--text-muted) mb-6">{renderComment(c.comment)}</div>}

										<div className="space-y-6 mt-6">
											{constructors.length > 0 && (
												<div>
													<h4 className="text-sm font-bold text-(--text-muted) uppercase tracking-wider mb-3">{t('docs.packages.details.constructor')}</h4>
													<div className="space-y-3">
														{constructors.map((constructor: any) => (
															<div key={constructor.id} className="bg-(--background) border border-(--border)/10 rounded-xl p-4">
																<code className="text-sm text-(--accent) font-mono font-bold">new {c.name}()</code>
																{renderComment(constructor.signatures?.[0]?.comment) && (
																	<div className="text-sm text-(--text-muted) mt-2">{renderComment(constructor.signatures[0].comment)}</div>
																)}
															</div>
														))}
													</div>
												</div>
											)}

											{properties.length > 0 && (
												<div>
													<h4 className="text-sm font-bold text-(--text-muted) uppercase tracking-wider mb-3">{t('docs.packages.details.properties')}</h4>
													<div className="overflow-x-auto rounded-xl border border-(--border)/10 bg-(--background)">
														<table className="w-full text-left text-sm">
															<thead className="bg-(--foreground)/50 text-(--text-muted) border-b border-(--border)/10">
																<tr>
																	<th className="px-4 py-3 font-bold">{t('docs.packages.details.property')}</th>
																	<th className="px-4 py-3 font-bold">{t('docs.packages.details.type')}</th>
																	<th className="px-4 py-3 font-bold">{t('docs.packages.details.description')}</th>
																</tr>
															</thead>
															<tbody className="divide-y divide-(--border)/10">
																{properties.map((prop: any) => (
																	<tr key={prop.id} className="hover:bg-(--foreground)/30 transition-colors">
																		<td className="px-4 py-4 whitespace-nowrap">
																			<code className="text-purple-400 font-mono font-bold">{prop.name}</code>
																		</td>
																		<td className="px-4 py-4 whitespace-nowrap">
																			{prop.type ? (
																				<span className="text-xs px-2 py-1 rounded bg-(--foreground)/80 text-(--text-muted) font-mono">
																					{prop.type.name || prop.type.type || 'any'}
																				</span>
																			) : (
																				<span className="text-(--text-muted)">-</span>
																			)}
																		</td>
																		<td className="px-4 py-4 text-(--text-muted)">
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
													<h4 className="text-sm font-bold text-(--text-muted) uppercase tracking-wider mb-3">{t('docs.packages.details.methods')}</h4>
													<div className="space-y-3">
														{methods.map((method: any) => (
															<div key={method.id} className="bg-(--background) border border-(--border)/10 rounded-xl p-4 flex flex-col gap-2">
																<div className="flex items-center gap-2">
																	<code className="text-sm text-green-400 font-mono font-bold">{method.name}()</code>
																</div>
																{renderComment(method.signatures?.[0]?.comment) && (
																	<div className="text-sm text-(--text-muted)">{renderComment(method.signatures[0].comment)}</div>
																)}
															</div>
														))}
													</div>
												</div>
											)}
										</div>
									</div>
								);
							})}
						</div>
					</section>
				)}

				{interfaces.length > 0 && (
					<section>
						<h2 className="text-3xl font-bold text-(--text) mb-8">{t('docs.packages.details.interfaces')}</h2>
						<div className="space-y-8">
							{interfaces.map((i: any) => {
								const interfaceChildren = i.children || [];
								const properties = interfaceChildren.filter((child: any) => child.kind === 1024);
								const methods = interfaceChildren.filter((child: any) => child.kind === 2048);

								return (
									<div key={i.id} id={`interface-${i.name}`} className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl p-6 scroll-mt-24">
										<h3 className="text-2xl font-bold text-(--text) mb-2 flex items-center gap-2">
											<FileCode2 className="text-purple-400" size={20} />
											{i.name}
										</h3>

										{renderComment(i.comment) && <div className="text-(--text-muted) mb-6">{renderComment(i.comment)}</div>}

										<div className="space-y-6 mt-6">
											{properties.length > 0 && (
												<div>
													<h4 className="text-sm font-bold text-(--text-muted) uppercase tracking-wider mb-3">{t('docs.packages.details.properties')}</h4>
													<div className="overflow-x-auto rounded-xl border border-(--border)/10 bg-(--background)">
														<table className="w-full text-left text-sm">
															<thead className="bg-(--foreground)/50 text-(--text-muted) border-b border-(--border)/10">
																<tr>
																	<th className="px-4 py-3 font-bold">{t('docs.packages.details.property')}</th>
																	<th className="px-4 py-3 font-bold">{t('docs.packages.details.type')}</th>
																	<th className="px-4 py-3 font-bold">{t('docs.packages.details.description')}</th>
																</tr>
															</thead>
															<tbody className="divide-y divide-(--border)/10">
																{properties.map((prop: any) => (
																	<tr key={prop.id} className="hover:bg-(--foreground)/30 transition-colors">
																		<td className="px-4 py-4 whitespace-nowrap">
																			<code className="text-purple-400 font-mono font-bold">{prop.name}</code>
																		</td>
																		<td className="px-4 py-4 whitespace-nowrap">
																			{prop.type ? (
																				<span className="text-xs px-2 py-1 rounded bg-(--foreground)/80 text-(--text-muted) font-mono">
																					{prop.type.name || prop.type.type || 'any'}
																				</span>
																			) : (
																				<span className="text-(--text-muted)">-</span>
																			)}
																		</td>
																		<td className="px-4 py-4 text-(--text-muted)">
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
													<h4 className="text-sm font-bold text-(--text-muted) uppercase tracking-wider mb-3">{t('docs.packages.details.methods')}</h4>
													<div className="space-y-3">
														{methods.map((method: any) => (
															<div key={method.id} className="bg-(--background) border border-(--border)/10 rounded-xl p-4 flex flex-col gap-2">
																<div className="flex items-center gap-2">
																	<code className="text-sm text-green-400 font-mono font-bold">{method.name}()</code>
																</div>
																{renderComment(method.signatures?.[0]?.comment) && (
																	<div className="text-sm text-(--text-muted)">{renderComment(method.signatures[0].comment)}</div>
																)}
															</div>
														))}
													</div>
												</div>
											)}
										</div>
									</div>
								);
							})}
						</div>
					</section>
				)}
			</div>
		</div>
	);
}
