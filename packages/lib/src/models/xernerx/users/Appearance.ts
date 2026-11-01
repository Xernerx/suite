/** @format */
import { Schema } from 'mongoose';

const schema = new Schema(
	{
		ownerId: { type: String, required: true, unique: true }, // user id
		theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
		accent: { type: String },
		uiZoom: { type: Number, default: 100 },
		uiGap: { type: String, default: '16' },
		pageWidth: { type: String, default: '90' },
		textScale: { type: Number, default: 14 },
		clientSync: { type: Boolean, default: false },
		syncFromDiscord: { type: Boolean, default: true },
		uiPreferences: {
			headerSubdomains: {
				type: [String],
				enum: ['app', 'portal', 'store', 'account', 'info', 'docs', 'cdn', 'haste', 'api', 'www', 'admin', 'hosting'],
				default: ['portal', 'store'],
			},
			showHeaderStore: { type: Boolean, default: true },
			showHeaderPortal: { type: Boolean, default: true },
			showHeaderCommandPalette: { type: Boolean, default: true },
			showHeaderNotifications: { type: Boolean, default: true },
			showHeaderDownload: { type: Boolean, default: true },
			showHeaderAppDrawer: { type: Boolean, default: true },
			showShortcutHints: { type: Boolean, default: true },
			showDiscordCollectibles: { type: Boolean, default: true },
			showGiftBadge: { type: Boolean, default: true },
			reducedMotion: { type: Boolean, default: false },
			defaultSidebarCollapsed: { type: Boolean, default: false },
			developerMode: { type: Boolean, default: false },
			alignment: { type: String, enum: ['system', 'left', 'right'], default: 'system' },
			dotMatrixStage: { type: String, enum: ['default', 'ripple', 'orbit', 'blank'], default: 'default' },
			dotMatrixType: {
				type: String,
				enum: ['default', 'full', 'icon', 'orbit', 'vortex', 'helix', 'prism', 'infinity', 'wavegrid', 'chronos', 'supernova', 'tesseract', 'synthwave', 'lotus', 'blank'],
				default: 'default',
			},
			dotMatrixRenderStyle: {
				type: String,
				enum: ['dots', 'constellation', 'hexgrid', 'aurora', 'glyphs'],
				default: 'dots',
			},
			dotMatrixAnimation: {
				type: String,
				enum: ['animate', 'static', 'always'],
				default: 'animate',
			},
			windowControls: {
				type: String,
				enum: ['system', 'windows', 'macos', 'xernerx', 'capsule', 'squircle', 'minimal'],
				default: 'system',
			},
			uiIconStyle: {
				type: String,
				enum: ['standard', 'duotone', 'bold', 'precision'],
				default: 'standard',
			},
			ambientScene: {
				type: String,
				enum: ['default', 'mesh_lava', 'cyber_grid', 'topography', 'nebula_cosmos', 'prism_caustics'],
				default: 'default',
			},
			surfaceStyle: {
				type: String,
				enum: ['default', 'crystal', 'holographic', 'neon', 'obsidian'],
				default: 'default',
			},
			cursorFx: {
				type: String,
				enum: ['default', 'starlight_trail', 'plasma_sparks', 'cyber_reticle', 'sonic_rings', 'aurora_ribbon'],
				default: 'default',
			},
			overlaySkin: {
				type: String,
				enum: ['default', 'hud_tactical', 'frosted_prism', 'neon_arcade', 'minimal_pill'],
				default: 'default',
			},
		},
	},
	{ timestamps: true }
);

export default schema;
