/** @format */

import { database } from '@xernerx/lib/core';
import { EventBuilder } from '@xernerx/framework';
import { Interaction } from 'discord.js';
import { buildBotStatsMessage, type StatsTimeframe } from '../commands/slash/bot.js';
import { buildServerStatsMessage } from '../commands/slash/server.js';
import { buildLeaderboardMessage, type LeaderboardCategory } from '../commands/slash/leaderboard.js';
import { buildStoreMessage, type StoreCategoryTab } from '../commands/slash/store.js';

export default class BotInteractionCreateEvent extends EventBuilder {
	constructor() {
		super('interactionCreateAutocomplete', {
			name: 'interactionCreate',
			emitter: 'client',
			once: false,
		});
	}

	override async run(interaction: Interaction) {
		if (interaction.isAutocomplete()) {
			await (interaction.client as any).emit('slashCommandInteraction', interaction);
			return;
		}

		if (!interaction.isButton()) return;

		if (interaction.customId.startsWith('bot_stats:')) {
			try {
				const [, botId, rawTf] = interaction.customId.split(':');
				const timeframe = (['24h', '7d', '30d', '1y', 'all'].includes(rawTf) ? rawTf : '24h') as StatsTimeframe;

				await interaction.deferUpdate();

				const db = await database('xernerx');
				const BotModel = (db.models.bots as any).Bot;
				const bot = await BotModel.findOne({ id: botId }).lean();
				if (!bot) return;
				const isOwner = Array.isArray(bot.owners) && bot.owners.map(String).includes(interaction.user.id);
				if (bot.privacy === 'private' && !isOwner) return;

				const payload = await buildBotStatsMessage(interaction.client, bot, timeframe, interaction.user.id);
				await interaction.editReply(payload);
			} catch (error) {
				console.error('Error handling bot_stats timeframe button:', error);
			}
			return;
		}

		if (interaction.customId.startsWith('server_stats:')) {
			try {
				const [, guildId, rawTf] = interaction.customId.split(':');
				const timeframe = (['24h', '7d', '30d', '1y', 'all'].includes(rawTf) ? rawTf : '24h') as StatsTimeframe;

				await interaction.deferUpdate();

				const db = await database('xernerx');
				const GuildModel = (db.models.guilds as any).Guild;
				const guildDoc = await GuildModel.findOne({ id: guildId }).lean();
				if (!guildDoc) return;
				const isOwner = String(guildDoc.owner || '') === interaction.user.id;
				if (guildDoc.privacy === 'private' && !isOwner) return;

				const payload = await buildServerStatsMessage(interaction.client, guildDoc, timeframe, interaction.user.id);
				await interaction.editReply(payload);
			} catch (error) {
				console.error('Error handling server_stats timeframe button:', error);
			}
			return;
		}

		if (interaction.customId.startsWith('leaderboard:')) {
			try {
				const [, rawCat] = interaction.customId.split(':');
				const category: LeaderboardCategory = rawCat === 'servers' || rawCat === 'streaks' ? rawCat : 'bots';

				await interaction.deferUpdate();

				const payload = await buildLeaderboardMessage(interaction.client, category, interaction.user.id);
				await interaction.editReply(payload);
			} catch (error) {
				console.error('Error handling leaderboard category button:', error);
			}
			return;
		}

		if (interaction.customId.startsWith('store:')) {
			try {
				const [, rawTab] = interaction.customId.split(':');
				const tab: StoreCategoryTab = rawTab === 'perks' || rawTab === 'packs' ? rawTab : 'subscriptions';

				await interaction.deferUpdate();

				const payload = await buildStoreMessage(interaction.client, tab, interaction.user.id);
				await interaction.editReply(payload);
			} catch (error) {
				console.error('Error handling store category button:', error);
			}
		}
	}
}
