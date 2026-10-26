/** @format */
'use client';

import { CodeBlock } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import { Code, Info } from 'lucide-react';
import { EndpointSection } from './EndpointSection';

interface V1SubProps {
	activeGroup?: string;
	searchQuery?: string;
	methodFilter?: string;
	defaultExpanded?: boolean;
	onTryRoute?: (method: string, path: string) => void;
	botId?: string;
}

export function V1CommandsEndpoints({ activeGroup = 'all', searchQuery = '', methodFilter = 'ALL', defaultExpanded = true, onTryRoute, botId = '' }: V1SubProps) {
	const { t } = useDictionary();

	if (activeGroup !== 'all' && activeGroup !== 'v1-commands') return null;

	const effectiveBotId = botId.trim() || 'YOUR_BOT_ID';

	const sections = [
		{
			id: 'fetch-bot-commands',
			title: t('docs.api.v1.endpoints.fetchBotCommands.title'),
			icon: Code,
			description: t('docs.api.v1.endpoints.fetchBotCommands.description'),
			routes: [{ method: 'GET', path: '/v1/bots/[id]/commands', auth: 'token' as const }],
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
								code: `curl -X GET "https://api.xernerx.com/v1/bots/${effectiveBotId}/commands" \\\n  -H "Authorization: Bearer YOUR_API_TOKEN"`,
							},
							{
								label: 'TypeScript (fetch)',
								language: 'typescript',
								code: `const response = await fetch('https://api.xernerx.com/v1/bots/${effectiveBotId}/commands', {\n    method: 'GET',\n    headers: {\n        'Authorization': 'Bearer YOUR_API_TOKEN'\n    }\n});\n\nconst commands = await response.json();\nconsole.log(commands);`,
							},
							{
								label: '@xernerx/commands SDK',
								language: 'typescript',
								code: `import { CommandsClient } from '@xernerx/commands';\n\nconst commands = new CommandsClient({\n    botId: '${effectiveBotId}',\n    token: process.env.XERNERX_API_TOKEN!\n});\n\nconst currentCommands = await commands.getCommands();\nconsole.log(currentCommands);`,
							},
							{
								label: 'Python',
								language: 'python',
								code: `import requests\n\nurl = "https://api.xernerx.com/v1/bots/${effectiveBotId}/commands"\nheaders = {\n    "Authorization": "Bearer YOUR_API_TOKEN"\n}\n\nresponse = requests.get(url, headers=headers)\nprint(response.json())`,
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
			routes: [
				{ method: 'POST', path: '/v1/bots/[id]/commands', auth: 'token' as const },
				{ method: 'PUT', path: '/v1/bots/[id]/commands', auth: 'token' as const },
			],
			extra: (
				<div className="p-6 border-t border-(--border)/10">
					<div className="bg-(--accent)/10 border border-(--accent)/20 p-4 rounded-2xl mb-6">
						<h3 className="text-(--accent) font-bold mb-1 flex items-center gap-2">
							<Info size={16} /> {t('docs.api.v1.endpoints.syncBotCommands.bulkSync')}
						</h3>
						<p className="text-sm text-(--text-muted)" dangerouslySetInnerHTML={{ __html: t('docs.api.v1.endpoints.syncBotCommands.bulkSyncDesc') }}></p>
					</div>

					<h3 className="font-semibold text-(--text) mb-4 flex items-center gap-2">
						<Code size={16} /> {t('docs.api.v1.common.fetchExamples')}
					</h3>
					<CodeBlock
						tabs={[
							{
								label: '@xernerx/commands (Extension)',
								language: 'typescript',
								code: `import { XernerxCommands } from '@xernerx/commands';\n\n// Registers built-in developer commands (xc!) and auto-syncs slash & context commands on startup\nclient.modules.extensionHandler.loadExtensions(\n    new XernerxCommands(client, {\n        token: process.env.XERNERX_TOKEN!,\n        prefix: 'xc!',\n        useEmbeds: true,\n    })\n);`,
							},
							{
								label: '@xernerx/commands (CommandsClient)',
								language: 'typescript',
								code: `import { CommandsClient } from '@xernerx/commands';\n\nconst commands = new CommandsClient({\n    botId: '${effectiveBotId}',\n    token: process.env.XERNERX_API_TOKEN!\n});\n\nawait commands.postCommands([\n    {\n        name: 'ping',\n        description: 'Replies with Pong!',\n        type: 1\n    }\n]);`,
							},
							{
								label: 'TypeScript (fetch)',
								language: 'typescript',
								code: `const response = await fetch('https://api.xernerx.com/v1/bots/${effectiveBotId}/commands', {\n    method: 'PUT',\n    headers: {\n        'Authorization': 'Bearer YOUR_API_TOKEN',\n        'Content-Type': 'application/json'\n    },\n    body: JSON.stringify([\n        {\n            name: "ping",\n            description: "Replies with Pong!",\n            type: 1\n        }\n    ])\n});\n\nconst result = await response.json();\nconsole.log(result);`,
							},
							{
								label: 'cURL',
								language: 'bash',
								code: `curl -X PUT "https://api.xernerx.com/v1/bots/${effectiveBotId}/commands" \\\n  -H "Authorization: Bearer YOUR_API_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '[{"name":"ping","description":"Replies with Pong!","type":1}]'`,
							},
							{
								label: 'Python',
								language: 'python',
								code: `import requests\n\nurl = "https://api.xernerx.com/v1/bots/${effectiveBotId}/commands"\nheaders = {\n    "Authorization": "Bearer YOUR_API_TOKEN",\n    "Content-Type": "application/json"\n}\ndata = [\n    {\n        "name": "ping",\n        "description": "Replies with Pong!",\n        "type": 1\n    }\n]\n\nresponse = requests.put(url, json=data, headers=headers)\nprint(response.json())`,
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
			routes: [{ method: 'DELETE', path: '/v1/bots/[id]/commands?commandId=...', auth: 'token' as const }],
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
								code: `curl -X DELETE "https://api.xernerx.com/v1/bots/${effectiveBotId}/commands" \\\n  -H "Authorization: Bearer YOUR_API_TOKEN"`,
							},
							{
								label: 'TypeScript (fetch)',
								language: 'typescript',
								code: `const response = await fetch('https://api.xernerx.com/v1/bots/${effectiveBotId}/commands', {\n    method: 'DELETE',\n    headers: {\n        'Authorization': 'Bearer YOUR_API_TOKEN'\n    }\n});\n\nconst result = await response.json();\nconsole.log(result);`,
							},
							{
								label: '@xernerx/commands SDK',
								language: 'typescript',
								code: `import { CommandsClient } from '@xernerx/commands';\n\nconst commands = new CommandsClient({\n    botId: '${effectiveBotId}',\n    token: process.env.XERNERX_API_TOKEN!\n});\n\n// Delete a single command by ID or name, or clear all commands\nawait commands.deleteCommands('ping');\nawait commands.clearCommands();`,
							},
							{
								label: 'Python',
								language: 'python',
								code: `import requests\n\nurl = "https://api.xernerx.com/v1/bots/${effectiveBotId}/commands"\nheaders = {\n    "Authorization": "Bearer YOUR_API_TOKEN"\n}\n\nresponse = requests.delete(url, headers=headers)\nprint(response.json())`,
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
