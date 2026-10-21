/** @format */
'use client';

import { motion } from 'framer-motion';
import { Code } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';

export function WebsocketProtocolSection() {
	const { t } = useDictionary();

	return (
		<motion.section
			id="protocol"
			initial={{ opacity: 1, y: 0 }}
			animate={{ opacity: 1, y: 0 }}
			className="rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden scroll-mt-28"
			style={{ padding: 'var(--ui-gap)' }}
		>
			<div className="flex items-center gap-3 mb-4 pb-3 border-b border-(--border)/10">
				<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
					<Code size={20} />
				</div>
				<div>
					<h2 className="text-xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('docs.websocket.protocol.title')}
					</h2>
					<p className="text-xs text-(--text-muted)">{t('docs.websocket.protocol.description')}</p>
				</div>
			</div>

			<div className="space-y-6">
				<div className="p-4 rounded-2xl bg-(--background)/50 border border-(--border)/10 space-y-3">
					<h3 className="text-sm font-bold text-(--text)">{t('docs.websocket.protocol.schemaTitle')}</h3>
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
									<td className="py-3 font-mono font-bold text-(--accent)">id</td>
									<td className="py-3 font-mono text-xs">String</td>
									<td className="py-3 text-(--accent-red) text-xs font-bold">{t('docs.websocket.protocol.table.yes')}</td>
									<td className="py-3 text-(--text-muted)">{t('docs.websocket.protocol.fields.idDesc')}</td>
								</tr>
								<tr className="border-b border-(--border)/5">
									<td className="py-3 font-mono font-bold text-(--accent)">service</td>
									<td className="py-3 font-mono text-xs">String</td>
									<td className="py-3 text-(--accent-red) text-xs font-bold">{t('docs.websocket.protocol.table.yes')}</td>
									<td className="py-3 text-(--text-muted)" dangerouslySetInnerHTML={{ __html: t('docs.websocket.protocol.fields.serviceDesc') }} />
								</tr>
								<tr className="border-b border-(--border)/5">
									<td className="py-3 font-mono font-bold text-(--accent)">method</td>
									<td className="py-3 font-mono text-xs">String</td>
									<td className="py-3 text-(--accent-red) text-xs font-bold">{t('docs.websocket.protocol.table.yes')}</td>
									<td className="py-3 text-(--text-muted)" dangerouslySetInnerHTML={{ __html: t('docs.websocket.protocol.fields.methodDesc') }} />
								</tr>
								<tr className="border-b border-(--border)/5">
									<td className="py-3 font-mono font-bold text-(--accent)">action</td>
									<td className="py-3 font-mono text-xs">String</td>
									<td className="py-3 text-(--text-muted) text-xs">{t('docs.websocket.protocol.table.optional')}</td>
									<td className="py-3 text-(--text-muted)" dangerouslySetInnerHTML={{ __html: t('docs.websocket.protocol.fields.actionDesc') }} />
								</tr>
								<tr>
									<td className="py-3 font-mono font-bold text-(--accent)">body</td>
									<td className="py-3 font-mono text-xs">Object</td>
									<td className="py-3 text-(--accent-red) text-xs font-bold">{t('docs.websocket.protocol.table.yes')}</td>
									<td className="py-3 text-(--text-muted)">{t('docs.websocket.protocol.fields.bodyDesc')}</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>

				<div className="space-y-3">
					<h3 className="text-sm font-bold text-(--text)">{t('docs.websocket.protocol.mappingTitle')}</h3>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
						<div className="p-4 bg-(--background)/50 border border-(--border)/10 rounded-2xl">
							<span className="font-extrabold text-[11px] px-2.5 py-0.5 bg-(--accent)/15 text-(--accent) border border-(--accent)/30 rounded-xl uppercase font-mono">GET</span>
							<div className="font-mono font-bold text-(--text) mt-2.5 text-xs">model.findOne(body)</div>
							<p className="text-xs text-(--text-muted) mt-1">{t('docs.websocket.protocol.methods.getDesc')}</p>
						</div>

						<div className="p-4 bg-(--background)/50 border border-(--border)/10 rounded-2xl">
							<span className="font-extrabold text-[11px] px-2.5 py-0.5 bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/30 rounded-xl uppercase font-mono">
								POST
							</span>
							<div className="font-mono font-bold text-(--text) mt-2.5 text-xs">model.create(body)</div>
							<p className="text-xs text-(--text-muted) mt-1">{t('docs.websocket.protocol.methods.postDesc')}</p>
						</div>

						<div className="p-4 bg-(--background)/50 border border-(--border)/10 rounded-2xl">
							<span className="font-extrabold text-[11px] px-2.5 py-0.5 bg-(--accent-orange)/15 text-(--accent-orange) border border-(--accent-orange)/30 rounded-xl uppercase font-mono">
								PATCH
							</span>
							<div className="font-mono font-bold text-(--text) mt-2.5 text-xs">findOneAndUpdate(...)</div>
							<p className="text-xs text-(--text-muted) mt-1" dangerouslySetInnerHTML={{ __html: t('docs.websocket.protocol.methods.patchDesc') }} />
						</div>

						<div className="p-4 bg-(--background)/50 border border-(--border)/10 rounded-2xl">
							<span className="font-extrabold text-[11px] px-2.5 py-0.5 bg-(--accent-red)/15 text-(--accent-red) border border-(--accent-red)/30 rounded-xl uppercase font-mono">
								DELETE
							</span>
							<div className="font-mono font-bold text-(--text) mt-2.5 text-xs">findOneAndDelete(...)</div>
							<p className="text-xs text-(--text-muted) mt-1">{t('docs.websocket.protocol.methods.deleteDesc')}</p>
						</div>
					</div>
				</div>
			</div>
		</motion.section>
	);
}
