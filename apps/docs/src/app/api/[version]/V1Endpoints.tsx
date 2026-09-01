/** @format */
// Force recompile
import { CodeBlock } from '@xernerx/ui';
import { motion } from 'framer-motion';
import { useDictionary } from '@xernerx/providers';
import { Server, Code, BarChart2, Lock, Shield, Link as LinkIcon, Megaphone, Languages, FileText, Settings2, Info, Rocket } from 'lucide-react';

export function V1Endpoints() {
	const { t } = useDictionary();
	return (
		<>
			{[
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
				{
					id: 'fetch-bot-stats',
					title: t('docs.api.v1.endpoints.fetchBotStats.title'),
					icon: BarChart2,
					description: t('docs.api.v1.endpoints.fetchBotStats.description'),
					routes: [{ method: 'GET', path: '/v1/bots/[id]/stats', color: 'blue' }],
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
										code: `const response = await fetch('https://api.xernerx.com/v1/bots/YOUR_BOT_ID/stats', {\n    method: 'GET',\n    headers: {\n        'Authorization': 'Bearer YOUR_API_TOKEN'\n    }\n});\n\nconst stats = await response.json();\nconsole.log(stats);`,
									},
									{
										label: 'JavaScript',
										language: 'javascript',
										code: `const response = await fetch('https://api.xernerx.com/v1/bots/YOUR_BOT_ID/stats', {\n    method: 'GET',\n    headers: {\n        'Authorization': 'Bearer YOUR_API_TOKEN'\n    }\n});\n\nconst stats = await response.json();\nconsole.log(stats);`,
									},
									{
										label: 'Python',
										language: 'python',
										code: `import requests\n\nurl = "https://api.xernerx.com/v1/bots/YOUR_BOT_ID/stats"\nheaders = {\n    "Authorization": "Bearer YOUR_API_TOKEN"\n}\n\nresponse = requests.get(url, headers=headers)\nprint(response.json())`,
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
					routes: [{ method: 'POST', path: '/v1/bots/[id]/stats', color: 'green' }],
					extra: (
						<div className="p-6 border-t border-(--border)/10">
							<h4 className="font-semibold text-(--text) mb-3 flex items-center gap-2">
								<Code size={16} /> {t('docs.api.v1.common.jsonBodyParameters')}
							</h4>
							<table className="w-full text-left text-sm border-collapse mb-2">
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

							<div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl mt-6 mb-6">
								<h4 className="text-blue-500 font-bold mb-1 flex items-center gap-2">
									<Rocket size={16} /> {t('docs.api.v1.endpoints.postBotStats.nodePackage')}
								</h4>
								<p className="text-sm text-(--text-muted)" dangerouslySetInnerHTML={{ __html: t('docs.api.v1.endpoints.postBotStats.nodePackageDesc') }}></p>
							</div>

							<h4 className="font-semibold text-(--text) mb-4 flex items-center gap-2">
								<Code size={16} /> {t('docs.api.v1.common.fetchExamples')}
							</h4>
							<CodeBlock
								tabs={[
									{
										label: 'TypeScript',
										language: 'typescript',
										code: `const response = await fetch('https://api.xernerx.com/v1/bots/YOUR_BOT_ID/stats', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        serverCount: 1500,
        shardCount: 2,
        userCount: 450000
    })
});

const data = await response.json();
console.log(data);`,
									},
									{
										label: 'JavaScript',
										language: 'javascript',
										code: `const response = await fetch('https://api.xernerx.com/v1/bots/YOUR_BOT_ID/stats', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        serverCount: 1500,
        shardCount: 2,
        userCount: 450000
    })
});

const data = await response.json();
console.log(data);`,
									},
									{
										label: 'Python',
										language: 'python',
										code: `import requests

url = "https://api.xernerx.com/v1/bots/YOUR_BOT_ID/stats"
headers = {
    "Authorization": "Bearer YOUR_API_TOKEN",
    "Content-Type": "application/json"
}
data = {
    "serverCount": 1500,
    "shardCount": 2,
    "userCount": 450000
}

response = requests.post(url, json=data, headers=headers)
print(response.json())`,
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
					routes: [{ method: 'PATCH', path: '/v1/bots/[id]/stats', color: 'orange' }],
					extra: (
						<div className="p-6 border-t border-(--border)/10">
							<h4 className="font-semibold text-(--text) mb-3 flex items-center gap-2">
								<Code size={16} /> {t('docs.api.v1.common.jsonBodyParameters')}
							</h4>
							<table className="w-full text-left text-sm border-collapse mb-6">
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
							<h4 className="font-semibold text-(--text) mb-4 flex items-center gap-2">
								<Code size={16} /> {t('docs.api.v1.common.fetchExamples')}
							</h4>
							<CodeBlock
								tabs={[
									{
										label: 'TypeScript',
										language: 'typescript',
										code: `const response = await fetch('https://api.xernerx.com/v1/bots/YOUR_BOT_ID/stats?statId=...', {\n    method: 'PATCH',\n    headers: {\n        'Authorization': 'Bearer YOUR_API_TOKEN',\n        'Content-Type': 'application/json'\n    },\n    body: JSON.stringify({\n        serverCount: 1550\n    })\n});\n\nconst data = await response.json();\nconsole.log(data);`,
									},
									{
										label: 'JavaScript',
										language: 'javascript',
										code: `const response = await fetch('https://api.xernerx.com/v1/bots/YOUR_BOT_ID/stats?statId=...', {\n    method: 'PATCH',\n    headers: {\n        'Authorization': 'Bearer YOUR_API_TOKEN',\n        'Content-Type': 'application/json'\n    },\n    body: JSON.stringify({\n        serverCount: 1550\n    })\n});\n\nconst data = await response.json();\nconsole.log(data);`,
									},
									{
										label: 'Python',
										language: 'python',
										code: `import requests\n\nurl = "https://api.xernerx.com/v1/bots/YOUR_BOT_ID/stats?statId=..."\nheaders = {\n    "Authorization": "Bearer YOUR_API_TOKEN",\n    "Content-Type": "application/json"\n}\ndata = {\n    "serverCount": 1550\n}\n\nresponse = requests.patch(url, json=data, headers=headers)\nprint(response.json())`,
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
					routes: [{ method: 'DELETE', path: '/v1/bots/[id]/stats', color: 'red' }],
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
										code: `const response = await fetch('https://api.xernerx.com/v1/bots/YOUR_BOT_ID/stats?statId=...', {\n    method: 'DELETE',\n    headers: {\n        'Authorization': 'Bearer YOUR_API_TOKEN'\n    }\n});\n\nconst data = await response.json();\nconsole.log(data);`,
									},
									{
										label: 'JavaScript',
										language: 'javascript',
										code: `const response = await fetch('https://api.xernerx.com/v1/bots/YOUR_BOT_ID/stats?statId=...', {\n    method: 'DELETE',\n    headers: {\n        'Authorization': 'Bearer YOUR_API_TOKEN'\n    }\n});\n\nconst data = await response.json();\nconsole.log(data);`,
									},
									{
										label: 'Python',
										language: 'python',
										code: `import requests\n\nurl = "https://api.xernerx.com/v1/bots/YOUR_BOT_ID/stats?statId=..."\nheaders = {\n    "Authorization": "Bearer YOUR_API_TOKEN"\n}\n\nresponse = requests.delete(url, headers=headers)\nprint(response.json())`,
									},
								]}
							/>
						</div>
					),
				},
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
			].map((section) => {
				const Icon = section.icon;
				return (
					<motion.section key={section.id} id={section.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6 scroll-mt-24">
						<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
							<Icon className="text-(--accent)" size={24} /> {section.title}
						</h2>
						<p className="text-(--text-muted)">{section.description}</p>

						<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl overflow-hidden mb-6">
							{section.routes.map((route, i) => (
								<div key={i} className={`flex items-center gap-3 p-4 bg-(--background)/50 ${i !== section.routes.length - 1 || section.extra ? 'border-b border-(--border)/5' : ''}`}>
									<span className={`font-bold text-xs px-2 py-1 bg-${route.color}-500/20 text-${route.color}-500 rounded uppercase tracking-wider`}>{route.method}</span>
									<code className="text-(--text) font-mono">{route.path}</code>
								</div>
							))}
							{section.extra}
						</div>
					</motion.section>
				);
			})}
		</>
	);
}
