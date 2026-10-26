/** @format */
'use client';

import { motion } from 'framer-motion';
import { Check, Copy, Radio } from 'lucide-react';
import { useState } from 'react';
import { CodeBlock } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

export function WebsocketConnectingSection() {
	const { t } = useDictionary();
	const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

	const gatewayUrls = [
		{
			id: 'prod',
			label: t('docs.websocket.connecting.productionEndpoint'),
			url: 'wss://ws.xernerx.com',
			badge: t('docs.api.common.badgeRelease'),
			badgeClass: 'bg-(--accent-green)/15 text-(--accent-green) border-(--accent-green)/30',
		},
		{
			id: 'dev',
			label: t('docs.websocket.connecting.developmentEndpoint'),
			url: 'wss://ws.dev.xernerx.com',
			badge: t('docs.api.common.badgeCanaryDev'),
			badgeClass: 'bg-(--accent-orange)/15 text-(--accent-orange) border-(--accent-orange)/30',
		},
		{
			id: 'local',
			label: t('docs.websocket.connecting.localRuntime'),
			url: 'ws://localhost:5000',
			badge: t('docs.api.common.badgePort5000'),
			badgeClass: 'bg-(--accent)/15 text-(--accent) border-(--accent)/30',
		},
	];

	const handleCopy = (url: string) => {
		navigator.clipboard.writeText(url);
		setCopiedUrl(url);
		setTimeout(() => setCopiedUrl(null), 1800);
	};

	return (
		<motion.section
			id="connecting"
			initial={{ opacity: 1, y: 0 }}
			animate={{ opacity: 1, y: 0 }}
			className="rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm scroll-mt-28"
			style={{ padding: 'var(--ui-gap)' }}
		>
			<div className="flex items-center gap-3 mb-4 pb-3 border-b border-(--border)/10">
				<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
					<Radio size={20} />
				</div>
				<div>
					<h2 className="text-xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('docs.websocket.connecting.title')}
					</h2>
					<p className="text-xs text-(--text-muted)" dangerouslySetInnerHTML={{ __html: t('docs.websocket.connecting.description') }} />
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
				{gatewayUrls.map((env) => {
					const isCopied = copiedUrl === env.url;
					return (
						<div key={env.id} className="flex flex-col justify-between gap-3 p-4 rounded-2xl bg-(--background)/60 border border-(--border)/10 hover:border-(--accent)/30 transition-colors">
							<div className="flex items-center justify-between gap-2">
								<span className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">{env.label}</span>
								<span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${env.badgeClass}`}>{env.badge}</span>
							</div>
							<div className="flex items-center justify-between gap-2 pt-1">
								<code className="text-xs sm:text-sm font-mono font-bold text-(--text) truncate">{env.url}</code>
								<button
									type="button"
									onClick={() => handleCopy(env.url)}
									className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-(--foreground)/60 hover:bg-(--accent)/15 text-(--text-muted) hover:text-(--accent) border border-(--border)/10 transition-colors cursor-pointer shrink-0"
								>
									{isCopied ? <Check size={12} className="text-(--accent-green)" /> : <Copy size={12} />}
									<span>{isCopied ? t('docs.api.common.copied') : t('docs.api.common.copyUrl')}</span>
								</button>
							</div>
						</div>
					);
				})}
			</div>

			<div className="p-4 rounded-2xl bg-(--background)/50 border border-(--border)/10 space-y-3">
				<div>
					<h3 className="text-sm font-bold text-(--text)">{t('docs.websocket.connecting.healthChecksTitle')}</h3>
					<p className="text-xs text-(--text-muted) mt-0.5">{t('docs.websocket.connecting.healthChecksDesc')}</p>
				</div>
				<div className="rounded-xl overflow-hidden border border-(--border)/10 text-sm">
					<CodeBlock
						tabs={[
							{
								label: 'GET /health',
								language: 'text',
								code: 'ok',
							},
							{
								label: 'GET /',
								language: 'text',
								code: 'alive',
							},
						]}
					/>
				</div>
			</div>
		</motion.section>
	);
}
