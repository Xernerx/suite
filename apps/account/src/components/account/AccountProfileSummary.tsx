/** @format */
'use client';

import { Ban, ExternalLink, User as UserIcon } from 'lucide-react';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { Button, CopyButton } from '@xernerx/ui';
import Image from 'next/image';

interface AccountProfileSummaryProps {
	activeUser: any;
	userId?: string;
	avatarUrl: string | null;
	displayName: string;
	isBlacklisted: boolean;
}

export function AccountProfileSummary({ activeUser, userId, avatarUrl, displayName, isBlacklisted }: AccountProfileSummaryProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();

	return (
		<>
			{isBlacklisted && (
				<div
					className="flex items-start rounded-3xl border border-(--accent-red)/30 bg-(--accent-red)/10 backdrop-blur-md shadow-sm"
					style={{
						padding: 'var(--ui-gap)',
						gap: 'calc(var(--ui-gap) * 0.75)',
					}}
				>
					<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-(--accent-red)/20 text-(--accent-red) border border-(--accent-red)/30">
						<Ban size={20} />
					</div>
					<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.2)' }}>
						<h2 className="text-base font-bold text-(--accent-red)">{t('account.account.blacklistedBanner.title')}</h2>
						<p className="text-xs text-(--text-muted) leading-relaxed">{t('account.account.blacklistedBanner.description')}</p>
					</div>
				</div>
			)}

			<div
				className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{
					padding: 'var(--ui-gap)',
					gap: 'var(--ui-gap)',
				}}
			>
				<div
					className="flex items-center"
					style={{
						gap: 'var(--ui-gap)',
					}}
				>
					{avatarUrl ? (
						<Image
							src={avatarUrl}
							alt={t('account.common.alt')}
							width={80}
							height={80}
							className="h-20 w-20 rounded-full border border-(--border)/10 object-cover shrink-0"
							unoptimized
							draggable={false}
						/>
					) : (
						<div className="flex h-20 w-20 items-center justify-center rounded-full bg-(--border)/10 shrink-0">
							<UserIcon size={36} className="text-(--text-muted)" />
						</div>
					)}
					<div
						className="flex flex-col overflow-hidden"
						style={{
							gap: 'calc(var(--ui-gap) * 0.25)',
						}}
					>
						<div className="flex items-center gap-2">
							<h2 className="text-xl font-bold text-(--text) truncate">{displayName}</h2>
							{isBlacklisted && (
								<span className="inline-flex items-center gap-1 rounded-full bg-(--accent-red)/15 border border-(--accent-red)/30 px-2.5 py-0.5 text-[11px] font-bold text-(--accent-red)">
									<Ban size={11} />
									{t('account.account.blacklistedBanner.badge')}
								</span>
							)}
						</div>
						<p className="text-sm text-(--text-muted) truncate">@{activeUser?.username || activeUser?.name?.toLowerCase().replace(/\s/g, '')}</p>
						{userId && <CopyButton value={userId} label={t('account.common.description', { userId })} toastTitle={t('account.profile.idCopied')} className="w-fit" />}
					</div>
				</div>
				{userId && !isBlacklisted && (
					<div className="flex items-center shrink-0">
						<Button variant="secondary" onClick={() => window.open(`${getEnvUrl('https://app.xernerx.com/')}users/${userId}`, '_blank')} className="gap-2">
							<ExternalLink size={16} />
							{t('account.profile.viewPublicProfile')}
						</Button>
					</div>
				)}
			</div>
		</>
	);
}
