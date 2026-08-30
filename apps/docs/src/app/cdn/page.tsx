/** @format */
// Force recompile
'use client';

import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Book, Code, Globe, Lock, Rocket, Server, Shield, Terminal } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { useSidebar, useDictionary } from '@xernerx/providers';
import { CodeBlock } from '@xernerx/ui';

export default function CDNDocs() {
	const { setNavItems, show, clearNavItems } = useSidebar();
	const { t } = useDictionary();

	useEffect(() => {
		show();
		setNavItems([
			{ label: t('docs.cdn.nav.backToCategories'), href: '/', icon: ArrowLeft, category: t('docs.cdn.nav.category.navigation') },
			{ label: t('docs.cdn.nav.overview'), href: '#overview', icon: Globe, category: t('docs.cdn.nav.category.cdnApi') },
			{ label: t('docs.cdn.nav.uploadMedia'), href: '#upload', icon: Server, category: t('docs.cdn.nav.category.endpoints') },
			{ label: t('docs.cdn.nav.listMedia'), href: '#list', icon: Server, category: t('docs.cdn.nav.category.endpoints') },
			{ label: t('docs.cdn.nav.manageMedia'), href: '#manage', icon: Server, category: t('docs.cdn.nav.category.endpoints') },
			{ label: t('docs.cdn.nav.secureProxy'), href: '#proxy', icon: Lock, category: t('docs.cdn.nav.category.endpoints') },
		]);

		return () => clearNavItems();
	}, [setNavItems, show, clearNavItems, t]);

	return (
		<div className="max-w-7xl mx-auto py-12 px-6 lg:px-8 w-full selection:bg-(--accent) selection:text-white">
			<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
				<h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-(--text) mb-4" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('docs.cdn.title')}
				</h1>
				<p className="text-lg text-(--text-muted) leading-relaxed mb-6">{t('docs.cdn.description')}</p>

				<div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm mb-12 shadow-sm">
					<AlertCircle className="shrink-0 mt-0.5" size={18} />
					<div>
						<strong className="block mb-1 text-red-500">{t('docs.cdn.notice.title')}</strong>
						<p>{t('docs.cdn.notice.description')}</p>
					</div>
				</div>
			</motion.div>

			<div className="space-y-16">
				{/* OVERVIEW SECTION */}
				<motion.section id="overview" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6 scroll-mt-24">
					<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
						<Globe className="text-(--accent)" size={24} /> {t('docs.cdn.overview.title')}
					</h2>
					<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl p-6">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
							<div>
								<h3 className="font-semibold text-(--text) mb-1">{t('docs.cdn.overview.productionEndpoint')}</h3>
								<code className="text-sm text-(--accent) bg-(--accent)/10 px-2 py-1 rounded">https://cdn.xernerx.com</code>
							</div>
							<div>
								<h3 className="font-semibold text-(--text) mb-1">{t('docs.cdn.overview.canaryEndpoint')}</h3>
								<code className="text-sm text-orange-500 bg-orange-500/10 px-2 py-1 rounded">https://cdn.canary.xernerx.com</code>
							</div>
							<div>
								<h3 className="font-semibold text-(--text) mb-1">{t('docs.cdn.overview.developmentEndpoint')}</h3>
								<code className="text-sm text-blue-500 bg-blue-500/10 px-2 py-1 rounded">https://cdn.dev.xernerx.com</code>
							</div>
						</div>

						<div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-sm">
							<Shield className="shrink-0 mt-0.5" size={18} />
							<p>
								<strong>{t('docs.cdn.overview.authLabel')}</strong> {t('docs.cdn.overview.authDesc1')}
								<code>uploadMedia</code>
								{t('docs.cdn.overview.authDesc2')}
								<code>manageMedia</code>
								{t('docs.cdn.overview.authDesc3')}
							</p>
						</div>
					</div>
				</motion.section>

				{/* UPLOAD ENDPOINT */}
				<motion.section id="upload" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6 scroll-mt-24">
					<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
						<Server className="text-(--accent)" size={24} /> {t('docs.cdn.upload.title')}
					</h2>
					<p className="text-(--text-muted)">{t('docs.cdn.upload.description')}</p>

					<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl overflow-hidden">
						<div className="flex items-center gap-3 p-4 bg-(--background)/50 border-b border-(--border)/10">
							<span className="font-bold text-xs px-2 py-1 bg-green-500/20 text-green-500 rounded uppercase tracking-wider">POST</span>
							<code className="text-(--text) font-mono">/upload</code>
						</div>

						<div className="p-6 space-y-6">
							<div>
								<h4 className="font-semibold text-(--text) mb-3 flex items-center gap-2">
									<Book size={16} /> {t('docs.cdn.upload.contentType')}
								</h4>
								<code className="text-sm px-2 py-1 bg-(--background) rounded border border-(--border)/10">multipart/form-data</code>
							</div>

							<div>
								<h4 className="font-semibold text-(--text) mb-3 flex items-center gap-2">
									<Code size={16} /> {t('docs.cdn.upload.formFields')}
								</h4>
								<div className="overflow-x-auto">
									<table className="w-full text-left text-sm border-collapse">
										<thead>
											<tr className="border-b border-(--border)/10 text-(--text-muted)">
												<th className="pb-2 font-medium">{t('docs.cdn.table.field')}</th>
												<th className="pb-2 font-medium">{t('docs.cdn.table.type')}</th>
												<th className="pb-2 font-medium">{t('docs.cdn.table.required')}</th>
												<th className="pb-2 font-medium">{t('docs.cdn.table.description')}</th>
											</tr>
										</thead>
										<tbody className="text-(--text)">
											<tr className="border-b border-(--border)/5">
												<td className="py-3 font-mono text-(--accent)">file</td>
												<td className="py-3 font-mono">File</td>
												<td className="py-3 text-red-400">{t('docs.cdn.table.yes')}</td>
												<td className="py-3">{t('docs.cdn.upload.fields.fileDesc')}</td>
											</tr>
											<tr className="border-b border-(--border)/5">
												<td className="py-3 font-mono text-(--accent)">privacy</td>
												<td className="py-3 font-mono">String</td>
												<td className="py-3 text-(--text-muted)">{t('docs.cdn.table.no')}</td>
												<td className="py-3">
													{t('docs.cdn.upload.fields.privacyDesc1')}
													<code>public</code>
													{t('docs.cdn.upload.fields.privacyDesc2')}
													<code>limited</code>
													{t('docs.cdn.upload.fields.privacyDesc3')}
													<code>private</code>
													{t('docs.cdn.upload.fields.privacyDesc4')}
												</td>
											</tr>
											<tr>
												<td className="py-3 font-mono text-(--accent)">shared</td>
												<td className="py-3 font-mono">JSON String</td>
												<td className="py-3 text-(--text-muted)">{t('docs.cdn.table.no')}</td>
												<td className="py-3">{t('docs.cdn.upload.fields.sharedDesc')}</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>

							<div>
								<h4 className="font-semibold text-(--text) mb-3 flex items-center gap-2">
									<Terminal size={16} /> {t('docs.cdn.successResponse')}
								</h4>
								<div className="rounded-xl overflow-hidden border border-(--border)/10 text-sm">
									<CodeBlock
										tabs={[
											{
												label: 'JSON',
												language: 'json',
												code: `{\n  "success": true,\n  "url": "https://cdn.xernerx.com/view/64c9f1a2...",\n  "media": {\n    "_id": "64c9f1a2...",\n    "filename": "image.png",\n    "mimeType": "image/png",\n    "size": 1024500,\n    "privacy": "private",\n    "uploaderId": "user_id_here",\n    "url": "https://cdn.xernerx.com/view/64c9f1a2...",\n    "createdAt": "2026-08-30T12:00:00.000Z"\n  }\n}`,
											},
										]}
									/>
								</div>
							</div>
						</div>
					</div>
				</motion.section>

				{/* LIST MEDIA ENDPOINT */}
				<motion.section id="list" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6 scroll-mt-24">
					<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
						<Server className="text-(--accent)" size={24} /> {t('docs.cdn.list.title')}
					</h2>
					<p className="text-(--text-muted)">{t('docs.cdn.list.description')}</p>

					<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl overflow-hidden">
						<div className="flex items-center gap-3 p-4 bg-(--background)/50 border-b border-(--border)/10">
							<span className="font-bold text-xs px-2 py-1 bg-blue-500/20 text-blue-500 rounded uppercase tracking-wider">GET</span>
							<code className="text-(--text) font-mono">/media</code>
						</div>

						<div className="p-6 space-y-6">
							<div>
								<h4 className="font-semibold text-(--text) mb-3 flex items-center gap-2">
									<Code size={16} /> {t('docs.cdn.list.queryParams')}
								</h4>
								<div className="overflow-x-auto">
									<table className="w-full text-left text-sm border-collapse">
										<thead>
											<tr className="border-b border-(--border)/10 text-(--text-muted)">
												<th className="pb-2 font-medium">{t('docs.cdn.table.parameter')}</th>
												<th className="pb-2 font-medium">{t('docs.cdn.table.description')}</th>
											</tr>
										</thead>
										<tbody className="text-(--text)">
											<tr>
												<td className="py-3 font-mono text-(--accent)">admin</td>
												<td className="py-3">
													{t('docs.cdn.list.params.adminDesc1')}
													<code>true</code>
													{t('docs.cdn.list.params.adminDesc2')}
													<code>manageMedia</code>
													{t('docs.cdn.list.params.adminDesc3')}
												</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>

							<div>
								<h4 className="font-semibold text-(--text) mb-3 flex items-center gap-2">
									<Terminal size={16} /> {t('docs.cdn.successResponse')}
								</h4>
								<div className="rounded-xl overflow-hidden border border-(--border)/10 text-sm">
									<CodeBlock
										tabs={[
											{
												label: 'JSON',
												language: 'json',
												code: `{\n  "media": [\n    {\n      "_id": "64c9f1a2...",\n      "filename": "image.png",\n      "url": "https://cdn.xernerx.com/view/64c9f1a2...",\n      // ... metadata\n    }\n  ]\n}`,
											},
										]}
									/>
								</div>
							</div>
						</div>
					</div>
				</motion.section>

				{/* MANAGE MEDIA ENDPOINT */}
				<motion.section id="manage" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6 scroll-mt-24">
					<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
						<Server className="text-(--accent)" size={24} /> {t('docs.cdn.manage.title')}
					</h2>
					<p className="text-(--text-muted)">{t('docs.cdn.manage.description')}</p>

					<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl overflow-hidden mb-6">
						<div className="flex items-center gap-3 p-4 bg-(--background)/50 border-b border-(--border)/10">
							<span className="font-bold text-xs px-2 py-1 bg-orange-500/20 text-orange-500 rounded uppercase tracking-wider">PATCH</span>
							<code className="text-(--text) font-mono">/media/[id]</code>
						</div>

						<div className="p-6 space-y-6">
							<div>
								<h4 className="font-semibold text-(--text) mb-3 flex items-center gap-2">
									<Code size={16} /> {t('docs.cdn.manage.jsonBodyParams')}
								</h4>
								<div className="overflow-x-auto">
									<table className="w-full text-left text-sm border-collapse">
										<thead>
											<tr className="border-b border-(--border)/10 text-(--text-muted)">
												<th className="pb-2 font-medium">{t('docs.cdn.table.field')}</th>
												<th className="pb-2 font-medium">{t('docs.cdn.table.type')}</th>
												<th className="pb-2 font-medium">{t('docs.cdn.table.description')}</th>
											</tr>
										</thead>
										<tbody className="text-(--text)">
											<tr className="border-b border-(--border)/5">
												<td className="py-3 font-mono text-(--accent)">privacy</td>
												<td className="py-3 font-mono">String</td>
												<td className="py-3">
													{t('docs.cdn.manage.fields.privacyDesc1')}
													<code>public</code>
													{t('docs.cdn.manage.fields.privacyDesc2')}
													<code>limited</code>
													{t('docs.cdn.manage.fields.privacyDesc3')}
													<code>private</code>
													{t('docs.cdn.manage.fields.privacyDesc4')}
												</td>
											</tr>
											<tr>
												<td className="py-3 font-mono text-(--accent)">shared</td>
												<td className="py-3 font-mono">Array&lt;String&gt;</td>
												<td className="py-3">{t('docs.cdn.manage.fields.sharedDesc')}</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>
						</div>
					</div>

					<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl overflow-hidden">
						<div className="flex items-center gap-3 p-4 bg-(--background)/50 border-b border-(--border)/10">
							<span className="font-bold text-xs px-2 py-1 bg-red-500/20 text-red-500 rounded uppercase tracking-wider">DELETE</span>
							<code className="text-(--text) font-mono">/media/[id]</code>
						</div>

						<div className="p-6">
							<p className="text-sm text-(--text-muted) leading-relaxed">
								{t('docs.cdn.manage.deleteDesc1')}
								<code>manageMedia</code>
								{t('docs.cdn.manage.deleteDesc2')}
							</p>
						</div>
					</div>
				</motion.section>

				{/* SECURE PROXY ENDPOINT */}
				<motion.section id="proxy" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6 scroll-mt-24">
					<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
						<Lock className="text-(--accent)" size={24} /> {t('docs.cdn.proxy.title')}
					</h2>
					<p className="text-(--text-muted)">{t('docs.cdn.proxy.description')}</p>

					<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl overflow-hidden">
						<div className="flex items-center gap-3 p-4 bg-(--background)/50 border-b border-(--border)/10">
							<span className="font-bold text-xs px-2 py-1 bg-blue-500/20 text-blue-500 rounded uppercase tracking-wider">GET</span>
							<code className="text-(--text) font-mono">/view/[id]</code>
						</div>

						<div className="p-6">
							<p className="text-sm text-(--text-muted) leading-relaxed">
								{t('docs.cdn.proxy.details1')}
								<code>Content-Type</code>
								{t('docs.cdn.proxy.details2')}
								<code>uploaderId</code>
								{t('docs.cdn.proxy.details3')}
								<code>shared</code>
								{t('docs.cdn.proxy.details4')}
								<code>manageMedia</code>
								{t('docs.cdn.proxy.details5')}
							</p>
						</div>
					</div>
				</motion.section>
			</div>
		</div>
	);
}
