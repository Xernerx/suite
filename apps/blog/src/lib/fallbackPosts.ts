/** @format */

import type { BlogPostItem } from '@/components/types';

export const BLOG_SLUG_ALIASES: Record<string, string> = {
	'the-customization-update': 'the-customization-update-stage-render-forms-and-cosmetics-studio',
	'customization-update': 'the-customization-update-stage-render-forms-and-cosmetics-studio',
	'platform-and-bot-security': 'platform-and-bot-security-architecture',
	'security-architecture': 'platform-and-bot-security-architecture',
	'inside-the-xernerx-suite': 'inside-the-xernerx-suite-architecture',
};

export function normalizeBlogSlug(raw: string): string {
	return String(raw || '')
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}

export function getBlogSlugCandidates(rawSlug: string): string[] {
	const clean = String(rawSlug || '')
		.trim()
		.toLowerCase();
	const normalized = normalizeBlogSlug(rawSlug);
	const set = new Set<string>([clean, normalized].filter(Boolean));
	if (BLOG_SLUG_ALIASES[normalized]) {
		set.add(BLOG_SLUG_ALIASES[normalized]);
	}
	for (const [alias, canonical] of Object.entries(BLOG_SLUG_ALIASES)) {
		if (canonical === normalized) {
			set.add(alias);
		}
	}
	return Array.from(set);
}

export const FALLBACK_BLOG_POSTS: BlogPostItem[] = [
	{
		id: 'blog-security-architecture-2026',
		slug: 'platform-and-bot-security-architecture',
		title: 'Platform & Bot Security Architecture: Zero Message Logging, 3-Tier Privacy & Cryptographic Webhooks',
		subtitle:
			'A deep dive into how Xernerx Studios protects your Discord communities, enforces strict data minimization across Virtue, YourApps, To-Do List Bot, Metamorphosis, and Zodiac, and empowers you with self-service privacy controls.',
		content: `## Security Built Into Every Layer

At **Xernerx Studios**, security and privacy are foundational engineering guarantees enforced across every web application, API gateway, CDN asset, and Discord bot daemon in the Xernerx Suite.

With the launch of our dedicated [Platform & Bot Security Hub](https://www.xernerx.com/security), we are publishing a transparent breakdown of how our infrastructure handles authentication, Discord bot telemetry, developer credentials, and user data rights.

## Zero Message Content Logging Across All Official Bots

- **Virtue (Community Levelling & Engagement)**: Processes message events in volatile memory solely to award XP when cooldown rules pass—never logging or archiving message text or attachments.
- **YourApps (Forms & Applications)**: Operates over Modals V2 and authenticated WebSocket RPC without \`MessageContent\` intents.
- **To-Do List Bot, Metamorphosis & Zodiac**: Store only explicit slash-command checklists or compute stateless interaction responses on the fly.

## Universal 3-Tier Privacy Truth

Every resource across the Xernerx Suite is governed by **Public**, **Limited**, and **Private** visibility tiers verified server-side.`,
		coverImage: null,
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
		publishedAt: '2026-11-03T12:00:00.000Z',
		views: 142,
		reactionCounts: { rocket: 3, heart: 2, sparkles: 1, shield: 5, fire: 1 },
		totalReactions: 12,
		viewerReactions: [],
		linkedAnnouncementId: null,
	},
	{
		id: 'blog-customization-update-2026',
		slug: 'the-customization-update-stage-render-forms-and-cosmetics-studio',
		title: 'The Customization Update: Stage Render Forms, Profile Cosmetics Studio, Ambient Scenes & Desktop Crests',
		subtitle:
			'Personalize every pixel of the Xernerx Suite with 5 morphing Stage Render Forms, 12 Dot-Matrix formations, animated Avatar Frame Shaders, Glass Surface Styles, Cursor FX, and 10 Desktop App Icon Crests.',
		content: `## Beyond the Dot Matrix: Morphing Stage Render Forms

When you launch any application in the Xernerx Suite, our signature interactive loading animation seamlessly morphs into your background stage. With **The Customization Update**, you can transform how the entire stage renders:

- **Classic Dot Matrix (\`dots\`)**: Crisp, tactile circular particle matrix.
- **Constellation Mesh (\`constellation\`)**: Star-nodes linked by dynamic proximity filaments.
- **Cyber Hex-Grid (\`hexgrid\`)**: Precision geometric hexagonal cells pulsing with \`--accent\`.
- **Aurora Bokeh (\`aurora\`)**: Soft atmospheric orbs drifting across the canvas.
- **Matrix Glyphs (\`glyphs\`)**: Crisp technical vector crosshairs and data glyphs.

## Profile Identity Cosmetics Studio

Visit [account.xernerx.com](https://account.xernerx.com) to equip **Avatar Frame Shaders**, **Animated Nameplates**, and **Profile Card Themes**, or unlock **Ambient Canvas Scenes**, **Glass Surface Styles**, **Interactive Cursor FX**, and **Desktop App Icon Crests** in the [Credit Store](https://store.xernerx.com/?tab=credits).`,
		coverImage: null,
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
		publishedAt: '2026-11-02T18:00:00.000Z',
		views: 218,
		reactionCounts: { rocket: 2, heart: 3, sparkles: 4, shield: 0, fire: 2 },
		totalReactions: 11,
		viewerReactions: [],
		linkedAnnouncementId: null,
	},
	{
		id: 'blog-suite-architecture-2026',
		slug: 'inside-the-xernerx-suite-architecture',
		title: 'Inside the Xernerx Suite: Real-Time WebSocket Routing, Private Edge Media & Scoped API Tokens',
		subtitle: 'How our TypeScript monorepo powers 13 synchronized web applications, bidirectional WebSocket RPC telemetry, private @vercel/blob media streaming, and @xernerx/* developer SDKs.',
		content: `## One Monorepo, Thirteen Synchronized Applications

The **Xernerx Suite** is architected as a unified TypeScript monorepo orchestrating 13 web applications (\`www\`, \`api\`, \`cdn\`, \`account\`, \`app\`, \`docs\`, \`admin\`, \`info\`, \`store\`, \`portal\`, \`hosting\`, \`haste\`, and \`blog\`), real-time microservices (\`services/websocket\`, \`services/bot\`, \`services/app\`), and our Electron desktop client (\`clients/desktop\`).

## Private Edge Media Streaming (\`cdn.xernerx.com/raw/[id]\`)

\`cdn.xernerx.com\` stores uploads in private \`@vercel/blob\` storage and streams every asset through \`/raw/[id]\` to enforce our **Universal 3-Tier Privacy Truth** at the edge. Explore full documentation at [docs.xernerx.com](https://docs.xernerx.com).`,
		coverImage: null,
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
		publishedAt: '2026-11-01T15:00:00.000Z',
		views: 96,
		reactionCounts: { rocket: 2, heart: 1, sparkles: 1, shield: 1, fire: 2 },
		totalReactions: 7,
		viewerReactions: [],
		linkedAnnouncementId: null,
	},
];

export function findFallbackBlogPost(rawSlug: string): BlogPostItem | null {
	const candidates = getBlogSlugCandidates(rawSlug);
	const normalized = normalizeBlogSlug(rawSlug);
	return (
		FALLBACK_BLOG_POSTS.find(
			(p) => candidates.includes(p.slug) || candidates.includes(p.id) || (normalized.length >= 6 && (p.slug.startsWith(`${normalized}-`) || normalized.startsWith(`${p.slug}-`)))
		) || null
	);
}
