/** @format */

import crypto from 'crypto';

export function computeReadingTime(markdown: string): number {
	const words = String(markdown || '')
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/[#>*_`~\-!\[\]()]/g, ' ')
		.trim()
		.split(/\s+/)
		.filter(Boolean).length;
	return Math.max(1, Math.ceil(words / 200));
}

export function sanitizeSlug(raw: string): string {
	return String(raw || '')
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}

export const REACTION_KEYS = ['rocket', 'heart', 'sparkles', 'shield', 'fire'] as const;
export type ReactionKey = (typeof REACTION_KEYS)[number];

export function serializeBlogPost(doc: any, viewerId?: string | null, includeContent = true) {
	const raw = doc?.toObject ? doc.toObject() : doc;
	const reactionsObj = raw?.reactions || {};
	const reactionCounts: Record<ReactionKey, number> = {
		rocket: Array.isArray(reactionsObj.rocket) ? reactionsObj.rocket.length : 0,
		heart: Array.isArray(reactionsObj.heart) ? reactionsObj.heart.length : 0,
		sparkles: Array.isArray(reactionsObj.sparkles) ? reactionsObj.sparkles.length : 0,
		shield: Array.isArray(reactionsObj.shield) ? reactionsObj.shield.length : 0,
		fire: Array.isArray(reactionsObj.fire) ? reactionsObj.fire.length : 0,
	};
	const viewerReactions: ReactionKey[] = viewerId ? REACTION_KEYS.filter((k) => Array.isArray(reactionsObj[k]) && reactionsObj[k].includes(String(viewerId))) : [];
	const totalReactions = Object.values(reactionCounts).reduce((acc, n) => acc + n, 0);

	const out: Record<string, any> = {
		id: raw.id,
		slug: raw.slug,
		title: raw.title,
		subtitle: raw.subtitle || '',
		coverImage: raw.coverImage || null,
		coverGradient: raw.coverGradient || 'accent',
		category: raw.category || 'announcements',
		audience: raw.audience || 'all',
		tags: Array.isArray(raw.tags) ? raw.tags : [],
		privacy: raw.privacy || 'public',
		featured: Boolean(raw.featured),
		readingTimeMinutes: raw.readingTimeMinutes || computeReadingTime(raw.content || ''),
		author: raw.author || {
			id: 'system',
			username: 'Xernerx Studios',
			globalName: 'Xernerx Studios',
			avatar: null,
			role: 'Core Engineering',
		},
		publishedAt: raw.publishedAt || raw.createdAt || new Date().toISOString(),
		createdAt: raw.createdAt,
		updatedAt: raw.updatedAt,
		views: typeof raw.views === 'number' ? raw.views : 0,
		reactionCounts,
		totalReactions,
		viewerReactions,
		linkedAnnouncementId: raw.linkedAnnouncementId || null,
	};

	if (includeContent) {
		out.content = raw.content || '';
	}

	return out;
}

export const DEFAULT_BLOG_POSTS = [
	{
		id: 'blog-security-architecture-2026',
		slug: 'platform-and-bot-security-architecture',
		title: 'Platform & Bot Security Architecture: Zero Message Logging, 3-Tier Privacy & Cryptographic Webhooks',
		subtitle:
			'A deep dive into how Xernerx Studios protects your Discord communities, enforces strict data minimization across Virtue, To-Do List Bot, Metamorphosis, and Zodiac, and empowers you with self-service privacy controls.',
		coverGradient: 'emerald',
		category: 'security',
		audience: 'all',
		tags: ['Security', 'Privacy', 'Virtue', 'API Tokens', 'Webhooks'],
		privacy: 'public',
		featured: true,
		readingTimeMinutes: 5,
		author: {
			id: 'system',
			username: 'Xernerx Security',
			globalName: 'Xernerx Security & Trust',
			avatar: null,
			role: 'Security Engineering',
		},
		publishedAt: new Date('2026-11-03T12:00:00Z'),
		views: 142,
		reactions: {
			rocket: ['seed-1', 'seed-2', 'seed-3'],
			heart: ['seed-1', 'seed-4'],
			sparkles: ['seed-2'],
			shield: ['seed-1', 'seed-2', 'seed-3', 'seed-4', 'seed-5'],
			fire: ['seed-3'],
		},
		content: `## Security Built Into Every Layer

At **Xernerx Studios**, security and privacy are not afterthoughts—they are foundational engineering guarantees enforced across every web application, API gateway, CDN asset, and Discord bot daemon in the Xernerx Suite.

With the launch of our dedicated [Platform & Bot Security Hub](https://www.xernerx.com/security), we are publishing a transparent breakdown of how our infrastructure handles authentication, Discord bot telemetry, developer credentials, and user data rights.

## Zero Message Content Logging Across All Official Bots

Our official Discord bots are engineered around strict **Data Minimization**:

- **Virtue (Community Levelling & Engagement)**: Virtue processes message events in volatile memory solely to award XP when cooldown rules pass. **Virtue never logs, stores, or archives the text content, attachments, or embeds of your Discord messages.** Voice XP tracks elapsed unmuted time counters—never audio streams.
- **To-Do List Bot**: Stores only the task entries, checklists, and completion states you explicitly create via slash commands, plus encrypted OAuth tokens if you link third-party task providers.
- **Metamorphosis & Zodiac**: Operate as stateless interaction responders—computing transformations, horoscopes, and compatibility results on the fly without retaining personal message histories.

## Universal 3-Tier Privacy Truth

Every resource across the Xernerx Suite—including **User Profiles, Bots, Servers, Organizations, CDN Media, Haste Documents, and Blog Articles**—is governed by our universal 3-tier privacy engine:

1. **Public (\`public\`)**: Listed in public directories, leaderboards, and search results, and accessible by anyone.
2. **Limited (\`limited\`)**: Never listed in public directories, leaderboards, or search indexes, but accessible by anyone with the direct URL or ID.
3. **Private (\`private\`)**: Strictly private—never listed and accessible **only** by the resource owner (or authorized organization members) verified server-side.

## Scoped Developer API Tokens & HMAC-SHA256 Webhooks

For developers building on \`api.xernerx.com\` and \`portal.xernerx.com\`, we have expanded credential security:

\`\`\`ts
// Example: Verifying an incoming Xernerx Webhook with HMAC-SHA256
import crypto from 'crypto';

export function verifyXernerxWebhook(rawBody: string, signatureHeader: string, secret: string): boolean {
	const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
	return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
}
\`\`\`

- **Granular Scopes, TTL Expirations & IP Allowlists**: Developer Bearer tokens (\`xrn_...\`) are hashed at rest and support per-token expiration dates (\`expiresAt\`) and CIDR/IP allowlists (\`allowedIps\`).
- **Signed Webhook Payloads**: Every outbound vote, review, and release webhook is signed with \`X-Xernerx-Signature\` and \`X-Xernerx-Timestamp\` to prevent replay attacks.

## Self-Service Data Control

You are always in control of your identity on [account.xernerx.com](https://account.xernerx.com):

- **Download My Data (\`.json\`)**: Export a complete machine-readable archive of your profile, settings, and activity at any time.
- **Delete Virtue Data**: Wipe all Virtue XP and levelling records across all servers while keeping your main Xernerx account intact.
- **Automatic Service Profiles Opt-Out**: Toggle whether Discord bots like Virtue may automatically initialize XP profiles when you chat in participating servers.
- **Instant Account Erasure**: Permanently delete your profile or full account with immediate cascading cleanup.`,
	},
	{
		id: 'blog-customization-update-2026',
		slug: 'the-customization-update-stage-render-forms-and-cosmetics-studio',
		title: 'The Customization Update: Stage Render Forms, Profile Cosmetics Studio, Ambient Scenes & Desktop Crests',
		subtitle:
			'Personalize every pixel of the Xernerx Suite with 5 morphing Stage Render Forms, 12 Dot-Matrix formations, animated Avatar Frame Shaders, Glass Surface Styles, Cursor FX, and 10 Desktop App Icon Crests.',
		coverGradient: 'accent',
		category: 'product',
		audience: 'end-user',
		tags: ['Credit Store', 'Cosmetics', 'Appearance', 'Desktop App', 'Themes'],
		privacy: 'public',
		featured: false,
		readingTimeMinutes: 4,
		author: {
			id: 'system',
			username: 'Xernerx Design',
			globalName: 'Xernerx Product & Design',
			avatar: null,
			role: 'Design Systems',
		},
		publishedAt: new Date('2026-11-02T18:00:00Z'),
		views: 218,
		reactions: {
			rocket: ['seed-1', 'seed-2'],
			heart: ['seed-1', 'seed-2', 'seed-3'],
			sparkles: ['seed-1', 'seed-2', 'seed-3', 'seed-4'],
			shield: [],
			fire: ['seed-2', 'seed-4'],
		},
		content: `## Beyond the Dot Matrix: Morphing Stage Render Forms

When you launch any application in the Xernerx Suite, our signature interactive loading animation seamlessly morphs into your background stage. With **The Customization Update**, you can now transform how the entire stage renders—while preserving that signature smooth morph transition:

- **Classic Dot Matrix (\`dots\`)**: Crisp, tactile circular particle matrix.
- **Constellation Mesh (\`constellation\`)**: Star-nodes linked by dynamic proximity filaments that react to cursor gravity.
- **Cyber Hex-Grid (\`hexgrid\`)**: Precision geometric hexagonal cells that pulse with your active \`--accent\` color.
- **Aurora Bokeh (\`aurora\`)**: Soft, luminous atmospheric orbs that drift and blend across the canvas.
- **Matrix Glyphs (\`glyphs\`)**: Crisp technical vector crosshairs and data glyphs.

## Profile Identity Cosmetics Studio

Head over to [account.xernerx.com](https://account.xernerx.com) to open the **Profile Identity Cosmetics Studio** with full unsaved-change protection (\`Ctrl + S\` to save, \`Alt + R\` to reset):

1. **Avatar Frame Shaders**: Equip animated rings around your avatar, including *Plasma Ring*, *Holo Crown*, *Cyber Hex*, and *Solar Flare*.
2. **Animated Nameplate Shaders**: Style your display name with *Aurora Shimmer*, *Synthwave Chrome*, or *Nebula Pulse*.
3. **Profile Card Themes**: Transform your public profile card and directory appearances with *Holographic Foil*, *Celestial Starlight*, or *Obsidian Gold*.

## Ambient Canvas Scenes, Glass Surfaces & Cursor FX

Unlock individual perks or value bundles in the [Credit Store](https://store.xernerx.com/?tab=credits) using Virtual Credits earned from daily gifts, voting streaks, and milestones:

- **Ambient Canvas Scenes**: *Lava Mesh*, *Synthwave Cyber Grid*, *Topographic Contours*, *Deep Nebula Cosmos*, and *Prism Caustics*.
- **Glass Surface Styles**: *Crystal Clear*, *Holographic Iridescent*, *Neon Edge*, and *Obsidian Matte*.
- **Interactive Cursor FX**: *Starlight Trail*, *Plasma Click Sparks*, *Cyber Reticle*, *Sonic Click Rings*, and *Aurora Ribbon*.
- **Header & Window Controls + UI Icon Packs**: Switch between *Capsule*, *Squircle*, *Minimal*, *macOS Traffic Lights*, and *Windows* header styles—and pair them with *Duotone*, *Bold*, or *Precision* UI Icon Packs.
- **10 Desktop App Icon Crests**: Customize your Windows taskbar and macOS dock icon in the [Xernerx Desktop App](https://www.xernerx.com/download).`,
	},
	{
		id: 'blog-suite-architecture-2026',
		slug: 'inside-the-xernerx-suite-architecture',
		title: 'Inside the Xernerx Suite: Real-Time WebSocket Routing, Private Edge Media & Scoped API Tokens',
		subtitle: 'How our TypeScript monorepo powers 13 synchronized web applications, bidirectional WebSocket RPC telemetry, private @vercel/blob media streaming, and @xernerx/* developer SDKs.',
		coverGradient: 'cyan',
		category: 'engineering',
		audience: 'developer',
		tags: ['Architecture', 'TypeScript', 'WebSockets', 'SDK', 'Next.js'],
		privacy: 'public',
		featured: false,
		readingTimeMinutes: 4,
		author: {
			id: 'system',
			username: 'Xernerx Engineering',
			globalName: 'Xernerx Core Engineering',
			avatar: null,
			role: 'Platform Architecture',
		},
		publishedAt: new Date('2026-11-01T15:00:00Z'),
		views: 96,
		reactions: {
			rocket: ['seed-1', 'seed-3'],
			heart: ['seed-2'],
			sparkles: ['seed-1'],
			shield: ['seed-2'],
			fire: ['seed-1', 'seed-2'],
		},
		content: `## One Monorepo, Thirteen Synchronized Applications

The **Xernerx Suite** is architected as a unified TypeScript monorepo orchestrating 13 web applications (\`www\`, \`api\`, \`cdn\`, \`account\`, \`app\`, \`docs\`, \`admin\`, \`info\`, \`store\`, \`portal\`, \`hosting\`, \`haste\`, and now \`blog\`), real-time microservices (\`services/websocket\`, \`services/bot\`, \`services/app\`), and our Electron desktop client (\`clients/desktop\`).

## Real-Time Telemetry via \`@xernerx/stats\` & \`@xernerx/websocket\`

Bot developers can stream live shard latency, guild counts, and command telemetry directly to \`api.xernerx.com\` and our WebSocket gateway:

\`\`\`ts
import { XernerxStats } from '@xernerx/stats';

const stats = new XernerxStats(client, {
	token: process.env.XERNERX_API_TOKEN!,
	intervalMs: 60_000,
});

stats.start();
\`\`\`

## Private Edge Media Streaming (\`cdn.xernerx.com/raw/[id]\`)

Unlike traditional static buckets where anyone who guesses a file URL can view it, \`cdn.xernerx.com\` stores uploads in private \`@vercel/blob\` storage and streams every asset through \`/raw/[id]\`. This allows us to enforce our **Universal 3-Tier Privacy Truth** at the edge—verifying owner session cookies on \`private\` files while serving \`public\` and \`limited\` assets with high-throughput cache headers.

Explore the full interactive REST API and WebSocket documentation at [docs.xernerx.com](https://docs.xernerx.com).`,
	},
];

export async function ensureSeededBlogPosts(BlogPostModel: any) {
	try {
		const count = await BlogPostModel.countDocuments();
		if (count === 0) {
			for (const post of DEFAULT_BLOG_POSTS) {
				await BlogPostModel.findOneAndUpdate({ slug: post.slug }, { $setOnInsert: { ...post, id: post.id || crypto.randomUUID() } }, { upsert: true });
			}
		}
	} catch (err) {
		console.warn('Failed to seed default blog posts:', err);
	}
}
