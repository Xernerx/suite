/** @format */

import type { ComponentRow, EmbedData } from './types';

export type BoilerplateTemplateType = 'welcome' | 'rules' | 'support' | 'ecosystem' | 'tos' | 'privacy';

export function buildBoilerplateTemplate(
	type: BoilerplateTemplateType,
	t: (path: string, variables?: Record<string, string | number>) => string,
	user?: { id?: string; username?: string; global_name?: string; avatar?: string } | null
): { title: string; content: string; embeds: EmbedData[]; components: ComponentRow[] } {
	const avatarUrl = user?.avatar && user?.id ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : undefined;
	const footerObj = {
		text: user?.username || user?.global_name || 'Xernerx Studios',
		icon_url: avatarUrl,
	};
	const nowIso = new Date().toISOString();

	if (type === 'welcome') {
		return {
			title: t('admin.dashboard.announcements.templates.welcomeTitle'),
			content: '',
			embeds: [
				{
					title: t('admin.dashboard.announcements.templates.welcomeEmbedTitle'),
					description: t('admin.dashboard.announcements.templates.welcomeEmbedDesc'),
					color: '#8b7cf6',
					fields: [],
					author: { name: '', url: '', icon_url: '' },
					footer: { text: '' },
				},
				{
					title: t('admin.dashboard.announcements.templates.welcomeEmbed2Title'),
					description: '',
					color: '#8b7cf6',
					fields: [
						{ name: t('admin.dashboard.announcements.templates.welcomeE2F1Name'), value: t('admin.dashboard.announcements.templates.welcomeE2F1Val'), inline: false },
						{ name: t('admin.dashboard.announcements.templates.welcomeE2F2Name'), value: t('admin.dashboard.announcements.templates.welcomeE2F2Val'), inline: false },
						{ name: t('admin.dashboard.announcements.templates.welcomeE2F3Name'), value: t('admin.dashboard.announcements.templates.welcomeE2F3Val'), inline: false },
					],
					author: { name: '', url: '', icon_url: '' },
					footer: { text: '' },
				},
				{
					title: t('admin.dashboard.announcements.templates.welcomeEmbed3Title'),
					description: '',
					color: '#8b7cf6',
					fields: [
						{ name: t('admin.dashboard.announcements.templates.welcomeE3F1Name'), value: t('admin.dashboard.announcements.templates.welcomeE3F1Val'), inline: true },
						{ name: t('admin.dashboard.announcements.templates.welcomeE3F2Name'), value: t('admin.dashboard.announcements.templates.welcomeE3F2Val'), inline: true },
					],
					author: { name: '', url: '', icon_url: '' },
					footer: footerObj,
					timestamp: nowIso,
				},
			],
			components: [
				{
					type: 1,
					components: [
						{ type: 2, style: 5, label: t('admin.dashboard.announcements.templates.welcomeBtnApp'), url: 'https://app.xernerx.com' },
						{ type: 2, style: 5, label: t('admin.dashboard.announcements.templates.welcomeBtnDesktop'), url: 'https://xernerx.com/download' },
						{ type: 2, style: 5, label: t('admin.dashboard.announcements.templates.welcomeBtnCredits'), url: 'https://store.xernerx.com?category=credits' },
						{ type: 2, style: 5, label: t('admin.dashboard.announcements.templates.welcomeBtnInfo'), url: 'https://info.xernerx.com' },
						{ type: 2, style: 5, label: t('admin.dashboard.announcements.templates.welcomeBtnAccount'), url: 'https://account.xernerx.com' },
					],
				},
			],
		};
	}

	if (type === 'rules') {
		return {
			title: t('admin.dashboard.announcements.templates.rulesTitle'),
			content: '',
			embeds: [
				{
					title: t('admin.dashboard.announcements.templates.rulesEmbedTitle'),
					description: t('admin.dashboard.announcements.templates.rulesEmbedDesc'),
					color: '#8b7cf6',
					fields: [
						{ name: t('admin.dashboard.announcements.templates.rulesF1Name'), value: t('admin.dashboard.announcements.templates.rulesF1Val'), inline: false },
						{ name: t('admin.dashboard.announcements.templates.rulesF2Name'), value: t('admin.dashboard.announcements.templates.rulesF2Val'), inline: false },
						{ name: t('admin.dashboard.announcements.templates.rulesF3Name'), value: t('admin.dashboard.announcements.templates.rulesF3Val'), inline: false },
					],
					author: { name: '', url: '', icon_url: '' },
					footer: footerObj,
					timestamp: nowIso,
				},
			],
			components: [
				{
					type: 1,
					components: [
						{ type: 2, style: 5, label: t('admin.dashboard.announcements.templates.tosButtonLabel'), url: 'https://xernerx.com/terms' },
						{ type: 2, style: 5, label: t('admin.dashboard.announcements.templates.privacyButtonLabel'), url: 'https://xernerx.com/privacy' },
						{ type: 2, style: 5, label: t('admin.dashboard.announcements.templates.rulesBtnModeration'), url: 'https://info.xernerx.com/faq?category=moderation' },
					],
				},
			],
		};
	}

	if (type === 'support') {
		return {
			title: t('admin.dashboard.announcements.templates.supportTitle'),
			content: '',
			embeds: [
				{
					title: t('admin.dashboard.announcements.templates.supportEmbedTitle'),
					description: t('admin.dashboard.announcements.templates.supportEmbedDesc'),
					color: '#8b7cf6',
					fields: [
						{ name: t('admin.dashboard.announcements.templates.supportField1Name'), value: t('admin.dashboard.announcements.templates.supportField1Val'), inline: false },
						{ name: t('admin.dashboard.announcements.templates.supportField2Name'), value: t('admin.dashboard.announcements.templates.supportField2Val'), inline: false },
					],
					author: { name: '', url: '', icon_url: '' },
					footer: footerObj,
					timestamp: nowIso,
				},
			],
			components: [
				{
					type: 1,
					components: [
						{ type: 2, style: 5, label: t('admin.dashboard.announcements.templates.supportBtnBug'), url: 'https://info.xernerx.com/bugs' },
						{ type: 2, style: 5, label: t('admin.dashboard.announcements.templates.supportBtnSuggest'), url: 'https://info.xernerx.com/suggestions' },
						{ type: 2, style: 5, label: t('admin.dashboard.announcements.templates.supportBtnFaq'), url: 'https://info.xernerx.com/faq' },
					],
				},
			],
		};
	}

	if (type === 'ecosystem') {
		return {
			title: t('admin.dashboard.announcements.templates.ecosystemTitle'),
			content: '',
			embeds: [
				{
					title: t('admin.dashboard.announcements.templates.ecosystemEmbedTitle'),
					description: t('admin.dashboard.announcements.templates.ecosystemEmbedDesc'),
					color: '#8b7cf6',
					fields: [
						{ name: t('admin.dashboard.announcements.templates.ecosystemField1Name'), value: t('admin.dashboard.announcements.templates.ecosystemField1Val'), inline: false },
						{ name: t('admin.dashboard.announcements.templates.ecosystemField2Name'), value: t('admin.dashboard.announcements.templates.ecosystemField2Val'), inline: false },
					],
					author: { name: '', url: '', icon_url: '' },
					footer: footerObj,
					timestamp: nowIso,
				},
			],
			components: [
				{
					type: 1,
					components: [
						{ type: 2, style: 5, label: t('admin.dashboard.announcements.templates.ecosystemBtnExplore'), url: 'https://app.xernerx.com' },
						{ type: 2, style: 5, label: t('admin.dashboard.announcements.templates.ecosystemBtnPortal'), url: 'https://app.xernerx.com/portal' },
						{ type: 2, style: 5, label: t('admin.dashboard.announcements.templates.ecosystemBtnDocs'), url: 'https://docs.xernerx.com' },
					],
				},
			],
		};
	}

	return {
		title: type === 'tos' ? t('admin.dashboard.announcements.templates.tosTitle') : t('admin.dashboard.announcements.templates.privacyTitle'),
		content: '',
		embeds: [
			{
				title: type === 'tos' ? t('admin.dashboard.announcements.templates.tosEmbedTitle') : t('admin.dashboard.announcements.templates.privacyEmbedTitle'),
				description: type === 'tos' ? t('admin.dashboard.announcements.templates.tosEmbedDesc') : t('admin.dashboard.announcements.templates.privacyEmbedDesc'),
				color: '#8b7cf6',
				fields: [],
				author: { name: '', url: '', icon_url: '' },
				footer: footerObj,
				timestamp: nowIso,
			},
		],
		components: [
			{
				type: 1,
				components: [
					{
						type: 2,
						style: 5,
						label: type === 'tos' ? t('admin.dashboard.announcements.templates.tosButtonLabel') : t('admin.dashboard.announcements.templates.privacyButtonLabel'),
						url: `https://xernerx.com/${type === 'tos' ? 'terms' : 'privacy'}`,
					},
				],
			},
		],
	};
}
