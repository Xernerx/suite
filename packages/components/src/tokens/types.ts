/** @format */

export type TokenStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface TokenListInfo {
	_id: string;
	id?: string;
	name: string;
	status: TokenStatus;
	permissions?: {
		secure?: boolean;
		websocket?: boolean;
		admin?: boolean;
	};
}

export interface FullToken extends TokenListInfo {
	id: string;
	owners: string[];
	botId?: string;
	createdAt: string;
}

export interface Token {
	_id: string;
	id: string;
	name: string;
	owners?: string[];
	status: TokenStatus;
	permissions?: {
		secure?: boolean;
		websocket?: boolean;
	};
	botId?: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface UserOption {
	id: string;
	name?: string;
	global_name?: string;
	username?: string;
	avatar?: string;
}
