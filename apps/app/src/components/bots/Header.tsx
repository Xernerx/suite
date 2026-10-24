/** @format */
'use client';

import { useEffect, useState } from 'react';
import { UserProfilePopover } from '@xernerx/components';
import { useDictionary, useEnvironment, useSession, useToast, useUser } from '@xernerx/providers';
import { Badge, Button, CopyButton } from '@xernerx/ui';
import { User, ExternalLink, ShieldCheck, Globe, LifeBuoy, MessageSquare, FileText, Shield, ChevronUp, LayoutDashboard, Share2, Check, Code2, Rocket, Coins, Bell, BellRing } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import SpotlightBoostModal from '@/components/SpotlightBoostModal';
import TipCreditsModal from '@/components/users/TipCreditsModal';

export default function Header({ bot, id, setBot }: { bot: any; id: string; setBot: any }) {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { toast } = useToast();
	const { data: session } = useSession();
	const { user } = useUser();

	// Vote State
	const [canVote, setCanVote] = useState(false);
	const [nextVoteAt, setNextVoteAt] = useState<string | null>(null);
	const [voting, setVoting] = useState(false);
	const [timeLeft, setTimeLeft] = useState<string>('');
	const [copiedShare, setCopiedShare] = useState(false);
	const [boostModalOpen, setBoostModalOpen] = useState(false);
	const [tipModalOpen, setTipModalOpen] = useState(false);
	const [reminderEnabled, setReminderEnabled] = useState(false);
	const [savingReminder, setSavingReminder] = useState(false);

	const sessionUserId = (session as any)?.user?.id || user?.id;
	const primaryOwnerId = bot.owners?.[0] || bot.ownersData?.[0]?.id;
	const primaryOwnerName = bot.ownersData?.[0]?.global_name || bot.ownersData?.[0]?.username || bot.discord?.global_name || bot.name || t('common.unknownBot');
	const activeBoostUntil = bot.boostedUntil || bot.promotedUntil;
	const isBoosted = Boolean(activeBoostUntil && new Date(activeBoostUntil).getTime() > Date.now());
	const botDisplayName = bot.discord?.global_name || bot.discord?.username || bot.name || t('common.unknownBot');
	const reminderKey = `bot:${bot.id || id}`;

	useEffect(() => {
		const saved = (user as any)?.notifications?.voteReminders?.[reminderKey];
		if (saved && new Date(saved).getTime() > Date.now()) {
			setReminderEnabled(true);
		} else {
			setReminderEnabled(false);
		}
	}, [user, reminderKey]);

	const handleShareProfile = () => {
		const url = window.location.href;
		navigator.clipboard.writeText(url).then(() => {
			setCopiedShare(true);
			toast({ type: 'success', title: t('app.bots.id.profileLinkCopied'), description: url });
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
					description: nextState ? t('app.voteReminder.enabledDesc', { name: botDisplayName }) : undefined,
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

	useEffect(() => {
		if (!nextVoteAt || canVote) return;
		const interval = setInterval(() => {
			const diff = new Date(nextVoteAt).getTime() - Date.now();
			if (diff <= 0) {
				setCanVote(true);
				setNextVoteAt(null);
				clearInterval(interval);
			} else {
				const h = Math.floor(diff / (1000 * 60 * 60));
				const m = Math.floor((diff / 1000 / 60) % 60);
				setTimeLeft(`${h}h ${m}m`);
			}
		}, 60000);

		const diff = new Date(nextVoteAt).getTime() - Date.now();
		if (diff > 0) {
			const h = Math.floor(diff / (1000 * 60 * 60));
			const m = Math.floor((diff / 1000 / 60) % 60);
			setTimeLeft(`${h}h ${m}m`);
		}

		return () => clearInterval(interval);
	}, [nextVoteAt, canVote]);

	useEffect(() => {
		if (!isReady) return;
		const fetchVoteStatus = async () => {
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${id}/vote`), { credentials: 'include' });
				if (res.ok) {
					const data = await res.json();
					setCanVote(data.canVote);
					setNextVoteAt(data.nextVoteAt);
				}
			} catch {
				// Silently fail
			}
		};
		fetchVoteStatus();
	}, [id, getEnvUrl, isReady]);

	const handleVote = async () => {
		setVoting(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${id}/vote`), {
				method: 'POST',
				credentials: 'include',
			});
			if (res.ok) {
				setCanVote(false);
				setNextVoteAt(new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString());
				setBot((prev: any) => (prev ? { ...prev, voteCount: (prev.voteCount || 0) + 1 } : prev));
			}
		} catch (error) {
			console.error('Failed to vote', error);
		} finally {
			setVoting(false);
		}
	};

	const avatarUrl = bot.discord?.avatar
		? `https://cdn.discordapp.com/avatars/${bot.id}/${bot.discord.avatar}.png?size=256`
		: bot.avatar
			? `https://cdn.discordapp.com/avatars/${bot.id}/${bot.avatar}.png?size=256`
			: null;

	return (
		<div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-12 p-8 rounded-3xl bg-(--foreground)/50 border border-(--border)/10 backdrop-blur-md shadow-sm mt-8 relative overflow-hidden">
			{bot.discord?.banner && (
				<div
					className="absolute inset-0 opacity-20 pointer-events-none"
					style={{ backgroundImage: `url(https://cdn.discordapp.com/banners/${bot.id}/${bot.discord.banner}.png?size=1024)`, backgroundSize: 'cover', backgroundPosition: 'center' }}
				/>
			)}
			{avatarUrl ? (
				<Image src={avatarUrl} alt={botDisplayName} width={128} height={128} className="rounded-2xl shadow-lg border-2 border-(--border)/20 relative z-10" />
			) : (
				<div className="w-32 h-32 rounded-2xl bg-(--background) border-2 border-(--border)/20 flex items-center justify-center text-(--text-muted) shadow-lg relative z-10">
					<User className="w-12 h-12" />
				</div>
			)}
			<div className="flex-1 relative z-10">
				<div className="flex flex-wrap items-center gap-3 mb-2">
					<h1 className="text-4xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{botDisplayName}
					</h1>
					{bot.verified && <ShieldCheck className="w-6 h-6 text-(--accent-green)" />}
					{bot.discord?.bot && <Badge variant="accent">{t('app.bots.id.text4')}</Badge>}
					{isBoosted && (
						<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-(--accent)/20 text-(--accent) border border-(--accent)/35">
							<Rocket size={11} />
							{t('app.boost.spotlightBadge')}
						</span>
					)}
					<CopyButton value={bot.id} label={bot.id} toastTitle={t('app.bots.id.idCopied')} toastDescription={bot.id} />
				</div>
				<p className="text-lg text-(--text-muted) mb-4 max-w-2xl">{bot.description || t('common.noDescription')}</p>
				<div className="flex flex-wrap gap-2">
					{bot.tags?.map((tag: string) => (
						<span key={tag} className="px-3 py-1 bg-(--accent)/10 text-(--accent) text-sm font-semibold rounded-full border border-(--accent)/20 flex items-center gap-1">
							<span className="text-[10px] font-bold text-(--text-muted)">#</span> {tag}
						</span>
					))}
				</div>
			</div>

			<div className="flex-shrink-0 w-full md:w-auto mt-4 md:mt-0 relative z-10 flex flex-col items-start md:items-end gap-6">
				<div className="flex flex-col items-start md:items-end gap-3 w-full">
					<div className="flex flex-wrap sm:flex-row w-full md:w-auto gap-3">
						{bot.links?.invite && (
							<Button onClick={() => window.open(bot.links!.invite, '_blank')} className="w-full sm:w-auto px-8 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_40%,transparent)]">
								{t('app.bots.id.text5')}
							</Button>
						)}
						<Button
							onClick={handleVote}
							disabled={!canVote || voting}
							variant="outline"
							className={`w-full sm:w-auto px-6 border border-(--border)/10 ${canVote ? 'hover:border-(--accent)/50 hover:bg-(--accent)/10 text-(--accent)' : 'opacity-50 cursor-not-allowed'}`}
						>
							<ChevronUp className="w-4 h-4 mr-2" />
							{voting ? t('app.bots.id.voting') : canVote ? t('app.bots.id.vote') : nextVoteAt ? t('app.bots.id.voteAgainIn', { time: timeLeft || '...' }) : t('app.bots.id.voted')}
						</Button>
						{!canVote && nextVoteAt && (
							<Button
								onClick={handleToggleReminder}
								loading={savingReminder}
								variant="outline"
								title={reminderEnabled ? t('app.voteReminder.remindingBtn') : t('app.voteReminder.remindMeBtn')}
								className={`w-full sm:w-auto px-4 border transition-all ${
									reminderEnabled
										? 'border-(--accent)/40 bg-(--accent)/15 text-(--accent)'
										: 'border-(--border)/10 hover:border-(--accent)/50 hover:bg-(--accent)/10 text-(--text-muted) hover:text-(--text)'
								}`}
							>
								{reminderEnabled ? <BellRing className="w-4 h-4 mr-1.5 text-(--accent)" /> : <Bell className="w-4 h-4 mr-1.5" />}
								{reminderEnabled ? t('app.voteReminder.remindingBtn') : t('app.voteReminder.remindMeBtn')}
							</Button>
						)}
						<Button
							onClick={() => setBoostModalOpen(true)}
							variant="outline"
							title={t('app.boost.buttonLabel')}
							className="w-full sm:w-auto px-4 border border-(--accent)/30 hover:border-(--accent) bg-(--accent)/10 text-(--accent)"
						>
							<Rocket className="w-4 h-4 mr-1.5" />
							{t('app.boost.buttonLabel')}
						</Button>
						{primaryOwnerId && (
							<Button
								onClick={() => setTipModalOpen(true)}
								variant="outline"
								title={t('app.tip.tipCreatorBtn')}
								className="w-full sm:w-auto px-4 border border-(--border)/10 hover:border-(--accent)/50 hover:bg-(--accent)/10 text-(--text-muted) hover:text-(--text)"
							>
								<Coins className="w-4 h-4 mr-1.5 text-(--accent)" />
								{t('app.tip.tipCreatorBtn')}
							</Button>
						)}
						<Button
							onClick={handleShareProfile}
							variant="outline"
							title={t('app.bots.id.shareProfile')}
							className="w-full sm:w-auto px-4 border border-(--border)/10 hover:border-(--accent)/50 hover:bg-(--accent)/10 text-(--text-muted) hover:text-(--text)"
						>
							{copiedShare ? <Check className="w-4 h-4 text-(--accent-green)" /> : <Share2 className="w-4 h-4" />}
						</Button>
					</div>
					{bot.links && Object.entries(bot.links).filter(([key, val]) => key !== 'invite' && val).length > 0 && (
						<div className="flex flex-wrap gap-2 justify-end w-full">
							{Object.entries(bot.links)
								.filter(([key, val]) => key !== 'invite' && val)
								.map(([key, val]) => {
									let Icon: any = ExternalLink;
									if (key === 'github') Icon = Code2;
									else if (key === 'website') Icon = Globe;
									else if (key === 'support') Icon = LifeBuoy;
									else if (key === 'community') Icon = MessageSquare;
									else if (key === 'privacy') Icon = Shield;
									else if (key === 'terms') Icon = FileText;
									else if (key === 'dashboard') Icon = LayoutDashboard;

									return (
										<button
											key={key}
											onClick={() => window.open(val as string, '_blank')}
											className="flex items-center gap-1.5 text-xs font-bold text-(--text-muted) hover:text-(--text) bg-(--background)/50 hover:bg-(--background) px-3 py-1.5 rounded-xl border border-(--border)/10 transition-all capitalize shadow-sm"
										>
											<Icon className="w-3.5 h-3.5" />
											{key}
										</button>
									);
								})}
						</div>
					)}
				</div>

				<div className="flex flex-col sm:flex-row items-end justify-end gap-6">
					{bot.organizationData && (
						<div className="flex flex-col items-start md:items-end gap-2">
							<span className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider">{t('app.bots.id.publishedBy')}</span>
							<div className="flex flex-wrap gap-2 justify-end">
								{bot.organizationData.privacy !== 'private' ? (
									<Link
										href={`/organization/${bot.organizationData._id}`}
										className="flex items-center gap-2 bg-(--background) border border-(--border)/10 px-3 py-1 rounded-full shadow-sm hover:border-(--accent)/50 transition-colors"
									>
										{bot.organizationData.iconUrl ? (
											<Image
												src={bot.organizationData.iconUrl}
												alt={bot.organizationData.name}
												width={16}
												height={16}
												unoptimized
												className="w-4 h-4 rounded-full object-cover"
											/>
										) : (
											<div className="w-4 h-4 rounded-full bg-(--foreground) flex items-center justify-center text-[8px]">{bot.organizationData.name.charAt(0)}</div>
										)}
										<span className="text-xs font-bold text-(--accent)">{bot.organizationData.name}</span>
									</Link>
								) : (
									<span className="flex items-center gap-2 bg-(--background) border border-(--border)/10 px-3 py-1 rounded-full shadow-sm">
										{bot.organizationData.iconUrl ? (
											<Image
												src={bot.organizationData.iconUrl}
												alt={bot.organizationData.name}
												width={16}
												height={16}
												unoptimized
												className="w-4 h-4 rounded-full object-cover"
											/>
										) : (
											<div className="w-4 h-4 rounded-full bg-(--foreground) flex items-center justify-center text-[8px]">{bot.organizationData.name.charAt(0)}</div>
										)}
										<span className="text-xs font-bold text-(--text-muted)">{bot.organizationData.name}</span>
									</span>
								)}
							</div>
						</div>
					)}

					{bot.ownersData && bot.ownersData.length > 0 && (
						<div className="flex flex-col items-start md:items-end gap-2">
							<span className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider">{t('app.bots.id.text6')}</span>
							<div className="flex flex-wrap gap-2 justify-end">
								{bot.ownersData.map((owner: any) => (
									<UserProfilePopover key={owner.id} userId={owner.id} initialUser={owner}>
										<div className="flex items-center gap-2 bg-(--background) border border-(--border)/10 px-3 py-1 rounded-full shadow-sm hover:border-(--accent)/50 transition-colors">
											<Image
												src={
													owner.avatar
														? `https://cdn.discordapp.com/avatars/${owner.id}/${owner.avatar}.png?size=64`
														: `https://cdn.discordapp.com/embed/avatars/${Number(owner.discriminator) % 5}.png`
												}
												alt={owner.global_name || owner.username || ''}
												width={16}
												height={16}
												className="rounded-full"
											/>
											<span className="text-xs font-bold text-(--text)">{owner.global_name || owner.username}</span>
										</div>
									</UserProfilePopover>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
			<SpotlightBoostModal
				isOpen={boostModalOpen}
				onClose={() => setBoostModalOpen(false)}
				targetType="bot"
				targetId={bot.id}
				targetName={botDisplayName}
				currentBoostedUntil={activeBoostUntil}
				onBoostSuccess={(boostedUntil) => setBot((prev: any) => (prev ? { ...prev, boostedUntil, promotedUntil: boostedUntil } : prev))}
			/>
			{primaryOwnerId && <TipCreditsModal isOpen={tipModalOpen} onClose={() => setTipModalOpen(false)} recipientId={primaryOwnerId} recipientName={primaryOwnerName} />}
		</div>
	);
}
