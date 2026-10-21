/** @format */
'use client';

import { usePlatform, useSidebar } from '@xernerx/providers';

import { Footer } from './Footer';
import { Header } from './Header';
import { useWindowControlsStyle } from './HeaderWindowControls';
import NextTopLoader from 'nextjs-toploader';
import { Sidebar } from './Sidebar';

export function Page({ children }: { children: React.ReactNode }) {
	const { device } = usePlatform();
	const { state } = useSidebar();
	const { isRightAligned } = useWindowControlsStyle();

	// Footer only renders when the sidebar is hidden
	const showFooter = state === 'hidden';

	return (
		<div className="flex h-screen w-full flex-col overflow-hidden bg-(--background)" style={{ height: 'calc(100vh / var(--ui-zoom, 1))' }}>
			{/* Header stays completely fixed at the top */}
			<Header />

			{/* Middle layout container filling the screen */}
			<div className={`flex flex-1 overflow-hidden ${isRightAligned ? 'flex-row-reverse' : ''}`}>
				<NextTopLoader color="var(--accent)" showSpinner={false} shadow="none" height={3} />

				<Sidebar />

				{/* Scrollable Content Area with a prominent, symmetrical radial and linear accent gradient */}
				<div
					id="main-scroll-container"
					className={`relative h-full flex-1 overflow-y-auto shadow-inner
                        ${device === 'mobile' || state === 'hidden' ? 'rounded-t-xl' : isRightAligned ? 'rounded-tr-xl' : 'rounded-tl-xl'} 
                    `}
					style={{
						background:
							'radial-gradient(circle at 50% 15%, color-mix(in srgb, var(--accent) 30%, var(--foreground)) 0%, var(--foreground) 75%), linear-gradient(135deg, color-mix(in srgb, var(--accent) 20%, var(--foreground)) 0%, var(--foreground) 50%, color-mix(in srgb, var(--accent) 20%, var(--foreground)) 100%)',
					}}
				>
					<div className={`relative z-10 flex flex-col ${showFooter ? 'min-h-full justify-between' : ''}`}>
						<main className="relative z-10" style={{ padding: 'var(--ui-gap)' }}>
							{children}
						</main>

						{/* Rendered only when sidebar is hidden, acting as an extra scrollable element */}
						{showFooter && <Footer />}
					</div>
				</div>
			</div>
		</div>
	);
}
