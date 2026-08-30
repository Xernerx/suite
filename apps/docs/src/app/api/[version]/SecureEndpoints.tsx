/** @format */
import { CodeBlock } from '@xernerx/ui';
import { motion } from 'framer-motion';
import { Server, Code, BarChart2, Lock, Shield, Link as LinkIcon, Megaphone, Languages, FileText, Settings2, Info, Key } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';

export function SecureEndpoints() {
	const { t } = useDictionary();
	return (
		<>
			{[
				{
					id: 'manage-users',
					title: t('docs.api.secure.manageUsers.title'),
					icon: Server,
					description: t('docs.api.secure.manageUsers.description'),
					routes: [
						{ method: 'GET', path: '/secure/users', color: 'blue' },
						{ method: 'GET', path: '/secure/users/[id]', color: 'blue' },
						{ method: 'PATCH', path: '/secure/users/[id]', color: 'orange' },
						{ method: 'DELETE', path: '/secure/users/[id]', color: 'red' },
					],
				},
				{
					id: 'manage-tokens',
					title: t('docs.api.secure.manageTokens.title'),
					icon: Key,
					description: t('docs.api.secure.manageTokens.description'),
					routes: [
						{ method: 'GET', path: '/secure/tokens', color: 'blue' },
						{ method: 'POST', path: '/secure/tokens', color: 'green' },
						{ method: 'PATCH', path: '/secure/tokens/[id]', color: 'orange' },
						{ method: 'DELETE', path: '/secure/tokens/[id]', color: 'red' },
					],
				},
				{
					id: 'manage-roles',
					title: t('docs.api.secure.manageRoles.title'),
					icon: Shield,
					description: t('docs.api.secure.manageRoles.description'),
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
					title: t('docs.api.secure.manageInvites.title'),
					icon: LinkIcon,
					description: t('docs.api.secure.manageInvites.description'),
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
					title: t('docs.api.secure.manageAnnouncements.title'),
					icon: Megaphone,
					description: t('docs.api.secure.manageAnnouncements.description'),
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
					title: t('docs.api.secure.manageTranslations.title'),
					icon: Languages,
					description: t('docs.api.secure.manageTranslations.description'),
					routes: [
						{ method: 'GET', path: '/secure/dictionary/[language]', color: 'blue' },
						{ method: 'POST', path: '/secure/dictionary/[language]', color: 'green' },
						{ method: 'PATCH', path: '/secure/dictionary/[language]', color: 'orange' },
					],
				},
				{
					id: 'manage-applications',
					title: t('docs.api.secure.manageApplications.title'),
					icon: FileText,
					description: t('docs.api.secure.manageApplications.description'),
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
					title: t('docs.api.secure.systemSettings.title'),
					icon: Settings2,
					description: t('docs.api.secure.systemSettings.description'),
					routes: [
						{ method: 'GET', path: '/secure/core/settings', color: 'blue' },
						{ method: 'POST', path: '/secure/core/settings', color: 'green' },
						{ method: 'PATCH', path: '/secure/core/settings/[id]', color: 'orange' },
						{ method: 'DELETE', path: '/secure/core/settings/[id]', color: 'red' },
					],
				},
			].map((section: any) => {
				const Icon = section.icon;
				return (
					<motion.section key={section.id} id={section.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6 scroll-mt-24">
						<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
							<Icon className="text-(--accent)" size={24} /> {section.title}
						</h2>
						<p className="text-(--text-muted)">{section.description}</p>

						<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl overflow-hidden mb-6">
							{section.routes.map((route: any, i: number) => (
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
