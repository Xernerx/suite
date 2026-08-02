/** @format */

'use client';

import { signOut, useSession } from 'next-auth/react';

import { useEffect } from 'react';
import { useSidebar } from '@/providers/SidebarProvider';
import { useToast } from '@/providers/ToastProvider';
import { useUser } from '@/providers/UserProvider';

export default function Main({ children }: { children: React.ReactNode }) {
	const { state } = useSidebar();
	const { user } = useUser();
	const { data: session } = useSession();
	const { toast } = useToast();

	useEffect(() => {
		toast('Signing in...', 'info');
		if (session?.message === '401: Unauthorized' || user?.message === '401: Unauthorized') {
			signOut();

			return toast('Session expired, signing you out', 'error');
		}

		if (session) return toast('Signed in!', 'success');
	}, []);

	return (
		<main
			className={`flex-1 overflow-y-auto bg-(--bg-panel) ${state == 'hidden' ? 'rounded-xl' : 'rounded-tl-xl'} p-8`}
			style={{
				background: `var(--bg-effect), var(--bg-panel)`,
			}}
		>
			{children}
		</main>
	);
}
