/** @format */
'use client';

import { motion } from 'framer-motion';
import { Code } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';

export function WebsocketProtocolSection() {
	const { t } = useDictionary();

	return (
		<motion.section id="protocol" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6 scroll-mt-24">
			<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
				<Code className="text-(--accent)" size={24} /> {t('docs.websocket.protocol.title')}
			</h2>
			<p className="text-(--text-muted)">{t('docs.websocket.protocol.description')}</p>

			<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl overflow-hidden p-6 space-y-6">
				<h3 className="text-lg font-semibold text-(--text)">{t('docs.websocket.protocol.schemaTitle')}</h3>
				<div className="overflow-x-auto">
					<table className="w-full text-left text-sm border-collapse">
						<thead>
							<tr className="border-b border-(--border)/10 text-(--text-muted)">
								<th className="pb-2 font-medium">{t('docs.websocket.protocol.table.field')}</th>
								<th className="pb-2 font-medium">{t('docs.websocket.protocol.table.type')}</th>
								<th className="pb-2 font-medium">{t('docs.websocket.protocol.table.required')}</th>
								<th className="pb-2 font-medium">{t('docs.websocket.protocol.table.description')}</th>
							</tr>
						</thead>
						<tbody className="text-(--text)">
							<tr className="border-b border-(--border)/5">
								<td className="py-3 font-mono text-(--accent)">id</td>
								<td className="py-3 font-mono">String</td>
								<td className="py-3 text-red-400">{t('docs.websocket.protocol.table.yes')}</td>
								<td className="py-3">{t('docs.websocket.protocol.fields.idDesc')}</td>
							</tr>
							<tr className="border-b border-(--border)/5">
								<td className="py-3 font-mono text-(--accent)">service</td>
								<td className="py-3 font-mono">String</td>
								<td className="py-3 text-red-400">{t('docs.websocket.protocol.table.yes')}</td>
								<td className="py-3" dangerouslySetInnerHTML={{ __html: t('docs.websocket.protocol.fields.serviceDesc') }} />
							</tr>
							<tr className="border-b border-(--border)/5">
								<td className="py-3 font-mono text-(--accent)">method</td>
								<td className="py-3 font-mono">String</td>
								<td className="py-3 text-red-400">{t('docs.websocket.protocol.table.yes')}</td>
								<td className="py-3" dangerouslySetInnerHTML={{ __html: t('docs.websocket.protocol.fields.methodDesc') }} />
							</tr>
							<tr className="border-b border-(--border)/5">
								<td className="py-3 font-mono text-(--accent)">action</td>
								<td className="py-3 font-mono">String</td>
								<td className="py-3 text-(--text-muted)">{t('docs.websocket.protocol.table.optional')}</td>
								<td className="py-3" dangerouslySetInnerHTML={{ __html: t('docs.websocket.protocol.fields.actionDesc') }} />
							</tr>
							<tr>
								<td className="py-3 font-mono text-(--accent)">body</td>
								<td className="py-3 font-mono">Object</td>
								<td className="py-3 text-red-400">{t('docs.websocket.protocol.table.yes')}</td>
								<td className="py-3">{t('docs.websocket.protocol.fields.bodyDesc')}</td>
							</tr>
						</tbody>
					</table>
				</div>

				<div className="border-t border-(--border)/10 pt-6">
					<h3 className="text-lg font-semibold text-(--text) mb-4">{t('docs.websocket.protocol.mappingTitle')}</h3>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						<div className="p-4 bg-(--background)/50 border border-(--border)/10 rounded-xl">
							<span className="font-bold text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded uppercase font-mono">GET</span>
							<div className="font-semibold text-(--text) mt-2 text-sm">model.findOne(body)</div>
							<p className="text-xs text-(--text-muted) mt-1">{t('docs.websocket.protocol.methods.getDesc')}</p>
						</div>

						<div className="p-4 bg-(--background)/50 border border-(--border)/10 rounded-xl">
							<span className="font-bold text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded uppercase font-mono">POST</span>
							<div className="font-semibold text-(--text) mt-2 text-sm">model.create(body)</div>
							<p className="text-xs text-(--text-muted) mt-1">{t('docs.websocket.protocol.methods.postDesc')}</p>
						</div>

						<div className="p-4 bg-(--background)/50 border border-(--border)/10 rounded-xl">
							<span className="font-bold text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded uppercase font-mono">PATCH</span>
							<div className="font-semibold text-(--text) mt-2 text-sm">findOneAndUpdate(...)</div>
							<p className="text-xs text-(--text-muted) mt-1" dangerouslySetInnerHTML={{ __html: t('docs.websocket.protocol.methods.patchDesc') }} />
						</div>

						<div className="p-4 bg-(--background)/50 border border-(--border)/10 rounded-xl">
							<span className="font-bold text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded uppercase font-mono">DELETE</span>
							<div className="font-semibold text-(--text) mt-2 text-sm">findOneAndDelete(...)</div>
							<p className="text-xs text-(--text-muted) mt-1">{t('docs.websocket.protocol.methods.deleteDesc')}</p>
						</div>
					</div>
				</div>
			</div>
		</motion.section>
	);
}
