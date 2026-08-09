// /** @format */

// import { authOptions } from '@/lib/schema/auth';
// import { getServerSession } from 'next-auth';
// import { redirect } from 'next/navigation';
// import { signOut } from 'next-auth/react';

// export default async function Layout({ children }: { children: React.ReactNode }) {
// 	const session = await getServerSession(authOptions);

// 	if (!session) redirect('/auth/login');

// 	return <>{children}</>;
// }
/** @format */

export default function Layout({ children }: { children: React.ReactNode }) {
	return children;
}
