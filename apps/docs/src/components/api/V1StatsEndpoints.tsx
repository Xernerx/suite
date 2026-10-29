/** @format */
'use client';

import { CodeBlock } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import { BarChart2, Code, Rocket } from 'lucide-react';
import { EndpointSection } from './EndpointSection';

interface V1SubProps {
	activeGroup?: string;
	searchQuery?: string;
	methodFilter?: string;
	defaultExpanded?: boolean;
	onTryRoute?: (method: string, path: string) => void;
	botId?: string;
}

export function V1StatsEndpoints({ activeGroup = 'all', searchQuery = '', methodFilter = 'ALL', defaultExpanded = true, onTryRoute, botId = '' }: V1SubProps) {
	const { t } = useDictionary();

	if (activeGroup !== 'all' && activeGroup !== 'v1-stats') return null;

	const effectiveBotId = botId.trim() || 'YOUR_BOT_ID';

	const sections = [
		{
			id: 'fetch-bot-stats',
			title: t('docs.api.v1.endpoints.fetchBotStats.title'),
			icon: BarChart2,
			description: t('docs.api.v1.endpoints.fetchBotStats.description'),
			routes: [{ method: 'GET', path: '/v1/bots/[id]/stats', auth: 'token' as const }],
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
								code: `curl -X GET "https://api.xernerx.com/v1/bots/${effectiveBotId}/stats" \\\n  -H "Authorization: Bearer YOUR_API_TOKEN"`,
							},
							{
								label: 'TypeScript (fetch)',
								language: 'typescript',
								code: `const response = await fetch('https://api.xernerx.com/v1/bots/${effectiveBotId}/stats', {\n    method: 'GET',\n    headers: {\n        'Authorization': 'Bearer YOUR_API_TOKEN'\n    }\n});\n\nconst stats = await response.json();\nconsole.log(stats);`,
							},
							{
								label: '@xernerx/stats SDK',
								language: 'typescript',
								code: `import { StatsClient } from '@xernerx/stats';\n\nconst stats = new StatsClient({\n    botId: '${effectiveBotId}',\n    token: process.env.XERNERX_API_TOKEN!\n});\n\nconst currentStats = await stats.get();\nconsole.log(currentStats);`,
							},
							{
								label: 'Python',
								language: 'python',
								code: `import requests\n\nurl = "https://api.xernerx.com/v1/bots/${effectiveBotId}/stats"\nheaders = {\n    "Authorization": "Bearer YOUR_API_TOKEN"\n}\n\nresponse = requests.get(url, headers=headers)\nprint(response.json())`,
							},
						]}
					/>
				</div>
			),
		},
		{
			id: 'post-bot-stats',
			title: t('docs.api.v1.endpoints.postBotStats.title'),
			icon: BarChart2,
			description: t('docs.api.v1.endpoints.postBotStats.description'),
			routes: [{ method: 'POST', path: '/v1/bots/[id]/stats', auth: 'token' as const }],
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
									<td className="py-3 font-mono text-(--accent)">serverCount</td>
									<td className="py-3 font-mono">Number</td>
									<td className="py-3">{t('docs.api.v1.common.serverCountDesc')}</td>
								</tr>
								<tr className="border-b border-(--border)/5">
									<td className="py-3 font-mono text-(--accent)">shardCount</td>
									<td className="py-3 font-mono">Number</td>
									<td className="py-3">{t('docs.api.v1.common.shardCountDesc')}</td>
								</tr>
								<tr>
									<td className="py-3 font-mono text-(--accent)">userCount</td>
									<td className="py-3 font-mono">Number</td>
									<td className="py-3">{t('docs.api.v1.common.userCountDesc')}</td>
								</tr>
							</tbody>
						</table>
					</div>

					<div className="bg-(--accent)/10 border border-(--accent)/20 p-4 rounded-2xl mb-6">
						<h3 className="text-(--accent) font-bold mb-1 flex items-center gap-2">
							<Rocket size={16} /> {t('docs.api.v1.endpoints.postBotStats.nodePackage')}
						</h3>
						<p className="text-sm text-(--text-muted)" dangerouslySetInnerHTML={{ __html: t('docs.api.v1.endpoints.postBotStats.nodePackageDesc') }}></p>
					</div>

					<h3 className="font-semibold text-(--text) mb-4 flex items-center gap-2">
						<Code size={16} /> {t('docs.api.v1.common.fetchExamples')}
					</h3>
					<CodeBlock
						tabs={[
							{
								label: 'cURL',
								language: 'bash',
								code: `curl -X POST "https://api.xernerx.com/v1/bots/${effectiveBotId}/stats" \\\n  -H "Authorization: Bearer YOUR_API_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{"serverCount":1500,"shardCount":2,"userCount":450000}'`,
							},
							{
								label: 'TypeScript (fetch)',
								language: 'typescript',
								code: `const response = await fetch('https://api.xernerx.com/v1/bots/${effectiveBotId}/stats', {\n    method: 'POST',\n    headers: {\n        'Authorization': 'Bearer YOUR_API_TOKEN',\n        'Content-Type': 'application/json'\n    },\n    body: JSON.stringify({\n        serverCount: 1500,\n        shardCount: 2,\n        userCount: 450000\n    })\n});\n\nconst data = await response.json();\nconsole.log(data);`,
							},
							{
								label: '@xernerx/stats SDK',
								language: 'typescript',
								code: `import { StatsClient } from '@xernerx/stats';\n\nconst stats = new StatsClient({\n    botId: '${effectiveBotId}',\n    token: process.env.XERNERX_API_TOKEN!\n});\n\nawait stats.post({\n    guildCount: 1500,\n    shardCount: 2,\n    userCount: 450000\n});`,
							},
							{
								label: 'Python',
								language: 'python',
								code: `import requests\n\nurl = "https://api.xernerx.com/v1/bots/${effectiveBotId}/stats"\nheaders = {\n    "Authorization": "Bearer YOUR_API_TOKEN",\n    "Content-Type": "application/json"\n}\ndata = {\n    "serverCount": 1500,\n    "shardCount": 2,\n    "userCount": 450000\n}\n\nresponse = requests.post(url, json=data, headers=headers)\nprint(response.json())`,
							},
						]}
					/>
				</div>
			),
		},
		{
			id: 'update-bot-stats',
			title: t('docs.api.v1.endpoints.updateBotStats.title'),
			icon: BarChart2,
			description: t('docs.api.v1.endpoints.updateBotStats.description'),
			routes: [{ method: 'PATCH', path: '/v1/bots/[id]/stats?statId=...', auth: 'token' as const }],
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
								code: `curl -X PATCH "https://api.xernerx.com/v1/bots/${effectiveBotId}/stats?statId=..." \\\n  -H "Authorization: Bearer YOUR_API_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{"serverCount":1550}'`,
							},
							{
								label: 'TypeScript (fetch)',
								language: 'typescript',
								code: `const response = await fetch('https://api.xernerx.com/v1/bots/${effectiveBotId}/stats?statId=...', {\n    method: 'PATCH',\n    headers: {\n        'Authorization': 'Bearer YOUR_API_TOKEN',\n        'Content-Type': 'application/json'\n    },\n    body: JSON.stringify({\n        serverCount: 1550\n    })\n});\n\nconst data = await response.json();\nconsole.log(data);`,
							},
							{
								label: '@xernerx/stats SDK',
								language: 'typescript',
								code: `import { StatsClient } from '@xernerx/stats';\n\nconst stats = new StatsClient({\n    botId: '${effectiveBotId}',\n    token: process.env.XERNERX_API_TOKEN!\n});\n\nawait stats.update('STAT_ENTRY_ID', { guildCount: 1550 });`,
							},
							{
								label: 'Python',
								language: 'python',
								code: `import requests\n\nurl = "https://api.xernerx.com/v1/bots/${effectiveBotId}/stats?statId=..."\nheaders = {\n    "Authorization": "Bearer YOUR_API_TOKEN",\n    "Content-Type": "application/json"\n}\ndata = {\n    "serverCount": 1550\n}\n\nresponse = requests.patch(url, json=data, headers=headers)\nprint(response.json())`,
							},
						]}
					/>
				</div>
			),
		},
		{
			id: 'delete-bot-stats',
			title: t('docs.api.v1.endpoints.deleteBotStats.title'),
			icon: BarChart2,
			description: t('docs.api.v1.endpoints.deleteBotStats.description'),
			routes: [{ method: 'DELETE', path: '/v1/bots/[id]/stats?statId=...', auth: 'token' as const }],
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
								code: `curl -X DELETE "https://api.xernerx.com/v1/bots/${effectiveBotId}/stats?statId=..." \\\n  -H "Authorization: Bearer YOUR_API_TOKEN"`,
							},
							{
								label: 'TypeScript (fetch)',
								language: 'typescript',
								code: `const response = await fetch('https://api.xernerx.com/v1/bots/${effectiveBotId}/stats?statId=...', {\n    method: 'DELETE',\n    headers: {\n        'Authorization': 'Bearer YOUR_API_TOKEN'\n    }\n});\n\nconst data = await response.json();\nconsole.log(data);`,
							},
							{
								label: '@xernerx/stats SDK',
								language: 'typescript',
								code: `import { StatsClient } from '@xernerx/stats';\n\nconst stats = new StatsClient({\n    botId: '${effectiveBotId}',\n    token: process.env.XERNERX_API_TOKEN!\n});\n\nawait stats.delete('STAT_ENTRY_ID');`,
							},
							{
								label: 'Python',
								language: 'python',
								code: `import requests\n\nurl = "https://api.xernerx.com/v1/bots/${effectiveBotId}/stats?statId=..."\nheaders = {\n    "Authorization": "Bearer YOUR_API_TOKEN"\n}\n\nresponse = requests.delete(url, headers=headers)\nprint(response.json())`,
							},
						]}
					/>
				</div>
			),
		},
	];

	return (
		<>
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
