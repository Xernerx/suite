/** @format */
'use client';

import { motion } from 'framer-motion';
import { Database, Globe, Layers } from 'lucide-react';
import { CodeBlock } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

export function WebsocketServicesSection() {
	const { t } = useDictionary();

	return (
		<motion.section id="services" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6 scroll-mt-24">
			<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
				<Database className="text-(--accent)" size={24} /> {t('docs.websocket.services.title')}
			</h2>
			<p className="text-(--text-muted)">{t('docs.websocket.services.description')}</p>

			{/* VIRTUE SERVICE */}
			<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl overflow-hidden">
				<div className="flex items-center gap-3 p-4 bg-(--background)/50 border-b border-(--border)/10">
					<Layers className="text-(--accent)" size={20} />
					<span className="font-bold text-(--text) font-mono">service: &quot;virtue&quot;</span>
					<span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">{t('docs.websocket.services.activeBadge')}</span>
				</div>

				<div className="p-6 space-y-6">
					<p className="text-sm text-(--text-muted)" dangerouslySetInnerHTML={{ __html: t('docs.websocket.services.virtue.description') }} />

					<div className="overflow-x-auto">
						<table className="w-full text-left text-sm border-collapse">
							<thead>
								<tr className="border-b border-(--border)/10 text-(--text-muted)">
									<th className="pb-2 font-medium">{t('docs.websocket.services.table.action')}</th>
									<th className="pb-2 font-medium">{t('docs.websocket.services.table.database')}</th>
									<th className="pb-2 font-medium">{t('docs.websocket.services.table.filterKeys')}</th>
									<th className="pb-2 font-medium">{t('docs.websocket.services.table.description')}</th>
								</tr>
							</thead>
							<tbody className="text-(--text)">
								<tr className="border-b border-(--border)/5">
									<td className="py-3 font-mono text-(--accent)">guilds</td>
									<td className="py-3 font-mono text-xs text-orange-400">virtue</td>
									<td className="py-3 font-mono text-xs">{'{ id }'}</td>
									<td className="py-3" dangerouslySetInnerHTML={{ __html: t('docs.websocket.services.virtue.guildsDesc') }} />
								</tr>
								<tr className="border-b border-(--border)/5">
									<td className="py-3 font-mono text-(--accent)">text</td>
									<td className="py-3 font-mono text-xs text-orange-400">virtue</td>
									<td className="py-3 font-mono text-xs">{'{ id, guild }'}</td>
									<td className="py-3">{t('docs.websocket.services.virtue.textDesc')}</td>
								</tr>
								<tr className="border-b border-(--border)/5">
									<td className="py-3 font-mono text-(--accent)">voice</td>
									<td className="py-3 font-mono text-xs text-orange-400">virtue</td>
									<td className="py-3 font-mono text-xs">{'{ id, guild }'}</td>
									<td className="py-3">{t('docs.websocket.services.virtue.voiceDesc')}</td>
								</tr>
								<tr className="border-b border-(--border)/5">
									<td className="py-3 font-mono text-(--accent)">globalLevel</td>
									<td className="py-3 font-mono text-xs text-blue-400">xernerx</td>
									<td className="py-3 font-mono text-xs">{'{ ownerId }'}</td>
									<td className="py-3">{t('docs.websocket.services.virtue.globalLevelDesc')}</td>
								</tr>
								<tr>
									<td className="py-3 font-mono text-(--accent)">globalUser</td>
									<td className="py-3 font-mono text-xs text-blue-400">xernerx</td>
									<td className="py-3 font-mono text-xs">{'{ id }'}</td>
									<td className="py-3">{t('docs.websocket.services.virtue.globalUserDesc')}</td>
								</tr>
							</tbody>
						</table>
					</div>

					<div>
						<h4 className="text-sm font-semibold text-(--text) mb-3">{t('docs.websocket.services.virtue.exampleTitle')}</h4>
						<div className="rounded-xl overflow-hidden border border-(--border)/10 text-sm">
							<CodeBlock
								tabs={[
									{
										label: 'Request',
										language: 'json',
										code: `{\n  "id": "req-guild-update",\n  "service": "virtue",\n  "method": "PATCH",\n  "action": "guilds",\n  "body": {\n    "id": "102938475612345678",\n    "mode": "extreme",\n    "levelUp": true,\n    "levelMessage": "Congratulations [@mention]! You reached level [@level]!"\n  }\n}`,
									},
									{
										label: 'Response',
										language: 'json',
										code: `{\n  "id": "req-guild-update",\n  "_id": "64e0a7bc9e1234567890abcd",\n  "id": "102938475612345678",\n  "mode": "extreme",\n  "cycles": {\n    "daily": false,\n    "weekly": false,\n    "monthly": false\n  },\n  "roles": {\n    "ignored": [],\n    "tracked": []\n  },\n  "levelUp": true,\n  "levelMessage": "Congratulations [@mention]! You reached level [@level]!",\n  "levelChannel": null,\n  "autoDelete": 0,\n  "createdAt": "2026-08-15T12:00:00.000Z",\n  "updatedAt": "2026-09-13T09:30:00.000Z"\n}`,
									},
								]}
							/>
						</div>
					</div>
				</div>
			</div>

			{/* XERNERX SERVICE */}
			<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl overflow-hidden">
				<div className="flex items-center gap-3 p-4 bg-(--background)/50 border-b border-(--border)/10">
					<Globe className="text-blue-400" size={20} />
					<span className="font-bold text-(--text) font-mono">service: &quot;xernerx&quot;</span>
					<span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">{t('docs.websocket.services.activeBadge')}</span>
				</div>

				<div className="p-6 space-y-6">
					<p className="text-sm text-(--text-muted)" dangerouslySetInnerHTML={{ __html: t('docs.websocket.services.xernerx.description') }} />

					<div className="overflow-x-auto">
						<table className="w-full text-left text-sm border-collapse">
							<thead>
								<tr className="border-b border-(--border)/10 text-(--text-muted)">
									<th className="pb-2 font-medium">{t('docs.websocket.services.table.action')}</th>
									<th className="pb-2 font-medium">{t('docs.websocket.services.table.database')}</th>
									<th className="pb-2 font-medium">{t('docs.websocket.services.table.filterKeys')}</th>
									<th className="pb-2 font-medium">{t('docs.websocket.services.table.description')}</th>
								</tr>
							</thead>
							<tbody className="text-(--text)">
								<tr className="border-b border-(--border)/5">
									<td className="py-3 font-mono text-(--accent)">users</td>
									<td className="py-3 font-mono text-xs text-blue-400">xernerx</td>
									<td className="py-3 font-mono text-xs">{'{ id }'}</td>
									<td className="py-3">{t('docs.websocket.services.xernerx.usersDesc')}</td>
								</tr>
								<tr className="border-b border-(--border)/5">
									<td className="py-3 font-mono text-(--accent)">levels</td>
									<td className="py-3 font-mono text-xs text-blue-400">xernerx</td>
									<td className="py-3 font-mono text-xs">
										{'{ id }'} or {'{ ownerId }'}
									</td>
									<td className="py-3">{t('docs.websocket.services.xernerx.levelsDesc')}</td>
								</tr>
								<tr className="border-b border-(--border)/5">
									<td className="py-3 font-mono text-(--accent)">credits</td>
									<td className="py-3 font-mono text-xs text-blue-400">xernerx</td>
									<td className="py-3 font-mono text-xs">
										{'{ id }'} or {'{ ownerId }'}
									</td>
									<td className="py-3">{t('docs.websocket.services.xernerx.creditsDesc')}</td>
								</tr>
								<tr className="border-b border-(--border)/5">
									<td className="py-3 font-mono text-(--accent)">tokens</td>
									<td className="py-3 font-mono text-xs text-blue-400">xernerx</td>
									<td className="py-3 font-mono text-xs">{'{ id }'}</td>
									<td className="py-3">{t('docs.websocket.services.xernerx.tokensDesc')}</td>
								</tr>
								<tr className="border-b border-(--border)/5">
									<td className="py-3 font-mono text-(--accent)">guilds</td>
									<td className="py-3 font-mono text-xs text-blue-400">xernerx</td>
									<td className="py-3 font-mono text-xs">{'{ id }'}</td>
									<td className="py-3">{t('docs.websocket.services.xernerx.guildsDesc')}</td>
								</tr>
								<tr>
									<td className="py-3 font-mono text-(--accent)">bots</td>
									<td className="py-3 font-mono text-xs text-blue-400">xernerx</td>
									<td className="py-3 font-mono text-xs">{'{ id }'}</td>
									<td className="py-3">{t('docs.websocket.services.xernerx.botsDesc')}</td>
								</tr>
							</tbody>
						</table>
					</div>

					<div>
						<h4 className="text-sm font-semibold text-(--text) mb-3">{t('docs.websocket.services.xernerx.exampleTitle')}</h4>
						<div className="rounded-xl overflow-hidden border border-(--border)/10 text-sm">
							<CodeBlock
								tabs={[
									{
										label: 'Request',
										language: 'json',
										code: `{\n  "id": "req-user-1",\n  "service": "xernerx",\n  "method": "GET",\n  "action": "users",\n  "body": {\n    "id": "482513687417061376"\n  }\n}`,
									},
									{
										label: 'Response',
										language: 'json',
										code: `{\n  "id": "req-user-1",\n  "_id": "69e120fbf62bd80cfa39a8e5",\n  "id": "482513687417061376",\n  "name": "Dummi",\n  "credits": {\n    "balance": 8445,\n    "streak": 5\n  },\n  "roles": ["owner"]\n}`,
									},
								]}
							/>
						</div>
					</div>
				</div>
			</div>

			{/* PLANNED SERVICES */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div className="bg-(--foreground)/20 border border-(--border)/10 rounded-2xl p-4">
					<div className="flex items-center justify-between mb-2">
						<span className="font-mono text-sm font-bold text-(--text)">service: &quot;metamorphosis&quot;</span>
						<span className="text-xs px-2 py-0.5 bg-(--border)/20 text-(--text-muted) rounded">{t('docs.websocket.services.stubBadge')}</span>
					</div>
					<p className="text-xs text-(--text-muted)">{t('docs.websocket.services.metamorphosis.desc')}</p>
				</div>

				<div className="bg-(--foreground)/20 border border-(--border)/10 rounded-2xl p-4">
					<div className="flex items-center justify-between mb-2">
						<span className="font-mono text-sm font-bold text-(--text)">service: &quot;zodiac&quot;</span>
						<span className="text-xs px-2 py-0.5 bg-(--border)/20 text-(--text-muted) rounded">{t('docs.websocket.services.stubBadge')}</span>
					</div>
					<p className="text-xs text-(--text-muted)">{t('docs.websocket.services.zodiac.desc')}</p>
				</div>
			</div>
		</motion.section>
	);
}
