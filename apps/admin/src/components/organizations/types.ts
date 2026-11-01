/** @format */

export interface AdminOrganizationSummary {
	_id?: string;
	id: string;
	name: string;
	icon?: string;
	iconUrl?: string;
	bannerUrl?: string;
	owner: string;
	members?: string[];
	description?: string;
	info?: string;
	verified?: boolean;
	privacy?: 'public' | 'limited' | 'private' | string;
	vanitySlug?: string;
	vanityUnlocked?: boolean;
	widgets?: boolean;
	treasuryBalance?: number;
	links?: Record<string, string>;
}
