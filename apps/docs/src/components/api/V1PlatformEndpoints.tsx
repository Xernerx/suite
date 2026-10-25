/** @format */
'use client';

import { useState } from 'react';
import { CodeBlock, Input, Selector } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import { Activity, Bot, Code, Rocket, Rss, Trophy, Webhook } from 'lucide-react';
import { EndpointSection } from './EndpointSection';

interface V1SubProps {
	activeGroup?: string;
	searchQuery?: string;
	methodFilter?: string;
	defaultExpanded?: boolean;
	onTryRoute?: (method: string, path: string) => void;
	botId?: string;
	onBotIdChange?: (val: string) => void;
	botOptions?: { label: string; value: string }[];
	showBotBar?: boolean;
}

export function V1PlatformEndpoints({
	activeGroup = 'all',
	searchQuery = '',
	methodFilter = 'ALL',
	defaultExpanded = true,
	onTryRoute,
	botId: controlledBotId,
	onBotIdChange,
	botOptions = [],
	showBotBar = true,
}: V1SubProps) {
	const { t } = useDictionary();
	const [localBotId, setLocalBotId] = useState('');

	if (activeGroup !== 'all' && activeGroup !== 'v1-platform') return null;

	const currentBotId = controlledBotId !== undefined ? controlledBotId : localBotId;
	const handleBotIdChange = (val: string) => {
		if (onBotIdChange) onBotIdChange(val);
		else setLocalBotId(val);
	};
	const effectiveBotId = currentBotId.trim() || 'YOUR_BOT_ID';

	const sections = [
		{
			id: 'post-bot-releases',
			title: t('docs.api.v1.endpoints.postBotReleases.title'),
			icon: Rocket,
			description: t('docs.api.v1.endpoints.postBotReleases.description'),
			routes: [
				{ method: 'GET', path: '/v1/bots/[id]/releases', auth: 'public' as const },
				{ method: 'POST', path: '/v1/bots/[id]/releases', auth: 'token' as const },
				{ method: 'PATCH', path: '/v1/bots/[id]/releases?releaseId=...', auth: 'token' as const },
				{ method: 'DELETE', path: '/v1/bots/[id]/releases?releaseId=...', auth: 'token' as const },
			],
			extra: (
				<div className="p-6 border-t border-(--border)/10">
					<h3 className="font-semibold text-(--text) mb-3 flex items-center gap-2">
						<Code size={16} /> {t('docs.api.v1.common.jsonBodyParameters')}
					</h3>
					<div className="overflow-x-auto rounded-2xl border border-(--border)/10 bg-(--background)/40 p-4 mb-6">
						<table className="w-full text-left text-sm border-collapse">
							<thead>
								<tr className="border-b border-(--border)/10 text-(--text-muted)">
									<th className="pb-2 font-medium">{t('docs.api.v1.common.field')}</th>
									<th className="pb-2 font-medium">{t('docs.api.v1.common.type')}</th>
									<th className="pb-2 font-medium">{t('docs.api.v1.common.description')}</th>
								</tr>
							</thead>
							<tbody className="text-(--text)">
								<tr className="border-b border-(--border)/5">
									<td className="py-3 font-mono text-(--accent)">version</td>
									<td className="py-3 font-mono">String</td>
									<td className="py-3">{t('docs.api.v1.endpoints.postBotReleases.versionDesc')}</td>
								</tr>
								<tr className="border-b border-(--border)/5">
									<td className="py-3 font-mono text-(--accent)">title</td>
									<td className="py-3 font-mono">String</td>
									<td className="py-3">{t('docs.api.v1.endpoints.postBotReleases.titleDesc')}</td>
								</tr>
								<tr className="border-b border-(--border)/5">
									<td className="py-3 font-mono text-(--accent)">notes</td>
									<td className="py-3 font-mono">String</td>
									<td className="py-3">{t('docs.api.v1.endpoints.postBotReleases.notesDesc')}</td>
								</tr>
								<tr>
									<td className="py-3 font-mono text-(--accent)">breaking</td>
									<td className="py-3 font-mono">Boolean</td>
									<td className="py-3">{t('docs.api.v1.endpoints.postBotReleases.breakingDesc')}</td>
								</tr>
							</tbody>
						</table>
					</div>

					<h3 className="font-semibold text-(--text) mb-4 flex items-center gap-2">
						<Code size={16} /> {t('docs.api.v1.common.fetchExamples')}
					</h3>
					<CodeBlock
						tabs={[
							{
								label: 'cURL',
								language: 'bash',
								code: `curl -X POST "https://api.xernerx.com/v1/bots/${effectiveBotId}/releases" \\\n  -H "Authorization: Bearer YOUR_API_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{"version":"1.4.0","title":"Spring Telemetry Update","notes":"Added shard latency metrics and new slash commands.","breaking":false}'`,
							},
							{
								label: 'TypeScript (fetch)',
								language: 'typescript',
								code: `const response = await fetch('https://api.xernerx.com/v1/bots/${effectiveBotId}/releases', {\n    method: 'POST',\n    headers: {\n        'Authorization': 'Bearer YOUR_API_TOKEN',\n        'Content-Type': 'application/json'\n    },\n    body: JSON.stringify({\n        version: '1.4.0',\n        title: 'Spring Telemetry Update',\n        notes: 'Added shard latency metrics and new slash commands.',\n        breaking: false\n    })\n});\n\nconst release = await response.json();\nconsole.log(release);`,
							},
							{
								label: '@xernerx/stats SDK',
								language: 'typescript',
								code: `import { StatsClient } from '@xernerx/stats';\n\nconst stats = new StatsClient({\n    botId: '${effectiveBotId}',\n    token: process.env.XERNERX_API_TOKEN!\n});\n\nawait stats.publishRelease({\n    version: '1.4.0',\n    title: 'Spring Telemetry Update',\n    notes: 'Added shard latency metrics and new slash commands.',\n    breaking: false\n});`,
							},
							{
								label: 'Python',
								language: 'python',
								code: `import requests\n\nurl = "https://api.xernerx.com/v1/bots/${effectiveBotId}/releases"\nheaders = {\n    "Authorization": "Bearer YOUR_API_TOKEN",\n    "Content-Type": "application/json"\n}\npayload = {\n    "version": "1.4.0",\n    "title": "Spring Telemetry Update",\n    "notes": "Added shard latency metrics and new slash commands.",\n    "breaking": False\n}\n\nresponse = requests.post(url, json=payload, headers=headers)\nprint(response.json())`,
							},
						]}
					/>
				</div>
			),
		},
		{
			id: 'fetch-leaderboard',
			title: t('docs.api.v1.endpoints.fetchLeaderboard.title'),
			icon: Trophy,
			description: t('docs.api.v1.endpoints.fetchLeaderboard.description'),
			routes: [{ method: 'GET', path: '/v1/leaderboard', auth: 'public' as const }],
			extra: (
				<div className="p-6 border-t border-(--border)/10">
					<h3 className="font-semibold text-(--text) mb-4 flex items-center gap-2">
						<Code size={16} /> {t('docs.api.v1.common.fetchExamples')}
					</h3>
					<CodeBlock
						tabs={[
							{
								label: 'cURL',
								language: 'bash',
								code: `curl -s "https://api.xernerx.com/v1/leaderboard"`,
							},
							{
								label: 'TypeScript (fetch)',
								language: 'typescript',
								code: `const response = await fetch('https://api.xernerx.com/v1/leaderboard');\nconst { bots, servers, streaks } = await response.json();\nconsole.log({ bots, servers, streaks });`,
							},
							{
								label: '@xernerx/stats SDK',
								language: 'typescript',
								code: `import { StatsClient } from '@xernerx/stats';\n\nconst stats = new StatsClient({ botId: '${effectiveBotId}', token: process.env.XERNERX_API_TOKEN! });\nconst leaderboard = await stats.getLeaderboard();\nconsole.log(leaderboard);`,
							},
							{
								label: 'Python',
								language: 'python',
								code: `import requests\n\nresponse = requests.get("https://api.xernerx.com/v1/leaderboard")\nprint(response.json())`,
							},
						]}
					/>
				</div>
			),
		},
		{
			id: 'fetch-changelog-rss',
			title: t('docs.api.v1.endpoints.fetchChangelogRss.title'),
			icon: Rss,
			description: t('docs.api.v1.endpoints.fetchChangelogRss.description'),
			routes: [{ method: 'GET', path: '/v1/changelog/rss.xml', auth: 'public' as const }],
			extra: (
				<div className="p-6 border-t border-(--border)/10">
					<h3 className="font-semibold text-(--text) mb-4 flex items-center gap-2">
						<Code size={16} /> {t('docs.api.v1.common.fetchExamples')}
					</h3>
					<CodeBlock
						tabs={[
							{
								label: 'cURL',
								language: 'bash',
								code: `curl -s "https://api.xernerx.com/v1/changelog/rss.xml"`,
							},
							{
								label: 'TypeScript (fetch)',
								language: 'typescript',
								code: `const response = await fetch('https://api.xernerx.com/v1/changelog/rss.xml');\nconst rssXml = await response.text();\nconsole.log(rssXml);`,
							},
							{
								label: '@xernerx/stats SDK',
								language: 'typescript',
								code: `import { StatsClient } from '@xernerx/stats';\n\nconst stats = new StatsClient({ botId: '${effectiveBotId}', token: process.env.XERNERX_API_TOKEN! });\nconst rssFeed = await fetch('https://api.xernerx.com/v1/changelog/rss.xml').then((r) => r.text());\nconsole.log(rssFeed);`,
							},
							{
								label: 'Python',
								language: 'python',
								code: `import requests\n\nresponse = requests.get("https://api.xernerx.com/v1/changelog/rss.xml")\nprint(response.text)`,
							},
						]}
					/>
				</div>
			),
		},
		{
			id: 'fetch-version-changelog',
			title: t('docs.api.v1.endpoints.fetchVersionChangelog.title'),
			icon: Activity,
			description: t('docs.api.v1.endpoints.fetchVersionChangelog.description'),
			routes: [
				{ method: 'GET', path: '/api/version', auth: 'public' as const },
				{ method: 'GET', path: '/api/changelog?version=latest|all|<semver>', auth: 'public' as const },
			],
			extra: (
				<div className="p-6 border-t border-(--border)/10">
					<h3 className="font-semibold text-(--text) mb-4 flex items-center gap-2">
						<Code size={16} /> {t('docs.api.v1.common.fetchExamples')}
					</h3>
					<CodeBlock
						tabs={[
							{
								label: 'cURL',
								language: 'bash',
								code: `curl -s "https://api.xernerx.com/api/version"\ncurl -s "https://api.xernerx.com/api/changelog?version=latest"`,
							},
							{
								label: 'TypeScript (fetch)',
								language: 'typescript',
								code: `const versionRes = await fetch('https://api.xernerx.com/api/version');\nconst { version } = await versionRes.json();\n\nconst changelogRes = await fetch('https://api.xernerx.com/api/changelog?version=all');\nconst { versions, selectedVersion, content, fullContent } = await changelogRes.json();`,
							},
							{
								label: '@xernerx/stats SDK',
								language: 'typescript',
								code: `import { StatsClient } from '@xernerx/stats';\n\nconst stats = new StatsClient({ botId: '${effectiveBotId}', token: process.env.XERNERX_API_TOKEN! });\nconst { version } = await fetch('https://api.xernerx.com/api/version').then((r) => r.json());\nconsole.log('Suite Version:', version);`,
							},
							{
								label: 'Python',
								language: 'python',
								code: `import requests\n\nversion = requests.get("https://api.xernerx.com/api/version").json()\nchangelog = requests.get("https://api.xernerx.com/api/changelog?version=latest").json()\nprint(version, changelog)`,
							},
						]}
					/>
				</div>
			),
		},
		{
			id: 'bot-webhooks-local-relay',
			title: t('docs.api.v1.endpoints.botWebhooksRelay.title'),
			icon: Webhook,
			description: t('docs.api.v1.endpoints.botWebhooksRelay.description'),
			routes: [
				{ method: 'POST', path: 'https://your-bot.example.com/webhooks/xernerx', auth: 'token' as const },
				{ method: 'POST', path: 'http://localhost:3000/webhooks/xernerx (Desktop App Relay)', auth: 'token' as const },
			],
			extra: (
				<div className="p-6 border-t border-(--border)/10 space-y-5">
					<div className="rounded-2xl bg-(--accent)/10 border border-(--accent)/30 p-4">
						<h4 className="text-sm font-bold text-(--accent) mb-1">{t('docs.api.v1.endpoints.botWebhooksRelay.localRelayTitle')}</h4>
						<p className="text-xs text-(--text-muted) leading-relaxed">{t('docs.api.v1.endpoints.botWebhooksRelay.localRelayDesc')}</p>
					</div>

					<div>
						<h3 className="font-semibold text-(--text) mb-3 flex items-center gap-2">
							<Code size={16} /> {t('docs.api.v1.endpoints.botWebhooksRelay.headersAndEvents')}
						</h3>
						<CodeBlock
							tabs={[
								{
									label: 'Express / Node.js Receiver',
									language: 'typescript',
									code: `import express from 'express';\n\nconst app = express();\napp.use(express.json());\n\napp.post('/webhooks/xernerx', (req, res) => {\n  const event = req.headers['x-xernerx-event']; // e.g. "POST vote", "POST review", "POST stat"\n  const deliveryId = req.headers['x-xernerx-delivery'];\n  const payload = req.body;\n\n  console.log(\`[Xernerx Webhook] \${event} (\${deliveryId})\`, payload);\n  res.status(200).json({ received: true });\n});\n\n// Test directly in /portal inside the Xernerx Desktop App using http://localhost:3000/webhooks/xernerx\napp.listen(3000, () => console.log('Listening on http://localhost:3000/webhooks/xernerx'));`,
								},
								{
									label: 'Webhook JSON Payload',
									language: 'json',
									code: `{\n  "event": "POST vote",\n  "botId": "${effectiveBotId}",\n  "test": true,\n  "timestamp": "2026-10-24T20:15:00.000Z",\n  "data": {\n    "userId": "987654321098765432",\n    "votes": 42,\n    "message": "Test webhook ping from Xernerx Developer Portal"\n  }\n}`,
								},
							]}
						/>
					</div>
				</div>
			),
		},
	];

	return (
		<>
			{showBotBar && (
				<div
					className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
					style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
				>
					<div className="flex items-center gap-3 min-w-0">
						<div className="w-10 h-10 rounded-2xl bg-(--accent)/10 border border-(--accent)/30 text-(--accent) flex items-center justify-center shrink-0">
							<Bot size={18} />
						</div>
						<div className="min-w-0">
							<h3 className="text-sm font-bold text-(--text)">{t('docs.api.v1.snippetGenerator.botIdLabel')}</h3>
							<p className="text-xs text-(--text-muted) truncate">{t('docs.api.v1.snippetGenerator.botIdHelper')}</p>
						</div>
					</div>
					<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto sm:min-w-80">
						{botOptions.length > 0 && (
							<div className="sm:w-52">
								<Selector
									value={currentBotId}
									onChange={(val: string) => handleBotIdChange(val)}
									options={[{ label: t('docs.api.v1.snippetGenerator.selectBotPlaceholder'), value: '' }, ...botOptions]}
									placeholder={t('docs.api.v1.snippetGenerator.selectBotPlaceholder')}
								/>
							</div>
						)}
						<div className="flex-1 sm:w-56">
							<Input value={currentBotId} onChange={(e) => handleBotIdChange(e.target.value)} placeholder={t('docs.api.v1.snippetGenerator.botIdPlaceholder')} />
						</div>
					</div>
				</div>
			)}

			{sections.map((section) => (
				<EndpointSection
					key={section.id}
					id={section.id}
					title={section.title}
					icon={section.icon}
					description={section.description}
					routes={section.routes}
					extra={section.extra}
					defaultExpanded={defaultExpanded}
					searchQuery={searchQuery}
					methodFilter={methodFilter}
					onTryRoute={onTryRoute}
				/>
			))}
		</>
	);
}
