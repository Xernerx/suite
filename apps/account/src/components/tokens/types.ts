/** @format */

export type TokenStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface TokenListInfo {
	_id: string;
	id?: string;
	name: string;
	status: TokenStatus;
}

export interface FullToken extends TokenListInfo {
	id: string;
	owners: string[];
	botId?: string;
	createdAt: string;
}

export interface UserOption {
	id: string;
	name?: string;
	global_name?: string;
	username?: string;
	avatar?: string;
}
