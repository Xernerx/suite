/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Link as LinkIcon, Copy, Check, ShieldCheck, Sliders, KeyRound } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState, useMemo } from 'react';
import { getEnabledInviteOptions, type InviteOptionsConfig } from '@xernerx/lib';
import { useDictionary, useEnvironment, useSidebar, useToast } from '@xernerx/providers';
import { Input } from '@xernerx/ui';
import { PageFaqSection } from '@/components/PageFaqSection';
import { StudioTrustProofStrip } from '@/components/StudioTrustProofStrip';
import { SuiteComparisonTable } from '@/components/SuiteComparisonTable';
import { DEFAULT_OFFICIAL_INVITES } from '@/lib/defaultOfficialInvites';

interface Invite {
	id: string;
	name: string;
	clientId: string;
	permissions?: string;
	options?: InviteOptionsConfig;
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
		() =>
			DEFAULT_OFFICIAL_INVITES.map((inv) => ({
				id: inv.id,
				name: inv.name,
				clientId: inv.clientId,
				permissions: inv.permissions,
				options: inv.options,
				botName: t(`www.applications.${inv.id}.title`),
				botAvatar: inv.defaultAvatarUrl,
				description: t(`www.applications.${inv.id}.desc`),
			})),
		[t]
	);

	const [invites, setInvites] = useState<Invite[]>([]);
	const [failedAvatars, setFailedAvatars] = useState<Record<string, boolean>>({});
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
					signal: AbortSignal.timeout(4000),
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
				<motion.div
					initial={{ opacity: 0, y: 18 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
					className="flex flex-col md:flex-row md:items-end justify-between gap-6"
				>
					<div>
						<h1 className="text-5xl font-extrabold mb-4 text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('www.invites.title')}
						</h1>
						<p className="text-lg text-(--text-muted) max-w-2xl leading-relaxed">{t('www.invites.description')}</p>
					</div>
					{activeInvites.length > 0 && (
						<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }} className="w-full md:max-w-sm">
							<Input variant="search" shortcut={true} placeholder={t('www.invites.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
						</motion.div>
					)}
				</motion.div>

				<AnimatePresence mode="popLayout">
					{filteredInvites.length === 0 ? (
						<motion.div
							key="empty-invites"
							initial={{ opacity: 0, scale: 0.96, y: 10 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.96, y: -10 }}
							transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
							className="text-center py-24 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10"
						>
							<p className="text-(--text-muted)">{t('www.invites.noMatchingInvites', { query: searchQuery })}</p>
						</motion.div>
					) : (
						<motion.div key="invites-grid" layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
							<AnimatePresence mode="popLayout">
								{filteredInvites.map((invite, idx) => {
									const enabledOptions = getEnabledInviteOptions(invite);
									const isSingleUrl = enabledOptions.length === 1;
									const cardClassName =
										'group flex flex-col h-full p-8 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 hover:border-(--accent)/40 shadow-sm hover:shadow-[0_10px_40px_-10px_color-mix(in_srgb,var(--accent)_30%,transparent)] transition-colors overflow-hidden relative';

									const cardInner = (
										<>
											<div className="absolute top-0 right-0 p-8 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
												<ArrowUpRight className="text-(--text)" size={24} />
											</div>

											<div className="flex items-start justify-between gap-3 mb-6">
												{invite.botAvatar && !failedAvatars[invite.id] ? (
													<img
														src={invite.botAvatar}
														alt={invite.botName}
														onError={() => setFailedAvatars((prev) => ({ ...prev, [invite.id]: true }))}
														className="w-14 h-14 rounded-2xl object-cover transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-md"
													/>
												) : (
													<div className="w-14 h-14 rounded-2xl bg-(--accent)/10 flex items-center justify-center text-(--accent) transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
														<LinkIcon size={24} />
													</div>
												)}

												<span className="rounded-full bg-(--accent)/10 border border-(--accent)/30 px-3 py-1 text-xs font-bold text-(--accent)">
													{isSingleUrl ? t('www.invites.directRedirectBadge') : t('www.invites.multiOptionsBadge', { count: enabledOptions.length })}
												</span>
											</div>

											<h2 className="font-bold text-2xl text-(--text) mb-2 group-hover:text-(--accent) transition-colors" style={{ fontFamily: 'var(--font-fredoka)' }}>
												{isSingleUrl ? (
													<button
														type="button"
														onClick={() => window.open(`/invites/${invite.id}`, '_blank', 'noopener,noreferrer')}
														className="after:absolute after:inset-0 text-left cursor-pointer"
													>
														{invite.botName}
													</button>
												) : (
													<Link href={`/invites/${invite.id}`} className="after:absolute after:inset-0">
														{invite.botName}
													</Link>
												)}
											</h2>
											{invite.description && <p className="text-sm text-(--text-muted) leading-relaxed mb-4">{invite.description}</p>}

											{!isSingleUrl && (
												<div className="relative z-10 flex flex-wrap items-center gap-1.5 mb-4">
													{enabledOptions.map((opt) => {
														const optionLabel = t(`www.invites.options.${opt.key}.label`);
														return (
															<motion.button
																key={opt.key}
																type="button"
																onClick={(e) => {
																	e.preventDefault();
																	e.stopPropagation();
																	window.open(`/invites/${invite.id}/${opt.key}`, '_blank', 'noopener,noreferrer');
																}}
																aria-label={`${optionLabel} — ${invite.botName}`}
																whileHover={{ scale: 1.05, y: -1 }}
																whileTap={{ scale: 0.95 }}
																className="rounded-full bg-(--background)/60 hover:bg-(--accent) hover:text-(--accent-contrast) border border-(--border)/10 px-2.5 py-1 text-xs font-semibold text-(--text-muted) transition-colors cursor-pointer"
															>
																{optionLabel}
															</motion.button>
														);
													})}
												</div>
											)}

											<div className="relative z-10 text-sm text-(--text-muted) flex items-center justify-between gap-2 mt-auto pt-2">
												<span className="font-mono bg-(--foreground)/50 px-2.5 py-1 rounded-full text-xs border border-(--border)/10">/invites/{invite.id}</span>
												<motion.button
													type="button"
													whileHover={{ scale: 1.08 }}
													whileTap={{ scale: 0.92 }}
													onClick={(e) => handleCopyInvite(e, invite.id)}
													title={t('www.invites.copyInviteUrl')}
													className="p-2 rounded-full bg-(--background)/60 hover:bg-(--accent) hover:text-(--accent-contrast) text-(--text-muted) border border-(--border)/10 transition-colors cursor-pointer"
												>
													<AnimatePresence mode="wait" initial={false}>
														{copiedId === invite.id ? (
															<motion.span
																key="copied"
																initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
																animate={{ scale: 1, opacity: 1, rotate: 0 }}
																exit={{ scale: 0.5, opacity: 0, rotate: 20 }}
																transition={{ duration: 0.16 }}
																className="flex items-center justify-center"
															>
																<Check size={14} className="text-(--accent-green)" />
															</motion.span>
														) : (
															<motion.span
																key="copy"
																initial={{ scale: 0.5, opacity: 0, rotate: 20 }}
																animate={{ scale: 1, opacity: 1, rotate: 0 }}
																exit={{ scale: 0.5, opacity: 0, rotate: -20 }}
																transition={{ duration: 0.16 }}
																className="flex items-center justify-center"
															>
																<Copy size={14} />
															</motion.span>
														)}
													</AnimatePresence>
												</motion.button>
											</div>
										</>
									);

									return (
										<motion.div
											key={invite.id}
											layout
											initial={{ opacity: 0, y: 20, scale: 0.96 }}
											animate={{ opacity: 1, y: 0, scale: 1 }}
											exit={{ opacity: 0, scale: 0.94, y: -10 }}
											whileHover={{ y: -6, scale: 1.015 }}
											whileTap={{ scale: 0.99 }}
											transition={{ duration: 0.4, delay: idx * 0.06, ease: [0.16, 1, 0.3, 1] }}
											className="h-full"
										>
											<div className={cardClassName}>{cardInner}</div>
										</motion.div>
									);
								})}
							</AnimatePresence>
						</motion.div>
					)}
				</AnimatePresence>

				<section className="flex flex-col gap-8">
					<motion.div
						initial={{ opacity: 0, y: 16 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: '-40px' }}
						transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
						className="flex flex-col gap-2"
					>
						<h2 className="text-3xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('www.invites.guide.title')}
						</h2>
						<p className="text-(--text-muted) max-w-3xl leading-relaxed">{t('www.invites.guide.subtitle')}</p>
					</motion.div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{guideCards.map((card, i) => (
							<motion.div
								key={card.key}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								whileHover={{ y: -5, scale: 1.01 }}
								viewport={{ once: true, margin: '-40px' }}
								transition={{ duration: 0.45, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
								className="group flex flex-col p-8 rounded-3xl bg-(--foreground)/30 border border-(--border)/10 hover:border-(--accent)/30 backdrop-blur-md shadow-sm transition-colors gap-4"
							>
								<div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
									<card.icon size={22} />
								</div>
								<h3 className="text-xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{card.title}
								</h3>
								<p className="text-sm text-(--text-muted) leading-relaxed">{card.description}</p>
							</motion.div>
						))}
					</div>
				</section>

				<SuiteComparisonTable />

				<StudioTrustProofStrip />

				<PageFaqSection
					subtitle={t('www.invites.faq.subtitle')}
					items={[
						{ question: t('www.invites.faq.q1'), answer: t('www.invites.faq.a1') },
						{ question: t('www.invites.faq.q2'), answer: t('www.invites.faq.a2') },
						{ question: t('www.invites.faq.q3'), answer: t('www.invites.faq.a3') },
						{ question: t('www.invites.faq.q4'), answer: t('www.invites.faq.a4') },
					]}
				/>
			</div>
		</div>
	);
}
