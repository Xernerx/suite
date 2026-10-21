/** @format */
import { Schema } from 'mongoose';

const schema = new Schema(
	{
		ownerId: { type: String, required: true, unique: true }, // user id
		theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
		accent: { type: String },
		uiZoom: { type: Number, default: 100 },
		uiGap: { type: String, default: '16' },
		textScale: { type: Number, default: 14 },
		clientSync: { type: Boolean, default: false },
		syncFromDiscord: { type: Boolean, default: true },
		uiPreferences: {
			showHeaderStore: { type: Boolean, default: true },
			showHeaderCommandPalette: { type: Boolean, default: true },
			showHeaderNotifications: { type: Boolean, default: true },
			showHeaderDownload: { type: Boolean, default: true },
			showHeaderAppDrawer: { type: Boolean, default: true },
			showShortcutHints: { type: Boolean, default: true },
			showDiscordCollectibles: { type: Boolean, default: true },
			showGiftBadge: { type: Boolean, default: true },
			reducedMotion: { type: Boolean, default: false },
			defaultSidebarCollapsed: { type: Boolean, default: false },
		},
	},
	{ timestamps: true }
);

export default schema;
