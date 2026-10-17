/** @format */

export interface Token {
	_id: string;
	id: string;
	name: string;
	owners?: string[];
	status: 'active' | 'inactive' | 'suspended' | 'pending';
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
