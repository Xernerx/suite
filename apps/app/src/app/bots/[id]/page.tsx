/** @format */

import BotPageClient, { type BotProfile } from '@/components/bots/BotPageClient';
import { getBotSeoData } from '@/lib/profileMetadata';

export default async function BotPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const seo = await getBotSeoData(id);

	const initialBot: BotProfile | null = seo
		? {
				id: seo.id,
				name: seo.name,
				vanitySlug: seo.slug,
				verified: seo.verified,
				description: seo.description,
				info: seo.info,
				tags: seo.tags,
				commands: seo.commands,
				guildCount: seo.guildCount,
				userCount: seo.userCount,
				voteCount: seo.voteCount,
			}
		: null;

	return <BotPageClient id={id} initialBot={initialBot} />;
}
