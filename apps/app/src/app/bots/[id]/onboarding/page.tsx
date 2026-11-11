/** @format */
'use client';

import { Loading } from '@xernerx/feedback';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, use, useEffect, useState } from 'react';
import BotOnboardingFlow from '@/components/bots/BotOnboardingFlow';

function BotOnboardingContent({ id }: { id: string }) {
	const { getEnvUrl, isReady } = useEnvironment();
	const { t } = useDictionary();
	const router = useRouter();
	const searchParams = useSearchParams();

	const [bot, setBot] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	const guildId = searchParams.get('guild_id');
	const permissions = searchParams.get('permissions');
	const forceTourParam = searchParams.get('tour') === '1';

	useEffect(() => {
		if (!isReady) return;
		let cancelled = false;

		const fetchBot = async () => {
			setLoading(true);
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${id}/profile`), { credentials: 'include' });
				if (!res.ok) {
					if (!cancelled) router.replace(`/bots/${id}?skipOnboarding=1`);
					return;
				}
				const botData = await res.json();
				if (cancelled) return;

				const targetSnowflake = botData.id || id;
				if (!botData.discord || (!botData.discord.username && !botData.discord.global_name)) {
					try {
						const discordRes = await fetch(getEnvUrl(`https://api.xernerx.com/core/users/${targetSnowflake}/discord`));
						if (discordRes.ok) {
							botData.discord = await discordRes.json();
						}
					} catch {}
				}

				if (Array.isArray(botData.owners) && botData.owners.length > 0 && (!botData.ownersData || botData.ownersData.length === 0)) {
					const ownersData = await Promise.all(
						botData.owners.map(async (ownerId: string) => {
							try {
								const oRes = await fetch(getEnvUrl(`https://api.xernerx.com/core/users/${ownerId}/discord`));
								if (oRes.ok) return await oRes.json();
							} catch {}
							return null;
						})
					);
					botData.ownersData = ownersData.filter(Boolean);
				}

				const displayName = botData.discord?.global_name || botData.discord?.username || botData.name || id;
				document.title = `Xernerx App | ${t('app.bots.onboarding.pageTitle', { name: displayName })}`;
				setBot(botData);
			} catch {
				if (!cancelled) router.replace(`/bots/${id}?skipOnboarding=1`);
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		fetchBot();
		return () => {
			cancelled = true;
		};
	}, [id, isReady, getEnvUrl, router, t]);

	if (loading || !bot) {
		return (
			<div className="flex-1 flex items-center justify-center min-h-screen">
				<Loading />
			</div>
		);
	}

	return <BotOnboardingFlow bot={bot} setBot={setBot} id={bot.vanitySlug || bot.id || id} initialGuildId={guildId} initialPermissions={permissions} initialForceTour={forceTourParam} />;
}

export default function BotOnboardingPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = use(params);
	return (
		<Suspense
			fallback={
				<div className="flex-1 flex items-center justify-center min-h-screen">
					<Loading />
				</div>
			}
		>
			<BotOnboardingContent id={id} />
		</Suspense>
	);
}
