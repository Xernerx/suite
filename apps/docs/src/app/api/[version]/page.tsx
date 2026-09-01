/** @format */
// Force recompile
'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, BarChart2, Book, Code, Globe, Key, Lock, Rocket, Server, Shield, Terminal, Link as LinkIcon, Megaphone, Languages, FileText, Settings2, Info } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSidebar, useUser, useEnvironment, useDictionary } from '@xernerx/providers';
import { Selector, CodeBlock } from '@xernerx/ui';

import { useParams, useRouter } from 'next/navigation';
import { V1Endpoints } from './V1Endpoints';
import { CoreEndpoints } from './CoreEndpoints';
import { SecureEndpoints } from './SecureEndpoints';

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

	const { t } = useDictionary();
	useEffect(() => {
		show();

		let navItems = [
			{ label: t('docs.api.common.nav.back'), href: '/', icon: ArrowLeft, category: 'Navigation' },
			{ label: t('docs.api.common.nav.overview'), href: '#overview', icon: Globe, category: 'REST API' },
			{ label: t('docs.api.common.auth'), href: '#authentication', icon: Key, category: 'REST API' },
		];

		if (version === 'v1') {
			navItems.push(
				{ label: t('docs.api.v1.endpoints.fetchBotProfile.title'), href: '#fetch-bot-profile', icon: Server, category: t('docs.api.common.nav.endpoints') },
				{ label: t('docs.api.v1.endpoints.updateBotProfile.title'), href: '#update-bot-profile', icon: Code, category: t('docs.api.common.nav.endpoints') },
				{ label: t('docs.api.v1.endpoints.deleteBotProfile.title'), href: '#delete-bot-profile', icon: Server, category: t('docs.api.common.nav.endpoints') },
				{ label: t('docs.api.v1.endpoints.fetchBotStats.title'), href: '#fetch-bot-stats', icon: BarChart2, category: t('docs.api.common.nav.endpoints') },
				{ label: t('docs.api.v1.endpoints.postBotStats.title'), href: '#post-bot-stats', icon: BarChart2, category: t('docs.api.common.nav.endpoints') },
				{ label: t('docs.api.v1.endpoints.updateBotStats.title'), href: '#update-bot-stats', icon: BarChart2, category: t('docs.api.common.nav.endpoints') },
				{ label: t('docs.api.v1.endpoints.deleteBotStats.title'), href: '#delete-bot-stats', icon: BarChart2, category: t('docs.api.common.nav.endpoints') },
				{ label: t('docs.api.v1.endpoints.fetchBotCommands.title'), href: '#fetch-bot-commands', icon: Code, category: t('docs.api.common.nav.endpoints') },
				{ label: t('docs.api.v1.endpoints.syncBotCommands.title'), href: '#sync-bot-commands', icon: Code, category: t('docs.api.common.nav.endpoints') },
				{ label: t('docs.api.v1.endpoints.deleteBotCommands.title'), href: '#delete-bot-commands', icon: Code, category: t('docs.api.common.nav.endpoints') }
			);
		} else if (version === 'core' && isAdmin) {
			navItems.push(
				{ label: t('docs.api.core.fetchDiscordProfile.title'), href: '#fetch-discord-profile', icon: Server, category: t('docs.api.common.nav.users') },
				{ label: t('docs.api.core.fetchDiscordGuilds.title'), href: '#fetch-discord-guilds', icon: Shield, category: t('docs.api.common.nav.users') },
				{ label: t('docs.api.core.fetchDiscordGuild.title'), href: '#fetch-discord-guild', icon: Globe, category: t('docs.api.common.nav.guilds') },
				{ label: t('docs.api.core.fetchDiscordRoles.title'), href: '#fetch-discord-roles', icon: Key, category: t('docs.api.common.nav.guilds') }
			);
		} else if (version === 'secure' && isAdmin) {
			navItems.push(
				{ label: t('docs.api.secure.manageUsers.title'), href: '#manage-users', icon: Server, category: t('docs.api.common.nav.endpoints') },
				{ label: t('docs.api.secure.manageTokens.title'), href: '#manage-tokens', icon: Key, category: t('docs.api.common.nav.endpoints') },
				{ label: t('docs.api.secure.manageRoles.title'), href: '#manage-roles', icon: Shield, category: t('docs.api.common.nav.endpoints') },
				{ label: t('docs.api.secure.manageInvites.title'), href: '#manage-invites', icon: LinkIcon, category: t('docs.api.common.nav.endpoints') },
				{ label: t('docs.api.secure.manageAnnouncements.title'), href: '#manage-announcements', icon: Megaphone, category: t('docs.api.common.nav.endpoints') },
				{ label: t('docs.api.secure.manageTranslations.title'), href: '#manage-translations', icon: Languages, category: t('docs.api.common.nav.endpoints') },
				{ label: t('docs.api.secure.manageApplications.title'), href: '#manage-applications', icon: FileText, category: t('docs.api.common.nav.endpoints') },
				{ label: t('docs.api.secure.systemSettings.title'), href: '#system-settings', icon: Settings2, category: t('docs.api.common.nav.endpoints') }
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
						Xernerx {t('docs.api.common.title')} <span className="text-2xl text-(--accent)">{version}</span>
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
							placeholder={t('docs.api.common.selectVersion')}
						/>
					</div>
				</div>
				<p className="text-lg text-(--text-muted) leading-relaxed mb-12">{t('docs.api.common.description').replace('{version}', version.toUpperCase())}</p>
			</motion.div>

			<div className="space-y-16">
				{/* OVERVIEW SECTION */}
				<motion.section id="overview" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6 scroll-mt-24">
					<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
						<Globe className="text-(--accent)" size={24} /> {t('docs.api.common.baseUrl')}
					</h2>
					<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl p-6">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
							<div>
								<h3 className="font-semibold text-(--text) mb-1">{t('docs.api.common.prodEndpoint')}</h3>
								<code className="text-sm text-(--accent) bg-(--accent)/10 px-2 py-1 rounded">https://api.xernerx.com</code>
							</div>
							<div>
								<h3 className="font-semibold text-(--text) mb-1">{t('docs.api.common.canaryEndpoint')}</h3>
								<code className="text-sm text-orange-500 bg-orange-500/10 px-2 py-1 rounded">https://api.canary.xernerx.com</code>
							</div>
							<div>
								<h3 className="font-semibold text-(--text) mb-1">{t('docs.api.common.devEndpoint')}</h3>
								<code className="text-sm text-blue-500 bg-blue-500/10 px-2 py-1 rounded">https://api.dev.xernerx.com</code>
							</div>
						</div>
					</div>
				</motion.section>

				<motion.section id="authentication" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6 scroll-mt-24">
					<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
						<Key className="text-(--accent)" size={24} /> {t('docs.api.common.auth')}
					</h2>
					<p className="text-(--text-muted)">
						{t('docs.api.common.authDesc1')}
						{version === 'secure' && t('docs.api.common.authDesc2')}
					</p>

					<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl p-6">
						<p className="mb-4 text-sm text-(--text-muted)">
							{t('docs.api.common.authDesc3').split('Authorization')[0]}
							<code>Authorization</code>
							{t('docs.api.common.authDesc3').split('Authorization')[1]}
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
									<Lock size={16} /> {t('docs.api.common.securePassage')}
								</h4>
								<p className="text-sm text-(--text-muted)">
									{t('docs.api.common.secureDesc').split('/secure')[0]}
									<code>/secure</code>
									{t('docs.api.common.secureDesc').split('/secure')[1].split('secure passage')[0]}
									<code>secure</code>
									{t('docs.api.common.secureDesc').split('/secure')[1].split('secure passage')[1]}
								</p>
							</div>
						)}
					</div>
				</motion.section>

				{version === 'v1' && <V1Endpoints />}
				{version === 'core' && isAdmin && <CoreEndpoints />}
				{version === 'secure' && isAdmin && <SecureEndpoints />}
			</div>
		</div>
	);
}
