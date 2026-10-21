/** @format */
'use client';

import { useState } from 'react';
import { Bot, User, ExternalLink, Copy, Check } from 'lucide-react';
import { useDictionary, useToast } from '@xernerx/providers';
import { BotRow } from '@xernerx/components';
import { Button } from '@xernerx/ui';
import Image from 'next/image';
import Link from 'next/link';

interface PersonalWorkspaceProps {
	session: any;
	bots: any[];
	organizations: any[];
}

export default function PersonalWorkspace({ session, bots, organizations }: PersonalWorkspaceProps) {
	const { t } = useDictionary();
	const { toast } = useToast();
	const [copiedId, setCopiedId] = useState(false);

	const userId = session?.user?.id;
	const personalBots = bots.filter((b) => !b.organization || b.organization === 'null' || b.organization === 'undefined' || !organizations.some((org) => org._id === b.organization));

	const handleCopyId = () => {
		if (!userId) return;
		navigator.clipboard.writeText(userId);
		setCopiedId(true);
		toast({ title: t('app.portal.workspace.idCopied'), type: 'success' });
		setTimeout(() => setCopiedId(false), 2000);
	};

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			<div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[2rem] border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden p-8">
				<div className="relative z-10 flex items-center gap-4">
					{session?.user?.image ? (
						<Image
							src={session.user.image}
							alt="Avatar"
							width={80}
							height={80}
							unoptimized
							className="h-20 w-20 rounded-full border border-(--border)/10 object-cover shrink-0 shadow-lg"
						/>
					) : (
						<div className="flex h-20 w-20 items-center justify-center rounded-full bg-(--background)/50 shrink-0 shadow-lg border border-(--border)/10">
							<User className="w-8 h-8 text-(--text-muted)" />
						</div>
					)}
					<div className="flex flex-col gap-1.5">
						<span className="text-3xl font-extrabold text-(--text) drop-shadow-md tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{session?.user?.name || t('app.portal.nav.personal')}
						</span>
						<div className="flex flex-wrap items-center gap-2">
							<span className="text-sm font-medium text-(--text-muted)">{t('app.portal.myWorkspace')}</span>
							{userId && (
								<button
									type="button"
									onClick={handleCopyId}
									className="inline-flex items-center gap-1.5 w-fit text-xs font-mono text-(--text-muted) hover:text-(--text) bg-(--background)/60 hover:bg-(--background) px-2.5 py-0.5 rounded-lg border border-(--border)/10 transition-colors cursor-pointer"
								>
									<span>{t('app.portal.workspace.id', { id: userId })}</span>
									{copiedId ? <Check className="w-3.5 h-3.5 text-(--accent-green)" /> : <Copy className="w-3.5 h-3.5" />}
								</button>
							)}
						</div>
					</div>
				</div>
				{userId && (
					<div className="relative z-10 flex items-center gap-2 shrink-0">
						<Link href={`/users/${userId}`}>
							<Button variant="secondary" className="gap-2">
								<ExternalLink className="w-4 h-4" />
								{t('app.portal.workspace.viewPublicProfile')}
							</Button>
						</Link>
					</div>
				)}
			</div>

			<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-[2rem] p-8 shadow-xl">
				<div className="flex items-center gap-3 mb-6 text-(--text) font-extrabold text-sm tracking-widest uppercase">
					<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
						<Bot className="w-4 h-4" />
					</div>
					{t('app.portal.personalBots')}
				</div>
				<div className="flex flex-col items-center justify-center w-full">
					{personalBots.length > 0 ? (
						<div className="flex flex-col w-full bg-(--foreground)/30 border border-(--border)/10 rounded-3xl overflow-hidden shadow-sm">
							{personalBots.map((bot) => (
								<BotRow key={bot._id || bot.id} bot={bot} hrefPrefix="/portal/bots" />
							))}
						</div>
					) : (
						<div className="flex flex-col items-center justify-center p-8 bg-(--background)/50 rounded-2xl border border-(--border)/10 border-dashed w-full">
							<Bot className="w-8 h-8 text-(--text-muted) opacity-50 mb-3" />
							<p className="text-sm text-(--text-muted) mb-4">{t('app.portal.noBots')}</p>
							<div className="text-xs text-(--text-muted) bg-(--background) border border-(--border)/20 px-4 py-2 rounded-lg">{t('app.portal.botsAutoRegister')}</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
