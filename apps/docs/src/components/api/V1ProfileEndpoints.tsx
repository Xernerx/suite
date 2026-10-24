/** @format */
'use client';

import { CodeBlock } from '@xernerx/ui';
import Image from 'next/image';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { Server, Code, Lock, Award } from 'lucide-react';
import { EndpointSection } from './EndpointSection';

interface V1SubProps {
	activeGroup?: string;
	searchQuery?: string;
	methodFilter?: string;
	defaultExpanded?: boolean;
	onTryRoute?: (method: string, path: string) => void;
	botId?: string;
}

export function V1ProfileEndpoints({ activeGroup = 'all', searchQuery = '', methodFilter = 'ALL', defaultExpanded = true, onTryRoute, botId = '' }: V1SubProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const apiBase = getEnvUrl('https://api.xernerx.com');
	const appBase = getEnvUrl('https://app.xernerx.com');

	const effectiveBotId = botId.trim() || 'YOUR_BOT_ID';
	const badgeBotId = botId.trim() || '1059956767103668244';
	const sampleBadgeUrl = `${apiBase}/v1/bots/${badgeBotId}/badge.svg?type=votes`;
	const sampleBotUrl = `${appBase}/bots/${badgeBotId}`;

	const sections = [
		{
			id: 'fetch-bot-profile',
			group: 'v1-profiles',
			title: t('docs.api.v1.endpoints.fetchBotProfile.title'),
			icon: Server,
			description: t('docs.api.v1.endpoints.fetchBotProfile.description'),
			routes: [{ method: 'GET', path: '/v1/bots/[id]/profile', auth: 'token' as const }],
			extra: (
				<div className="p-6 border-t border-(--border)/10 text-sm text-(--text-muted) space-y-4">
					<div className="bg-(--accent-orange)/10 border border-(--accent-orange)/20 p-4 rounded-2xl mb-6">
						<h3 className="text-(--accent-orange) font-bold mb-1 flex items-center gap-2">
							<Lock size={16} /> {t('docs.api.v1.endpoints.fetchBotProfile.privacyScope')}
						</h3>
						<p className="text-sm text-(--text-muted)" dangerouslySetInnerHTML={{ __html: t('docs.api.v1.endpoints.fetchBotProfile.privacyDesc') }}></p>
					</div>

					<h3 className="font-semibold text-(--text) mb-4 flex items-center gap-2">
						<Code size={16} /> {t('docs.api.v1.common.fetchExamples')}
					</h3>
					<CodeBlock
						tabs={[
							{
								label: 'cURL',
								language: 'bash',
								code: `curl -X GET "https://api.xernerx.com/v1/bots/${effectiveBotId}/profile" \\\n  -H "Authorization: Bearer YOUR_API_TOKEN"`,
							},
							{
								label: 'TypeScript (fetch)',
								language: 'typescript',
								code: `const response = await fetch('https://api.xernerx.com/v1/bots/${effectiveBotId}/profile', {\n    method: 'GET',\n    headers: {\n        'Authorization': 'Bearer YOUR_API_TOKEN'\n    }\n});\n\nconst profile = await response.json();\nconsole.log(profile);`,
							},
							{
								label: '@xernerx/stats SDK',
								language: 'typescript',
								code: `import { StatsClient } from '@xernerx/stats';\n\nconst stats = new StatsClient({\n    botId: '${effectiveBotId}',\n    token: process.env.XERNERX_API_TOKEN!\n});\n\nconst profile = await stats.getProfile();\nconsole.log(profile);`,
							},
							{
								label: 'Python',
								language: 'python',
								code: `import requests\n\nurl = "https://api.xernerx.com/v1/bots/${effectiveBotId}/profile"\nheaders = {\n    "Authorization": "Bearer YOUR_API_TOKEN"\n}\n\nresponse = requests.get(url, headers=headers)\nprint(response.json())`,
							},
						]}
					/>
				</div>
			),
		},
		{
			id: 'update-bot-profile',
			group: 'v1-profiles',
			title: t('docs.api.v1.endpoints.updateBotProfile.title'),
			icon: Code,
			description: t('docs.api.v1.endpoints.updateBotProfile.description'),
			routes: [{ method: 'PATCH', path: '/v1/bots/[id]/profile', auth: 'token' as const }],
			extra: (
				<div className="p-6 border-t border-(--border)/10">
					<h3 className="font-semibold text-(--text) mb-4 flex items-center gap-2">
						<Code size={16} /> {t('docs.api.v1.common.jsonBodyParameters')}
					</h3>
					<div className="overflow-x-auto mb-8 rounded-2xl border border-(--border)/10 bg-(--background)/40 p-4">
						<table className="w-full text-left border-collapse text-sm">
							<thead>
								<tr className="border-b border-(--border)/10 text-(--text-muted)">
									<th className="py-2 font-medium">{t('docs.api.v1.common.field')}</th>
									<th className="py-2 font-medium">{t('docs.api.v1.common.type')}</th>
									<th className="py-2 font-medium">{t('docs.api.v1.common.description')}</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-(--border)/5">
								<tr>
									<td className="py-3 font-mono text-(--accent)">description</td>
									<td className="py-3 font-mono">String</td>
									<td className="py-3 text-(--text-muted)">{t('docs.api.v1.endpoints.updateBotProfile.descField')}</td>
								</tr>
								<tr>
									<td className="py-3 font-mono text-(--accent)">info</td>
									<td className="py-3 font-mono">String</td>
									<td className="py-3 text-(--text-muted)">{t('docs.api.v1.endpoints.updateBotProfile.infoField')}</td>
								</tr>
								<tr>
									<td className="py-3 font-mono text-(--accent)">privacy</td>
									<td className="py-3 font-mono">String</td>
									<td className="py-3 text-(--text-muted)" dangerouslySetInnerHTML={{ __html: t('docs.api.v1.endpoints.updateBotProfile.privacyField') }}></td>
								</tr>
								<tr>
									<td className="py-3 font-mono text-(--accent)">tags</td>
									<td className="py-3 font-mono">Array</td>
									<td className="py-3 text-(--text-muted)">{t('docs.api.v1.endpoints.updateBotProfile.tagsField')}</td>
								</tr>
								<tr>
									<td className="py-3 font-mono text-(--accent)">links</td>
									<td className="py-3 font-mono">Object</td>
									<td className="py-3 text-(--text-muted)" dangerouslySetInnerHTML={{ __html: t('docs.api.v1.endpoints.updateBotProfile.linksField') }}></td>
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
								code: `curl -X PATCH "https://api.xernerx.com/v1/bots/${effectiveBotId}/profile" \\\n  -H "Authorization: Bearer YOUR_API_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{"description":"An updated short description for my bot!"}'`,
							},
							{
								label: 'TypeScript (fetch)',
								language: 'typescript',
								code: `const response = await fetch('https://api.xernerx.com/v1/bots/${effectiveBotId}/profile', {\n    method: 'PATCH',\n    headers: {\n        'Authorization': 'Bearer YOUR_API_TOKEN',\n        'Content-Type': 'application/json'\n    },\n    body: JSON.stringify({\n        description: "An updated short description for my bot!"\n    })\n});\n\nconst updatedProfile = await response.json();\nconsole.log(updatedProfile);`,
							},
							{
								label: '@xernerx/stats SDK',
								language: 'typescript',
								code: `import { StatsClient } from '@xernerx/stats';\n\nconst stats = new StatsClient({\n    botId: '${effectiveBotId}',\n    token: process.env.XERNERX_API_TOKEN!\n});\n\nawait stats.updateProfile({\n    description: 'An updated short description for my bot!'\n});`,
							},
							{
								label: 'Python',
								language: 'python',
								code: `import requests\n\nurl = "https://api.xernerx.com/v1/bots/${effectiveBotId}/profile"\nheaders = {\n    "Authorization": "Bearer YOUR_API_TOKEN",\n    "Content-Type": "application/json"\n}\ndata = {\n    "description": "An updated short description for my bot!"\n}\n\nresponse = requests.patch(url, json=data, headers=headers)\nprint(response.json())`,
							},
						]}
					/>
				</div>
			),
		},
		{
			id: 'delete-bot-profile',
			group: 'v1-profiles',
			title: t('docs.api.v1.endpoints.deleteBotProfile.title'),
			icon: Server,
			description: t('docs.api.v1.endpoints.deleteBotProfile.description'),
			routes: [{ method: 'DELETE', path: '/v1/bots/[id]/profile', auth: 'token' as const }],
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
								code: `curl -X DELETE "https://api.xernerx.com/v1/bots/${effectiveBotId}/profile" \\\n  -H "Authorization: Bearer YOUR_API_TOKEN"`,
							},
							{
								label: 'TypeScript (fetch)',
								language: 'typescript',
								code: `const response = await fetch('https://api.xernerx.com/v1/bots/${effectiveBotId}/profile', {\n    method: 'DELETE',\n    headers: {\n        'Authorization': 'Bearer YOUR_API_TOKEN'\n    }\n});\n\nconst result = await response.json();\nconsole.log(result);`,
							},
							{
								label: '@xernerx/stats SDK',
								language: 'typescript',
								code: `import { StatsClient } from '@xernerx/stats';\n\nconst stats = new StatsClient({\n    botId: '${effectiveBotId}',\n    token: process.env.XERNERX_API_TOKEN!\n});\n\nawait stats.deleteProfile();`,
							},
							{
								label: 'Python',
								language: 'python',
								code: `import requests\n\nurl = "https://api.xernerx.com/v1/bots/${effectiveBotId}/profile"\nheaders = {\n    "Authorization": "Bearer YOUR_API_TOKEN"\n}\n\nresponse = requests.delete(url, headers=headers)\nprint(response.json())`,
							},
						]}
					/>
				</div>
			),
		},
		{
			id: 'fetch-bot-badges',
			group: 'v1-badges',
			title: t('app.widgets.badgesTitle'),
			icon: Award,
			description: t('app.widgets.badgesDescription'),
			routes: [
				{ method: 'GET', path: '/v1/bots/[id]/badge.svg?type=votes|servers|users|status&theme=dark|light&style=rounded|pill|flat', auth: 'public' as const },
				{ method: 'GET', path: '/v1/guilds/[id]/badge.svg?type=votes|members|messages|status&theme=dark|light&style=rounded|pill|flat', auth: 'public' as const },
				{ method: 'GET', path: '/v1/organizations/[id]/badge.svg?type=members|bots|servers|status&theme=dark|light&style=rounded|pill|flat', auth: 'public' as const },
				{ method: 'GET', path: '/v1/users/[id]/badge.svg?type=streak|bots|orgs|status&theme=dark|light&style=rounded|pill|flat', auth: 'public' as const },
				{ method: 'GET', path: '/v1/status/badge.svg', auth: 'public' as const },
			],
			extra: (
				<div className="p-6 border-t border-(--border)/10">
					<CodeBlock
						preview={
							<div className="flex flex-wrap items-center gap-2">
								<Image src={`${apiBase}/v1/bots/1059956767103668244/badge.svg?type=votes`} alt="Votes Badge" width={110} height={24} unoptimized className="h-6 w-auto" />
								<Image src={`${apiBase}/v1/bots/1059956767103668244/badge.svg?type=servers`} alt="Servers Badge" width={120} height={24} unoptimized className="h-6 w-auto" />
								<Image src={`${apiBase}/v1/bots/1059956767103668244/badge.svg?type=status`} alt="Status Badge" width={110} height={24} unoptimized className="h-6 w-auto" />
								<Image src={`${apiBase}/v1/status/badge.svg`} alt="System Status Badge" width={130} height={24} unoptimized className="h-6 w-auto" />
							</div>
						}
						tabs={[
							{
								id: 'markdown',
								label: t('app.widgets.formatMarkdown'),
								language: 'markdown',
								code: `[![Xernerx Votes](${sampleBadgeUrl})](${sampleBotUrl})`,
							},
							{
								id: 'html',
								label: t('app.widgets.formatHtmlImg'),
								language: 'html',
								code: `<a href="${sampleBotUrl}" target="_blank" rel="noopener noreferrer">\n  <img src="${sampleBadgeUrl}" alt="Xernerx Votes" />\n</a>`,
							},
							{
								id: 'svg',
								label: t('app.widgets.formatDirectSvg'),
								language: 'url',
								code: sampleBadgeUrl,
							},
						]}
					/>
				</div>
			),
		},
	].filter((s) => activeGroup === 'all' || s.group === activeGroup);

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
