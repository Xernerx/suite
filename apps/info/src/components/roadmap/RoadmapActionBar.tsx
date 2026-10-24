/** @format */
'use client';

import { useState } from 'react';
import { ThumbsUp, Bell, BellRing } from 'lucide-react';
import { useDictionary, useEnvironment, useSession, useToast, useUser } from '@xernerx/providers';

interface RoadmapActionBarProps {
	item: any;
	onUpdate: (updatedItem: any) => void;
}

export default function RoadmapActionBar({ item, onUpdate }: RoadmapActionBarProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { data: session } = useSession();
	const { user: discordUser } = useUser();
	const { toast } = useToast();

	const activeUser = discordUser || session?.user;
	const userId = (activeUser as any)?.id;

	const [busy, setBusy] = useState<'upvote' | 'watch' | null>(null);

	const upvotes: string[] = Array.isArray(item.upvotes) ? item.upvotes : [];
	const watchers: string[] = Array.isArray(item.watchers) ? item.watchers : [];

	const hasUpvoted = Boolean(userId && upvotes.includes(userId));
	const isWatching = Boolean(userId && watchers.includes(userId));

	const handleInteract = async (action: 'upvote' | 'watch') => {
		if (!userId) {
			toast({
				type: 'error',
				title: t('info.roadmap.actions.loginRequired'),
			});
			return;
		}
		setBusy(action);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/info/roadmap/${item.id}/interact`), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ action, userId }),
			});
			if (!res.ok) throw new Error('Failed to update');
			const data = await res.json();
			if (data?.data) {
				onUpdate(data.data);
			}
			if (action === 'watch') {
				toast({
					type: 'success',
					title: data.watching ? t('info.roadmap.actions.watchAdded') : t('info.roadmap.actions.watchRemoved'),
				});
			}
		} catch (err: any) {
			toast({ type: 'error', title: err.message });
		} finally {
			setBusy(null);
		}
	};

	return (
		<div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-(--border)/10 z-10">
			<button
				type="button"
				disabled={busy !== null}
				onClick={() => handleInteract('upvote')}
				className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer backdrop-blur-md ${
					hasUpvoted
						? 'bg-(--accent)/15 text-(--accent) border-(--accent)/35 shadow-[0_0_12px_color-mix(in_srgb,var(--accent)_20%,transparent)]'
						: 'bg-(--background)/60 text-(--text-muted) border-(--border)/10 hover:text-(--text) hover:border-(--accent)/30'
				}`}
			>
				<ThumbsUp size={13} />
				<span>{upvotes.length}</span>
			</button>

			{item.status !== 'released' && (
				<button
					type="button"
					disabled={busy !== null}
					onClick={() => handleInteract('watch')}
					className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer backdrop-blur-md ${
						isWatching
							? 'bg-(--accent)/15 text-(--accent) border-(--accent)/35 shadow-[0_0_12px_color-mix(in_srgb,var(--accent)_20%,transparent)]'
							: 'bg-(--background)/60 text-(--text-muted) border-(--border)/10 hover:text-(--text) hover:border-(--accent)/30'
					}`}
				>
					{isWatching ? <BellRing size={13} /> : <Bell size={13} />}
					<span>{isWatching ? t('info.roadmap.actions.watching') : t('info.roadmap.actions.notifyMe')}</span>
				</button>
			)}
		</div>
	);
}
