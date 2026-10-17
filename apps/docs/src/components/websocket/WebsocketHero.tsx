/** @format */
'use client';

import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';

export function WebsocketHero() {
	const { t } = useDictionary();

	return (
		<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
			<h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-(--text) mb-4" style={{ fontFamily: 'var(--font-fredoka)' }}>
				{t('docs.websocket.hero.title')}
			</h1>
			<p className="text-lg text-(--text-muted) leading-relaxed mb-6">{t('docs.websocket.hero.description')}</p>

			<div className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-orange-400 text-sm mb-12 shadow-sm">
				<AlertCircle className="shrink-0 mt-0.5" size={18} />
				<div>
					<strong className="block mb-1 text-orange-400">{t('docs.websocket.hero.alertTitle')}</strong>
					<p dangerouslySetInnerHTML={{ __html: t('docs.websocket.hero.alertDescription') }} />
				</div>
			</div>
		</motion.div>
	);
}
