/** @format */
'use client';

import { CodeBlock } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import { Code, Info } from 'lucide-react';
import { EndpointSection } from './EndpointSection';

export function V1CommandsEndpoints() {
	const { t } = useDictionary();

	const sections = [
		{
			id: 'fetch-bot-commands',
			title: t('docs.api.v1.endpoints.fetchBotCommands.title'),
			icon: Code,
			description: t('docs.api.v1.endpoints.fetchBotCommands.description'),
			routes: [{ method: 'GET', path: '/v1/bots/[id]/commands', color: 'blue' }],
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
								code: `const response = await fetch('https://api.xernerx.com/v1/bots/YOUR_BOT_ID/commands', {\n    method: 'GET',\n    headers: {\n        'Authorization': 'Bearer YOUR_API_TOKEN'\n    }\n});\n\nconst commands = await response.json();\nconsole.log(commands);`,
							},
							{
								label: 'JavaScript',
								language: 'javascript',
								code: `const response = await fetch('https://api.xernerx.com/v1/bots/YOUR_BOT_ID/commands', {\n    method: 'GET',\n    headers: {\n        'Authorization': 'Bearer YOUR_API_TOKEN'\n    }\n});\n\nconst commands = await response.json();\nconsole.log(commands);`,
							},
							{
								label: 'Python',
								language: 'python',
								code: `import requests\n\nurl = "https://api.xernerx.com/v1/bots/YOUR_BOT_ID/commands"\nheaders = {\n    "Authorization": "Bearer YOUR_API_TOKEN"\n}\n\nresponse = requests.get(url, headers=headers)\nprint(response.json())`,
							},
						]}
					/>
				</div>
			),
		},
		{
			id: 'sync-bot-commands',
			title: t('docs.api.v1.endpoints.syncBotCommands.title'),
			icon: Code,
			description: t('docs.api.v1.endpoints.syncBotCommands.description'),
			routes: [{ method: 'PUT', path: '/v1/bots/[id]/commands', color: 'purple' }],
			extra: (
				<div className="p-6 border-t border-(--border)/10">
					<div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl mb-6">
						<h4 className="text-blue-500 font-bold mb-1 flex items-center gap-2">
							<Info size={16} /> {t('docs.api.v1.endpoints.syncBotCommands.bulkSync')}
						</h4>
						<p className="text-sm text-(--text-muted)" dangerouslySetInnerHTML={{ __html: t('docs.api.v1.endpoints.syncBotCommands.bulkSyncDesc') }}></p>
					</div>

					<h4 className="font-semibold text-(--text) mb-4 flex items-center gap-2">
						<Code size={16} /> {t('docs.api.v1.common.fetchExamples')}
					</h4>
					<CodeBlock
						tabs={[
							{
								label: 'TypeScript',
								language: 'typescript',
								code: `const response = await fetch('https://api.xernerx.com/v1/bots/YOUR_BOT_ID/commands', {
    method: 'PUT',
    headers: {
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    },
    // Pass your raw Discord command array
    body: JSON.stringify([
        {
            name: "ping",
            description: "Replies with Pong!",
            type: 1
        }
    ])
});

const result = await response.json();
console.log(result);`,
							},
							{
								label: 'JavaScript',
								language: 'javascript',
								code: `const response = await fetch('https://api.xernerx.com/v1/bots/YOUR_BOT_ID/commands', {
    method: 'PUT',
    headers: {
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify([
        {
            name: "ping",
            description: "Replies with Pong!",
            type: 1
        }
    ])
});

const result = await response.json();
console.log(result);`,
							},
							{
								label: 'Python',
								language: 'python',
								code: `import requests

url = "https://api.xernerx.com/v1/bots/YOUR_BOT_ID/commands"
headers = {
    "Authorization": "Bearer YOUR_API_TOKEN",
    "Content-Type": "application/json"
}
data = [
    {
        "name": "ping",
        "description": "Replies with Pong!",
        "type": 1
    }
]

response = requests.put(url, json=data, headers=headers)
print(response.json())`,
							},
						]}
					/>
				</div>
			),
		},
		{
			id: 'delete-bot-commands',
			title: t('docs.api.v1.endpoints.deleteBotCommands.title'),
			icon: Code,
			description: t('docs.api.v1.endpoints.deleteBotCommands.description'),
			routes: [{ method: 'DELETE', path: '/v1/bots/[id]/commands', color: 'red' }],
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
								code: `const response = await fetch('https://api.xernerx.com/v1/bots/YOUR_BOT_ID/commands', {\n    method: 'DELETE',\n    headers: {\n        'Authorization': 'Bearer YOUR_API_TOKEN'\n    }\n});\n\nconst result = await response.json();\nconsole.log(result);`,
							},
							{
								label: 'JavaScript',
								language: 'javascript',
								code: `const response = await fetch('https://api.xernerx.com/v1/bots/YOUR_BOT_ID/commands', {\n    method: 'DELETE',\n    headers: {\n        'Authorization': 'Bearer YOUR_API_TOKEN'\n    }\n});\n\nconst result = await response.json();\nconsole.log(result);`,
							},
							{
								label: 'Python',
								language: 'python',
								code: `import requests\n\nurl = "https://api.xernerx.com/v1/bots/YOUR_BOT_ID/commands"\nheaders = {\n    "Authorization": "Bearer YOUR_API_TOKEN"\n}\n\nresponse = requests.delete(url, headers=headers)\nprint(response.json())`,
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
