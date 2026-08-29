import { auth, permissions } from '@xernerx/lib';

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { getServerSession } from 'next-auth';

export async function GET(req: Request, { params }: { params: Promise<{ key: string[] }> }) {
	const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
	const protocol = req.headers.get('x-forwarded-proto') || 'http';
	const baseUrl = `${protocol}://${host}`;

	const { key } = await params;
	const keyString = key.join('/');

	const session = await getServerSession(auth);

	if (!session || !session.user) {
		// Redirect to login with a callback to this exact URL
		const callbackUrl = encodeURIComponent(`/setup/${keyString}`);
		return new NextResponse(null, {
			status: 307,
			headers: { Location: `/api/auth/signin?callbackUrl=${callbackUrl}` },
		});
	}

	// Safely decode any URL-encoded characters the browser might have injected (like %3D for =)
	const inputSecret = decodeURIComponent(keyString).trim();
	// Strip any accidental quotes that might exist in the .env file
	const envSecret = process.env.NEXTAUTH_SECRET?.replace(/["']/g, '').trim() || '';

	// Browsers and Next.js automatically collapse double slashes (//) into a single slash (/).
	// If the NextAuth secret happens to contain // (like yours does), the URL parameter will only have /.
	// To make this bulletproof, we strip all slashes from both strings before comparing.
	const safeInput = inputSecret.replace(/\//g, '');
	const safeEnv = envSecret.replace(/\//g, '');

	if (safeInput !== safeEnv) {
		console.warn('\n--- SETUP FAILED ---');
		console.warn('The secret you pasted in the URL does not perfectly match your .env file!');
		console.warn('Expected from .env :', safeEnv);
		console.warn('Received from URL  :', safeInput);
		console.warn('--------------------\n');
		// Invalid secret, pretend this route doesn't do anything special
		return new NextResponse(null, { status: 307, headers: { Location: '/' } });
	}

	console.log('\n--- SETUP SUCCESS ---');
	console.log('Secret matched perfectly! Initiating database patch for user:', (session.user as any).id);

	try {
		const db = await database('xernerx');
		const UserModel = (db.models.users as any).User;
		const RoleModel = (db.models.core as any).Role;

		// Security Check: If ANY role exists with wildcard permissions, setup is already complete
		// We check for 'permissions.roles' to ensure the setup completes fully.
		const existingAdminRole = await RoleModel.findOne({ 'permissions.roles': true });

		if (existingAdminRole) {
			console.warn('Admin setup was triggered but an admin already exists. Aborting.');
			return new NextResponse(null, { status: 307, headers: { Location: '/' } });
		}

		// Create a single object with all permissions set to true
		const perms = Object.fromEntries(Object.values(permissions).map((item: any) => [item.key, true]));

		// Setup: Create the master 'owner' role
		await RoleModel.findOneAndUpdate(
			{ id: 'owner' },
			{
				$set: {
					name: 'Owner',
					permissions: perms,
				},
			},
			{ upsert: true, new: true }
		);

		// Assign role to the current user
		await UserModel.updateOne(
			{ id: (session.user as any).id },
			{
				$addToSet: { roles: 'owner' },
			},
			{ upsert: true }
		);

		// Redirect to dashboard now that they have admin access
		return new NextResponse(null, { status: 307, headers: { Location: '/' } });
	} catch (error) {
		console.error('Setup failed:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
