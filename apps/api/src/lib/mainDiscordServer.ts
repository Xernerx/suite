/** @format */

export const DEFAULT_MAIN_SERVER_ID = process.env.DISCORD_GUILD_ID || '687429190165069838';
export const DEFAULT_XERNERX_EMBED_COLOR = 0x8b7cf6;

export async function getMainDiscordServerId(db: any): Promise<string> {
	try {
		const setting = await db?.models?.core?.Setting?.findOne({ id: 'admin_server_id' }).lean();
		const configured = String(setting?.value || '').trim();
		if (configured) return configured;
	} catch {}
	return DEFAULT_MAIN_SERVER_ID;
}

export type CommunityWebhookFeedType = 'issues' | 'suggestions';

export interface CommunityWebhookPayload {
	feedType: CommunityWebhookFeedType;
	title: string;
	url?: string;
	description: string;
	color?: number;
	fields?: Array<{ name: string; value: string; inline?: boolean }>;
	author?: { name: string; url?: string; icon_url?: string };
	thumbnailUrl?: string | null;
	footerText?: string;
	ctaLinks?: Array<{ label: string; url: string }>;
}

/**
 * Broadcasts Issues/Bug Reports to `issues_webhook_url` and Suggestions/Roadmap updates to `suggestions_webhook_url`
 * in the main Discord server with native Link Buttons (or markdown fallback).
 */
export async function dispatchAppCommunityWebhook(db: any, payload: CommunityWebhookPayload): Promise<boolean> {
	try {
		const settingId = payload.feedType === 'issues' ? 'issues_webhook_url' : 'suggestions_webhook_url';
		const setting = await db?.models?.core?.Setting?.findOne({ id: settingId }).lean();
		const webhookUrl = String(setting?.value || '').trim();
		if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) return false;

		const defaultUsername = payload.feedType === 'issues' ? 'Xernerx Bug Tracker' : 'Xernerx Suggestions';
		const defaultFooter = payload.feedType === 'issues' ? 'Xernerx Suite • Issue & Bug Tracker' : 'Xernerx Suite • Suggestions & Roadmap';

		const baseEmbed: Record<string, any> = {
			title: payload.title,
			description: payload.description,
			color: payload.color ?? DEFAULT_XERNERX_EMBED_COLOR,
			timestamp: new Date().toISOString(),
			footer: {
				text: payload.footerText || defaultFooter,
			},
		};

		if (payload.url) {
			baseEmbed.url = payload.url;
		}
		if (payload.author) {
			baseEmbed.author = payload.author;
		}
		if (payload.thumbnailUrl) {
			baseEmbed.thumbnail = { url: payload.thumbnailUrl };
		}
		if (Array.isArray(payload.fields) && payload.fields.length > 0) {
			baseEmbed.fields = payload.fields;
		}

		const validLinks = Array.isArray(payload.ctaLinks) ? payload.ctaLinks.filter((l) => l.label && l.url).slice(0, 5) : [];

		if (validLinks.length > 0) {
			const components = [
				{
					type: 1,
					components: validLinks.map((l) => ({
						type: 2,
						style: 5,
						label: l.label.slice(0, 80),
						url: l.url,
					})),
				},
			];

			const resWithButtons = await fetch(webhookUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					username: defaultUsername,
					embeds: [baseEmbed],
					components,
				}),
			});

			if (resWithButtons.ok) return true;
		}

		// Fallback for non-application webhooks: append markdown links inside the embed description
		const linksMarkdown = validLinks.length > 0 ? '\n\n' + validLinks.map((link) => `🔗 **[${link.label}](${link.url})**`).join('  •  ') : '';
		const fallbackEmbed = {
			...baseEmbed,
			description: `${payload.description}${linksMarkdown}`,
		};

		const res = await fetch(webhookUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				username: defaultUsername,
				embeds: [fallbackEmbed],
			}),
		});

		return res.ok;
	} catch (err) {
		console.warn('[CommunityWebhook] Failed to dispatch community webhook:', err);
		return false;
	}
}
