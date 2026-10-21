/** @format */
'use client';

import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, CheckCircle2, Key } from 'lucide-react';
import { CodeBlock } from '@xernerx/ui';
import { useDictionary, useEnvironment } from '@xernerx/providers';

export function WebsocketAuthSection() {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();

	return (
		<motion.section
			id="authentication"
			initial={{ opacity: 1, y: 0 }}
			animate={{ opacity: 1, y: 0 }}
			className="rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden scroll-mt-28"
			style={{ padding: 'var(--ui-gap)' }}
		>
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-(--border)/10">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
						<Key size={20} />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<h2 className="text-xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('docs.websocket.auth.title')}
							</h2>
							<span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-(--accent)/15 text-(--accent) border border-(--accent)/30">service: &quot;auth&quot;</span>
						</div>
						<p className="text-xs text-(--text-muted) mt-0.5" dangerouslySetInnerHTML={{ __html: t('docs.websocket.auth.description') }} />
					</div>
				</div>

				<a
					href={getEnvUrl('https://account.xernerx.com/tokens')}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold bg-(--accent)/15 hover:bg-(--accent) text-(--accent) hover:text-white border border-(--accent)/30 transition-colors shrink-0 self-start sm:self-auto"
				>
					<span>{t('docs.api.common.manageTokensLink')}</span>
					<ArrowRight size={13} />
				</a>
			</div>

			<div className="space-y-6">
				<div className="p-4 rounded-2xl bg-(--background)/50 border border-(--border)/10 space-y-3">
					<div>
						<h3 className="text-sm font-bold text-(--text)">{t('docs.websocket.auth.requestPayloadTitle')}</h3>
						<p className="text-xs text-(--text-muted) mt-1" dangerouslySetInnerHTML={{ __html: t('docs.websocket.auth.requestPayloadDesc') }} />
					</div>
					<div className="rounded-xl overflow-hidden border border-(--border)/10 text-sm">
						<CodeBlock
							tabs={[
								{
									label: 'Request',
									language: 'json',
									code: `{\n  "id": "auth-req-1",\n  "service": "auth",\n  "body": {\n    "token": "YOUR_CLIENT_TOKEN"\n  }\n}`,
								},
							]}
						/>
					</div>
				</div>

				<div className="space-y-3">
					<h3 className="text-sm font-bold text-(--text)">{t('docs.websocket.auth.responsePayloadsTitle')}</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="p-4 rounded-2xl bg-(--background)/50 border border-(--border)/10 space-y-2.5">
							<h4 className="text-xs font-bold uppercase tracking-wider text-(--accent-green) flex items-center gap-1.5">
								<CheckCircle2 size={15} /> {t('docs.websocket.auth.successResponse')}
							</h4>
							<div className="rounded-xl overflow-hidden border border-(--border)/10 text-sm">
								<CodeBlock
									tabs={[
										{
											label: 'Success JSON',
											language: 'json',
											code: `{\n  "id": "auth-req-1",\n  "success": true\n}`,
										},
									]}
								/>
							</div>
						</div>

						<div className="p-4 rounded-2xl bg-(--background)/50 border border-(--border)/10 space-y-2.5">
							<h4 className="text-xs font-bold uppercase tracking-wider text-(--accent-red) flex items-center gap-1.5">
								<AlertCircle size={15} /> {t('docs.websocket.auth.failureResponse')}
							</h4>
							<div className="rounded-xl overflow-hidden border border-(--border)/10 text-sm">
								<CodeBlock
									tabs={[
										{
											label: 'Failure JSON',
											language: 'json',
											code: `{\n  "id": "auth-req-1",\n  "message": "Invalid token"\n}`,
										},
									]}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</motion.section>
	);
}
