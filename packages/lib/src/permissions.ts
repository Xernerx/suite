/** @format */

export interface PermissionDefinition {
	key: string;
	label: string;
	description: string;
	defaultValue: boolean;
}

export const permissions: PermissionDefinition[] = [
	{
		key: 'access',
		label: 'Dashboard Access',
		description: 'Allow or deny access to the Xernerx admin panel.',
		defaultValue: false,
	},
	{
		key: 'users',
		label: 'Manage Users',
		description: 'Permission to view, update, and delete platform users.',
		defaultValue: true,
	},
	{
		key: 'roles',
		label: 'Manage Roles',
		description: 'Permission to create, edit, and delete system roles.',
		defaultValue: false,
	},
	{
		key: 'tokens',
		label: 'Manage Tokens',
		description: 'Permission to generate, view, and revoke API tokens.',
		defaultValue: false,
	},
	{
		key: 'translations',
		label: 'Manage Translations',
		description: 'Permission to add and modify translations.',
		defaultValue: false,
	},
	{
		key: 'applications',
		label: 'Manage Applications',
		description: 'Permission review applications by users.',
		defaultValue: false,
	},
];
