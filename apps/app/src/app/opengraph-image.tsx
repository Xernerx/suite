/** @format */

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Xernerx Dashboard & Explorer';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
	return new ImageResponse(
		<div
			style={{
				height: '100%',
				width: '100%',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
				backgroundColor: '#09090b',
				backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.25), transparent 55%)',
				padding: '72px',
				color: '#ffffff',
				fontFamily: 'sans-serif',
			}}
		>
			<div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
				<div
					style={{
						padding: '8px 18px',
						borderRadius: '999px',
						backgroundColor: 'rgba(99, 102, 241, 0.15)',
						border: '1px solid rgba(99, 102, 241, 0.4)',
						color: '#818cf8',
						fontSize: '20px',
						fontWeight: 700,
					}}
				>
					app.xernerx.com
				</div>
			</div>

			<div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
				<div style={{ fontSize: '68px', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05 }}>Xernerx Dashboard</div>
				<div style={{ fontSize: '30px', color: '#a1a1aa', maxWidth: '880px', lineHeight: 1.4 }}>
					Explore verified Discord bots and communities, configure Virtue, and manage your developer portal.
				</div>
			</div>

			<div
				style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '28px', color: '#71717a', fontSize: '20px' }}
			>
				<span>Xernerx Studios</span>
				<span>Dashboard & Directory</span>
			</div>
		</div>,
		{ ...size }
	);
}
