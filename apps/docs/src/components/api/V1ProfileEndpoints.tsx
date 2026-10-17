/** @format */
'use client';

import { CodeBlock } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import { Server, Code, Lock } from 'lucide-react';
import { EndpointSection } from './EndpointSection';

export function V1ProfileEndpoints() {
	const { t } = useDictionary();

	const sections = [
		{
			id: 'fetch-bot-profile',
			title: t('docs.api.v1.endpoints.fetchBotProfile.title'),
			icon: Server,
			description: t('docs.api.v1.endpoints.fetchBotProfile.description'),
			routes: [{ method: 'GET', path: '/v1/bots/[id]/profile', color: 'blue' }],
			extra: (
				<div className="p-6 border-t border-(--border)/10 text-sm text-(--text-muted) space-y-4">
					<div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl mb-6">
						<h4 className="text-orange-500 font-bold mb-1 flex items-center gap-2">
							<Lock size={16} /> {t('docs.api.v1.endpoints.fetchBotProfile.privacyScope')}
						</h4>
						<p className="text-sm text-(--text-muted)" dangerouslySetInnerHTML={{ __html: t('docs.api.v1.endpoints.fetchBotProfile.privacyDesc') }}></p>
					</div>

					<h4 className="font-semibold text-(--text) mb-4 flex items-center gap-2">
						<Code size={16} /> {t('docs.api.v1.common.fetchExamples')}
					</h4>
					<CodeBlock
						tabs={[
							{
								label: 'TypeScript',
								language: 'typescript',
								code: `const response = await fetch('https://api.xernerx.com/v1/bots/YOUR_BOT_ID/profile', {\n    method: 'GET',\n    headers: {\n        'Authorization': 'Bearer YOUR_API_TOKEN'\n    }\n});\n\nconst profile = await response.json();\nconsole.log(profile);`,
							},
							{
								label: 'JavaScript',
								language: 'javascript',
								code: `const response = await fetch('https://api.xernerx.com/v1/bots/YOUR_BOT_ID/profile', {\n    method: 'GET',\n    headers: {\n        'Authorization': 'Bearer YOUR_API_TOKEN'\n    }\n});\n\nconst profile = await response.json();\nconsole.log(profile);`,
							},
							{
								label: 'Python',
								language: 'python',
								code: `import requests\n\nurl = "https://api.xernerx.com/v1/bots/YOUR_BOT_ID/profile"\nheaders = {\n    "Authorization": "Bearer YOUR_API_TOKEN"\n}\n\nresponse = requests.get(url, headers=headers)\nprint(response.json())`,
							},
						]}
					/>
				</div>
			),
		},
		{
			id: 'update-bot-profile',
			title: t('docs.api.v1.endpoints.updateBotProfile.title'),
			icon: Code,
			description: t('docs.api.v1.endpoints.updateBotProfile.description'),
			routes: [{ method: 'PATCH', path: '/v1/bots/[id]/profile', color: 'orange' }],
			extra: (
				<div className="p-6 border-t border-(--border)/10">
					<h4 className="font-semibold text-(--text) mb-4 flex items-center gap-2">
						<Code size={16} /> {t('docs.api.v1.common.jsonBodyParameters')}
					</h4>
					<div className="overflow-x-auto mb-8">
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

					<h4 className="font-semibold text-(--text) mb-4 flex items-center gap-2">
						<Code size={16} /> {t('docs.api.v1.common.fetchExamples')}
					</h4>
					<CodeBlock
						tabs={[
							{
								label: 'TypeScript',
								language: 'typescript',
								code: `const response = await fetch('https://api.xernerx.com/v1/bots/YOUR_BOT_ID/profile', {\n    method: 'PATCH',\n    headers: {\n        'Authorization': 'Bearer YOUR_API_TOKEN',\n        'Content-Type': 'application/json'\n    },\n    body: JSON.stringify({\n        description: "An updated short description for my bot!"\n    })\n});\n\nconst updatedProfile = await response.json();\nconsole.log(updatedProfile);`,
							},
							{
								label: 'JavaScript',
								language: 'javascript',
								code: `const response = await fetch('https://api.xernerx.com/v1/bots/YOUR_BOT_ID/profile', {\n    method: 'PATCH',\n    headers: {\n        'Authorization': 'Bearer YOUR_API_TOKEN',\n        'Content-Type': 'application/json'\n    },\n    body: JSON.stringify({\n        description: "An updated short description for my bot!"\n    })\n});\n\nconst updatedProfile = await response.json();\nconsole.log(updatedProfile);`,
							},
							{
								label: 'Python',
								language: 'python',
								code: `import requests\n\nurl = "https://api.xernerx.com/v1/bots/YOUR_BOT_ID/profile"\nheaders = {\n    "Authorization": "Bearer YOUR_API_TOKEN",\n    "Content-Type": "application/json"\n}\ndata = {\n    "description": "An updated short description for my bot!"\n}\n\nresponse = requests.patch(url, json=data, headers=headers)\nprint(response.json())`,
							},
						]}
					/>
				</div>
			),
		},
		{
			id: 'delete-bot-profile',
			title: t('docs.api.v1.endpoints.deleteBotProfile.title'),
			icon: Server,
			description: t('docs.api.v1.endpoints.deleteBotProfile.description'),
			routes: [{ method: 'DELETE', path: '/v1/bots/[id]/profile', color: 'red' }],
			extra: (
				<div className="p-6 border-t border-(--border)/10">
					<h4 className="font-semibold text-(--text) mb-4 flex items-center gap-2">
						<Code size={16} /> {t('docs.api.v1.common.fetchExamples')}
					</h4>
					<CodeBlock
						tabs={[
							{
								label: 'TypeScript',
								language: 'typescript',
								code: `const response = await fetch('https://api.xernerx.com/v1/bots/YOUR_BOT_ID/profile', {\n    method: 'DELETE',\n    headers: {\n        'Authorization': 'Bearer YOUR_API_TOKEN'\n    }\n});\n\nconst result = await response.json();\nconsole.log(result);`,
							},
							{
								label: 'JavaScript',
								language: 'javascript',
								code: `const response = await fetch('https://api.xernerx.com/v1/bots/YOUR_BOT_ID/profile', {\n    method: 'DELETE',\n    headers: {\n        'Authorization': 'Bearer YOUR_API_TOKEN'\n    }\n});\n\nconst result = await response.json();\nconsole.log(result);`,
							},
							{
								label: 'Python',
								language: 'python',
								code: `import requests\n\nurl = "https://api.xernerx.com/v1/bots/YOUR_BOT_ID/profile"\nheaders = {\n    "Authorization": "Bearer YOUR_API_TOKEN"\n}\n\nresponse = requests.delete(url, headers=headers)\nprint(response.json())`,
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
				<EndpointSection key={section.id} id={section.id} title={section.title} icon={section.icon} description={section.description} routes={section.routes} extra={section.extra} />
			))}
		</>
	);
}
