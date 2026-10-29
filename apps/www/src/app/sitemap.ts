/** @format */

import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
	const now = new Date('2026-10-29T00:00:00Z');

	return [
		// WWW (www.xernerx.com)
		{ url: 'https://www.xernerx.com/', lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
		{ url: 'https://www.xernerx.com/download', lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
		{ url: 'https://www.xernerx.com/invites', lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
		{ url: 'https://www.xernerx.com/applications', lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
		{ url: 'https://www.xernerx.com/contact', lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
		{ url: 'https://www.xernerx.com/terms', lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
		{ url: 'https://www.xernerx.com/privacy', lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
		{ url: 'https://www.xernerx.com/cookies', lastModified: now, changeFrequency: 'monthly', priority: 0.5 },

		// APP (app.xernerx.com)
		{ url: 'https://app.xernerx.com/', lastModified: now, changeFrequency: 'daily', priority: 0.9 },
		{ url: 'https://app.xernerx.com/bots', lastModified: now, changeFrequency: 'daily', priority: 0.9 },
		{ url: 'https://app.xernerx.com/servers', lastModified: now, changeFrequency: 'daily', priority: 0.9 },
		{ url: 'https://app.xernerx.com/bots/782105629572464652', lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
		{ url: 'https://app.xernerx.com/bots/950251264095162418', lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
		{ url: 'https://app.xernerx.com/bots/881678826906730547', lastModified: now, changeFrequency: 'weekly', priority: 0.8 },

		// DOCS (docs.xernerx.com)
		{ url: 'https://docs.xernerx.com/', lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
		{ url: 'https://docs.xernerx.com/api', lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
		{ url: 'https://docs.xernerx.com/api/v1', lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
		{ url: 'https://docs.xernerx.com/packages', lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
		{ url: 'https://docs.xernerx.com/cdn', lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
		{ url: 'https://docs.xernerx.com/websocket', lastModified: now, changeFrequency: 'monthly', priority: 0.7 },

		// INFO (info.xernerx.com)
		{ url: 'https://info.xernerx.com/', lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
		{ url: 'https://info.xernerx.com/roadmap', lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
		{ url: 'https://info.xernerx.com/suggestions', lastModified: now, changeFrequency: 'daily', priority: 0.8 },
		{ url: 'https://info.xernerx.com/issues', lastModified: now, changeFrequency: 'daily', priority: 0.7 },
		{ url: 'https://info.xernerx.com/changelog', lastModified: now, changeFrequency: 'daily', priority: 0.8 },
		{ url: 'https://info.xernerx.com/faq', lastModified: now, changeFrequency: 'monthly', priority: 0.8 },

		// STORE & PORTAL & HASTE
		{ url: 'https://store.xernerx.com/', lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
		{ url: 'https://portal.xernerx.com/', lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
		{ url: 'https://haste.xernerx.com/', lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
	];
}
