/** @format */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

interface AchievementDefinition {
	id: string;
	name: string;
	rewardCredits: number;
	badge: string;
	target: number;
	category: 'streak' | 'votes' | 'ecosystem';
}

const ACHIEVEMENTS: AchievementDefinition[] = [
	{ id: 'streak_7', name: '7-Day Streak Master', rewardCredits: 150, badge: 'streak_master_7', target: 7, category: 'streak' },
	{ id: 'streak_30', name: '30-Day Streak Veteran', rewardCredits: 500, badge: 'streak_master_30', target: 30, category: 'streak' },
	{ id: 'streak_100', name: '100-Day Streak Legend', rewardCredits: 2000, badge: 'streak_master_100', target: 100, category: 'streak' },
	{ id: 'voter_10', name: 'Community Voter (10 Votes)', rewardCredits: 150, badge: 'top_voter_10', target: 10, category: 'votes' },
	{ id: 'voter_50', name: 'Super Supporter (50 Votes)', rewardCredits: 500, badge: 'top_voter_50', target: 50, category: 'votes' },
	{ id: 'ecosystem_builder', name: 'Ecosystem Builder', rewardCredits: 500, badge: 'ecosystem_builder', target: 1, category: 'ecosystem' },
];

async function computeMetrics(models: any, userId: string) {
	const CreditModel = (models.users as any).Credit;
	const BotVoteModel = (models.bots as any).Vote;
	const GuildVoteModel = (models.guilds as any).Vote;
	const BotModel = (models.bots as any).Bot;
	const GuildModel = (models.guilds as any).Guild;

	const [creditDoc, botVotes, guildVotes, publicBots, publicGuilds] = await Promise.all([
		CreditModel.findOne({ ownerId: userId })
			.lean()
			.catch(() => null),
		BotVoteModel.countDocuments({ userId }).catch(() => 0),
		GuildVoteModel.countDocuments({ userId }).catch(() => 0),
		BotModel.countDocuments({ owners: userId, $or: [{ privacy: 'public' }, { verified: true }] }).catch(() => 0),
		GuildModel.countDocuments({ owner: userId, $or: [{ privacy: 'public' }, { verified: true }] }).catch(() => 0),
	]);

	const streak = Number((creditDoc as any)?.streak) || 0;
	const totalVotes = (Number(botVotes) || 0) + (Number(guildVotes) || 0);
	const ecosystemCount = (Number(publicBots) || 0) + (Number(publicGuilds) || 0);
	const claimedAchievements: string[] = Array.isArray((creditDoc as any)?.claimedAchievements) ? (creditDoc as any).claimedAchievements : [];

	const items = ACHIEVEMENTS.map((def) => {
		const progress = def.category === 'streak' ? streak : def.category === 'votes' ? totalVotes : ecosystemCount;
		const unlocked = progress >= def.target;
		const claimed = claimedAchievements.includes(def.id);
		return {
			...def,
			progress: Math.min(progress, def.target),
			rawProgress: progress,
			unlocked,
			claimed,
		};
	});

	return {
		creditDoc,
		streak,
		totalVotes,
		ecosystemCount,
		claimedAchievements,
		achievements: items,
	};
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const { models } = await database('xernerx');
		const data = await computeMetrics(models, id);

		return NextResponse.json({
			achievements: data.achievements,
			referredBy: (data.creditDoc as any)?.referredBy || null,
			referralBonusClaimed: Boolean((data.creditDoc as any)?.referralBonusClaimed),
		});
	} catch (error: any) {
		return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const { achievementId } = await req.json().catch(() => ({}));
		if (!achievementId) {
			return NextResponse.json({ error: 'achievementId is required' }, { status: 400 });
		}

		const { models } = await database('xernerx');
		const data = await computeMetrics(models, id);
		const target = data.achievements.find((a) => a.id === achievementId);

		if (!target) {
			return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
		}
		if (!target.unlocked) {
			return NextResponse.json({ error: 'Achievement not unlocked yet' }, { status: 400 });
		}
		if (target.claimed) {
			return NextResponse.json({ error: 'Achievement already claimed' }, { status: 400 });
		}

		const CreditModel = (models.users as any).Credit;
		const updatedCredit = await CreditModel.findOneAndUpdate(
			{ ownerId: id },
			{
				$inc: { balance: target.rewardCredits },
				$addToSet: {
					claimedAchievements: target.id,
					unlockedBadges: target.badge,
					activeBadges: target.badge,
				},
				$push: {
					transactions: {
						id: crypto.randomUUID(),
						type: 'achievement',
						amount: target.rewardCredits,
						multiplierPercent: 100,
						itemId: target.id,
						itemName: `Achievement Unlocked — ${target.name}`,
						createdAt: new Date(),
					},
				},
			},
			{ upsert: true, returnDocument: 'after' }
		).lean();

		const nextData = await computeMetrics(models, id);

		return NextResponse.json({
			success: true,
			rewardCredits: target.rewardCredits,
			badge: target.badge,
			credits: updatedCredit,
			achievements: nextData.achievements,
		});
	} catch (error: any) {
		return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
	}
}
