/** @format */
import 'server-only';
import { ServerClient } from 'postmark';
import { render } from '@react-email/render';

let postmarkClient: ServerClient | null = null;
if (process.env.POSTMARK_TOKEN) {
	postmarkClient = new ServerClient(process.env.POSTMARK_TOKEN);
}

export interface MailPayload {
	to: string;
	subject: string;
	template: React.ReactElement;
}

export async function sendMail(payload: MailPayload) {
	if (!postmarkClient) {
		console.warn('POSTMARK_TOKEN is missing. Email dispatch skipped.', payload.subject);
		return;
	}

	try {
		const html = await render(payload.template);
		await postmarkClient.sendEmail({
			From: 'noreply@xernerx.com', // Update this to your verified Sender Signature in Postmark
			To: payload.to,
			Subject: payload.subject,
			HtmlBody: html,
		});
	} catch (error) {
		console.error('Failed to send email via Postmark:', error);
		throw error;
	}
}

export interface WebhookPayload {
	url: string;
	content?: string;
	embeds?: any[];
}

export async function sendWebhook(payload: WebhookPayload) {
	try {
		const res = await fetch(payload.url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				content: payload.content,
				embeds: payload.embeds,
			}),
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`Discord Webhook returned ${res.status}: ${text}`);
		}
	} catch (error) {
		console.error('Failed to send Discord webhook:', error);
		throw error;
	}
}
