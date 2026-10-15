/** @format */
'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';

interface BotProfilePreviewProps {
	botId: string;
	getEnvUrl: (url: string) => string;
	onClear: () => void;
}

export function BotProfilePreview({ botId, getEnvUrl, onClear }: BotProfilePreviewProps) {
	const [profile, setProfile] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const { t } = useDictionary();

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
			<div className="flex items-center gap-1.5 rounded-xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md pl-2 pr-1.5 py-1 text-xs text-(--text) shadow-sm">
				<Loading variant="small" />
				<span className="font-medium truncate max-w-[120px]">{t('admin.tokens.card.botApplication')}</span>
				<button
					type="button"
					onClick={onClear}
					className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full hover:bg-red-500/10 text-(--text-muted) hover:text-red-500 transition-colors"
				>
					<X size={10} />
				</button>
			</div>
		);
	}
	if (!profile) {
		return (
			<div className="flex items-center gap-1.5 rounded-xl border border-red-500/10 bg-red-500/5 backdrop-blur-md pl-2 pr-1.5 py-1 text-xs text-red-500 shadow-sm">
				<span className="font-medium truncate max-w-[120px]">{t('admin.tokens.card.apiConnection')}</span>
				<button type="button" onClick={onClear} className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full hover:bg-red-500/10 text-red-500 hover:text-red-500 transition-colors">
					<X size={10} />
				</button>
			</div>
		);
	}
	const avatarUrl = profile.avatarUrl || (profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png?size=64` : null);
	const name = profile.global_name || profile.username || t('admin.tokens.unknownBot');
	return (
		<div className="flex items-center gap-1.5 rounded-xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md pl-2 pr-1.5 py-1 text-xs text-(--text) shadow-sm">
			{avatarUrl ? (
				<img src={avatarUrl} alt={name} className="h-4 w-4 rounded-full object-cover shrink-0" />
			) : (
				<div className="flex h-4 w-4 items-center justify-center rounded-full bg-(--foreground) shrink-0">
					<span className="text-[8px] font-bold text-(--text-muted)">{name.charAt(0)}</span>
				</div>
			)}
			<span className="font-medium truncate max-w-[120px]">{name}</span>
			<button
				type="button"
				onClick={onClear}
				className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full hover:bg-red-500/10 text-(--text-muted) hover:text-red-500 transition-colors"
			>
				<X size={10} />
			</button>
		</div>
	);
}
