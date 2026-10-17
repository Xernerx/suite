/** @format */

export interface Question {
	id: string;
	type: string; // 'text' | 'textarea' | 'select' | 'checkbox' | 'radio'
	question: string;
	required: boolean;
	options: string[];
}

export interface ApplicationConfig {
	id: string;
	name: string;
	description: string;
	rewardRole: string;
	status: string;
	public: boolean;
	requireLogin: boolean;
	createdAt: string;
	benefits: string[];
	requirements: string[];
	questions: Question[];
}

export interface Role {
	id: string;
	name?: string;
	role?: string;
	sync?: boolean;
}

export interface ApplicationFormData {
	id: string;
	name: string;
	description: string;
	rewardRole: string;
	status: string;
	public: boolean;
	requireLogin: boolean;
	benefits: string[];
	requirements: string[];
	questions: Question[];
}
