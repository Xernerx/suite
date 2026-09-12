/** @format */

import fs from 'fs';
import path from 'path';
import { Metadata } from 'next';
import ChangelogClient from './ChangelogClient';
import SidebarTrigger from './SidebarTrigger';
import { Suspense } from 'react';
import { Loading } from '@xernerx/feedback';

export const metadata: Metadata = {
	title: 'Changelog',
	description: 'See the latest updates and release notes across the Xernerx ecosystem.',
};

const APPS = [
	{ id: 'app', name: 'App' },
	{ id: 'account', name: 'Account' },
	{ id: 'admin', name: 'Admin' },
	{ id: 'api', name: 'API' },
	{ id: 'cdn', name: 'CDN' },
	{ id: 'docs', name: 'Docs' },
	{ id: 'www', name: 'Website' },
];

async function getChangelogs() {
	const changelogs: { appName: string; content: string }[] = [];

	// Artificial delay to allow the loading state to actually be visible
	// since fs.readFileSync is otherwise instantaneous on the server
	await new Promise((resolve) => setTimeout(resolve, 800));

	for (const app of APPS) {
		try {
			// Resolve the path to the CHANGELOG.md file in the respective app directory
			// Handle both monorepo root (Vercel) and package root (local dev)
			const cwd = process.cwd();
			const basePath = cwd.endsWith('www') ? path.join(cwd, '..', '..') : cwd;
			const filePath = path.join(basePath, 'apps', app.id, 'CHANGELOG.md');

			if (fs.existsSync(filePath)) {
				const content = fs.readFileSync(filePath, 'utf-8');
				changelogs.push({ appName: app.name, content });
			}
		} catch (error) {
			console.error(`Failed to read CHANGELOG for ${app.name}:`, error);
		}
	}

	return changelogs;
}

async function ChangelogDataLoader() {
	const changelogs = await getChangelogs();
	return <ChangelogClient changelogs={changelogs} />;
}

export default function ChangelogPage() {
	return (
		<>
			<SidebarTrigger />
			<Suspense
				fallback={
					<div className="flex flex-col w-full min-h-screen pt-48 items-center max-w-5xl mx-auto">
						<Loading />
					</div>
				}
			>
				<ChangelogDataLoader />
			</Suspense>
		</>
	);
}
