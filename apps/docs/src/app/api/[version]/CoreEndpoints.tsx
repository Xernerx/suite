/** @format */
import { CodeBlock } from '@xernerx/ui';
import { motion } from 'framer-motion';
import { Server, Code, BarChart2, Lock, Shield, Link as LinkIcon, Megaphone, Languages, FileText, Settings2, Info, Globe, Key } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';

export function CoreEndpoints() {
	const { t } = useDictionary();
	return (
		<>
			{[
				{
					id: 'fetch-discord-profile',
					title: t('docs.api.core.fetchDiscordProfile.title'),
					icon: Server,
					description: t('docs.api.core.fetchDiscordProfile.description'),
					routes: [{ method: 'GET', path: '/core/users/[id]/discord', color: 'blue' }],
				},
				{
					id: 'fetch-discord-guilds',
					title: t('docs.api.core.fetchDiscordGuilds.title'),
					icon: Shield,
					description: t('docs.api.core.fetchDiscordGuilds.description'),
					routes: [{ method: 'GET', path: '/core/users/[id]/discord/guilds', color: 'blue' }],
				},
				{
					id: 'fetch-discord-guild',
					title: t('docs.api.core.fetchDiscordGuild.title'),
					icon: Globe,
					description: t('docs.api.core.fetchDiscordGuild.description'),
					routes: [{ method: 'GET', path: '/core/guilds/[id]/discord', color: 'blue' }],
				},
				{
					id: 'fetch-discord-roles',
					title: t('docs.api.core.fetchDiscordRoles.title'),
					icon: Key,
					description: t('docs.api.core.fetchDiscordRoles.description'),
					routes: [{ method: 'GET', path: '/core/guilds/[id]/discord/roles', color: 'blue' }],
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
