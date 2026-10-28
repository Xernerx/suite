/** @format */

import { database } from '@xernerx/lib/core';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	Client,
	ContainerBuilder,
	GuildMemberRoleManager,
	Interaction,
	Message,
	MessageFlags,
	ModalBuilder,
	PermissionFlagsBits,
	SeparatorSpacingSize,
	TextInputBuilder,
	TextInputStyle,
	ThreadAutoArchiveDuration,
	ThreadChannel,
} from 'discord.js';

export const DEFAULT_SUPPORT_CHECKLIST = ['Retried the command?', 'Bot is online?', 'Have someone else try?', 'Checked if you have permissions?'];

export async function getSupportChecklist(db?: any): Promise<string[]> {
	try {
		const resolvedDb = db || (await database('xernerx'));
		const SettingModel = (resolvedDb.models.core as any).Setting;
		if (!SettingModel) return DEFAULT_SUPPORT_CHECKLIST;

		const setting = await SettingModel.findOne({ id: 'support_checklist' }).lean();
		if (setting?.value) {
			const parsed = JSON.parse(setting.value);
			if (Array.isArray(parsed) && parsed.length > 0) {
				const cleaned = parsed.map((item) => String(item).trim()).filter(Boolean);
				if (cleaned.length > 0) return cleaned;
			}
		}
	} catch {}
	return DEFAULT_SUPPORT_CHECKLIST;
}

export function buildSupportWelcomeContainer(userId: string): ContainerBuilder {
	return new ContainerBuilder()
		.addTextDisplayComponents((text) =>
			text.setContent(
				`# Hey there <@${userId}>!\nI've created a special support thread just for you! Please answer the intake questions below so our team can help you as quickly as possible. Once your issue is resolved, you can click **Close**.`
			)
		)
		.addActionRowComponents(
			new ActionRowBuilder<ButtonBuilder>().setComponents(
				new ButtonBuilder().setCustomId('resolve').setLabel('Resolve').setStyle(ButtonStyle.Success),
				new ButtonBuilder().setCustomId('hold').setLabel('Hold').setStyle(ButtonStyle.Secondary),
				new ButtonBuilder().setCustomId('reopen').setLabel('Reopen').setStyle(ButtonStyle.Primary),
				new ButtonBuilder().setCustomId('close').setLabel('Close').setStyle(ButtonStyle.Danger)
			)
		);
}

export async function buildSupportBotSelectContainer(guildName: string, bots: any[], client: Client): Promise<ContainerBuilder> {
	const container = new ContainerBuilder().addTextDisplayComponents((text) =>
		text.setContent(`Within **${guildName}** there are currently **${bots.length}** bots available for support.\nPlease select the bot you are having issues with:`)
	);

	let row = new ActionRowBuilder<ButtonBuilder>();

	for (let i = 0; i < bots.length; i++) {
		const botEntry = bots[i];
		if (i > 0 && i % 5 === 0) {
			container.addActionRowComponents(row);
			row = new ActionRowBuilder<ButtonBuilder>();
		}

		let label = botEntry.name || botEntry.id;
		if (!botEntry.name) {
			const botUser = await client.users.fetch(botEntry.id).catch(() => null);
			if (botUser?.username) label = botUser.username;
		}

		row.addComponents(new ButtonBuilder().setCustomId(`0-${botEntry.id}`).setLabel(String(label).slice(0, 80)).setStyle(ButtonStyle.Primary));
	}

	if (row.components.length > 0) {
		container.addActionRowComponents(row);
	}

	return container;
}

export function buildSupportStepContainer(ticket: any, checklist: string[]): ContainerBuilder {
	const container = new ContainerBuilder();
	const botHeadline = ticket.bot ? `# Support for <@${ticket.bot}>` : `# Support Intake`;
	container.addTextDisplayComponents((text) => text.setContent(botHeadline));

	const stepIndex = Number(ticket.index || 0);

	if (stepIndex === 0) {
		container
			.addTextDisplayComponents((text) => text.setContent('If relevant, please provide the **server information** where the issue occurred.'))
			.addActionRowComponents(
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder().setCustomId('1-guildId').setLabel('Enter').setStyle(ButtonStyle.Primary),
					new ButtonBuilder().setCustomId('-skip').setLabel('Skip').setStyle(ButtonStyle.Secondary)
				)
			);
		return container;
	}

	if (stepIndex === 1) {
		container
			.addTextDisplayComponents((text) => text.setContent('If relevant, please provide the **channel information** where the issue occurred.'))
			.addActionRowComponents(
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder().setCustomId('2-channelId').setLabel('Enter').setStyle(ButtonStyle.Primary),
					new ButtonBuilder().setCustomId('-skip').setLabel('Skip').setStyle(ButtonStyle.Secondary)
				)
			);
		return container;
	}

	if (stepIndex === 2) {
		container
			.addTextDisplayComponents((text) => text.setContent('If relevant, please provide the **message ID or command name** you were trying to use.'))
			.addActionRowComponents(
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder().setCustomId('3-messageOrCommandId').setLabel('Enter').setStyle(ButtonStyle.Primary),
					new ButtonBuilder().setCustomId('-skip').setLabel('Skip').setStyle(ButtonStyle.Secondary)
				)
			);
		return container;
	}

	// Step 3: Summary + Troubleshooting Checklist
	const guildName = ticket.guild?.name || 'Not given';
	const guildId = ticket.guild?.id || 'Not given';
	const channelName = ticket.channel?.name || 'Not given';
	const channelId = ticket.channel?.id || 'Not given';
	const messageId = ticket.message?.id || 'Not given';
	const commandName = ticket.command?.name || ticket.command?.id || 'Not given';

	container
		.addTextDisplayComponents((text) =>
			text.setContent(`> **Server:** ${guildName} (${guildId})\n> **Channel:** ${channelName} (${channelId})\n> **Message:** ${messageId}\n> **Command:** ${commandName}`)
		)
		.addActionRowComponents(
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder().setCustomId('1-edit').setLabel('Edit Server').setStyle(ButtonStyle.Secondary),
				new ButtonBuilder().setCustomId('2-edit').setLabel('Edit Channel').setStyle(ButtonStyle.Secondary),
				new ButtonBuilder().setCustomId('3-edit').setLabel('Edit Command / Msg').setStyle(ButtonStyle.Secondary)
			)
		)
		.addSeparatorComponents((separator) => separator.setDivider(true).setSpacing(SeparatorSpacingSize.Large))
		.addTextDisplayComponents((text) => text.setContent('### Troubleshooting Checklist\nPlease toggle the checks below that you have already tried:'));

	for (let i = 0; i < checklist.length; i++) {
		const key = String(i);
		const checked = ticket.checks instanceof Map ? Boolean(ticket.checks.get(key)) : Boolean(ticket.checks && ticket.checks[key]);

		container.addSectionComponents((section) =>
			section
				.addTextDisplayComponents((text) => text.setContent(`${i + 1}. **${checklist[i]}**`))
				.setButtonAccessory((button) =>
					button
						.setCustomId(`check-${i}`)
						.setLabel(checked ? '✔️' : '✖️')
						.setStyle(checked ? ButtonStyle.Success : ButtonStyle.Danger)
				)
		);
	}

	return container;
}

export async function handleSupportMessageCreate(message: Message): Promise<boolean> {
	if (process.env.ENVIRONMENT?.toUpperCase() !== 'PRODUCTION') return false;
	if (message.author.bot || message.system || !message.guild) return false;
	if (message.channel.isThread()) return false;

	try {
		const db = await database('xernerx');
		const SupportChannelModel = (db.models.core as any).SupportChannel;
		const SupportBotModel = (db.models.core as any).SupportBot;
		const SupportTicketModel = (db.models.core as any).SupportTicket;

		if (!SupportChannelModel || !SupportTicketModel) return false;

		const channelConfig = await SupportChannelModel.findOne({
			id: message.channel.id,
			guild: message.guild.id,
			type: 'support',
		}).lean();

		if (!channelConfig) return false;

		// Check if user already has an open or on-hold ticket in this guild
		const existingTicket = await SupportTicketModel.findOne({
			userId: message.author.id,
			guildId: message.guild.id,
			status: { $in: ['open', 'on-hold'] },
		});

		if (existingTicket) {
			const existingThread = await message.guild.channels.fetch(existingTicket.id).catch(() => null);
			if (existingThread && existingThread.isThread() && !existingThread.locked && !existingThread.archived) {
				const reminder = await message
					.reply({
						content: `You already have an active support ticket in <#${existingTicket.id}>! Please continue there or close it before opening a new one.`,
					})
					.catch(() => null);
				if (reminder) {
					setTimeout(() => reminder.delete().catch(() => {}), 10000);
				}
				return true;
			} else {
				existingTicket.status = 'closed';
				await existingTicket.save().catch(() => {});
			}
		}

		const bots = SupportBotModel ? await SupportBotModel.find({ guild: message.guild.id }).lean() : [];
		const checklist = await getSupportChecklist(db);

		const thread = await message.startThread({
			name: `[OPEN]-${message.author.username}`,
			autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
		});

		const defaultBotId = bots.length === 1 ? bots[0].id : bots.length === 0 ? message.client.user?.id || null : null;

		const ticketDoc = await SupportTicketModel.create({
			id: thread.id,
			guildId: message.guild.id,
			channelId: message.channel.id,
			userId: message.author.id,
			username: message.author.username,
			initialMessage: message.content ? message.content.slice(0, 500) : null,
			status: 'open',
			index: 0,
			bot: defaultBotId,
		});

		const welcomeMsg = await thread.send({
			flags: MessageFlags.IsComponentsV2,
			components: [buildSupportWelcomeContainer(message.author.id)],
		});

		await welcomeMsg.pin().catch(() => {});

		let stepContainer: ContainerBuilder;
		if (bots.length > 1) {
			stepContainer = await buildSupportBotSelectContainer(message.guild.name, bots, message.client);
		} else {
			stepContainer = buildSupportStepContainer(ticketDoc, checklist);
		}

		await thread.send({
			flags: MessageFlags.IsComponentsV2,
			components: [stepContainer],
		});

		return true;
	} catch (error) {
		console.error('[XernerxApp] Error creating support ticket thread:', error);
		return false;
	}
}

function hasStaffPermission(interaction: Interaction, roleId?: string | null): boolean {
	if (!interaction.inGuild()) return false;
	const memberPerms = interaction.memberPermissions;
	if (memberPerms?.has(PermissionFlagsBits.Administrator) || memberPerms?.has(PermissionFlagsBits.ManageThreads) || memberPerms?.has(PermissionFlagsBits.ManageGuild)) {
		return true;
	}
	if (roleId && interaction.member?.roles) {
		const roles = interaction.member.roles as GuildMemberRoleManager;
		if (typeof roles.cache?.has === 'function' && roles.cache.has(roleId)) {
			return true;
		}
		if (Array.isArray(roles) && roles.includes(roleId)) {
			return true;
		}
	}
	return false;
}

export async function handleSupportInteraction(interaction: Interaction): Promise<boolean> {
	if (process.env.ENVIRONMENT?.toUpperCase() !== 'PRODUCTION') return false;
	if (!interaction.isButton() && !interaction.isModalSubmit()) return false;
	if (!interaction.channel || !interaction.channel.isThread()) return false;

	try {
		const db = await database('xernerx');
		const SupportTicketModel = (db.models.core as any).SupportTicket;
		const SupportChannelModel = (db.models.core as any).SupportChannel;

		if (!SupportTicketModel) return false;

		const ticket = await SupportTicketModel.findOne({ id: interaction.channel.id });
		if (!ticket) return false;

		const thread = interaction.channel as ThreadChannel;
		const channelConfig = SupportChannelModel ? await SupportChannelModel.findOne({ id: thread.parentId || ticket.channelId }).lean() : null;

		const checklist = await getSupportChecklist(db);

		const notifyStaffIfReady = async () => {
			if (!channelConfig?.role) return;
			await thread
				.send({
					content: `## Thank you for providing the necessary information!\n<@&${channelConfig.role}> has been notified and will assist you shortly.`,
				})
				.catch(() => {});
		};

		if (interaction.isButton()) {
			const [action, value] = interaction.customId.split('-');

			if (action === 'resolve') {
				if (!hasStaffPermission(interaction, channelConfig?.role)) {
					await interaction.reply({
						flags: MessageFlags.Ephemeral,
						content: 'Only support staff members can mark this ticket as resolved.',
					});
					return true;
				}

				const baseName = thread.name.replace(/^\[(OPEN|ON-HOLD|RESOLVED|CLOSED)\]-/, '');
				await thread.setName(`[RESOLVED]-${baseName}`).catch(() => {});
				await thread.setLocked(true).catch(() => {});
				await thread.setAutoArchiveDuration(ThreadAutoArchiveDuration.OneHour).catch(() => {});

				ticket.status = 'resolved';
				await ticket.save();

				await interaction.reply({
					content: `Ticket marked as **Resolved** by ${interaction.user}. This thread has been locked and will archive automatically.`,
				});
				return true;
			}

			if (action === 'hold') {
				if (!hasStaffPermission(interaction, channelConfig?.role)) {
					await interaction.reply({
						flags: MessageFlags.Ephemeral,
						content: 'Only support staff members can put this ticket on hold.',
					});
					return true;
				}

				const baseName = thread.name.replace(/^\[(OPEN|ON-HOLD|RESOLVED|CLOSED)\]-/, '');
				await thread.setName(`[ON-HOLD]-${baseName}`).catch(() => {});

				ticket.status = 'on-hold';
				await ticket.save();

				await interaction.reply({
					content: `Ticket placed **On-Hold** by ${interaction.user}.`,
					components: [new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId('reopen').setLabel('Reopen Ticket').setStyle(ButtonStyle.Primary))],
				});
				return true;
			}

			if (action === 'reopen') {
				const isTicketOwner = interaction.user.id === ticket.userId;
				const isStaff = hasStaffPermission(interaction, channelConfig?.role);

				if (!isTicketOwner && !isStaff) {
					await interaction.reply({
						flags: MessageFlags.Ephemeral,
						content: 'Only the ticket creator or support staff can reopen this ticket.',
					});
					return true;
				}

				if (ticket.status === 'open') {
					await interaction.reply({
						flags: MessageFlags.Ephemeral,
						content: 'This support ticket is already open.',
					});
					return true;
				}

				const baseName = thread.name.replace(/^\[(OPEN|ON-HOLD|RESOLVED|CLOSED)\]-/, '');
				await thread.setLocked(false).catch(() => {});
				await thread.setArchived(false).catch(() => {});
				await thread.setAutoArchiveDuration(ThreadAutoArchiveDuration.OneWeek).catch(() => {});
				await thread.setName(`[OPEN]-${baseName}`).catch(() => {});

				ticket.status = 'open';
				await ticket.save();

				await interaction.reply({
					content: `Ticket **Reopened** by ${interaction.user}.`,
				});
				return true;
			}

			if (action === 'close') {
				const isTicketOwner = interaction.user.id === ticket.userId;
				const isStaff = hasStaffPermission(interaction, channelConfig?.role);

				if (!isTicketOwner && !isStaff) {
					await interaction.reply({
						flags: MessageFlags.Ephemeral,
						content: 'Only the ticket creator or support staff can close this ticket.',
					});
					return true;
				}

				const baseName = thread.name.replace(/^\[(OPEN|ON-HOLD|RESOLVED|CLOSED)\]-/, '');
				await thread.setName(`[CLOSED]-${baseName}`).catch(() => {});
				await thread.setLocked(true).catch(() => {});
				await thread.setAutoArchiveDuration(ThreadAutoArchiveDuration.OneHour).catch(() => {});

				ticket.status = 'closed';
				await ticket.save();

				await interaction.reply({
					content: `Ticket **Closed** by ${interaction.user}.`,
				});
				return true;
			}

			// Intake steps are restricted to the ticket author (or staff)
			if (interaction.user.id !== ticket.userId && !hasStaffPermission(interaction, channelConfig?.role)) {
				await interaction.reply({
					flags: MessageFlags.Ephemeral,
					content: 'Only the user who opened this support ticket can fill out the intake steps.',
				});
				return true;
			}

			if (value === 'skip') {
				ticket.index = Math.min(3, Number(ticket.index || 0) + 1);
				await ticket.save();

				const container = buildSupportStepContainer(ticket, checklist);
				await interaction.update({
					flags: MessageFlags.IsComponentsV2,
					components: [container],
				});

				if (ticket.index === 3) {
					await notifyStaffIfReady();
				}
				return true;
			}

			if (action === '0') {
				ticket.bot = value;
				ticket.index = 0;
				await ticket.save();

				const container = buildSupportStepContainer(ticket, checklist);
				await interaction.update({
					flags: MessageFlags.IsComponentsV2,
					components: [container],
				});
				return true;
			}

			if (action === '1') {
				const modal = new ModalBuilder()
					.setTitle('Server Information')
					.setCustomId('guild-info')
					.addComponents(
						new ActionRowBuilder<TextInputBuilder>().setComponents(
							new TextInputBuilder()
								.setCustomId('guild-id')
								.setLabel('Server ID')
								.setPlaceholder('Enter the Discord Server ID...')
								.setValue(ticket.guild?.id ? String(ticket.guild.id) : '')
								.setStyle(TextInputStyle.Short)
								.setRequired(false)
								.setMaxLength(30)
						),
						new ActionRowBuilder<TextInputBuilder>().setComponents(
							new TextInputBuilder()
								.setCustomId('guild-name')
								.setLabel('Server Name')
								.setPlaceholder('Enter the Discord Server name...')
								.setValue(ticket.guild?.name ? String(ticket.guild.name) : '')
								.setStyle(TextInputStyle.Short)
								.setRequired(false)
								.setMaxLength(100)
						)
					);

				await interaction.showModal(modal);
				return true;
			}

			if (action === '2') {
				const modal = new ModalBuilder()
					.setTitle('Channel Information')
					.setCustomId('channel-info')
					.addComponents(
						new ActionRowBuilder<TextInputBuilder>().setComponents(
							new TextInputBuilder()
								.setCustomId('channel-id')
								.setLabel('Channel ID')
								.setPlaceholder('Enter the Channel ID...')
								.setValue(ticket.channel?.id ? String(ticket.channel.id) : '')
								.setStyle(TextInputStyle.Short)
								.setRequired(false)
								.setMaxLength(30)
						),
						new ActionRowBuilder<TextInputBuilder>().setComponents(
							new TextInputBuilder()
								.setCustomId('channel-name')
								.setLabel('Channel Name')
								.setPlaceholder('Enter the Channel name...')
								.setValue(ticket.channel?.name ? String(ticket.channel.name) : '')
								.setStyle(TextInputStyle.Short)
								.setRequired(false)
								.setMaxLength(100)
						)
					);

				await interaction.showModal(modal);
				return true;
			}

			if (action === '3') {
				const modal = new ModalBuilder()
					.setTitle('Message or Command Information')
					.setCustomId('message-command-info')
					.addComponents(
						new ActionRowBuilder<TextInputBuilder>().setComponents(
							new TextInputBuilder()
								.setCustomId('message-id')
								.setLabel('Message ID')
								.setPlaceholder('Enter the Message ID (if applicable)...')
								.setValue(ticket.message?.id ? String(ticket.message.id) : '')
								.setStyle(TextInputStyle.Short)
								.setRequired(false)
								.setMaxLength(30)
						),
						new ActionRowBuilder<TextInputBuilder>().setComponents(
							new TextInputBuilder()
								.setCustomId('command-name')
								.setLabel('Command Name')
								.setPlaceholder('e.g. /settings or /rank...')
								.setValue(ticket.command?.name ? String(ticket.command.name) : '')
								.setStyle(TextInputStyle.Short)
								.setRequired(false)
								.setMaxLength(100)
						)
					);

				await interaction.showModal(modal);
				return true;
			}

			if (action === 'check') {
				const currentVal = ticket.checks instanceof Map ? Boolean(ticket.checks.get(value)) : Boolean(ticket.checks && ticket.checks[value]);

				if (!ticket.checks || !(ticket.checks instanceof Map)) {
					ticket.checks = new Map<string, boolean>(Object.entries(ticket.checks || {}));
				}
				ticket.checks.set(value, !currentVal);
				await ticket.save();

				const container = buildSupportStepContainer(ticket, checklist);
				await interaction.update({
					flags: MessageFlags.IsComponentsV2,
					components: [container],
				});
				return true;
			}
		}

		if (interaction.isModalSubmit()) {
			if (interaction.customId === 'guild-info') {
				const id = interaction.fields.getTextInputValue('guild-id').trim();
				const name = interaction.fields.getTextInputValue('guild-name').trim();

				ticket.guild = { id: id || null, name: name || null };
				ticket.index = Math.max(Number(ticket.index || 0), 1);
				await ticket.save();

				const container = buildSupportStepContainer(ticket, checklist);
				if (interaction.isFromMessage()) {
					await interaction.update({
						flags: MessageFlags.IsComponentsV2,
						components: [container],
					});
				} else {
					await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Server information saved.' });
				}
				return true;
			}

			if (interaction.customId === 'channel-info') {
				const id = interaction.fields.getTextInputValue('channel-id').trim();
				const name = interaction.fields.getTextInputValue('channel-name').trim();

				ticket.channel = { id: id || null, name: name || null };
				ticket.index = Math.max(Number(ticket.index || 0), 2);
				await ticket.save();

				const container = buildSupportStepContainer(ticket, checklist);
				if (interaction.isFromMessage()) {
					await interaction.update({
						flags: MessageFlags.IsComponentsV2,
						components: [container],
					});
				} else {
					await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Channel information saved.' });
				}
				return true;
			}

			if (interaction.customId === 'message-command-info') {
				const id = interaction.fields.getTextInputValue('message-id').trim();
				const name = interaction.fields.getTextInputValue('command-name').trim();
				const wasAlreadyStep3 = Number(ticket.index || 0) >= 3;

				ticket.message = { id: id || null };
				ticket.command = { id: name || null, name: name || null };
				ticket.index = 3;
				await ticket.save();

				const container = buildSupportStepContainer(ticket, checklist);
				if (interaction.isFromMessage()) {
					await interaction.update({
						flags: MessageFlags.IsComponentsV2,
						components: [container],
					});
				} else {
					await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Information saved.' });
				}

				if (!wasAlreadyStep3) {
					await notifyStaffIfReady();
				}
				return true;
			}
		}

		return false;
	} catch (error) {
		console.error('[XernerxApp] Error handling support ticket interaction:', error);
		return false;
	}
}
