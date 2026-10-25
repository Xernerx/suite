/** @format */

import { EventBuilder } from '@xernerx/framework';
import { Interaction } from 'discord.js';
import { buildStatusMessage } from '../commands/slash/status.js';
import { buildRoadmapOverviewMessage, type RoadmapFilterTab } from '../commands/slash/roadmap.js';
import { buildFaqOverviewMessage, type FaqCategoryTab } from '../commands/slash/faq.js';
import { buildDocsOverviewMessage, type DocsSectionTab } from '../commands/slash/docs.js';
import { buildIssuesOverviewMessage, type IssuesFilterTab } from '../commands/slash/issues.js';
import { buildSuggestionsOverviewMessage, type SuggestionsFilterTab } from '../commands/slash/suggestions.js';
import { handleSupportInteraction } from '../lib/supportTickets.js';

export default class AppInteractionCreateEvent extends EventBuilder {
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

		if (process.env.ENVIRONMENT?.toUpperCase() === 'PRODUCTION' && (interaction.isButton() || interaction.isModalSubmit())) {
			const handledSupport = await handleSupportInteraction(interaction);
			if (handledSupport) return;
		}

		if (!interaction.isButton()) return;

		try {
			if (interaction.customId === 'status:refresh') {
				await interaction.deferUpdate();
				const payload = await buildStatusMessage(interaction.client, interaction.user.id);
				await interaction.editReply(payload);
				return;
			}

			if (interaction.customId.startsWith('roadmap:')) {
				const [, rawTab] = interaction.customId.split(':');
				const tab: RoadmapFilterTab = ['all', 'active', 'planned', 'released'].includes(rawTab) ? (rawTab as RoadmapFilterTab) : 'all';
				await interaction.deferUpdate();
				const payload = await buildRoadmapOverviewMessage(interaction.client, tab, interaction.user.id);
				await interaction.editReply(payload);
				return;
			}

			if (interaction.customId.startsWith('faq:')) {
				const [, rawTab] = interaction.customId.split(':');
				const tab: FaqCategoryTab = ['overview', 'platform', 'developers', 'community'].includes(rawTab) ? (rawTab as FaqCategoryTab) : 'overview';
				await interaction.deferUpdate();
				const payload = await buildFaqOverviewMessage(interaction.client, tab, interaction.user.id);
				await interaction.editReply(payload);
				return;
			}

			if (interaction.customId.startsWith('docs:')) {
				const [, rawTab] = interaction.customId.split(':');
				const tab: DocsSectionTab = ['overview', 'api', 'cdn', 'websocket', 'packages'].includes(rawTab) ? (rawTab as DocsSectionTab) : 'overview';
				await interaction.deferUpdate();
				const payload = await buildDocsOverviewMessage(interaction.client, tab, interaction.user.id);
				await interaction.editReply(payload);
				return;
			}

			if (interaction.customId.startsWith('issues:')) {
				const [, rawTab] = interaction.customId.split(':');
				const tab: IssuesFilterTab = ['all', 'open', 'resolved'].includes(rawTab) ? (rawTab as IssuesFilterTab) : 'all';
				await interaction.deferUpdate();
				const payload = await buildIssuesOverviewMessage(interaction.client, tab, interaction.user.id);
				await interaction.editReply(payload);
				return;
			}

			if (interaction.customId.startsWith('suggestions:')) {
				const [, rawTab] = interaction.customId.split(':');
				const tab: SuggestionsFilterTab = ['all', 'pending', 'accepted'].includes(rawTab) ? (rawTab as SuggestionsFilterTab) : 'all';
				await interaction.deferUpdate();
				const payload = await buildSuggestionsOverviewMessage(interaction.client, tab, interaction.user.id);
				await interaction.editReply(payload);
				return;
			}
		} catch (error) {
			console.error('[XernerxApp] Error handling interactive button:', error);
		}
	}
}
