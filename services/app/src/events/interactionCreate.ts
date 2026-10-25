/** @format */

import { EventBuilder } from '@xernerx/framework';
import { Interaction } from 'discord.js';

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
		}
	}
}
