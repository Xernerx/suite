/** @format */
'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Check, Copy, Layers, Link as LinkIcon, ShieldCheck, Sliders } from 'lucide-react';
import type { InviteOptionKey, ResolvedInviteOption } from '@xernerx/lib';
import { useDictionary, useSidebar, useToast } from '@xernerx/providers';
import { Button } from '@xernerx/ui';

export interface InviteChooserOptionItem extends ResolvedInviteOption {
	discordUrl: string;
}

interface InviteOptionChooserProps {
	id: string;
	botName: string;
	botAvatar: string | null;
	description?: string;
	options: InviteChooserOptionItem[];
}

const OPTION_ICONS: Record<InviteOptionKey, React.ComponentType<{ size?: number; className?: string }>> = {
	essential: ShieldCheck,
	optional: Layers,
	advanced: Sliders,
};

export function InviteOptionChooser({ id, botName, botAvatar, description, options }: InviteOptionChooserProps) {
	const { hide } = useSidebar();
	const { t } = useDictionary();
	const { toast } = useToast();
	const [copiedKey, setCopiedKey] = useState<string | null>(null);

	useEffect(() => {
		hide();
	}, [hide]);

	const copyOptionLink = (optionKey: InviteOptionKey) => {
		const shareUrl = `${window.location.origin}/invites/${id}/${optionKey}`;
		navigator.clipboard.writeText(shareUrl);
		setCopiedKey(optionKey);
		toast({ type: 'success', title: t('www.invites.inviteUrlCopied') });
		setTimeout(() => setCopiedKey((prev) => (prev === optionKey ? null : prev)), 2000);
	};

	const gridColsClass = options.length === 1 ? 'grid-cols-1' : options.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3';

	return (
		<div className="min-h-screen py-28 relative">
			<div className="max-w-(--page-width) mx-auto w-full px-6 relative z-10 flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
				<div>
					<Link
						href="/invites"
						className="inline-flex items-center gap-2 rounded-full bg-(--foreground)/30 hover:bg-(--foreground)/50 backdrop-blur-md border border-(--border)/10 px-4 py-2 text-xs font-bold text-(--text-muted) hover:text-(--text) transition-colors"
					>
						<ArrowLeft size={14} />
						<span>{t('www.invites.backToInvites')}</span>
					</Link>
				</div>

				<div className="flex flex-col sm:flex-row sm:items-center gap-6 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 p-8 shadow-sm w-full">
					{botAvatar ? (
						<Image src={botAvatar} alt={botName} width={72} height={72} unoptimized className="w-18 h-18 rounded-3xl shadow-md shrink-0" />
					) : (
						<div className="w-18 h-18 rounded-3xl bg-(--accent)/15 border border-(--accent)/30 flex items-center justify-center text-(--accent) shrink-0">
							<LinkIcon size={28} />
						</div>
					)}

					<div className="flex flex-col gap-2 min-w-0 flex-1">
						<div className="flex flex-wrap items-center gap-3">
							<h1 className="text-3xl sm:text-4xl font-extrabold text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{botName}
							</h1>
							<span className="font-mono bg-(--background)/60 px-3 py-1 rounded-full text-xs text-(--text-muted) border border-(--border)/10">/invites/{id}</span>
						</div>
						<p className="text-sm sm:text-base text-(--text-muted) max-w-3xl leading-relaxed">{description || t('www.invites.chooserSubtitle')}</p>
					</div>
				</div>

				<div className={`grid ${gridColsClass} items-stretch w-full`} style={{ gap: 'var(--ui-gap)' }}>
					{options.map((opt) => {
						const Icon = OPTION_ICONS[opt.key];
						const isPrimary = opt.key === 'essential' || options.length === 1;
						const label = t(`www.invites.options.${opt.key}.label`);
						const badge = t(`www.invites.options.${opt.key}.badge`);
						const desc = t(`www.invites.options.${opt.key}.description`);
						const cta = t(`www.invites.options.${opt.key}.cta`);

						const previewLabels = opt.key === 'optional' && opt.additionalLabels.length > 0 ? opt.additionalLabels : opt.permissionLabels;
						const visibleLabels = previewLabels.slice(0, 8);
						const remainingCount = Math.max(0, previewLabels.length - visibleLabels.length);

						return (
							<div
								key={opt.key}
								className={`flex flex-col h-full rounded-3xl backdrop-blur-md p-7 border transition-all ${
									isPrimary
										? 'bg-(--foreground)/40 border-(--accent)/40 shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_18%,transparent)]'
										: 'bg-(--foreground)/30 border-(--border)/10 hover:border-(--accent)/30 shadow-sm'
								}`}
								style={{ gap: 'var(--ui-gap)' }}
							>
								<div className="flex items-start justify-between gap-3">
									<div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30 shrink-0">
										<Icon size={22} />
									</div>
									<div className="flex items-center gap-1.5">
										<span
											className={`rounded-full px-3 py-1 text-xs font-extrabold border ${
												isPrimary ? 'bg-(--accent) text-(--accent-contrast) border-(--accent)' : 'bg-(--accent)/10 text-(--accent) border-(--accent)/30'
											}`}
										>
											{badge}
										</span>
										<button
											type="button"
											onClick={() => copyOptionLink(opt.key)}
											title={t('www.invites.options.copyTierUrl', { tier: label })}
											aria-label={t('www.invites.options.copyTierUrl', { tier: label })}
											className="p-2 rounded-full bg-(--background)/60 hover:bg-(--foreground) border border-(--border)/10 text-(--text-muted) hover:text-(--text) transition-colors cursor-pointer"
										>
											{copiedKey === opt.key ? <Check size={14} className="text-(--accent-green)" /> : <Copy size={14} />}
										</button>
									</div>
								</div>

								<div className="flex flex-col gap-1.5">
									<h2 className="text-2xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
										{label}
									</h2>
									<p className="text-sm text-(--text-muted) leading-relaxed min-h-[2.75rem]">{desc}</p>
								</div>

								<div className="flex-1 flex flex-col gap-2 rounded-2xl bg-(--background)/50 border border-(--border)/10 p-4">
									<div className="flex items-center justify-between gap-2 text-xs">
										<span className="font-bold text-(--text)">
											{opt.key === 'advanced' ? t('www.invites.options.zeroPermissions') : t('www.invites.options.permissionsCount', { count: opt.permissionCount })}
										</span>
										{opt.key === 'optional' && opt.additionalCount > 0 && (
											<span className="rounded-full bg-(--accent)/15 border border-(--accent)/30 px-2 py-0.5 text-[10px] font-bold text-(--accent)">
												{t('www.invites.options.additionalPermissionsCount', { count: opt.additionalCount })}
											</span>
										)}
									</div>

									<div className="flex flex-col gap-1.5 pt-2 border-t border-(--border)/10">
										<span className="text-[10px] font-bold uppercase tracking-wider text-(--text-muted)">
											{opt.key === 'advanced'
												? t('www.invites.options.permissionModeTitle')
												: opt.key === 'optional' && opt.additionalLabels.length > 0
													? t('www.invites.options.additionalPermissionsTitle')
													: t('www.invites.options.includedPermissionsTitle')}
										</span>
										<div className="flex flex-wrap gap-1.5">
											{opt.key === 'advanced' ? (
												<span className="rounded-full bg-(--foreground)/40 border border-(--border)/10 px-2.5 py-0.5 text-[11px] text-(--text-muted)">
													{t('www.invites.options.advancedModeTag')}
												</span>
											) : (
												<>
													{visibleLabels.map((perm) => (
														<span key={perm} className="rounded-full bg-(--foreground)/40 border border-(--border)/10 px-2.5 py-0.5 text-[11px] text-(--text-muted)">
															{perm}
														</span>
													))}
													{remainingCount > 0 && (
														<span className="rounded-full bg-(--accent)/10 border border-(--accent)/25 px-2.5 py-0.5 text-[11px] font-semibold text-(--accent)">
															{t('www.invites.options.morePermissions', { count: remainingCount })}
														</span>
													)}
												</>
											)}
										</div>
									</div>
								</div>

								<a href={opt.discordUrl} className="w-full mt-auto">
									<Button variant={isPrimary ? 'primary' : 'secondary'} className="w-full flex items-center justify-center gap-2">
										<span>{cta}</span>
										<ArrowUpRight size={16} />
									</Button>
								</a>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
