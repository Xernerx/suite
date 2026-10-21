/** @format */
'use client';

import { ArrowUpRight, Link as LinkIcon, Loader2, Copy, Check } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState, useMemo } from 'react';
import { useDictionary, useEnvironment, useSidebar, useToast } from '@xernerx/providers';
import { Input } from '@xernerx/ui';

interface Invite {
	id: string;
	name: string;
	clientId: string;
	botName: string;
	botAvatar: string | null;
}

export default function InvitesPage() {
	const { hide } = useSidebar();
	const { getEnvUrl, isReady } = useEnvironment();
	const { t } = useDictionary();
	const { toast } = useToast();

	const [invites, setInvites] = useState<Invite[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [copiedId, setCopiedId] = useState<string | null>(null);

	useEffect(() => {
		hide();
	}, [hide]);

	useEffect(() => {
		if (!isReady) return;

		async function fetchInvites() {
			try {
				const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/invites'), {
					credentials: 'include',
				});
				if (res.ok) {
					const data = await res.json();
					setInvites(data);
				}
			} catch (err) {
				console.error('Failed to fetch invites:', err);
			} finally {
				setLoading(false);
			}
		}

		fetchInvites();
	}, [getEnvUrl, isReady]);

	const filteredInvites = useMemo(() => {
		if (!searchQuery.trim()) return invites;
		const q = searchQuery.toLowerCase();
		return invites.filter((inv) => inv.botName?.toLowerCase().includes(q) || inv.name?.toLowerCase().includes(q) || inv.id?.toLowerCase().includes(q));
	}, [invites, searchQuery]);

	const handleCopyInvite = (e: React.MouseEvent, id: string) => {
		e.preventDefault();
		e.stopPropagation();
		const fullUrl = `${window.location.origin}/invites/${id}`;
		navigator.clipboard.writeText(fullUrl);
		setCopiedId(id);
		toast({ title: t('www.invites.inviteUrlCopied'), type: 'success' });
		setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
	};

	return (
		<div className="min-h-screen py-32 relative">
			<div className="max-w-7xl mx-auto px-6 relative z-10">
				<div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
					<div>
						<h1 className="text-5xl font-extrabold mb-4 text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('www.invites.title')}
						</h1>
						<p className="text-lg text-(--text-muted) max-w-2xl leading-relaxed">{t('www.invites.description')}</p>
					</div>
					{!loading && invites.length > 0 && (
						<div className="w-full md:max-w-sm">
							<Input variant="search" shortcut={true} placeholder={t('www.invites.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
						</div>
					)}
				</div>

				{loading ? (
					<div className="flex justify-center items-center py-24">
						<Loader2 className="w-8 h-8 animate-spin text-(--accent)" />
					</div>
				) : invites.length === 0 ? (
					<div className="text-center py-32 rounded-3xl bg-(--foreground)/30 backdrop-blur-xl border border-(--border)/10">
						<p className="text-(--text-muted)">{t('www.invites.empty')}</p>
					</div>
				) : filteredInvites.length === 0 ? (
					<div className="text-center py-32 rounded-3xl bg-(--foreground)/30 backdrop-blur-xl border border-(--border)/10">
						<p className="text-(--text-muted)">{t('www.invites.noMatchingInvites', { query: searchQuery })}</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						{filteredInvites.map((invite) => (
							<a
								key={invite.id}
								href={`/invites/${invite.id}`}
								className="group flex flex-col p-8 rounded-[2rem] bg-(--foreground)/30 backdrop-blur-xl border border-(--border)/10 hover:border-(--accent)/40 shadow-xl hover:shadow-[0_10px_40px_-10px_color-mix(in_srgb,var(--accent)_30%,transparent)] transition-all overflow-hidden relative"
							>
								<div className="absolute top-0 right-0 p-8 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
									<ArrowUpRight className="text-(--text)" size={24} />
								</div>

								{invite.botAvatar ? (
									<Image
										src={invite.botAvatar}
										alt={invite.botName}
										width={56}
										height={56}
										unoptimized
										className="w-14 h-14 rounded-2xl mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-md"
									/>
								) : (
									<div className="w-14 h-14 rounded-2xl bg-(--accent)/10 flex items-center justify-center text-(--accent) mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
										<LinkIcon size={24} />
									</div>
								)}

								<h2 className="font-bold text-2xl text-(--text) mb-2">{invite.botName}</h2>
								<div className="text-sm text-(--text-muted) flex items-center justify-between gap-2 mt-auto pt-2">
									<span className="font-mono bg-(--foreground)/50 px-2.5 py-1 rounded-lg text-xs border border-(--border)/10">/invites/{invite.id}</span>
									<button
										type="button"
										onClick={(e) => handleCopyInvite(e, invite.id)}
										title={t('www.invites.copyInviteUrl')}
										className="p-2 rounded-xl bg-(--background)/60 hover:bg-(--accent) hover:text-white text-(--text-muted) border border-(--border)/10 transition-colors cursor-pointer"
									>
										{copiedId === invite.id ? <Check size={14} className="text-(--accent-green)" /> : <Copy size={14} />}
									</button>
								</div>
							</a>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
