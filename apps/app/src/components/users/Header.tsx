/** @format */
'use client';

import { useDictionary, useEnvironment, useToast, useSession } from '@xernerx/providers';
import { Button, CopyButton } from '@xernerx/ui';
import { User, Share2, Settings } from 'lucide-react';
import Image from 'next/image';

export default function Header({ user, discordUser, id }: { user: any; discordUser: any; id: string }) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { data: session } = useSession();

	const isOwnProfile = (session as any)?.user?.id === id;

	const avatarUrl =
		discordUser?.avatarUrl ||
		(discordUser?.avatar
			? `https://cdn.discordapp.com/avatars/${id}/${discordUser.avatar}.png?size=256`
			: user?.avatar
				? `https://cdn.discordapp.com/avatars/${id}/${user.avatar}.png?size=256`
				: null);

	const bannerUrl = discordUser?.bannerUrl || (discordUser?.banner ? `https://cdn.discordapp.com/banners/${id}/${discordUser.banner}.png?size=1024` : null);
	const displayName = discordUser?.global_name || discordUser?.username || user?.username || t('app.users.unknownUser');
	const username = discordUser?.username || user?.username;

	const handleShareProfile = () => {
		if (typeof window === 'undefined') return;
		navigator.clipboard.writeText(window.location.href);
		toast({ title: t('app.users.profileLinkCopied'), type: 'success' });
	};

	return (
		<div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-12 p-8 rounded-3xl bg-(--foreground)/50 border border-(--border)/10 backdrop-blur-md shadow-sm mt-8 relative overflow-hidden">
			{bannerUrl && <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
			{avatarUrl ? (
				<Image src={avatarUrl} alt={displayName} width={128} height={128} className="rounded-2xl shadow-lg border-2 border-(--border)/20 relative z-10 object-cover" unoptimized />
			) : (
				<div className="w-32 h-32 rounded-2xl bg-(--background) border-2 border-(--border)/20 flex items-center justify-center text-(--text-muted) shadow-lg relative z-10">
					<User className="w-12 h-12" />
				</div>
			)}

			<div className="flex-1 relative z-10">
				<div className="flex flex-wrap items-center gap-3 mb-2">
					<h1 className="text-4xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{displayName}
					</h1>
					{username && <span className="text-sm font-semibold text-(--text-muted)">@{username}</span>}
					<CopyButton value={id} label={id} toastTitle={t('app.users.idCopied')} />
				</div>
				<p className="text-lg text-(--text-muted) max-w-2xl">{user?.description || t('common.noDescription')}</p>
			</div>

			<div className="flex-shrink-0 w-full md:w-auto mt-4 md:mt-0 relative z-10 flex flex-wrap items-center gap-2">
				{isOwnProfile && (
					<Button variant="primary" onClick={() => window.open(`${getEnvUrl('https://account.xernerx.com/')}?tab=profile`, '_blank')}>
						<Settings className="w-4 h-4 mr-1.5" />
						{t('app.users.editProfile')}
					</Button>
				)}
				<Button variant="secondary" onClick={handleShareProfile} title={t('app.users.shareProfile')}>
					<Share2 className="w-4 h-4 mr-1.5" />
					{t('app.users.shareProfile')}
				</Button>
			</div>
		</div>
	);
}
