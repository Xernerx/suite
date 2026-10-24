/** @format */
'use client';

import { Building2, Code2, ExternalLink, FileText, Globe, LifeBuoy, Link as LinkIcon, MessageSquare, Server, Shield } from 'lucide-react';
import Link from 'next/link';
import { useDictionary } from '@xernerx/providers';
import { Markdown } from '@xernerx/ui';

export function ServerProfile({ server, organizationData }: { server: any; organizationData: any }) {
	const { t } = useDictionary();
	const configuredLinks = Object.entries(server.links || {}).filter(([, val]) => Boolean(val && String(val).trim()));

	return (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<div className="lg:col-span-2 flex flex-col gap-8">
				{/* About Section */}
				<div className="p-8 rounded-3xl bg-(--foreground)/30 border border-(--border)/10 shadow-sm flex flex-col h-full">
					<h2 className="text-2xl font-bold mb-6 text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('app.servers.about', { name: server.name })}
					</h2>
					<Markdown className="flex-1" emptyText={t('app.servers.noDetailedDesc')}>
						{server.info ? String(server.info) : ''}
					</Markdown>
				</div>
			</div>

			<div className="flex flex-col gap-8">
				{/* Information Card */}
				<div className="p-6 rounded-3xl bg-(--foreground)/30 border border-(--border)/10 shadow-sm">
					<h2 className="text-lg font-bold mb-4 flex items-center gap-2">
						<Server className="w-5 h-5 text-(--text-muted)" /> {t('app.servers.information')}
					</h2>
					<div className="flex flex-col gap-4">
						{organizationData?.name && (
							<div className="flex flex-col gap-1">
								<span className="text-xs font-bold text-(--text-muted) uppercase tracking-wider">{t('app.servers.publishedBy')}</span>
								{(organizationData.privacy || organizationData.config?.privacy) !== 'private' ? (
									<Link href={`/organization/${organizationData._id}`} className="flex items-center gap-2 text-sm font-semibold text-(--accent) hover:underline">
										<Building2 className="w-4 h-4 shrink-0" />
										<span>{organizationData.name}</span>
									</Link>
								) : (
									<span className="flex items-center gap-2 text-sm font-medium text-(--text)">
										<Building2 className="w-4 h-4 shrink-0 text-(--text-muted)" />
										<span>{organizationData.name}</span>
									</span>
								)}
							</div>
						)}
						{configuredLinks.map(([key, rawUrl]) => {
							const urlStr = String(rawUrl);
							let Icon: any = LinkIcon;
							if (key === 'website') Icon = Globe;
							else if (key === 'support') Icon = LifeBuoy;
							else if (key === 'github') Icon = Code2;
							else if (key === 'community' || key === 'invite') Icon = MessageSquare;
							else if (key === 'privacy') Icon = Shield;
							else if (key === 'terms') Icon = FileText;
							else Icon = ExternalLink;

							let displayUrl = urlStr;
							try {
								const parsed = new URL(urlStr);
								displayUrl = parsed.hostname + (parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : '');
							} catch {}

							return (
								<div key={key} className="flex flex-col gap-1">
									<span className="text-xs font-bold text-(--text-muted) uppercase tracking-wider">{key}</span>
									<a href={urlStr} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium text-(--accent) hover:underline break-all">
										<Icon className="w-4 h-4 shrink-0" /> {displayUrl}
									</a>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
