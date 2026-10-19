/** @format */

import { ServerClient } from 'postmark';
import { render } from '@react-email/render';

let postmarkClient: ServerClient | null = null;
let cachedPostmarkToken: string | undefined;

function getPostmarkClient(): ServerClient | null {
	const token = process.env.POSTMARK_TOKEN;
	if (!token) return null;
	if (!postmarkClient || cachedPostmarkToken !== token) {
		postmarkClient = new ServerClient(token);
		cachedPostmarkToken = token;
	}
	return postmarkClient;
}

export interface MailPayload {
	to: string;
	subject: string;
	template: React.ReactElement;
}

export async function sendMail(payload: MailPayload) {
	const client = getPostmarkClient();
	if (!client) {
		console.warn('POSTMARK_TOKEN is missing. Email dispatch skipped.', payload.subject);
		return;
	}

	try {
		const html = await render(payload.template);
		await client.sendEmail({
			From: process.env.POSTMARK_FROM_EMAIL || 'noreply@xernerx.com',
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
				username: 'Xernerx App',
				avatar_url: 'https://xernerx.com/logo.png',
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
