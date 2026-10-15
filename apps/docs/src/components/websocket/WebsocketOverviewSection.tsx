/** @format */
'use client';

import { motion } from 'framer-motion';
import { Database, Globe, Key, Radio } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';

export function WebsocketOverviewSection() {
	const { t } = useDictionary();

	return (
		<motion.section id="overview" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6 scroll-mt-24">
			<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
				<Globe className="text-(--accent)" size={24} /> {t('docs.websocket.overview.title')}
			</h2>
			<div className="prose prose-invert max-w-none text-(--text-muted) space-y-4">
				<p dangerouslySetInnerHTML={{ __html: t('docs.websocket.overview.description1') }} />
				<p dangerouslySetInnerHTML={{ __html: t('docs.websocket.overview.description2') }} />
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl p-6">
					<div className="flex items-center gap-3 mb-2 text-(--text) font-semibold">
						<Radio className="text-(--accent)" size={20} />
						<span>{t('docs.websocket.overview.cards.socket.title')}</span>
					</div>
					<p className="text-sm text-(--text-muted)">{t('docs.websocket.overview.cards.socket.desc')}</p>
				</div>

				<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl p-6">
					<div className="flex items-center gap-3 mb-2 text-(--text) font-semibold">
						<Key className="text-orange-400" size={20} />
						<span>{t('docs.websocket.overview.cards.auth.title')}</span>
					</div>
					<p className="text-sm text-(--text-muted)" dangerouslySetInnerHTML={{ __html: t('docs.websocket.overview.cards.auth.desc') }} />
				</div>

				<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl p-6">
					<div className="flex items-center gap-3 mb-2 text-(--text) font-semibold">
						<Database className="text-emerald-400" size={20} />
						<span>{t('docs.websocket.overview.cards.proxy.title')}</span>
					</div>
					<p className="text-sm text-(--text-muted)">{t('docs.websocket.overview.cards.proxy.desc')}</p>
				</div>
			</div>
		</motion.section>
	);
}
