/** @format */
'use client';

import { motion } from 'framer-motion';
import { Server, Zap } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';

export function WebsocketConnectingSection() {
	const { t } = useDictionary();

	return (
		<motion.section id="connecting" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6 scroll-mt-24">
			<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
				<Zap className="text-(--accent)" size={24} /> {t('docs.websocket.connecting.title')}
			</h2>
			<p className="text-(--text-muted)" dangerouslySetInnerHTML={{ __html: t('docs.websocket.connecting.description') }} />

			<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl p-6">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
					<div>
						<h3 className="font-semibold text-(--text) mb-1">{t('docs.websocket.connecting.productionEndpoint')}</h3>
						<code className="text-sm text-(--accent) bg-(--accent)/10 px-2 py-1 rounded font-mono">wss://ws.xernerx.com</code>
					</div>
					<div>
						<h3 className="font-semibold text-(--text) mb-1">{t('docs.websocket.connecting.developmentEndpoint')}</h3>
						<code className="text-sm text-blue-400 bg-blue-500/10 px-2 py-1 rounded font-mono">wss://ws.dev.xernerx.com</code>
					</div>
					<div>
						<h3 className="font-semibold text-(--text) mb-1">{t('docs.websocket.connecting.localRuntime')}</h3>
						<code className="text-sm text-(--text-muted) bg-(--foreground)/40 px-2 py-1 rounded font-mono">ws://localhost:5000</code>
					</div>
				</div>

				<div className="border-t border-(--border)/10 pt-6">
					<h3 className="font-semibold text-(--text) mb-2 flex items-center gap-2">
						<Server size={18} className="text-(--accent)" /> {t('docs.websocket.connecting.healthChecksTitle')}
					</h3>
					<p className="text-sm text-(--text-muted) mb-4">{t('docs.websocket.connecting.healthChecksDesc')}</p>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-mono">
						<div className="p-3 bg-(--background)/50 border border-(--border)/10 rounded-xl">
							<div className="text-(--text-muted) text-xs mb-1">GET /health</div>
							<span className="text-green-400 font-semibold">200 OK &rarr; &quot;ok&quot;</span>
						</div>
						<div className="p-3 bg-(--background)/50 border border-(--border)/10 rounded-xl">
							<div className="text-(--text-muted) text-xs mb-1">GET /</div>
							<span className="text-green-400 font-semibold">200 OK &rarr; &quot;alive&quot;</span>
						</div>
					</div>
				</div>
			</div>
		</motion.section>
	);
}
