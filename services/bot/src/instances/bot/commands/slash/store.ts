/** @format */

import { database } from '@xernerx/lib/core';
import { SlashCommandBuilder, type SlashCommandOptions } from '@xernerx/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, EmbedBuilder } from 'discord.js';
import { getUserAccentColor } from '../../../../lib/botUtils.js';

export type StoreCategoryTab = 'subscriptions' | 'perks' | 'packs';

export const STORE_TABS: { id: StoreCategoryTab; label: string; title: string }[] = [
	{ id: 'subscriptions', label: 'Subscriptions', title: 'Xernerx Store • Subscriptions' },
	{ id: 'perks', label: 'Credit Perks', title: 'Xernerx Store • Credit Perks' },
	{ id: 'packs', label: 'Credit Packs', title: 'Xernerx Store • Credit Top-Up Packs' },
];

export async function buildStoreMessage(client: Client, tab: StoreCategoryTab, requesterUserId?: string) {
	const clientBotUser = client.user;
	const clientBotAvatar = clientBotUser?.displayAvatarURL();
	const clientBotName = clientBotUser?.username || 'Xernerx';

	const tabMeta = STORE_TABS.find((t) => t.id === tab) || STORE_TABS[0];
	const [db, accentColor] = await Promise.all([database('xernerx'), getUserAccentColor(requesterUserId)]);

	const ItemModel = (db.models.store as any)?.Item;
	const CreditModel = (db.models.users as any)?.Credit;

	const [items, creditDoc] = await Promise.all([
		ItemModel
			? ItemModel.find({ enabled: { $ne: false } })
					.sort({ order: 1 })
					.lean()
					.catch(() => [])
			: Promise.resolve([]),
		requesterUserId && CreditModel
			? CreditModel.findOne({ ownerId: requesterUserId })
					.select('balance streak')
					.lean()
					.catch(() => null)
			: Promise.resolve(null),
	]);

	const balance = Number((creditDoc as any)?.balance || 0);
	const streak = Number((creditDoc as any)?.streak || 0);

	const storeUrl = tab === 'subscriptions' ? 'https://store.xernerx.com' : 'https://store.xernerx.com/?category=credits';

	const embed = new EmbedBuilder()
		.setColor(accentColor)
		.setTitle(tabMeta.title)
		.setURL(storeUrl)
		.setDescription(
			`Explore subscriptions, ecosystem upgrades, and credit rewards on [store.xernerx.com](${storeUrl}).\n**Your Wallet:** \`${balance.toLocaleString()} Credits\` • **Streak:** \`${streak}d\``
		);

	if (tab === 'subscriptions') {
		const subItems = items.filter((i: any) => i.itemType === 'subscription' || (!i.itemType && !i.creditCost && !i.creditAmount));
		if (subItems.length > 0) {
			for (const item of subItems.slice(0, 8)) {
				const badgeSuffix = item.badge ? ` • \`${item.badge}\`` : '';
				const featureLines =
					Array.isArray(item.features) && item.features.length > 0
						? `\n${item.features
								.slice(0, 3)
								.map((f: string) => `• ${f}`)
								.join('\n')}`
						: '';
				embed.addFields([
					{
						name: `${item.name}${badgeSuffix}`,
						value: `${item.description || 'Premium ecosystem pass.'}${featureLines}`,
						inline: false,
					},
				]);
			}
		} else {
			embed.addFields([
				{
					name: 'Ultra Ecosystem',
					value: 'All consumer bots (Virtue, Zodiac, To-Do, Metamorphosis), 200% Credit Multiplier, and 1,000 CDN Media Slots.',
					inline: false,
				},
				{
					name: 'Individual Bot Passes',
					value: 'Dedicated passes for **Virtue**, **Zodiac**, **To-Do**, **Metamorphosis**, and **Developer Pro** with a 125% Credit Multiplier.',
					inline: false,
				},
			]);
		}
	} else if (tab === 'perks') {
		const perkItems = items.filter((i: any) => i.itemType === 'credit_perk');
		if (perkItems.length > 0) {
			for (const item of perkItems.slice(0, 10)) {
				const costLabel = `\`${Number(item.creditCost || 0).toLocaleString()} Credits\``;
				embed.addFields([
					{
						name: `${item.name} — ${costLabel}`,
						value: item.description || 'Redeemable with ecosystem credits.',
						inline: true,
					},
				]);
			}
		} else {
			embed.addFields([
				{
					name: 'CDN Upload Slots',
					value: '• **+1 Slot:** `1,000 Credits`\n• **+3 Slots:** `2,500 Credits`\n• **+10 Slots:** `7,500 Credits`',
					inline: true,
				},
				{
					name: 'Profile Showcase Slots',
					value: '• **+1 Showcase:** `1,500 Credits`\n• **+3 Showcases:** `3,500 Credits`\n• **Streak Shield:** `500 Credits`',
					inline: true,
				},
				{
					name: 'Trial Passes & Vanity Badges',
					value: '• **3-Day Virtue / Zodiac Trial:** `900 Credits`\n• **3-Day Ultra Trial:** `2,000 Credits`\n• **Vanity Badges:** `2,500 – 25,000 Credits`',
					inline: false,
				},
			]);
		}
	} else {
		const packItems = items.filter((i: any) => i.itemType === 'credit_pack');
		if (packItems.length > 0) {
			for (const item of packItems.slice(0, 6)) {
				const badgeSuffix = item.badge ? ` (\`${item.badge}\`)` : '';
				embed.addFields([
					{
						name: `${item.name}${badgeSuffix}`,
						value: `${item.description || `${Number(item.creditAmount || 0).toLocaleString()} instant ecosystem credits.`}`,
						inline: true,
					},
				]);
			}
		} else {
			embed.addFields([
				{
					name: '500 Credits Pack',
					value: 'Base pack of 500 ecosystem credits (`€5.00`).',
					inline: true,
				},
				{
					name: '1,200 Credits Pack (+20%)',
					value: '1,000 base credits + 200 bonus credits (`€10.00`).',
					inline: true,
				},
				{
					name: '3,250 Credits Vault (+30%)',
					value: '2,500 base credits + 750 bonus credits (`€25.00`).',
					inline: true,
				},
				{
					name: '7,000 Credits Treasury (+40%)',
					value: '5,000 base credits + 2,000 bonus credits (`€50.00`).',
					inline: true,
				},
			]);
		}
	}

	embed
		.setFooter({
			text: `${clientBotName} • Store`,
			iconURL: clientBotAvatar,
		})
		.setTimestamp();

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		...STORE_TABS.map((t) =>
			new ButtonBuilder()
				.setCustomId(`store:${t.id}`)
				.setLabel(t.label)
				.setStyle(t.id === tab ? ButtonStyle.Primary : ButtonStyle.Secondary)
		),
		new ButtonBuilder().setLabel('Open Store').setStyle(ButtonStyle.Link).setURL(storeUrl)
	);

	return {
		embeds: [embed],
		components: [row],
	};
}

export default class StoreCommand extends SlashCommandBuilder {
	constructor() {
		super('store', {
			name: 'store',
			description: 'Browse Xernerx Store subscriptions, credit perks, and credit top-up packs.',
			defer: true,
			deploy: { global: true },
			subcommands: [
				{
					name: 'subscriptions',
					description: 'View Ultra Ecosystem and individual bot passes on the Xernerx Store.',
				},
				{
					name: 'perks',
					description: 'View CDN slots, profile showcases, trial passes, streak shields, and vanity badges.',
				},
				{
					name: 'packs',
					description: 'View instant credit top-up packs and bonus tiers.',
				},
			],
		});
	}

	override async exec({ interaction, subcommand }: SlashCommandOptions) {
		const replyMethod = interaction.deferred ? 'editReply' : 'reply';
		const clientBotUser = interaction.client.user;
		const clientBotAvatar = clientBotUser?.displayAvatarURL();
		const clientBotName = clientBotUser?.username || 'Xernerx';

		const tab: StoreCategoryTab = subcommand === 'perks' || subcommand === 'packs' ? subcommand : 'subscriptions';

		try {
			const payload = await buildStoreMessage(interaction.client, tab, interaction.user.id);
			await (interaction as any)[replyMethod](payload);
		} catch (error) {
			console.error(`Error executing /store ${tab}:`, error);
			const errEmbed = new EmbedBuilder()
				.setColor(0xe06c75)
				.setTitle('Failed to Load Store')
				.setDescription('An error occurred while loading the store catalog. Visit [store.xernerx.com](https://store.xernerx.com).')
				.setFooter({
					text: `${clientBotName} • Store`,
					iconURL: clientBotAvatar,
				})
				.setTimestamp();

			await (interaction as any)[replyMethod]({ embeds: [errEmbed] });
		}
	}
}
