/** @format */

export type ReactionKey = 'rocket' | 'heart' | 'sparkles' | 'shield' | 'fire';
export type BlogCategory = 'announcements' | 'security' | 'product' | 'engineering' | 'community';
export type BlogAudience = 'all' | 'end-user' | 'developer';

export interface BlogPostAuthor {
	id: string;
	username: string;
	globalName: string;
	avatar?: string | null;
	role?: string;
}

export interface BlogPostItem {
	id: string;
	slug: string;
	title: string;
	subtitle: string;
	content?: string;
	coverImage?: string | null;
	coverGradient?: string;
	category: BlogCategory;
	audience: BlogAudience;
	tags: string[];
	privacy: 'public' | 'limited' | 'private';
	featured: boolean;
	readingTimeMinutes: number;
	author: BlogPostAuthor;
	publishedAt: string;
	createdAt?: string;
	updatedAt?: string;
	views: number;
	reactionCounts: Record<ReactionKey, number>;
	totalReactions: number;
	viewerReactions: ReactionKey[];
	linkedAnnouncementId?: string | null;
}

export interface TocHeading {
	id: string;
	text: string;
	level: 2 | 3;
}

export interface MarkdownSection {
	id: string;
	title: string;
	body: string;
}

export function slugifyHeading(raw: string): string {
	return String(raw || '')
		.toLowerCase()
		.replace(/[`*_~[\]()]/g, '')
		.trim()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-');
}

export function parseMarkdownSections(markdown: string): { intro: string; sections: MarkdownSection[] } {
	if (!markdown) return { intro: '', sections: [] };
	const lines = markdown.split(/\r?\n/);
	const introLines: string[] = [];
	const sections: MarkdownSection[] = [];
	let currentSection: MarkdownSection | null = null;
	let inCodeFence = false;

	for (const line of lines) {
		if (line.trim().startsWith('```')) {
			inCodeFence = !inCodeFence;
		}
		if (!inCodeFence) {
			const m2 = line.match(/^##\s+(.+)$/);
			if (m2?.[1]) {
				if (currentSection) {
					currentSection.body = currentSection.body.trim();
					sections.push(currentSection);
				}
				const title = m2[1].replace(/[`*_~]/g, '').trim();
				const id = slugifyHeading(title) || `section-${sections.length + 1}`;
				currentSection = { id, title, body: '' };
				continue;
			}
		}

		if (currentSection) {
			currentSection.body += `${line}\n`;
		} else {
			introLines.push(line);
		}
	}

	if (currentSection) {
		currentSection.body = currentSection.body.trim();
		sections.push(currentSection);
	}

	return {
		intro: introLines.join('\n').trim(),
		sections,
	};
}

export function extractTocHeadings(markdown: string): TocHeading[] {
	const { sections } = parseMarkdownSections(markdown);
	return sections.map((s) => ({
		id: s.id,
		text: s.title,
		level: 2,
	}));
}
