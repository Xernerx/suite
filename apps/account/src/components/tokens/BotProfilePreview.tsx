/** @format */
'use client';

import { useEffect, useState } from 'react';
import { useDictionary } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';

interface BotProfilePreviewProps {
	botId: string;
	getEnvUrl: (url: string) => string;
}

export default function BotProfilePreview({ botId, getEnvUrl }: BotProfilePreviewProps) {
	const { t } = useDictionary();
	const [profile, setProfile] = useState<any>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!botId || botId.length < 15) {
			setProfile(null);
			return;
		}
		let isMounted = true;
		setLoading(true);
		fetch(getEnvUrl(`https://api.xernerx.com/core/users/${botId}/discord`))
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (isMounted) {
					if (data && data.id) {
						setProfile(data);
					} else {
						setProfile(null);
					}
					setLoading(false);
				}
			})
			.catch(() => {
				if (isMounted) {
					setProfile(null);
					setLoading(false);
				}
			});
		return () => {
			isMounted = false;
		};
	}, [botId, getEnvUrl]);

	if (!botId || botId.length < 15) return null;

	if (loading) {
		return (
			<div className="flex items-center gap-1.5 rounded-xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md pl-2 pr-2 py-1 text-xs text-(--text) shadow-sm w-max">
				<Loading variant="small" />
				<span className="font-medium truncate max-w-[120px]">{t('account.common.description')}</span>
			</div>
		);
	}

	if (!profile) {
		return (
			<div className="flex items-center gap-1.5 rounded-xl border border-red-500/10 bg-red-500/5 backdrop-blur-md pl-2 pr-2 py-1 text-xs text-red-500 shadow-sm w-max">
				<span className="font-medium truncate max-w-[120px]">{t('account.common.description2')}</span>
			</div>
		);
	}

	const avatarUrl = profile.avatarUrl || (profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png?size=64` : null);
	const name = profile.global_name || profile.username || t('account.tokens.preview.unknownBot');

	return (
		<div className="flex items-center gap-1.5 rounded-xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md pl-2 pr-2 py-1 text-xs text-(--text) shadow-sm w-max">
			{avatarUrl ? (
				<img src={avatarUrl} alt={name} className="h-4 w-4 rounded-full object-cover shrink-0" />
			) : (
				<div className="flex h-4 w-4 items-center justify-center rounded-full bg-(--foreground) shrink-0">
					<span className="text-[8px] font-bold text-(--text-muted)">{name.charAt(0)}</span>
				</div>
			)}
			<span className="font-medium truncate max-w-[120px]">{name}</span>
		</div>
	);
}
