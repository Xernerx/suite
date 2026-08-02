/** @format */
'use client';

import { usePlatform, useSidebar } from '@xernerx/providers';

import { Footer } from './Footer';
import { Header } from './Header';
import NextTopLoader from 'nextjs-toploader';
import { Sidebar } from './Sidebar';

export function Page({ children }: { children: React.ReactNode }) {
	const { device } = usePlatform();
	const { state } = useSidebar();

	// Footer only renders when the sidebar is hidden
	const showFooter = state === 'hidden';

	return (
		<main className='dark flex h-screen w-full flex-col overflow-hidden bg-(--background)'>
			{/* Header stays completely fixed at the top */}
			<Header />

			{/* Middle layout container filling the screen */}
			<div className='flex flex-1 overflow-hidden'>
				<NextTopLoader color='var(--accent)' showSpinner={false} shadow='none' height={3} />

				<Sidebar />

				{/* Scrollable Content Area with a prominent, symmetrical radial and linear accent gradient */}
				<div
					className={`relative h-full flex-1 overflow-y-auto shadow-inner
                        ${device === 'mobile' || state === 'hidden' ? 'rounded-t-xl' : 'rounded-tl-xl'} 
                    `}
					style={{
						background:
							'radial-gradient(circle at 50% 15%, color-mix(in srgb, var(--accent) 30%, var(--foreground)) 0%, var(--foreground) 75%), linear-gradient(135deg, color-mix(in srgb, var(--accent) 20%, var(--foreground)) 0%, var(--foreground) 50%, color-mix(in srgb, var(--accent) 20%, var(--foreground)) 100%)',
					}}>
					<div className={`relative z-10 flex flex-col ${showFooter ? 'min-h-full justify-between' : ''}`}>
						<div style={{ padding: 'var(--ui-gap)' }}>{children}</div>

						{/* Rendered only when sidebar is hidden, acting as an extra scrollable element */}
						{showFooter && <Footer />}
					</div>
				</div>
			</div>
		</main>
	);
}
