/** @format */

import fs from 'fs';
import path from 'path';
import { Metadata } from 'next';
import ChangelogClient from '@/components/changelog/ChangelogClient';
import SidebarTrigger from '@/components/changelog/SidebarTrigger';

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
	{ id: 'info', name: 'Info' },
	{ id: 'store', name: 'Store' },
	{ id: 'www', name: 'Website' },
];

async function getChangelogs() {
	const changelogs: { appName: string; content: string }[] = [];

	for (const app of APPS) {
		try {
			// Resolve the path to the CHANGELOG.md file in the respective app directory
			// Handle both monorepo root (Vercel) and package root (local dev)
			const cwd = process.cwd();
			const basePath = cwd.endsWith('info') ? path.join(cwd, '..', '..') : cwd;
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

export default async function ChangelogPage() {
	const changelogs = await getChangelogs();

	return (
		<>
			<SidebarTrigger />
			<ChangelogClient changelogs={changelogs} />
		</>
	);
}
