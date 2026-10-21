/** @format */
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';

export interface BotProfilePreviewProps {
	botId: string;
	getEnvUrl: (url: string) => string;
	onClear?: () => void;
}

export function BotProfilePreview({ botId, getEnvUrl, onClear }: BotProfilePreviewProps) {
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
					setProfile(data && data.id ? data : null);
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

	const clearBtn = onClear ? (
		<button
			type="button"
			onClick={onClear}
			aria-label="Clear"
			className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full hover:bg-(--accent-red)/10 text-(--text-muted) hover:text-(--accent-red) transition-colors cursor-pointer"
		>
			<X size={10} />
		</button>
	) : null;

	if (loading) {
		return (
			<div className="flex items-center gap-1.5 rounded-xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md pl-2 pr-1.5 py-1 text-xs text-(--text) shadow-sm w-max">
				<Loading variant="small" />
				<span className="font-medium truncate max-w-[120px]">{t('admin.tokens.card.botApplication')}</span>
				{clearBtn}
			</div>
		);
	}

	if (!profile) {
		return (
			<div className="flex items-center gap-1.5 rounded-xl border border-(--accent-red)/10 bg-(--accent-red)/5 backdrop-blur-md pl-2 pr-1.5 py-1 text-xs text-(--accent-red) shadow-sm w-max">
				<span className="font-medium truncate max-w-[120px]">{t('admin.tokens.card.apiConnection')}</span>
				{clearBtn}
			</div>
		);
	}

	const avatarUrl = profile.avatarUrl || (profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png?size=64` : null);
	const name = profile.global_name || profile.username || t('admin.tokens.unknownBot');

	return (
		<div className="flex items-center gap-1.5 rounded-xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md pl-2 pr-1.5 py-1 text-xs text-(--text) shadow-sm w-max">
			{avatarUrl ? (
				<Image src={avatarUrl} alt={name} width={16} height={16} unoptimized className="h-4 w-4 rounded-full object-cover shrink-0" />
			) : (
				<div className="flex h-4 w-4 items-center justify-center rounded-full bg-(--foreground) shrink-0">
					<span className="text-[8px] font-bold text-(--text-muted)">{name.charAt(0)}</span>
				</div>
			)}
			<span className="font-medium truncate max-w-[120px]">{name}</span>
			{clearBtn}
		</div>
	);
}

export default BotProfilePreview;
