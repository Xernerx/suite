/** @format */
'use client';

import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Key } from 'lucide-react';
import { CodeBlock } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

export function WebsocketAuthSection() {
	const { t } = useDictionary();

	return (
		<motion.section id="authentication" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6 scroll-mt-24">
			<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
				<Key className="text-(--accent)" size={24} /> {t('docs.websocket.auth.title')}
			</h2>
			<p className="text-(--text-muted)" dangerouslySetInnerHTML={{ __html: t('docs.websocket.auth.description') }} />

			<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl overflow-hidden">
				<div className="p-6 space-y-6">
					<div>
						<h3 className="text-lg font-semibold text-(--text) mb-2">{t('docs.websocket.auth.requestPayloadTitle')}</h3>
						<p className="text-sm text-(--text-muted) mb-4" dangerouslySetInnerHTML={{ __html: t('docs.websocket.auth.requestPayloadDesc') }} />
						<div className="rounded-xl overflow-hidden border border-(--border)/10 text-sm mb-6">
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

					<div>
						<h3 className="text-lg font-semibold text-(--text) mb-2">{t('docs.websocket.auth.responsePayloadsTitle')}</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-1.5">
									<CheckCircle2 size={16} /> {t('docs.websocket.auth.successResponse')}
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

							<div>
								<h4 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-1.5">
									<AlertCircle size={16} /> {t('docs.websocket.auth.failureResponse')}
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
			</div>
		</motion.section>
	);
}
