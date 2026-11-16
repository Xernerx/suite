/** @format */

import 'server-only';
import type { Metadata } from 'next';
import { database } from '@xernerx/lib/server';
import { buildFallbackMetadata, fetchDiscordUser, resolveEnvUrls, resolveOfficialBotDefault, type LookupOutcome } from './profileMetadataShared';

export interface BotSeoData {
	id: string;
	slug: string;
	name: string;
	verified: boolean;
	description: string;
	info: string;
	tags: string[];
	commands: Array<{ name: string; description: string }>;
	guildCount: number;
	userCount: number;
	voteCount: number;
	canonicalUrl: string;
	jsonLd: Record<string, any>;
}

function buildBotSeoObject(params: {
	botId: string;
	slug: string;
	name: string;
	verified: boolean;
	description: string;
	info: string;
	tags: string[];
	commands: Array<{ name: string; description: string }>;
	guildCount: number;
	userCount: number;
	voteCount: number;
	reviewCount: number;
	avgRating: number;
	apiBase: string;
	appBase: string;
}): BotSeoData {
	const canonicalUrl = `${params.appBase}/bots/${encodeURIComponent(params.slug)}`;
	const cardImageUrl = `${params.apiBase}/core/bots/${encodeURIComponent(params.botId)}?type=png`;
	const hasBotWord = /\bbot\b/i.test(params.name);
	const schemaName = hasBotWord ? params.name : `${params.name} Discord Bot`;

	const jsonLd: Record<string, any> = {
		'@context': 'https://schema.org',
		'@type': 'SoftwareApplication',
		'@id': `${canonicalUrl}#bot`,
		name: schemaName,
		alternateName: Array.from(new Set([params.name, `${params.name} Bot`, `${params.name} Discord Bot`])),
		applicationCategory: 'UtilitiesApplication',
		operatingSystem: 'Discord, Web',
		url: canonicalUrl,
		image: cardImageUrl,
		description: params.description,
		keywords: [params.name, schemaName, 'Discord Bot', ...params.tags].join(', '),
		author: {
			'@type': 'Organization',
			name: 'Xernerx Studios',
			url: 'https://www.xernerx.com',
		},
		offers: {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'USD',
		},
		...(params.reviewCount > 0
			? {
					aggregateRating: {
						'@type': 'AggregateRating',
						ratingValue: params.avgRating,
						reviewCount: params.reviewCount,
						bestRating: 5,
						worstRating: 1,
					},
				}
			: {}),
	};

	return {
		id: params.botId,
		slug: params.slug,
		name: params.name,
		verified: params.verified,
		description: params.description,
		info: params.info,
		tags: params.tags,
		commands: params.commands,
		guildCount: params.guildCount,
		userCount: params.userCount,
		voteCount: params.voteCount,
		canonicalUrl,
		jsonLd,
	};
}

async function resolveBotSeoOutcome(id: string): Promise<LookupOutcome<BotSeoData>> {
	const { apiBase, appBase } = await resolveEnvUrls();
	const official = resolveOfficialBotDefault(id);

	// Path 1: Direct MongoDB lookup when MONGO_XERNERX is available on this runtime
	if (process.env.MONGO_XERNERX) {
		try {
			const db = await database('xernerx');
			const BotModel = (db.models.bots as any).Bot;
			const StatModel = (db.models.bots as any).Stat;
			const VoteModel = (db.models.bots as any).Vote;
			const CommandModel = (db.models.bots as any).Command;
			const ReviewModel = (db.models.bots as any).Review;

			const queryOr: any[] = [{ id }, { vanitySlug: id.toLowerCase() }];
			if (official) {
				queryOr.push({ id: official.id }, { vanitySlug: official.slug });
			}

			const bot = await BotModel.findOne({ $or: queryOr }).lean();
			if ((!bot || bot.privacy === 'private') && !official) {
				return { status: 'not_found' };
			}

			const botId = String(bot?.id || official?.id || id);
			const [latestStat, voteCount, discordUser, syncedCmds, reviews] = await Promise.all([
				StatModel
					? StatModel.findOne({ id: botId })
							.sort({ timestamp: -1 })
							.lean()
							.catch(() => null)
					: null,
				VoteModel ? VoteModel.countDocuments({ botId }).catch(() => bot?.voteCount || 0) : bot?.voteCount || 0,
				fetchDiscordUser(botId),
				CommandModel
					? CommandModel.find({ botId })
							.sort({ type: 1, name: 1 })
							.limit(40)
							.lean()
							.catch(() => [])
					: [],
				ReviewModel
					? ReviewModel.find({ botId })
							.select('rating')
							.lean()
							.catch(() => [])
					: [],
			]);

			const name = discordUser?.global_name || discordUser?.username || bot?.discordCache?.globalName || bot?.discordCache?.username || bot?.name || official?.name || 'Discord Bot';
			const verified = Boolean(bot?.verified ?? Boolean(official));
			const slug = String(bot?.vanitySlug || official?.slug || botId);
			const description = bot?.description || official?.description || `Discover ${name} on Xernerx Studios.`;
			const info = bot?.info || official?.info || description;
			const tags: string[] = Array.isArray(bot?.tags) && bot.tags.length > 0 ? bot.tags.map(String) : official?.tags || [];

			const rawCommands = Array.isArray(bot?.commands) && bot.commands.length > 0 ? bot.commands : syncedCmds;
			const commands: Array<{ name: string; description: string }> = (rawCommands || [])
				.map((c: any) => ({
					name: String(c?.name || c?.body?.name || '').trim(),
					description: String(c?.description || c?.body?.description || '').trim(),
				}))
				.filter((c: { name: string; description: string }) => Boolean(c.name));

			const reviewList = Array.isArray(reviews) ? reviews : [];
			const reviewCount = reviewList.length;
			const avgRating = reviewCount > 0 ? Number((reviewList.reduce((acc: number, r: any) => acc + (Number(r.rating) || 5), 0) / reviewCount).toFixed(1)) : 0;

			return {
				status: 'ok',
				data: buildBotSeoObject({
					botId,
					slug,
					name,
					verified,
					description,
					info,
					tags,
					commands,
					guildCount: Number(latestStat?.guildCount ?? latestStat?.servers ?? 0),
					userCount: Number(latestStat?.userCount ?? latestStat?.users ?? 0),
					voteCount: Number(voteCount ?? bot?.voteCount ?? 0),
					reviewCount,
					avgRating,
					apiBase,
					appBase,
				}),
			};
		} catch {
			// Fall through to HTTP API lookup if direct DB connection fails
		}
	}

	// Path 2: Query api.xernerx.com (canonical backend gateway with DB & Discord token access)
	try {
		const res = await fetch(`${apiBase}/secure/bots/${encodeURIComponent(id)}/profile`, {
			headers: { Origin: appBase },
			next: { revalidate: 300 },
		});

		if (res.status === 404) {
			if (official) {
				return {
					status: 'ok',
					data: buildBotSeoObject({
						botId: official.id,
						slug: official.slug,
						name: official.name,
						verified: true,
						description: official.description,
						info: official.info,
						tags: official.tags,
						commands: [],
						guildCount: 0,
						userCount: 0,
						voteCount: 0,
						reviewCount: 0,
						avgRating: 0,
						apiBase,
						appBase,
					}),
				};
			}
			return { status: 'not_found' };
		}

		if (res.ok) {
			const bot = await res.json();
			if (bot?.privacy === 'private' && !official) {
				return { status: 'not_found' };
			}

			const botId = String(bot?.id || official?.id || id);
			const name = bot?.discord?.global_name || bot?.discord?.username || bot?.discordCache?.globalName || bot?.discordCache?.username || bot?.name || official?.name || 'Discord Bot';
			const verified = Boolean(bot?.verified ?? Boolean(official));
			const slug = String(bot?.vanitySlug || official?.slug || botId);
			const description = bot?.description || official?.description || `Discover ${name} on Xernerx Studios.`;
			const info = bot?.info || official?.info || description;
			const tags: string[] = Array.isArray(bot?.tags) && bot.tags.length > 0 ? bot.tags.map(String) : official?.tags || [];
			const commands: Array<{ name: string; description: string }> = (Array.isArray(bot?.commands) ? bot.commands : [])
				.map((c: any) => ({
					name: String(c?.name || c?.body?.name || '').trim(),
					description: String(c?.description || c?.body?.description || '').trim(),
				}))
				.filter((c: { name: string; description: string }) => Boolean(c.name))
				.slice(0, 40);

			return {
				status: 'ok',
				data: buildBotSeoObject({
					botId,
					slug,
					name,
					verified,
					description,
					info,
					tags,
					commands,
					guildCount: Number(bot?.guildCount ?? bot?.latestStat?.guildCount ?? 0),
					userCount: Number(bot?.userCount ?? bot?.latestStat?.userCount ?? 0),
					voteCount: Number(bot?.voteCount ?? 0),
					reviewCount: Number(bot?.reviewSummary?.count ?? 0),
					avgRating: Number(bot?.reviewSummary?.average ?? 0),
					apiBase,
					appBase,
				}),
			};
		}
	} catch {
		// Fall through to /core/bots/[id] or official fallback
	}

	// Path 3: Public /core/bots/[id]?type=json fallback
	try {
		const coreRes = await fetch(`${apiBase}/core/bots/${encodeURIComponent(id)}?type=json`, {
			next: { revalidate: 300 },
		});
		if (coreRes.status === 404 && !official) {
			return { status: 'not_found' };
		}
		if (coreRes.ok) {
			const coreBot = await coreRes.json();
			const botId = String(coreBot?.id || official?.id || id);
			const name = coreBot?.name || official?.name || 'Discord Bot';
			const slug = String(coreBot?.vanitySlug || official?.slug || botId);
			const description = coreBot?.description || official?.description || `Discover ${name} on Xernerx Studios.`;
			const info = coreBot?.info || official?.info || description;
			const tags: string[] = Array.isArray(coreBot?.tags) && coreBot.tags.length > 0 ? coreBot.tags.map(String) : official?.tags || [];

			return {
				status: 'ok',
				data: buildBotSeoObject({
					botId,
					slug,
					name,
					verified: Boolean(coreBot?.verified ?? Boolean(official)),
					description,
					info,
					tags,
					commands: [],
					guildCount: Number(coreBot?.guildCount ?? 0),
					userCount: Number(coreBot?.userCount ?? 0),
					voteCount: Number(coreBot?.voteCount ?? 0),
					reviewCount: 0,
					avgRating: 0,
					apiBase,
					appBase,
				}),
			};
		}
	} catch {
		// Fall through
	}

	if (official) {
		return {
			status: 'ok',
			data: buildBotSeoObject({
				botId: official.id,
				slug: official.slug,
				name: official.name,
				verified: true,
				description: official.description,
				info: official.info,
				tags: official.tags,
				commands: [],
				guildCount: 0,
				userCount: 0,
				voteCount: 0,
				reviewCount: 0,
				avgRating: 0,
				apiBase,
				appBase,
			}),
		};
	}

	return { status: 'error' };
}

export async function getBotSeoData(id: string): Promise<BotSeoData | null> {
	const outcome = await resolveBotSeoOutcome(id);
	return outcome.status === 'ok' ? outcome.data : null;
}

export async function buildBotMetadata(id: string): Promise<Metadata> {
	const { apiBase, appBase } = await resolveEnvUrls();
	const canonicalPath = `/bots/${id}`;

	const outcome = await resolveBotSeoOutcome(id);
	if (outcome.status === 'not_found') {
		return buildFallbackMetadata(
			'Discord Bot Not Found',
			'This Discord bot profile is private or does not exist on the Xernerx Studios ecosystem directory. Explore public bots and commands.',
			canonicalPath,
			appBase,
			true
		);
	}
	if (outcome.status === 'error') {
		return buildFallbackMetadata(
			'Discord Bot Profile & Commands',
			'View Discord bot statistics, slash commands, server count metrics, and community reviews on the Xernerx Studios bot directory.',
			canonicalPath,
			appBase
		);
	}

	const seo = outcome.data;
	const parts: string[] = [`🌐 Servers: ${Number(seo.guildCount).toLocaleString()}`, `👥 Users: ${Number(seo.userCount).toLocaleString()}`, `🔼 Votes: ${Number(seo.voteCount).toLocaleString()}`];
	const statsDescription = parts.join(' • ');

	const hasBotWord = /\bbot\b/i.test(seo.name);
	const pageTitle = `${seo.name}${seo.verified ? ' ✓' : ''} — ${hasBotWord ? 'Discord App & Commands' : 'Discord Bot'}`;
	const ogTitle = hasBotWord ? `${seo.name}${seo.verified ? ' ✓' : ''}` : `${seo.name}${seo.verified ? ' ✓' : ''} — Discord Bot`;
	const baseDescription = seo.description || seo.info || `Check out ${seo.name} on Xernerx Studios!`;
	const ogDescription = statsDescription ? `${baseDescription}\n\n${statsDescription}` : baseDescription;
	const resolvedCanonicalPath = `/bots/${seo.slug}`;
	const currentUrl = `${appBase}${resolvedCanonicalPath}`;
	const cardImageUrl = `${apiBase}/core/bots/${encodeURIComponent(seo.id)}?type=png`;

	return {
		title: pageTitle,
		description: baseDescription,
		keywords: [seo.name, `${seo.name} Discord Bot`, `${seo.name} commands`, 'Discord Bot', 'Xernerx Studios', ...seo.tags],
		alternates: { canonical: resolvedCanonicalPath },
		openGraph: {
			siteName: 'Xernerx Studios',
			type: 'website',
			title: ogTitle,
			description: ogDescription,
			url: currentUrl,
			images: [
				{
					url: cardImageUrl,
					width: 840,
					height: 360,
					alt: seo.name,
				},
			],
		},
		twitter: {
			card: 'summary_large_image',
			site: '@XernerxStudios',
			creator: '@XernerxStudios',
			title: ogTitle,
			description: ogDescription,
			images: [cardImageUrl],
		},
	};
}
