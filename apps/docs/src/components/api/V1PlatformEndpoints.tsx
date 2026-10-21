/** @format */
'use client';

import { CodeBlock } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import { Activity, Code, Rss, Trophy } from 'lucide-react';
import { EndpointSection } from './EndpointSection';

interface V1SubProps {
	activeGroup?: string;
	searchQuery?: string;
	methodFilter?: string;
	defaultExpanded?: boolean;
	onTryRoute?: (method: string, path: string) => void;
}

export function V1PlatformEndpoints({ activeGroup = 'all', searchQuery = '', methodFilter = 'ALL', defaultExpanded = true, onTryRoute }: V1SubProps) {
	const { t } = useDictionary();

	if (activeGroup !== 'all' && activeGroup !== 'v1-platform') return null;

	const sections = [
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
								label: 'TypeScript',
								language: 'typescript',
								code: `const response = await fetch('https://api.xernerx.com/v1/leaderboard');\nconst { bots, servers, streaks } = await response.json();\nconsole.log({ bots, servers, streaks });`,
							},
							{
								label: 'JavaScript',
								language: 'javascript',
								code: `const response = await fetch('https://api.xernerx.com/v1/leaderboard');\nconst data = await response.json();\nconsole.log(data.bots, data.servers, data.streaks);`,
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
								label: 'TypeScript',
								language: 'typescript',
								code: `const response = await fetch('https://api.xernerx.com/v1/changelog/rss.xml');\nconst rssXml = await response.text();\nconsole.log(rssXml);`,
							},
							{
								label: 'cURL',
								language: 'bash',
								code: `curl -s https://api.xernerx.com/v1/changelog/rss.xml`,
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
								label: 'TypeScript',
								language: 'typescript',
								code: `const versionRes = await fetch('https://api.xernerx.com/api/version');\nconst { version } = await versionRes.json();\n\nconst changelogRes = await fetch('https://api.xernerx.com/api/changelog?version=all');\nconst { versions, selectedVersion, content, fullContent } = await changelogRes.json();`,
							},
							{
								label: 'JSON Response',
								language: 'json',
								code: `{\n  "version": "0.4.0"\n}`,
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
