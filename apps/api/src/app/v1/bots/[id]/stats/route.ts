/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { database, sendWebhook } from '@xernerx/lib/server';
import { authenticateV1BotRequest, fetchDiscordBotIdentity } from '@/lib/v1BotAuth';

async function getBotMeta(BotModel: any, id: string) {
	const botDoc = await BotModel.findOne({ id }).select('name avatar').lean();
	let name = botDoc?.name;
	let avatar = botDoc?.avatar;

	if (!name || name === 'Unknown Bot' || !avatar) {
		const discordIdentity = await fetchDiscordBotIdentity(id);
		if (discordIdentity.name && (!name || name === 'Unknown Bot')) {
			name = discordIdentity.name;
		}
		if (discordIdentity.avatar && !avatar) {
			avatar = discordIdentity.avatar;
		}
		if (name || avatar) {
			await BotModel.updateOne(
				{ id },
				{
					$set: {
						...(name ? { name } : {}),
						...(avatar ? { avatar } : {}),
					},
				}
			);
		}
	}

	let avatarUrl: string | undefined = undefined;
	if (avatar) {
		avatarUrl = avatar.startsWith('http') ? avatar : `https://cdn.discordapp.com/avatars/${id}/${avatar}.${avatar.startsWith('a_') ? 'gif' : 'png'}?size=128`;
	} else {
		try {
			const defaultIndex = Number(BigInt(id) >> BigInt(22)) % 6;
			avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
		} catch {
			avatarUrl = undefined;
		}
	}

	return {
		name: name || 'your bot',
		displayName: name || 'Unknown Bot',
		avatarUrl,
	};
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id: rawId } = await params;
		const authResult = await authenticateV1BotRequest(req, rawId, { isMutation: true });
		if (authResult.error) {
			return NextResponse.json({ error: authResult.error }, { status: authResult.status });
		}

		const { botId: id, BotModel, StatModel, VoteModel, HookModel } = authResult as Required<typeof authResult>;

		if (!StatModel) {
			return NextResponse.json({ error: 'Database models not found' }, { status: 500 });
		}

		const body = await req.json().catch(() => ({}));

		const serverCount = typeof body.serverCount === 'number' ? body.serverCount : typeof body.guildCount === 'number' ? body.guildCount : 0;
		const shardCount = typeof body.shardCount === 'number' ? body.shardCount : 0;
		const userCount = typeof body.userCount === 'number' ? body.userCount : 0;

		const currentVoteCount = VoteModel ? await VoteModel.countDocuments({ botId: id }) : 0;

		await StatModel.create({
			id,
			guildCount: serverCount,
			shardCount: shardCount,
			userCount: userCount,
			voteCount: currentVoteCount,
			timestamp: new Date(),
		});

		const updateFields: any = {};
		if (typeof body.voteCount === 'number') {
			updateFields.voteCount = body.voteCount;
		}

		if (Object.keys(updateFields).length > 0) {
			await BotModel.findOneAndUpdate({ id }, { $set: updateFields });
		}

		const botMeta = await getBotMeta(BotModel, id);
		const hooks = HookModel ? await HookModel.find({ botId: id }).lean() : [];

		if (hooks?.length) {
			for (const hook of hooks) {
				if (!hook.url || !hook.events?.includes('POST stat')) continue;
				try {
					await sendWebhook({
						url: hook.url,
						embeds: [
							{
								title: 'Bot Stats Posted',
								description: `The stats for **${botMeta.name}** were just posted!\n\n**Servers:** ${serverCount}\n**Shards:** ${shardCount}`,
								color: 0x00ff00,
								footer: {
									text: botMeta.displayName,
									...(botMeta.avatarUrl ? { icon_url: botMeta.avatarUrl } : {}),
								},
								timestamp: new Date().toISOString(),
							},
						],
					});
				} catch (e) {
					console.error('Failed to trigger bot webhook for stat post', e);
				}
			}
		}

		return NextResponse.json({ message: 'Stats updated successfully' }, { status: 201 });
	} catch (error: any) {
		console.error('Failed to process bot stats POST:', error);
		return NextResponse.json({ error: 'Internal Server Error', message: error.message, stack: error.stack }, { status: 500 });
	}
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
	return POST(req, context);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const db = await database('xernerx');
		const StatModel = (db.models.bots as any).Stat;

		if (!StatModel) return NextResponse.json({ error: 'Database model not found' }, { status: 500 });

		const stats = await StatModel.find({ id }).sort({ _id: -1 }).limit(100);
		return NextResponse.json(stats);
	} catch (error: any) {
		console.error('Failed to GET bot stats:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id: rawId } = await params;
		const authResult = await authenticateV1BotRequest(req, rawId, { isMutation: true });
		if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

		const { botId: id, hasFullAccess, StatModel, BotModel, HookModel, VoteModel } = authResult as Required<typeof authResult>;
		if (!hasFullAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

		const statId = req.nextUrl.searchParams.get('statId');
		const body = await req.json().catch(() => ({}));

		delete body._id;
		delete body.id;
		delete body.timestamp;

		if (typeof body.serverCount === 'number' && body.guildCount === undefined) {
			body.guildCount = body.serverCount;
		}

		if (statId) {
			await StatModel.updateOne({ _id: statId, id }, { $set: body });
		} else {
			const latest = await StatModel.findOne({ id }).sort({ _id: -1 });
			if (latest) {
				await StatModel.updateOne({ _id: latest._id }, { $set: body });
			} else {
				const currentVoteCount = VoteModel ? await VoteModel.countDocuments({ botId: id }) : 0;
				await StatModel.create({
					id,
					guildCount: typeof body.guildCount === 'number' ? body.guildCount : 0,
					shardCount: typeof body.shardCount === 'number' ? body.shardCount : 0,
					userCount: typeof body.userCount === 'number' ? body.userCount : 0,
					voteCount: currentVoteCount,
					timestamp: new Date(),
				});
			}
		}

		const botMeta = await getBotMeta(BotModel, id);
		const hooks = HookModel ? await HookModel.find({ botId: id }).lean() : [];

		if (hooks?.length) {
			for (const hook of hooks) {
				if (!hook.url || !hook.events?.includes('PATCH stat')) continue;
				try {
					await sendWebhook({
						url: hook.url,
						embeds: [
							{
								title: 'Bot Stats Updated',
								description: `The stats for **${botMeta.name}** were just updated!`,
								color: 0x00a0ff,
								footer: {
									text: botMeta.displayName,
									...(botMeta.avatarUrl ? { icon_url: botMeta.avatarUrl } : {}),
								},
								timestamp: new Date().toISOString(),
							},
						],
					});
				} catch (e) {
					console.error('Failed to trigger bot webhook for stat update', e);
				}
			}
		}

		return NextResponse.json({ message: 'Stats updated successfully' });
	} catch (error: any) {
		console.error('Failed to PATCH bot stats:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id: rawId } = await params;
		const authResult = await authenticateV1BotRequest(req, rawId, { isMutation: true });
		if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

		const { botId: id, hasFullAccess, StatModel, BotModel, HookModel } = authResult as Required<typeof authResult>;
		if (!hasFullAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

		const statId = req.nextUrl.searchParams.get('statId');

		if (statId) {
			await StatModel.deleteOne({ _id: statId, id });
		} else {
			await StatModel.deleteMany({ id });
		}

		const botMeta = await getBotMeta(BotModel, id);
		const hooks = HookModel ? await HookModel.find({ botId: id }).lean() : [];

		if (hooks?.length) {
			for (const hook of hooks) {
				if (!hook.url || !hook.events?.includes('DELETE stat')) continue;
				try {
					await sendWebhook({
						url: hook.url,
						embeds: [
							{
								title: 'Bot Stats Deleted',
								description: statId ? `A stat record was deleted for **${botMeta.name}**.` : `All stat records were deleted for **${botMeta.name}**.`,
								color: 0xff0000,
								footer: {
									text: botMeta.displayName,
									...(botMeta.avatarUrl ? { icon_url: botMeta.avatarUrl } : {}),
								},
								timestamp: new Date().toISOString(),
							},
						],
					});
				} catch (e) {
					console.error('Failed to trigger bot webhook for stat deletion', e);
				}
			}
		}

		return NextResponse.json({ message: 'Stats deleted successfully' });
	} catch (error: any) {
		console.error('Failed to DELETE bot stats:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
