/** @format */
'use client';

import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Book, Code, Globe, Lock, Rocket, Server, Shield, Terminal } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { useSidebar } from '@xernerx/providers';
import { CodeBlock } from '@xernerx/ui';

export default function CDNDocs() {
	const { setNavItems, show, clearNavItems } = useSidebar();

	useEffect(() => {
		show();
		setNavItems([
			{ label: 'Back to Categories', href: '/', icon: ArrowLeft, category: 'Navigation' },
			{ label: 'Overview', href: '#overview', icon: Globe, category: 'CDN API' },
			{ label: 'Upload Media', href: '#upload', icon: Server, category: 'Endpoints' },
			{ label: 'List Media', href: '#list', icon: Server, category: 'Endpoints' },
			{ label: 'Manage Media', href: '#manage', icon: Server, category: 'Endpoints' },
			{ label: 'Secure Proxy', href: '#proxy', icon: Lock, category: 'Endpoints' },
		]);

		return () => clearNavItems();
	}, [setNavItems, show, clearNavItems]);

	return (
		<div className="max-w-7xl mx-auto py-12 px-6 lg:px-8 w-full selection:bg-(--accent) selection:text-white">
			<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
				<h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-(--text) mb-4" style={{ fontFamily: 'var(--font-fredoka)' }}>
					Xernerx CDN Services
				</h1>
				<p className="text-lg text-(--text-muted) leading-relaxed mb-6">
					The Xernerx Content Delivery Network securely routes, caches, and accelerates media assets across the entire ecosystem. This documentation covers the internal HTTP API used for
					programmatically managing uploads and media retrieval.
				</p>

				<div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm mb-12 shadow-sm">
					<AlertCircle className="shrink-0 mt-0.5" size={18} />
					<div>
						<strong className="block mb-1 text-red-500">Internal API Usage Notice</strong>
						<p>
							The CDN is primarily designed as an internal microservice for Xernerx ecosystem applications (like the Account and Admin dashboards). While these endpoints are documented
							for transparency and advanced developer integrations, they are tightly coupled to the internal authentication flow and are not intended for general public consumption like
							a standalone SaaS product.
						</p>
					</div>
				</div>
			</motion.div>

			<div className="space-y-16">
				{/* OVERVIEW SECTION */}
				<motion.section id="overview" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6 scroll-mt-24">
					<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
						<Globe className="text-(--accent)" size={24} /> Base URL & Authentication
					</h2>
					<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl p-6">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
							<div>
								<h3 className="font-semibold text-(--text) mb-1">Production Endpoint</h3>
								<code className="text-sm text-(--accent) bg-(--accent)/10 px-2 py-1 rounded">https://cdn.xernerx.com</code>
							</div>
							<div>
								<h3 className="font-semibold text-(--text) mb-1">Canary Endpoint</h3>
								<code className="text-sm text-orange-500 bg-orange-500/10 px-2 py-1 rounded">https://cdn.canary.xernerx.com</code>
							</div>
							<div>
								<h3 className="font-semibold text-(--text) mb-1">Development Endpoint</h3>
								<code className="text-sm text-blue-500 bg-blue-500/10 px-2 py-1 rounded">https://cdn.dev.xernerx.com</code>
							</div>
						</div>

						<div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-sm">
							<Shield className="shrink-0 mt-0.5" size={18} />
							<p>
								<strong>Authentication:</strong> All restricted endpoints rely on standard NextAuth session cookies. API requests must be made with credentials included, and the
								authenticated user must possess the appropriate roles (e.g., <code>uploadMedia</code> or <code>manageMedia</code>) in the database.
							</p>
						</div>
					</div>
				</motion.section>

				{/* UPLOAD ENDPOINT */}
				<motion.section id="upload" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6 scroll-mt-24">
					<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
						<Server className="text-(--accent)" size={24} /> Upload Media
					</h2>
					<p className="text-(--text-muted)">Upload a new file to the private Vercel Blob store and create a MongoDB metadata record.</p>

					<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl overflow-hidden">
						<div className="flex items-center gap-3 p-4 bg-(--background)/50 border-b border-(--border)/10">
							<span className="font-bold text-xs px-2 py-1 bg-green-500/20 text-green-500 rounded uppercase tracking-wider">POST</span>
							<code className="text-(--text) font-mono">/upload</code>
						</div>

						<div className="p-6 space-y-6">
							<div>
								<h4 className="font-semibold text-(--text) mb-3 flex items-center gap-2">
									<Book size={16} /> Content-Type
								</h4>
								<code className="text-sm px-2 py-1 bg-(--background) rounded border border-(--border)/10">multipart/form-data</code>
							</div>

							<div>
								<h4 className="font-semibold text-(--text) mb-3 flex items-center gap-2">
									<Code size={16} /> Form Fields
								</h4>
								<div className="overflow-x-auto">
									<table className="w-full text-left text-sm border-collapse">
										<thead>
											<tr className="border-b border-(--border)/10 text-(--text-muted)">
												<th className="pb-2 font-medium">Field</th>
												<th className="pb-2 font-medium">Type</th>
												<th className="pb-2 font-medium">Required</th>
												<th className="pb-2 font-medium">Description</th>
											</tr>
										</thead>
										<tbody className="text-(--text)">
											<tr className="border-b border-(--border)/5">
												<td className="py-3 font-mono text-(--accent)">file</td>
												<td className="py-3 font-mono">File</td>
												<td className="py-3 text-red-400">Yes</td>
												<td className="py-3">The raw file binary to upload.</td>
											</tr>
											<tr className="border-b border-(--border)/5">
												<td className="py-3 font-mono text-(--accent)">privacy</td>
												<td className="py-3 font-mono">String</td>
												<td className="py-3 text-(--text-muted)">No</td>
												<td className="py-3">
													Either <code>public</code>, <code>limited</code>, or <code>private</code> (default).
												</td>
											</tr>
											<tr>
												<td className="py-3 font-mono text-(--accent)">shared</td>
												<td className="py-3 font-mono">JSON String</td>
												<td className="py-3 text-(--text-muted)">No</td>
												<td className="py-3">Stringified array of User IDs granted access to the file.</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>

							<div>
								<h4 className="font-semibold text-(--text) mb-3 flex items-center gap-2">
									<Terminal size={16} /> Success Response (200 OK)
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
						<Server className="text-(--accent)" size={24} /> List Media
					</h2>
					<p className="text-(--text-muted)">Retrieve a list of media records that the authenticated user owns or has shared access to.</p>

					<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl overflow-hidden">
						<div className="flex items-center gap-3 p-4 bg-(--background)/50 border-b border-(--border)/10">
							<span className="font-bold text-xs px-2 py-1 bg-blue-500/20 text-blue-500 rounded uppercase tracking-wider">GET</span>
							<code className="text-(--text) font-mono">/media</code>
						</div>

						<div className="p-6 space-y-6">
							<div>
								<h4 className="font-semibold text-(--text) mb-3 flex items-center gap-2">
									<Code size={16} /> Query Parameters
								</h4>
								<div className="overflow-x-auto">
									<table className="w-full text-left text-sm border-collapse">
										<thead>
											<tr className="border-b border-(--border)/10 text-(--text-muted)">
												<th className="pb-2 font-medium">Parameter</th>
												<th className="pb-2 font-medium">Description</th>
											</tr>
										</thead>
										<tbody className="text-(--text)">
											<tr>
												<td className="py-3 font-mono text-(--accent)">admin</td>
												<td className="py-3">
													If set to <code>true</code> and the user has <code>manageMedia</code> permissions, returns all media globally.
												</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>

							<div>
								<h4 className="font-semibold text-(--text) mb-3 flex items-center gap-2">
									<Terminal size={16} /> Success Response (200 OK)
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
						<Server className="text-(--accent)" size={24} /> Manage Media
					</h2>
					<p className="text-(--text-muted)">Update metadata properties of an existing media record or permanently delete it.</p>

					<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl overflow-hidden mb-6">
						<div className="flex items-center gap-3 p-4 bg-(--background)/50 border-b border-(--border)/10">
							<span className="font-bold text-xs px-2 py-1 bg-orange-500/20 text-orange-500 rounded uppercase tracking-wider">PATCH</span>
							<code className="text-(--text) font-mono">/media/[id]</code>
						</div>

						<div className="p-6 space-y-6">
							<div>
								<h4 className="font-semibold text-(--text) mb-3 flex items-center gap-2">
									<Code size={16} /> JSON Body Parameters
								</h4>
								<div className="overflow-x-auto">
									<table className="w-full text-left text-sm border-collapse">
										<thead>
											<tr className="border-b border-(--border)/10 text-(--text-muted)">
												<th className="pb-2 font-medium">Field</th>
												<th className="pb-2 font-medium">Type</th>
												<th className="pb-2 font-medium">Description</th>
											</tr>
										</thead>
										<tbody className="text-(--text)">
											<tr className="border-b border-(--border)/5">
												<td className="py-3 font-mono text-(--accent)">privacy</td>
												<td className="py-3 font-mono">String</td>
												<td className="py-3">
													Either <code>public</code>, <code>limited</code>, or <code>private</code>.
												</td>
											</tr>
											<tr>
												<td className="py-3 font-mono text-(--accent)">shared</td>
												<td className="py-3 font-mono">Array&lt;String&gt;</td>
												<td className="py-3">Array of User IDs to grant access to.</td>
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
								Permanently deletes the file from the Vercel Blob store and removes the metadata record from the database. Requires ownership or the <code>manageMedia</code>{' '}
								permission.
							</p>
						</div>
					</div>
				</motion.section>

				{/* SECURE PROXY ENDPOINT */}
				<motion.section id="proxy" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6 scroll-mt-24">
					<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
						<Lock className="text-(--accent)" size={24} /> Secure Media Proxy
					</h2>
					<p className="text-(--text-muted)">
						Since underlying Vercel Blobs are securely restricted, media must be streamed via the secure proxy endpoint which verifies access permissions dynamically.
					</p>

					<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl overflow-hidden">
						<div className="flex items-center gap-3 p-4 bg-(--background)/50 border-b border-(--border)/10">
							<span className="font-bold text-xs px-2 py-1 bg-blue-500/20 text-blue-500 rounded uppercase tracking-wider">GET</span>
							<code className="text-(--text) font-mono">/view/[id]</code>
						</div>

						<div className="p-6">
							<p className="text-sm text-(--text-muted) leading-relaxed">
								Provides a direct byte-stream of the requested file with appropriate <code>Content-Type</code> headers. If the media is private, the proxy verifies that the requester's
								session ID matches the <code>uploaderId</code>, exists in the <code>shared</code> array, or has global <code>manageMedia</code> permissions before streaming the file.
							</p>
						</div>
					</div>
				</motion.section>
			</div>
		</div>
	);
}
