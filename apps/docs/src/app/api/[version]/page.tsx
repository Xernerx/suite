/** @format */
'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, BarChart2, Book, Code, Globe, Key, Lock, Rocket, Server, Shield, Terminal, Link as LinkIcon, Megaphone, Languages, FileText, Settings2, Info } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSidebar, useUser, useEnvironment } from '@xernerx/providers';
import { Selector, CodeBlock } from '@xernerx/ui';

import { useParams, useRouter } from 'next/navigation';

export default function APIDocs() {
	const { version } = useParams() as { version: string };
	const router = useRouter();
	const { setNavItems, show, clearNavItems } = useSidebar();
	const { user } = useUser() as any;
	const { getEnvUrl } = useEnvironment();

	const [isAdmin, setIsAdmin] = useState(false);

	useEffect(() => {
		const checkAdmin = async () => {
			if (!user?.roles || !Array.isArray(user.roles) || user.roles.length === 0) return;
			try {
				const rolePromises = user.roles.map(async (roleItem: any) => {
					const roleId = typeof roleItem === 'string' ? roleItem : roleItem.id;
					if (!roleId) return null;
					const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/core/${roleId}`), { credentials: 'include' });
					if (!res.ok) return null;
					return res.json();
				});
				const fetchedRoles = await Promise.all(rolePromises);
				const hasPerm = fetchedRoles.some((role: any) => role?.permissions?.settings === true || role?.permissions?.tokens === true || role?.permissions?.access === true);
				setIsAdmin(hasPerm);
			} catch (err) {
				console.error('Failed to verify role permissions:', err);
			}
		};
		checkAdmin();
	}, [user?.roles, getEnvUrl]);

	useEffect(() => {
		show();

		let navItems = [
			{ label: 'Back to Categories', href: '/', icon: ArrowLeft, category: 'Navigation' },
			{ label: 'Overview', href: '#overview', icon: Globe, category: 'REST API' },
			{ label: 'Authentication', href: '#authentication', icon: Key, category: 'REST API' },
		];

		if (version === 'v1') {
			navItems.push(
				{ label: 'Fetch Bot Profile', href: '#fetch-bot-profile', icon: Server, category: 'Endpoints' },
				{ label: 'Update Bot Profile', href: '#update-bot-profile', icon: Code, category: 'Endpoints' },
				{ label: 'Delete Bot Profile', href: '#delete-bot-profile', icon: Server, category: 'Endpoints' },
				{ label: 'Fetch Bot Stats', href: '#fetch-bot-stats', icon: BarChart2, category: 'Endpoints' },
				{ label: 'Post Bot Stats', href: '#post-bot-stats', icon: BarChart2, category: 'Endpoints' },
				{ label: 'Update Bot Stats', href: '#update-bot-stats', icon: BarChart2, category: 'Endpoints' },
				{ label: 'Delete Bot Stats', href: '#delete-bot-stats', icon: BarChart2, category: 'Endpoints' },
				{ label: 'Fetch Bot Commands', href: '#fetch-bot-commands', icon: Code, category: 'Endpoints' },
				{ label: 'Sync Bot Commands', href: '#sync-bot-commands', icon: Code, category: 'Endpoints' },
				{ label: 'Delete Bot Commands', href: '#delete-bot-commands', icon: Code, category: 'Endpoints' }
			);
		} else if (version === 'core' && isAdmin) {
			navItems.push(
				{ label: 'Fetch Discord Profile', href: '#fetch-discord-profile', icon: Server, category: 'Users' },
				{ label: 'Fetch Discord Guilds', href: '#fetch-discord-guilds', icon: Shield, category: 'Users' },
				{ label: 'Fetch Discord Guild', href: '#fetch-discord-guild', icon: Globe, category: 'Guilds' },
				{ label: 'Fetch Discord Roles', href: '#fetch-discord-roles', icon: Key, category: 'Guilds' }
			);
		} else if (version === 'secure' && isAdmin) {
			navItems.push(
				{ label: 'Manage Users', href: '#manage-users', icon: Server, category: 'Endpoints' },
				{ label: 'Manage Tokens', href: '#manage-tokens', icon: Key, category: 'Endpoints' },
				{ label: 'Manage Roles', href: '#manage-roles', icon: Shield, category: 'Endpoints' },
				{ label: 'Manage Invites', href: '#manage-invites', icon: LinkIcon, category: 'Endpoints' },
				{ label: 'Manage Announcements', href: '#manage-announcements', icon: Megaphone, category: 'Endpoints' },
				{ label: 'Manage Translations', href: '#manage-translations', icon: Languages, category: 'Endpoints' },
				{ label: 'Manage Applications', href: '#manage-applications', icon: FileText, category: 'Endpoints' },
				{ label: 'System Settings', href: '#system-settings', icon: Settings2, category: 'Endpoints' }
			);
		}

		setNavItems(navItems);

		return () => clearNavItems();
	}, [setNavItems, show, clearNavItems, version, isAdmin]);

	return (
		<div className="max-w-7xl mx-auto py-12 px-6 lg:px-8 w-full selection:bg-(--accent) selection:text-white">
			<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
					<h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
						Xernerx REST API <span className="text-2xl text-(--accent)">{version}</span>
					</h1>
					<div className="w-full sm:w-48">
						<Selector
							value={version}
							onChange={(val: string) => router.push(`/api/${val}`)}
							options={[
								{ label: 'v1', value: 'v1' },
								...(isAdmin
									? [
											{ label: 'core', value: 'core' },
											{ label: 'secure', value: 'secure' },
										]
									: []),
							]}
							placeholder="Select Version"
						/>
					</div>
				</div>
				<p className="text-lg text-(--text-muted) leading-relaxed mb-12">
					The Xernerx {version.toUpperCase()} API allows developers to programmatically interface with the ecosystem, manage bot statistics, and automate organization workflows.
				</p>
			</motion.div>

			<div className="space-y-16">
				{/* OVERVIEW SECTION */}
				<motion.section id="overview" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6 scroll-mt-24">
					<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
						<Globe className="text-(--accent)" size={24} /> Base URL
					</h2>
					<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl p-6">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
							<div>
								<h3 className="font-semibold text-(--text) mb-1">Production Endpoint</h3>
								<code className="text-sm text-(--accent) bg-(--accent)/10 px-2 py-1 rounded">https://api.xernerx.com</code>
							</div>
							<div>
								<h3 className="font-semibold text-(--text) mb-1">Canary Endpoint</h3>
								<code className="text-sm text-orange-500 bg-orange-500/10 px-2 py-1 rounded">https://api.canary.xernerx.com</code>
							</div>
							<div>
								<h3 className="font-semibold text-(--text) mb-1">Development Endpoint</h3>
								<code className="text-sm text-blue-500 bg-blue-500/10 px-2 py-1 rounded">https://api.dev.xernerx.com</code>
							</div>
						</div>
					</div>
				</motion.section>

				<motion.section id="authentication" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6 scroll-mt-24">
					<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
						<Key className="text-(--accent)" size={24} /> Authentication
					</h2>
					<p className="text-(--text-muted)">
						All programmatic API requests across the platform must be authenticated using an API Token generated from your developer dashboard.
						{version === 'secure' && ' Internal web requests may also utilize standard NextAuth session cookies.'}
					</p>

					<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl p-6">
						<p className="mb-4 text-sm text-(--text-muted)">
							Pass your token in the <code>Authorization</code> HTTP header as a Bearer token.
						</p>

						<div className={version === 'secure' ? 'mb-4' : ''}>
							<CodeBlock
								tabs={[
									{
										label: 'TypeScript',
										language: 'typescript',
										code: `const headers: HeadersInit = {
  'Authorization': 'Bearer xnx_live_abc123def456...'
};`,
									},
									{
										label: 'JavaScript',
										language: 'javascript',
										code: `const headers = {
  'Authorization': 'Bearer xnx_live_abc123def456...'
};`,
									},
									{
										label: 'Python',
										language: 'python',
										code: `headers = {
    "Authorization": "Bearer xnx_live_abc123def456..."
}`,
									},
								]}
							/>
						</div>

						{version === 'secure' && (
							<div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl mt-4">
								<h4 className="text-orange-500 font-bold mb-1 flex items-center gap-2">
									<Lock size={16} /> Secure Passage
								</h4>
								<p className="text-sm text-(--text-muted)">
									The <code>/secure</code> API routes manage sensitive administrative components (roles, users, etc.). While utilized internally by the dashboard, they can also be
									accessed by third-party applications if an administrator has explicitly granted the API token the <code>secure</code> passage flag.
								</p>
							</div>
						)}
					</div>
				</motion.section>

				{/* V1 ENDPOINTS */}
				{version === 'v1' && (
					<>
						{[
							{
								id: 'fetch-bot-profile',
								title: 'Fetch Bot Profile',
								icon: Server,
								description: 'Retrieve public or private profile metadata for a specific Discord bot.',
								routes: [{ method: 'GET', path: '/v1/bots/[id]/profile', color: 'blue' }],
								extra: (
									<div className="p-6 border-t border-(--border)/10 text-sm text-(--text-muted) space-y-4">
										<div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl mb-6">
											<h4 className="text-orange-500 font-bold mb-1 flex items-center gap-2">
												<Lock size={16} /> Privacy & Ownership Scope
											</h4>
											<p className="text-sm text-(--text-muted)">
												If the requested bot profile is set to <code>private</code>, this endpoint will return a 403 Forbidden error unless the authenticated token belongs to
												an owner of the bot. If the token is owned by the bot developer, the response will additionally include sensitive properties such as configured{' '}
												<code>hooks</code> and full arrays of user votes.
											</p>
										</div>

										<h4 className="font-semibold text-(--text) mb-4 flex items-center gap-2">
											<Code size={16} /> Fetch Examples
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
								title: 'Update Bot Profile',
								icon: Code,
								description: "Update specific fields of your bot's profile programmatically.",
								routes: [{ method: 'PATCH', path: '/v1/bots/[id]/profile', color: 'orange' }],
								extra: (
									<div className="p-6 border-t border-(--border)/10">
										<h4 className="font-semibold text-(--text) mb-4 flex items-center gap-2">
											<Code size={16} /> JSON Body Parameters
										</h4>
										<div className="overflow-x-auto mb-8">
											<table className="w-full text-left border-collapse text-sm">
												<thead>
													<tr className="border-b border-(--border)/10 text-(--text-muted)">
														<th className="py-2 font-medium">Field</th>
														<th className="py-2 font-medium">Type</th>
														<th className="py-2 font-medium">Description</th>
													</tr>
												</thead>
												<tbody className="divide-y divide-(--border)/5">
													<tr>
														<td className="py-3 font-mono text-(--accent)">description</td>
														<td className="py-3 font-mono">String</td>
														<td className="py-3 text-(--text-muted)">A short summary of what the bot does (usually used in cards).</td>
													</tr>
													<tr>
														<td className="py-3 font-mono text-(--accent)">info</td>
														<td className="py-3 font-mono">String</td>
														<td className="py-3 text-(--text-muted)">A detailed markdown description for the bot's full profile page.</td>
													</tr>
													<tr>
														<td className="py-3 font-mono text-(--accent)">privacy</td>
														<td className="py-3 font-mono">String</td>
														<td className="py-3 text-(--text-muted)">
															Visibility scope. Allowed values: <code>public</code>, <code>private</code>, <code>limited</code>.
														</td>
													</tr>
													<tr>
														<td className="py-3 font-mono text-(--accent)">tags</td>
														<td className="py-3 font-mono">Array</td>
														<td className="py-3 text-(--text-muted)">An array of string categories that apply to the bot.</td>
													</tr>
													<tr>
														<td className="py-3 font-mono text-(--accent)">links</td>
														<td className="py-3 font-mono">Object</td>
														<td className="py-3 text-(--text-muted)">
															An object containing URLs like <code>invite</code>, <code>support</code>, or <code>website</code>.
														</td>
													</tr>
												</tbody>
											</table>
										</div>

										<h4 className="font-semibold text-(--text) mb-4 flex items-center gap-2">
											<Code size={16} /> Fetch Examples
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
								title: 'Delete Bot Profile',
								icon: Server,
								description: "Permanently delete your bot's profile from the platform ecosystem.",
								routes: [{ method: 'DELETE', path: '/v1/bots/[id]/profile', color: 'red' }],
								extra: (
									<div className="p-6 border-t border-(--border)/10">
										<h4 className="font-semibold text-(--text) mb-4 flex items-center gap-2">
											<Code size={16} /> Fetch Examples
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
								title: 'Fetch Bot Stats',
								icon: BarChart2,
								description: 'Retrieve the statistical history of a specific Discord bot.',
								routes: [{ method: 'GET', path: '/v1/bots/[id]/stats', color: 'blue' }],
								extra: (
									<div className="p-6 border-t border-(--border)/10">
										<h4 className="font-semibold text-(--text) mb-4 flex items-center gap-2">
											<Code size={16} /> Fetch Examples
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
								title: 'Post Bot Stats',
								icon: BarChart2,
								description: 'Log a new statistical snapshot for a Discord bot.',
								routes: [{ method: 'POST', path: '/v1/bots/[id]/stats', color: 'green' }],
								extra: (
									<div className="p-6 border-t border-(--border)/10">
										<h4 className="font-semibold text-(--text) mb-3 flex items-center gap-2">
											<Code size={16} /> JSON Body Parameters
										</h4>
										<table className="w-full text-left text-sm border-collapse mb-2">
											<thead>
												<tr className="border-b border-(--border)/10 text-(--text-muted)">
													<th className="pb-2 font-medium">Field</th>
													<th className="pb-2 font-medium">Type</th>
													<th className="pb-2 font-medium">Description</th>
												</tr>
											</thead>
											<tbody className="text-(--text)">
												<tr className="border-b border-(--border)/5">
													<td className="py-3 font-mono text-(--accent)">serverCount</td>
													<td className="py-3 font-mono">Number</td>
													<td className="py-3">The number of servers the bot is in (alias for guildCount).</td>
												</tr>
												<tr className="border-b border-(--border)/5">
													<td className="py-3 font-mono text-(--accent)">shardCount</td>
													<td className="py-3 font-mono">Number</td>
													<td className="py-3">The number of active shards.</td>
												</tr>
												<tr>
													<td className="py-3 font-mono text-(--accent)">userCount</td>
													<td className="py-3 font-mono">Number</td>
													<td className="py-3">The estimated total number of users across all guilds.</td>
												</tr>
											</tbody>
										</table>

										<div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl mt-6 mb-6">
											<h4 className="text-blue-500 font-bold mb-1 flex items-center gap-2">
												<Rocket size={16} /> Node.js Package Available
											</h4>
											<p className="text-sm text-(--text-muted)">
												If you are using Node.js, you can easily automate your statistics posting using the official <code>@xernerx/stats</code> package without needing to
												write manual fetch requests.
											</p>
										</div>

										<h4 className="font-semibold text-(--text) mb-4 flex items-center gap-2">
											<Code size={16} /> Fetch Examples
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
								title: 'Update Bot Stats',
								icon: BarChart2,
								description: 'Update a previously logged statistical snapshot.',
								routes: [{ method: 'PATCH', path: '/v1/bots/[id]/stats', color: 'orange' }],
								extra: (
									<div className="p-6 border-t border-(--border)/10">
										<h4 className="font-semibold text-(--text) mb-3 flex items-center gap-2">
											<Code size={16} /> JSON Body Parameters
										</h4>
										<table className="w-full text-left text-sm border-collapse mb-6">
											<thead>
												<tr className="border-b border-(--border)/10 text-(--text-muted)">
													<th className="pb-2 font-medium">Field</th>
													<th className="pb-2 font-medium">Type</th>
													<th className="pb-2 font-medium">Description</th>
												</tr>
											</thead>
											<tbody className="text-(--text)">
												<tr className="border-b border-(--border)/5">
													<td className="py-3 font-mono text-(--accent)">serverCount</td>
													<td className="py-3 font-mono">Number</td>
													<td className="py-3">The number of servers the bot is in (alias for guildCount).</td>
												</tr>
												<tr className="border-b border-(--border)/5">
													<td className="py-3 font-mono text-(--accent)">shardCount</td>
													<td className="py-3 font-mono">Number</td>
													<td className="py-3">The number of active shards.</td>
												</tr>
												<tr>
													<td className="py-3 font-mono text-(--accent)">userCount</td>
													<td className="py-3 font-mono">Number</td>
													<td className="py-3">The estimated total number of users across all guilds.</td>
												</tr>
											</tbody>
										</table>
										<h4 className="font-semibold text-(--text) mb-4 flex items-center gap-2">
											<Code size={16} /> Fetch Examples
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
								title: 'Delete Bot Stats',
								icon: BarChart2,
								description: 'Delete all statistical snapshots for a Discord bot.',
								routes: [{ method: 'DELETE', path: '/v1/bots/[id]/stats', color: 'red' }],
								extra: (
									<div className="p-6 border-t border-(--border)/10">
										<h4 className="font-semibold text-(--text) mb-4 flex items-center gap-2">
											<Code size={16} /> Fetch Examples
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
								title: 'Fetch Bot Commands',
								icon: Code,
								description: 'Retrieve your synced Discord application slash commands.',
								routes: [{ method: 'GET', path: '/v1/bots/[id]/commands', color: 'blue' }],
								extra: (
									<div className="p-6 border-t border-(--border)/10">
										<h4 className="font-semibold text-(--text) mb-4 flex items-center gap-2">
											<Code size={16} /> Fetch Examples
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
								title: 'Sync Bot Commands',
								icon: Code,
								description: 'Bulk synchronize your Discord application slash commands.',
								routes: [{ method: 'PUT', path: '/v1/bots/[id]/commands', color: 'purple' }],
								extra: (
									<div className="p-6 border-t border-(--border)/10">
										<div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl mb-6">
											<h4 className="text-blue-500 font-bold mb-1 flex items-center gap-2">
												<Info size={16} /> Bulk Synchronization
											</h4>
											<p className="text-sm text-(--text-muted)">
												The <code>PUT</code> endpoint expects a full array of your Discord application commands. It performs a complete sync by wiping your previously stored
												commands and bulk-inserting the new array. This is best called during your bot's startup sequence.
											</p>
										</div>

										<h4 className="font-semibold text-(--text) mb-4 flex items-center gap-2">
											<Code size={16} /> Fetch Examples
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
								title: 'Delete Bot Commands',
								icon: Code,
								description: 'Wipe all synchronized commands for a Discord bot.',
								routes: [{ method: 'DELETE', path: '/v1/bots/[id]/commands', color: 'red' }],
								extra: (
									<div className="p-6 border-t border-(--border)/10">
										<h4 className="font-semibold text-(--text) mb-4 flex items-center gap-2">
											<Code size={16} /> Fetch Examples
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
								<motion.section
									key={section.id}
									id={section.id}
									initial={{ opacity: 0, y: 20 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: true }}
									className="space-y-6 scroll-mt-24"
								>
									<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
										<Icon className="text-(--accent)" size={24} /> {section.title}
									</h2>
									<p className="text-(--text-muted)">{section.description}</p>

									<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl overflow-hidden mb-6">
										{section.routes.map((route, i) => (
											<div
												key={i}
												className={`flex items-center gap-3 p-4 bg-(--background)/50 ${i !== section.routes.length - 1 || section.extra ? 'border-b border-(--border)/5' : ''}`}
											>
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
				)}

				{/* CORE ENDPOINTS */}
				{version === 'core' && isAdmin && (
					<>
						{[
							{
								id: 'fetch-discord-profile',
								title: 'Fetch Discord Profile',
								icon: Server,
								description: "Fetch a user's Discord profile metadata directly from the Xernerx core caching layer.",
								routes: [{ method: 'GET', path: '/core/users/[id]/discord', color: 'blue' }],
							},
							{
								id: 'fetch-discord-guilds',
								title: 'Fetch Discord Guilds',
								icon: Shield,
								description: 'Retrieve a list of Discord guilds that a user is currently a member of.',
								routes: [{ method: 'GET', path: '/core/users/[id]/discord/guilds', color: 'blue' }],
							},
							{
								id: 'fetch-discord-guild',
								title: 'Fetch Discord Guild',
								icon: Globe,
								description: "Fetch a specific Discord guild's metadata directly from the Xernerx core caching layer.",
								routes: [{ method: 'GET', path: '/core/guilds/[id]/discord', color: 'blue' }],
							},
							{
								id: 'fetch-discord-roles',
								title: 'Fetch Discord Roles',
								icon: Key,
								description: 'Retrieve all available Discord roles within a specific guild.',
								routes: [{ method: 'GET', path: '/core/guilds/[id]/discord/roles', color: 'blue' }],
							},
						].map((section) => {
							const Icon = section.icon;
							return (
								<motion.section
									key={section.id}
									id={section.id}
									initial={{ opacity: 0, y: 20 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: true }}
									className="space-y-6 scroll-mt-24"
								>
									<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
										<Icon className="text-(--accent)" size={24} /> {section.title}
									</h2>
									<p className="text-(--text-muted)">{section.description}</p>

									<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl overflow-hidden mb-6">
										{section.routes.map((route, i) => (
											<div
												key={i}
												className={`flex items-center gap-3 p-4 bg-(--background)/50 ${i !== section.routes.length - 1 || section.extra ? 'border-b border-(--border)/5' : ''}`}
											>
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
				)}

				{/* SECURE ENDPOINTS */}
				{version === 'secure' && isAdmin && (
					<>
						{[
							{
								id: 'manage-users',
								title: 'Manage Users',
								icon: Server,
								description: 'Manage users on the platform.',
								routes: [
									{ method: 'GET', path: '/secure/users', color: 'blue' },
									{ method: 'GET', path: '/secure/users/[id]', color: 'blue' },
									{ method: 'PATCH', path: '/secure/users/[id]', color: 'orange' },
									{ method: 'DELETE', path: '/secure/users/[id]', color: 'red' },
								],
							},
							{
								id: 'manage-tokens',
								title: 'Manage Tokens',
								icon: Key,
								description: 'List, create, update, or delete API tokens.',
								routes: [
									{ method: 'GET', path: '/secure/tokens', color: 'blue' },
									{ method: 'POST', path: '/secure/tokens', color: 'green' },
									{ method: 'PATCH', path: '/secure/tokens/[id]', color: 'orange' },
									{ method: 'DELETE', path: '/secure/tokens/[id]', color: 'red' },
								],
							},
							{
								id: 'manage-roles',
								title: 'Manage Roles',
								icon: Shield,
								description: 'Create, edit, and delete system roles and permissions.',
								routes: [
									{ method: 'GET', path: '/secure/core', color: 'blue' },
									{ method: 'POST', path: '/secure/core', color: 'green' },
									{ method: 'GET', path: '/secure/core/[id]', color: 'blue' },
									{ method: 'PATCH', path: '/secure/core/[id]', color: 'orange' },
									{ method: 'DELETE', path: '/secure/core/[id]', color: 'red' },
									{ method: 'POST', path: '/secure/core/roles/reorder', color: 'green' },
								],
							},
							{
								id: 'manage-invites',
								title: 'Manage Invites',
								icon: LinkIcon,
								description: 'Configure public Discord bot invite URLs.',
								routes: [
									{ method: 'GET', path: '/secure/invites', color: 'blue' },
									{ method: 'POST', path: '/secure/invites', color: 'green' },
									{ method: 'GET', path: '/secure/invites/[id]', color: 'blue' },
									{ method: 'PATCH', path: '/secure/invites/[id]', color: 'orange' },
									{ method: 'DELETE', path: '/secure/invites/[id]', color: 'red' },
								],
							},
							{
								id: 'manage-announcements',
								title: 'Manage Announcements',
								icon: Megaphone,
								description: 'Create, edit, and publish platform announcements.',
								routes: [
									{ method: 'GET', path: '/secure/announcements', color: 'blue' },
									{ method: 'POST', path: '/secure/announcements', color: 'green' },
									{ method: 'PATCH', path: '/secure/announcements/[id]', color: 'orange' },
									{ method: 'DELETE', path: '/secure/announcements/[id]', color: 'red' },
									{ method: 'POST', path: '/secure/announcements/create-webhook', color: 'green' },
								],
							},
							{
								id: 'manage-translations',
								title: 'Manage Translations',
								icon: Languages,
								description: 'Add and modify system-wide translations.',
								routes: [
									{ method: 'GET', path: '/secure/dictionary/[language]', color: 'blue' },
									{ method: 'POST', path: '/secure/dictionary/[language]', color: 'green' },
									{ method: 'PATCH', path: '/secure/dictionary/[language]', color: 'orange' },
								],
							},
							{
								id: 'manage-applications',
								title: 'Manage Applications',
								icon: FileText,
								description: 'Create, edit, and review user applications.',
								routes: [
									{ method: 'GET', path: '/secure/dispatch/applications', color: 'blue' },
									{ method: 'POST', path: '/secure/dispatch/applications', color: 'green' },
									{ method: 'PATCH', path: '/secure/dispatch/applications/[id]', color: 'orange' },
									{ method: 'DELETE', path: '/secure/dispatch/applications/[id]', color: 'red' },
									{ method: 'GET', path: '/secure/dispatch/applications/reviews', color: 'blue' },
									{ method: 'POST', path: '/secure/dispatch/applications/reviews/[id]', color: 'green' },
								],
							},
							{
								id: 'system-settings',
								title: 'System Settings',
								icon: Settings2,
								description: 'Manage global system configurations and core settings.',
								routes: [
									{ method: 'GET', path: '/secure/core/settings', color: 'blue' },
									{ method: 'POST', path: '/secure/core/settings', color: 'green' },
									{ method: 'PATCH', path: '/secure/core/settings/[id]', color: 'orange' },
									{ method: 'DELETE', path: '/secure/core/settings/[id]', color: 'red' },
								],
							},
						].map((section) => {
							const Icon = section.icon;
							return (
								<motion.section
									key={section.id}
									id={section.id}
									initial={{ opacity: 0, y: 20 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: true }}
									className="space-y-6 scroll-mt-24"
								>
									<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
										<Icon className="text-(--accent)" size={24} /> {section.title}
									</h2>
									<p className="text-(--text-muted)">{section.description}</p>

									<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl overflow-hidden mb-6">
										{section.routes.map((route, i) => (
											<div
												key={i}
												className={`flex items-center gap-3 p-4 bg-(--background)/50 ${i !== section.routes.length - 1 || section.extra ? 'border-b border-(--border)/5' : ''}`}
											>
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
				)}
			</div>
		</div>
	);
}
// Trigger HMR 16
