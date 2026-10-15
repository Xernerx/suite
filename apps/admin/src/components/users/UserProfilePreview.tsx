/** @format */
'use client';

import React from 'react';
import Image from 'next/image';
import { Copy, User as UserIcon } from 'lucide-react';
import { useDictionary, useToast } from '@xernerx/providers';
import type { DiscordProfile, FullUser, UserSummary } from './types';

interface UserProfilePreviewProps {
	user: UserSummary;
	discord: DiscordProfile | null;
	fullUser: FullUser | null;
	displayName: string;
	avatarUrl: string | null;
	discordBanner: string | null;
}

export function UserProfilePreview({ user, discord, fullUser, displayName, avatarUrl, discordBanner }: UserProfilePreviewProps) {
	const { t } = useDictionary();
	const { toast } = useToast();

	return (
		<div className="flex flex-col col-span-1 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md overflow-hidden relative shadow-sm h-fit">
			{discordBanner ? (
				<div
					className="h-24 w-full bg-cover bg-center"
					style={{
						backgroundImage: `url(${discordBanner})`,
					}}
				/>
			) : (
				<div className="h-24 w-full bg-gradient-to-br from-(--accent)/40 to-purple-500/40 opacity-50" />
			)}

			<div className="absolute top-12 left-4 rounded-full border-4 border-(--background) bg-(--background) overflow-hidden h-20 w-20 shadow-md">
				{avatarUrl ? (
					<Image src={avatarUrl} alt={displayName} width={80} height={80} className="object-cover w-full h-full" unoptimized draggable={false} />
				) : (
					<div className="flex w-full h-full items-center justify-center bg-(--border)/10 text-(--text)">
						<UserIcon size={32} />
					</div>
				)}
			</div>

			<div className="pt-10 px-5 pb-5 flex flex-col">
				<h3 className="font-bold text-lg text-(--text) truncate">{discord?.globalName || fullUser?.name || displayName}</h3>
				<span className="text-sm text-(--text-muted) truncate">{discord?.username ? `@${discord.username}` : t('admin.users.noRoles')}</span>

				<div
					className="mt-4 flex flex-col"
					style={{
						gap: 'calc(var(--ui-gap) * 0.5)',
					}}
				>
					<button
						type="button"
						onClick={() => {
							navigator.clipboard.writeText(user.id);
							toast({
								title: t('admin.users.idCopied'),
								type: 'success',
							});
						}}
						className="flex items-center justify-between text-xs bg-(--background)/50 p-2.5 rounded-xl border border-(--border)/10 font-mono text-center text-(--text-muted) hover:text-(--accent) hover:border-(--accent)/30 transition-all text-left group cursor-pointer"
					>
						<span className="truncate">
							{t('admin.users.card.idPrefix', {
								id: user.id,
							})}
						</span>
						<Copy size={14} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
					</button>
					{fullUser?.email && (
						<button
							type="button"
							onClick={() => {
								navigator.clipboard.writeText(fullUser.email!);
								toast({
									title: t('admin.users.emailCopied'),
									type: 'success',
								});
							}}
							className="flex items-center justify-between text-xs bg-(--background)/50 p-2.5 rounded-xl border border-(--border)/10 text-(--text-muted) hover:text-(--accent) hover:border-(--accent)/30 transition-all text-left group cursor-pointer"
						>
							<div className="flex items-center gap-1.5 truncate">
								<div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
								<span className="truncate">{fullUser.email}</span>
							</div>
							<Copy size={14} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
