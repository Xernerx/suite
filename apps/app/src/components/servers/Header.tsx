/** @format */
'use client';

import { useEffect, useState } from 'react';
import { Bell, BellRing, Building2, Check, Image as ImageIcon, Rocket, Share2, Shield, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useDictionary, useEnvironment, useSession, useToast, useUser } from '@xernerx/providers';
import { Button, CopyButton } from '@xernerx/ui';
import SpotlightBoostModal from '@/components/SpotlightBoostModal';

export interface ServerHeaderProps {
	server: any;
	setServer?: any;
	organizationData: any;
	canVote: boolean;
	nextVoteAt?: string | null;
	voting: boolean;
	timeLeft: string;
	onVote: () => void;
}

export function ServerHeader({ server, setServer, organizationData, canVote, nextVoteAt, voting, timeLeft, onVote }: ServerHeaderProps) {
	const { t } = useDictionary();
	const { toast } = useToast();
	const { getEnvUrl } = useEnvironment();
	const { data: session } = useSession();
	const { user } = useUser();

	const [copiedShare, setCopiedShare] = useState(false);
	const [boostModalOpen, setBoostModalOpen] = useState(false);
	const [reminderEnabled, setReminderEnabled] = useState(false);
	const [savingReminder, setSavingReminder] = useState(false);

	const sessionUserId = (session as any)?.user?.id || user?.id;
	const reminderKey = `server:${server.id}`;

	useEffect(() => {
		const saved = (user as any)?.notifications?.voteReminders?.[reminderKey];
		if (saved && new Date(saved).getTime() > Date.now()) {
			setReminderEnabled(true);
		} else {
			setReminderEnabled(false);
		}
	}, [user, reminderKey]);

	const activeBoostUntil = server.boostedUntil || server.promotedUntil;
	const isBoosted = Boolean(activeBoostUntil && new Date(activeBoostUntil).getTime() > Date.now());

	const avatarUrl = server.icon ? `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png?size=256` : null;
	const bannerUrl = server.banner ? `https://cdn.discordapp.com/banners/${server.id}/${server.banner}.png?size=1024` : null;

	const handleShareProfile = () => {
		const url = window.location.href;
		navigator.clipboard.writeText(url).then(() => {
			setCopiedShare(true);
			toast({ type: 'success', title: t('app.servers.profileLinkCopied'), description: url });
			setTimeout(() => setCopiedShare(false), 2000);
		});
	};

	const handleToggleReminder = async () => {
		if (!sessionUserId) {
			toast({ type: 'error', title: t('app.voteReminder.loginRequired') });
			return;
		}
		if (!nextVoteAt) return;

		const nextState = !reminderEnabled;
		setSavingReminder(true);
		try {
			const existingNotifications = (user as any)?.notifications || {};
			const existingReminders = existingNotifications.voteReminders || {};
			const updatedReminders = {
				...existingReminders,
				[reminderKey]: nextState ? nextVoteAt : null,
			};

			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${sessionUserId}`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					notifications: {
						...existingNotifications,
						voteReminders: updatedReminders,
					},
				}),
			});

			if (res.ok) {
				setReminderEnabled(nextState);
				toast({
					type: 'success',
					title: nextState ? t('app.voteReminder.enabledTitle') : t('app.voteReminder.disabledTitle'),
					description: nextState ? t('app.voteReminder.enabledDesc', { name: server.name }) : undefined,
				});
			} else {
				toast({ type: 'error', title: t('app.voteReminder.errorTitle') });
			}
		} catch {
			toast({ type: 'error', title: t('app.voteReminder.errorTitle') });
		} finally {
			setSavingReminder(false);
		}
	};

	return (
		<div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-12 p-8 rounded-3xl bg-(--foreground)/50 border border-(--border)/10 backdrop-blur-md shadow-sm mt-8 relative overflow-hidden">
			{bannerUrl && <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
			{avatarUrl ? (
				<Image src={avatarUrl} alt={server.name} width={128} height={128} className="rounded-2xl shadow-lg border-2 border-(--border)/20 relative z-10" />
			) : (
				<div className="w-32 h-32 rounded-2xl bg-(--background) border-2 border-(--border)/20 flex items-center justify-center text-(--text-muted) shadow-lg relative z-10">
					<ImageIcon className="w-12 h-12" />
				</div>
			)}
			<div className="flex-1 relative z-10">
				<div className="flex flex-wrap items-center gap-3 mb-2">
					<h1 className="text-4xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{server.name}
					</h1>
					{server.verified && <Shield className="w-6 h-6 text-(--accent-green)" />}
					{isBoosted && (
						<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-(--accent)/20 text-(--accent) border border-(--accent)/35">
							<Rocket size={11} />
							{t('app.boost.spotlightBadge')}
						</span>
					)}
					<CopyButton value={server.id} label={server.id} toastTitle={t('app.servers.idCopied')} toastDescription={server.id} />
				</div>
				<p className="text-lg text-(--text-muted) mb-4 max-w-2xl">{server.description || t('common.noDescription')}</p>

				<div className="flex flex-wrap items-center gap-4">
					{server.bot !== false && (
						<div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-(--background)/80 border border-(--border)/10 shadow-sm backdrop-blur-md">
							<Users className="w-4 h-4 text-(--accent)" />
							<span className="text-sm font-semibold text-(--text)">
								{server.stats && server.stats.length > 0 ? server.stats[server.stats.length - 1].members.toLocaleString() : 'N/A'} {t('app.dashboard.stats.members')}
							</span>
						</div>
					)}
					{organizationData?.name &&
						((organizationData.privacy || organizationData.config?.privacy) !== 'private' ? (
							<Link
								href={`/organization/${organizationData._id}`}
								className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-(--background)/80 border border-(--border)/10 hover:border-(--accent)/50 shadow-sm backdrop-blur-md transition-colors"
							>
								<Building2 className="w-4 h-4 text-(--accent)" />
								<span className="text-sm font-semibold text-(--accent)">{organizationData.name}</span>
							</Link>
						) : (
							<div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-(--background)/80 border border-(--border)/10 shadow-sm backdrop-blur-md">
								<Building2 className="w-4 h-4 text-(--text-muted)" />
								<span className="text-sm font-semibold text-(--text-muted)">{organizationData.name}</span>
							</div>
						))}
				</div>
			</div>

			<div className="flex flex-col gap-3 min-w-[200px] relative z-10 w-full md:w-auto mt-6 md:mt-0">
				<div className="flex gap-2">
					<Button
						variant="primary"
						className="flex-1 justify-center shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_40%,transparent)] transition-shadow"
						onClick={() => window.open(server.links?.invite || server.links?.website || '#', '_blank')}
					>
						{t('app.servers.joinServer')}
					</Button>
					<Button
						variant="secondary"
						onClick={() => setBoostModalOpen(true)}
						title={t('app.boost.buttonLabel')}
						className="px-3.5 justify-center border border-(--accent)/30 hover:border-(--accent) bg-(--accent)/10 text-(--accent)"
					>
						<Rocket className="w-4 h-4 mr-1.5" />
						{t('app.boost.buttonLabel')}
					</Button>
					<Button
						variant="secondary"
						onClick={handleShareProfile}
						title={t('app.servers.shareProfile')}
						className="px-3.5 justify-center border border-(--border)/10 hover:border-(--accent)/50"
					>
						{copiedShare ? <Check className="w-4 h-4 text-(--accent-green)" /> : <Share2 className="w-4 h-4" />}
					</Button>
				</div>
				<div className="flex gap-2">
					<Button
						variant={canVote ? 'secondary' : 'ghost'}
						className={`flex-1 justify-center ${canVote ? 'hover:border-(--accent) hover:text-(--accent)' : 'opacity-70 cursor-not-allowed border-(--border)/5 bg-(--foreground)/30'}`}
						onClick={onVote}
						disabled={!canVote || voting}
						loading={voting}
					>
						{canVote ? t('app.servers.voteForServer', { count: server.voteCount || 0 }) : t('app.servers.voteAvailableIn', { time: timeLeft })}
					</Button>
					{!canVote && nextVoteAt && (
						<Button
							variant="secondary"
							onClick={handleToggleReminder}
							loading={savingReminder}
							title={reminderEnabled ? t('app.voteReminder.remindingBtn') : t('app.voteReminder.remindMeBtn')}
							className={`px-3.5 justify-center border transition-all ${
								reminderEnabled ? 'border-(--accent)/40 bg-(--accent)/15 text-(--accent)' : 'border-(--border)/10 hover:border-(--accent)/40 text-(--text-muted) hover:text-(--text)'
							}`}
						>
							{reminderEnabled ? <BellRing className="w-4 h-4 mr-1.5 text-(--accent)" /> : <Bell className="w-4 h-4 mr-1.5" />}
							<span className="text-xs font-bold">{reminderEnabled ? t('app.voteReminder.remindingBtn') : t('app.voteReminder.remindMeBtn')}</span>
						</Button>
					)}
				</div>
			</div>
			<SpotlightBoostModal
				isOpen={boostModalOpen}
				onClose={() => setBoostModalOpen(false)}
				targetType="server"
				targetId={server.id}
				targetName={server.name}
				currentBoostedUntil={activeBoostUntil}
				onBoostSuccess={(boostedUntil) => setServer?.((prev: any) => (prev ? { ...prev, boostedUntil, promotedUntil: boostedUntil } : prev))}
			/>
		</div>
	);
}
