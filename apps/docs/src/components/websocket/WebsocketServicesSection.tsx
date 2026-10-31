/** @format */
'use client';

import { motion } from 'framer-motion';
import { Database, Globe, Layers } from 'lucide-react';
import { CodeBlock } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

interface WebsocketServicesSectionProps {
	searchQuery?: string;
	serviceFilter?: string;
}

export function WebsocketServicesSection({ searchQuery = '', serviceFilter = 'ALL' }: WebsocketServicesSectionProps) {
	const { t } = useDictionary();
	const q = searchQuery.trim().toLowerCase();

	const virtueActions = [
		{ action: 'guilds', db: 'virtue', dbClass: 'text-(--accent-orange)', filter: '{ id }', desc: t('docs.websocket.services.virtue.guildsDesc'), html: true },
		{ action: 'users', db: 'virtue', dbClass: 'text-(--accent-orange)', filter: '{ id }', desc: t('docs.websocket.services.virtue.usersDesc'), html: false },
		{ action: 'members', db: 'virtue', dbClass: 'text-(--accent-orange)', filter: '{ id, guild }', desc: t('docs.websocket.services.virtue.membersDesc'), html: false },
		{ action: 'text', db: 'virtue', dbClass: 'text-(--accent-orange)', filter: '{ id, guild }', desc: t('docs.websocket.services.virtue.textDesc'), html: false },
		{ action: 'voice', db: 'virtue', dbClass: 'text-(--accent-orange)', filter: '{ id, guild }', desc: t('docs.websocket.services.virtue.voiceDesc'), html: false },
	];

	const xernerxActions = [
		{ action: 'users', db: 'xernerx', filter: '{ id }', desc: t('docs.websocket.services.xernerx.usersDesc') },
		{ action: 'levels', db: 'xernerx', filter: '{ id } or { ownerId }', desc: t('docs.websocket.services.xernerx.levelsDesc') },
		{ action: 'credits', db: 'xernerx', filter: '{ id } or { ownerId }', desc: t('docs.websocket.services.xernerx.creditsDesc') },
		{ action: 'tokens', db: 'xernerx', filter: '{ id }', desc: t('docs.websocket.services.xernerx.tokensDesc') },
		{ action: 'appearance', db: 'xernerx', filter: '{ id }', desc: t('docs.websocket.services.xernerx.appearanceDesc') },
		{ action: 'subscriptions', db: 'xernerx', filter: '{ id } or { ownerId }', desc: t('docs.websocket.services.xernerx.subscriptionsDesc') },
		{ action: 'guilds', db: 'xernerx', filter: '{ id }', desc: t('docs.websocket.services.xernerx.guildsDesc') },
		{ action: 'bots', db: 'xernerx', filter: '{ id }', desc: t('docs.websocket.services.xernerx.botsDesc') },
		{ action: 'settings', db: 'xernerx', filter: '{ id }', desc: t('docs.websocket.services.xernerx.settingsDesc') },
	];

	const filteredVirtue = virtueActions.filter((a) => !q || 'virtue'.includes(q) || a.action.toLowerCase().includes(q) || a.db.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q));
	const filteredXernerx = xernerxActions.filter((a) => !q || 'xernerx'.includes(q) || a.action.toLowerCase().includes(q) || a.db.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q));

	const showVirtue = (serviceFilter === 'ALL' || serviceFilter === 'virtue') && filteredVirtue.length > 0;
	const showXernerx = (serviceFilter === 'ALL' || serviceFilter === 'xernerx') && filteredXernerx.length > 0;
	const showPlanned =
		(serviceFilter === 'ALL' || serviceFilter === 'planned') &&
		(!q ||
			'metamorphosis'.includes(q) ||
			'zodiac'.includes(q) ||
			t('docs.websocket.services.metamorphosis.desc').toLowerCase().includes(q) ||
			t('docs.websocket.services.zodiac.desc').toLowerCase().includes(q));

	return (
		<motion.section id="services" initial={{ opacity: 1, y: 0 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 scroll-mt-28">
			{/* VIRTUE SERVICE */}
			{showVirtue && (
				<div className="rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden">
					<div className="flex items-center justify-between gap-3 bg-(--background)/40 border-b border-(--border)/10" style={{ padding: 'var(--ui-gap)' }}>
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
								<Layers size={20} />
							</div>
							<div>
								<div className="flex items-center gap-2">
									<h3 className="font-bold text-lg text-(--text) font-mono">service: &quot;virtue&quot;</h3>
									<span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/30 rounded-full">
										{t('docs.websocket.services.activeBadge')}
									</span>
								</div>
								<p className="text-xs text-(--text-muted) mt-0.5">{t('docs.websocket.services.actionsCount', { count: filteredVirtue.length })}</p>
							</div>
						</div>
					</div>

					<div className="space-y-6" style={{ padding: 'var(--ui-gap)' }}>
						<p className="text-xs sm:text-sm text-(--text-muted) leading-relaxed" dangerouslySetInnerHTML={{ __html: t('docs.websocket.services.virtue.description') }} />

						<div className="overflow-x-auto rounded-2xl border border-(--border)/10 bg-(--background)/50 p-4">
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
									{filteredVirtue.map((row, idx) => (
										<tr key={row.action} className={idx < filteredVirtue.length - 1 ? 'border-b border-(--border)/5' : ''}>
											<td className="py-3 font-mono font-bold text-(--accent)">{row.action}</td>
											<td className={`py-3 font-mono text-xs font-bold ${row.dbClass}`}>{row.db}</td>
											<td className="py-3 font-mono text-xs text-(--text-muted)">{row.filter}</td>
											{row.html ? (
												<td className="py-3 text-(--text-muted)" dangerouslySetInnerHTML={{ __html: row.desc }} />
											) : (
												<td className="py-3 text-(--text-muted)">{row.desc}</td>
											)}
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<div>
							<h4 className="text-sm font-bold text-(--text) mb-3">{t('docs.websocket.services.virtue.exampleTitle')}</h4>
							<div className="rounded-2xl overflow-hidden border border-(--border)/10 text-sm">
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
			)}

			{/* XERNERX SERVICE */}
			{showXernerx && (
				<div className="rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden">
					<div className="flex items-center justify-between gap-3 bg-(--background)/40 border-b border-(--border)/10" style={{ padding: 'var(--ui-gap)' }}>
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
								<Globe size={20} />
							</div>
							<div>
								<div className="flex items-center gap-2">
									<h3 className="font-bold text-lg text-(--text) font-mono">service: &quot;xernerx&quot;</h3>
									<span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/30 rounded-full">
										{t('docs.websocket.services.activeBadge')}
									</span>
								</div>
								<p className="text-xs text-(--text-muted) mt-0.5">{t('docs.websocket.services.actionsCount', { count: filteredXernerx.length })}</p>
							</div>
						</div>
					</div>

					<div className="space-y-6" style={{ padding: 'var(--ui-gap)' }}>
						<p className="text-xs sm:text-sm text-(--text-muted) leading-relaxed" dangerouslySetInnerHTML={{ __html: t('docs.websocket.services.xernerx.description') }} />

						<div className="overflow-x-auto rounded-2xl border border-(--border)/10 bg-(--background)/50 p-4">
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
									{filteredXernerx.map((row, idx) => (
										<tr key={row.action} className={idx < filteredXernerx.length - 1 ? 'border-b border-(--border)/5' : ''}>
											<td className="py-3 font-mono font-bold text-(--accent)">{row.action}</td>
											<td className="py-3 font-mono text-xs font-bold text-(--accent)">{row.db}</td>
											<td className="py-3 font-mono text-xs text-(--text-muted)">{row.filter}</td>
											<td className="py-3 text-(--text-muted)">{row.desc}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<div>
							<h4 className="text-sm font-bold text-(--text) mb-3">{t('docs.websocket.services.xernerx.exampleTitle')}</h4>
							<div className="rounded-2xl overflow-hidden border border-(--border)/10 text-sm">
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
			)}

			{/* PLANNED SERVICES */}
			{showPlanned && (
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-3xl p-5 flex flex-col gap-2">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Database size={16} className="text-(--accent)" />
								<span className="font-mono text-sm font-bold text-(--text)">service: &quot;metamorphosis&quot;</span>
							</div>
							<span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 bg-(--background)/80 text-(--text-muted) border border-(--border)/15 rounded-full">
								{t('docs.websocket.services.stubBadge')}
							</span>
						</div>
						<p className="text-xs text-(--text-muted) leading-relaxed">{t('docs.websocket.services.metamorphosis.desc')}</p>
					</div>

					<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-3xl p-5 flex flex-col gap-2">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Database size={16} className="text-(--accent)" />
								<span className="font-mono text-sm font-bold text-(--text)">service: &quot;zodiac&quot;</span>
							</div>
							<span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 bg-(--background)/80 text-(--text-muted) border border-(--border)/15 rounded-full">
								{t('docs.websocket.services.stubBadge')}
							</span>
						</div>
						<p className="text-xs text-(--text-muted) leading-relaxed">{t('docs.websocket.services.zodiac.desc')}</p>
					</div>
				</div>
			)}
		</motion.section>
	);
}
