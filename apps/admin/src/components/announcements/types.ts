/** @format */

export interface EmbedField {
	name: string;
	value: string;
	inline?: boolean;
}

export interface EmbedAuthor {
	name?: string;
	url?: string;
	icon_url?: string;
}

export interface EmbedFooter {
	text?: string;
	icon_url?: string;
}

export interface EmbedData {
	title?: string;
	description?: string;
	color?: string | number;
	fields?: EmbedField[];
	author?: EmbedAuthor;
	footer?: EmbedFooter;
	timestamp?: string;
}

export interface ButtonComponent {
	type: number;
	style: number;
	label?: string;
	custom_id?: string;
	url?: string;
}

export interface ComponentRow {
	type: number;
	components: ButtonComponent[];
}

export interface AnnouncementItem {
	id: string;
	title: string;
	channelId?: string;
	webhookUrl: string;
	message?: {
		content?: string;
		embeds?: any[];
		components?: any[];
	};
	scheduledFor?: string | null;
	sentAt?: string | null;
}

export interface ChannelOption {
	label: string;
	value: string;
}
