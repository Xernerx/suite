/** @format */
'use client';

import { usePlatform, useSidebar, useToast } from '@xernerx/providers';

import { Footer } from './Footer';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function Page({ children }: { children: React.ReactNode }) {
	const { device } = usePlatform();
	const { data: session, status } = useSession();
	const { state } = useSidebar();
	const { toast } = useToast();

	useEffect(() => {
		if (session?.user) {
			toast({ title: status, description: `Hello ${session.user.name}` });
		}
	}, [session, status, toast]);

	// Footer only renders when the sidebar is hidden
	const showFooter = state === 'hidden';

	return (
		<main className='dark flex h-screen w-full flex-col overflow-hidden bg-(--background)'>
			{/* Header stays completely fixed at the top */}
			<Header />

			{/* Middle layout container filling the screen */}
			<div className='flex flex-1 overflow-hidden'>
				<Sidebar />

				{/* Scrollable Content Area */}
				<div
					className={`h-full flex-1 overflow-y-auto bg-(--foreground) shadow-inner
                        ${device === 'mobile' || state === 'hidden' ? 'rounded-t-xl' : 'rounded-tl-xl'} 
                    `}>
					<div className={`flex flex-col ${showFooter ? 'min-h-full justify-between' : ''}`}>
						<div className='p-5'>{children}</div>

						{/* Rendered only when sidebar is hidden, acting as an extra scrollable element */}
						{showFooter && <Footer />}
					</div>
				</div>
			</div>
		</main>
	);
}
