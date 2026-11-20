/** @format */

import type { PositionCategory, YourAppsQuestion } from './types';

export interface PositionStarterTemplate {
	key: 'moderator' | 'helper' | 'appeal' | 'event' | 'bug' | 'poll';
	name: string;
	description: string;
	category: PositionCategory;
	anonymousResponses?: boolean;
	cooldown?: number;
	minimumJoinTime?: number;
	minimumAccountAge?: number;
	buildQuestions: () => YourAppsQuestion[];
}

const mkId = (idx: number) => `q_tpl_${idx}_${Math.random().toString(36).slice(2, 6)}`;

export const POSITION_STARTER_TEMPLATES: PositionStarterTemplate[] = [
	{
		key: 'moderator',
		name: 'Moderator Application',
		description: 'Help keep our community welcoming, active, and safe. Answer honestly and include as much detail as possible.',
		category: 'staff',
		cooldown: 604800,
		minimumJoinTime: 259200,
		minimumAccountAge: 2592000,
		buildQuestions: () => {
			const q1 = mkId(1);
			const q2 = mkId(2);
			const q3 = mkId(3);
			const q4 = mkId(4);
			const q5 = mkId(5);
			const q6 = mkId(6);
			return [
				{
					id: q1,
					question: 'What timezone are you in, and what hours are you usually active?',
					type: 'short',
					placeholder: 'e.g. UTC+1 • Weekdays 18:00–23:00',
					required: true,
					options: [],
					minLength: 3,
					maxLength: 256,
				},
				{ id: q2, question: 'How old are you?', type: 'number', placeholder: '16', required: true, options: [], minValue: 13, maxValue: 99 },
				{
					id: q3,
					question: 'Why would you like to join our moderation team?',
					type: 'paragraph',
					placeholder: 'Tell us what motivates you...',
					required: true,
					options: [],
					minLength: 30,
					maxLength: 1000,
				},
				{ id: q4, question: 'Have you moderated a Discord community before?', type: 'boolean', required: true, options: ['Yes', 'No'] },
				{
					id: q5,
					question: 'Which communities did you moderate, and what were your responsibilities?',
					type: 'paragraph',
					placeholder: 'Share server names, approximate size, and your role...',
					required: true,
					options: [],
					minLength: 15,
					maxLength: 1000,
					condition: { questionId: q4, operator: 'equals', value: 'Yes' },
				},
				{
					id: q6,
					question: 'Two members start arguing heatedly in general chat. How do you handle it?',
					type: 'paragraph',
					placeholder: 'Walk us through your steps...',
					required: true,
					options: [],
					minLength: 25,
					maxLength: 1000,
				},
			];
		},
	},
	{
		key: 'helper',
		name: 'Community Helper',
		description: 'Welcome newcomers, answer common questions, and help guide conversations across the server.',
		category: 'staff',
		cooldown: 259200,
		minimumJoinTime: 86400,
		buildQuestions: () => [
			{
				id: mkId(1),
				question: 'Which parts of the server are you most active and knowledgeable in?',
				type: 'paragraph',
				placeholder: 'Channels, games, or topics...',
				required: true,
				options: [],
				minLength: 15,
				maxLength: 800,
			},
			{ id: mkId(2), question: 'How many hours per week can you comfortably dedicate?', type: 'select', required: true, options: ['2–5 hours', '5–10 hours', '10–20 hours', '20+ hours'] },
			{
				id: mkId(3),
				question: 'Why do you think you would make a great Helper?',
				type: 'paragraph',
				placeholder: 'Share a bit about yourself...',
				required: true,
				options: [],
				minLength: 20,
				maxLength: 1000,
			},
		],
	},
	{
		key: 'appeal',
		name: 'Moderation Appeal',
		description: 'Submit an appeal regarding a mute, warning, or restriction in the server.',
		category: 'appeal',
		cooldown: 604800,
		buildQuestions: () => [
			{ id: mkId(1), question: 'Which action are you appealing?', type: 'radio', required: true, options: ['Timeout / Mute', 'Warning', 'Role Restriction', 'Other'] },
			{
				id: mkId(2),
				question: 'What led to the moderation action in your own words?',
				type: 'paragraph',
				placeholder: 'Explain clearly and honestly...',
				required: true,
				options: [],
				minLength: 20,
				maxLength: 1000,
			},
			{
				id: mkId(3),
				question: 'Why should this action be reconsidered, and what will change going forward?',
				type: 'paragraph',
				placeholder: 'Share why we should lift the restriction...',
				required: true,
				options: [],
				minLength: 20,
				maxLength: 1000,
			},
			{ id: mkId(4), question: 'Optional screenshots or supporting context', type: 'file', placeholder: 'Attach screenshots if relevant', required: false, options: [] },
		],
	},
	{
		key: 'event',
		name: 'Event Host Signup',
		description: 'Pitch and host an upcoming game night, tournament, or community activity!',
		category: 'event',
		buildQuestions: () => [
			{
				id: mkId(1),
				question: 'What type of event would you like to host?',
				type: 'select',
				required: true,
				options: ['Game Night', 'Tournament', 'Movie / Watch Party', 'Voice Stage / Q&A', 'Creative Contest'],
			},
			{
				id: mkId(2),
				question: 'Describe your event idea, rules, and approximate duration',
				type: 'paragraph',
				placeholder: 'How will it work and what is needed?',
				required: true,
				options: [],
				minLength: 20,
				maxLength: 1000,
			},
			{ id: mkId(3), question: 'Preferred day of the week', type: 'multiselect', required: true, options: ['Friday', 'Saturday', 'Sunday', 'Weekdays'] },
		],
	},
	{
		key: 'bug',
		name: 'Bug / Issue Report',
		description: 'Found something broken? Send structured reproduction steps and screenshots to the team.',
		category: 'feedback',
		buildQuestions: () => [
			{
				id: mkId(1),
				question: 'Where did you encounter the issue?',
				type: 'select',
				required: true,
				options: ['Discord Server / Channels', 'Bot Commands', 'Web Portal', 'Roles / Permissions'],
			},
			{
				id: mkId(2),
				question: 'Steps to reproduce & what happened instead',
				type: 'paragraph',
				placeholder: '1. Go to... 2. Click... 3. Expected vs Actual...',
				required: true,
				options: [],
				minLength: 15,
				maxLength: 1000,
			},
			{ id: mkId(3), question: 'Attach a screenshot or clip (Optional)', type: 'file', required: false, options: [] },
		],
	},
	{
		key: 'poll',
		name: 'Community Pulse Poll',
		description: 'Quick anonymous community poll — vote in Discord or on the web!',
		category: 'poll',
		anonymousResponses: true,
		buildQuestions: () => [
			{
				id: mkId(1),
				question: 'Which upcoming community activity are you most excited for?',
				type: 'radio',
				required: true,
				options: ['Weekend Game Tournaments', 'Community Movie Nights', 'Creative / Art Showcases', 'Voice Hangout Stages'],
			},
			{
				id: mkId(2),
				question: 'Any extra ideas or suggestions for the server? (Optional)',
				type: 'paragraph',
				placeholder: 'Share your thoughts...',
				required: false,
				options: [],
				minLength: 0,
				maxLength: 800,
			},
		],
	},
];
