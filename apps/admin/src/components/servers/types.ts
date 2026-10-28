/** @format */

export interface AdminServerSummary {
	id: string;
	name?: string;
	icon?: string | null;
	banner?: string | null;
	vanitySlug?: string;
	vanityUnlocked?: boolean;
	verified?: boolean;
	bot?: boolean;
	privacy?: 'public' | 'limited' | 'private' | string;
	widgets?: boolean;
	owner?: string | null;
	organization?: string | null;
	description?: string;
	info?: string;
	voteCount?: number;
	memberCount?: number;
	links?: Record<string, string>;
}
