/** @format */

import { EventBuilder } from '@xernerx/framework';
import { syncBotCommands, updateBotPresence } from '../../../lib/botUtils.js';

export default class AppClientReadyEvent extends EventBuilder {
	constructor() {
		super('clientReady', {
			name: 'clientReady',
			emitter: 'client',
			once: false,
		});
	}

	override async run() {
		updateBotPresence(this.client);
		syncBotCommands(this.client, process.env.XERNERX_APP_TOKEN || process.env.XERNERX_TOKEN);
	}
}
