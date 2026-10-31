/** @format */
'use client';

import { ArrowUpRight, Link as LinkIcon, Copy, Check, ShieldCheck, Sliders, KeyRound } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState, useMemo } from 'react';
import { useDictionary, useEnvironment, useSidebar, useToast } from '@xernerx/providers';
import { Input } from '@xernerx/ui';
import { PageFaqSection } from '@/components/PageFaqSection';

interface Invite {
	id: string;
	name: string;
	clientId: string;
	botName: string;
	botAvatar: string | null;
	description?: string;
}

export default function InvitesPage() {
	const { hide } = useSidebar();
	const { getEnvUrl, isReady } = useEnvironment();
	const { t } = useDictionary();
	const { toast } = useToast();

	const defaultInvites = useMemo<Invite[]>(
		() => [
			{
				id: 'virtue',
				name: 'Virtue',
				clientId: '950251264095162418',
				botName: t('www.applications.virtue.title'),
				botAvatar: null,
				description: t('www.applications.virtue.desc'),
			},
			{
				id: 'metamorphosis',
				name: 'Metamorphosis',
				clientId: '881678826906730547',
				botName: t('www.applications.metamorphosis.title'),
				botAvatar: null,
				description: t('www.applications.metamorphosis.desc'),
			},
			{
				id: 'zodiac',
				name: 'Zodiac',
				clientId: '950251264095162418',
				botName: t('www.applications.zodiac.title'),
				botAvatar: null,
				description: t('www.applications.zodiac.desc'),
			},
			{
				id: 'todo',
				name: 'To-Do List Bot',
				clientId: '782105629572464652',
				botName: t('www.applications.todo.title'),
				botAvatar: null,
				description: t('www.applications.todo.desc'),
			},
		],
		[t]
	);

	const [invites, setInvites] = useState<Invite[]>([]);
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
					if (Array.isArray(data) && data.length > 0) {
						setInvites(data);
					}
				}
			} catch (err) {
				console.error('Failed to fetch invites:', err);
			}
		}

		fetchInvites();
	}, [getEnvUrl, isReady]);

	const activeInvites = invites.length > 0 ? invites : defaultInvites;

	const filteredInvites = useMemo(() => {
		if (!searchQuery.trim()) return activeInvites;
		const q = searchQuery.toLowerCase();
		return activeInvites.filter((inv) => inv.botName?.toLowerCase().includes(q) || inv.name?.toLowerCase().includes(q) || inv.id?.toLowerCase().includes(q));
	}, [activeInvites, searchQuery]);

	const handleCopyInvite = (e: React.MouseEvent, id: string) => {
		e.preventDefault();
		e.stopPropagation();
		const fullUrl = `${window.location.origin}/invites/${id}`;
		navigator.clipboard.writeText(fullUrl);
		setCopiedId(id);
		toast({ title: t('www.invites.inviteUrlCopied'), type: 'success' });
		setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
	};

	const guideCards = [
		{
			key: 'permissions',
			icon: KeyRound,
			title: t('www.invites.guide.permissions.title'),
			description: t('www.invites.guide.permissions.description'),
		},
		{
			key: 'dashboard',
			icon: Sliders,
			title: t('www.invites.guide.dashboard.title'),
			description: t('www.invites.guide.dashboard.description'),
		},
		{
			key: 'verified',
			icon: ShieldCheck,
			title: t('www.invites.guide.verified.title'),
			description: t('www.invites.guide.verified.description'),
		},
	];

	return (
		<div className="min-h-screen py-28 relative">
			<div className="max-w-(--page-width) mx-auto w-full px-6 relative z-10 flex flex-col gap-16">
				<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
					<div>
						<h1 className="text-5xl font-extrabold mb-4 text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('www.invites.title')}
						</h1>
						<p className="text-lg text-(--text-muted) max-w-2xl leading-relaxed">{t('www.invites.description')}</p>
					</div>
					{activeInvites.length > 0 && (
						<div className="w-full md:max-w-sm">
							<Input variant="search" shortcut={true} placeholder={t('www.invites.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
						</div>
					)}
				</div>

				{filteredInvites.length === 0 ? (
					<div className="text-center py-24 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10">
						<p className="text-(--text-muted)">{t('www.invites.noMatchingInvites', { query: searchQuery })}</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						{filteredInvites.map((invite) => (
							<a
								key={invite.id}
								href={`/invites/${invite.id}`}
								className="group flex flex-col p-8 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 hover:border-(--accent)/40 shadow-sm hover:shadow-[0_10px_40px_-10px_color-mix(in_srgb,var(--accent)_30%,transparent)] transition-all overflow-hidden relative"
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

								<h2 className="font-bold text-2xl text-(--text) mb-2" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{invite.botName}
								</h2>
								{invite.description && <p className="text-sm text-(--text-muted) leading-relaxed mb-4">{invite.description}</p>}
								<div className="text-sm text-(--text-muted) flex items-center justify-between gap-2 mt-auto pt-2">
									<span className="font-mono bg-(--foreground)/50 px-2.5 py-1 rounded-lg text-xs border border-(--border)/10">/invites/{invite.id}</span>
									<button
										type="button"
										onClick={(e) => handleCopyInvite(e, invite.id)}
										title={t('www.invites.copyInviteUrl')}
										className="p-2 rounded-xl bg-(--background)/60 hover:bg-(--accent) hover:text-(--text) text-(--text-muted) border border-(--border)/10 transition-colors cursor-pointer"
									>
										{copiedId === invite.id ? <Check size={14} className="text-(--accent-green)" /> : <Copy size={14} />}
									</button>
								</div>
							</a>
						))}
					</div>
				)}

				<section className="flex flex-col gap-8">
					<div className="flex flex-col gap-2">
						<h2 className="text-3xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('www.invites.guide.title')}
						</h2>
						<p className="text-(--text-muted) max-w-3xl leading-relaxed">{t('www.invites.guide.subtitle')}</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{guideCards.map((card) => (
							<div key={card.key} className="flex flex-col p-8 rounded-3xl bg-(--foreground)/30 border border-(--border)/10 backdrop-blur-md shadow-sm gap-4">
								<div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
									<card.icon size={22} />
								</div>
								<h3 className="text-xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{card.title}
								</h3>
								<p className="text-sm text-(--text-muted) leading-relaxed">{card.description}</p>
							</div>
						))}
					</div>
				</section>

				<PageFaqSection
					subtitle={t('www.invites.faq.subtitle')}
					items={[
						{ question: t('www.invites.faq.q1'), answer: t('www.invites.faq.a1') },
						{ question: t('www.invites.faq.q2'), answer: t('www.invites.faq.a2') },
						{ question: t('www.invites.faq.q3'), answer: t('www.invites.faq.a3') },
					]}
				/>
			</div>
		</div>
	);
}
