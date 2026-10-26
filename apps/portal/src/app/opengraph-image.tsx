/** @format */

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Xernerx Developer & Organization Portal';
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
				backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(168, 85, 247, 0.25), transparent 55%)',
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
						backgroundColor: 'rgba(168, 85, 247, 0.15)',
						border: '1px solid rgba(168, 85, 247, 0.4)',
						color: '#c084fc',
						fontSize: '20px',
						fontWeight: 700,
					}}
				>
					portal.xernerx.com
				</div>
			</div>

			<div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
				<div style={{ fontSize: '68px', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05 }}>Xernerx Developer Portal</div>
				<div style={{ fontSize: '30px', color: '#a1a1aa', maxWidth: '880px', lineHeight: 1.4 }}>
					Manage developer organizations, publish Discord bots, configure webhooks, and monitor application telemetry.
				</div>
			</div>

			<div
				style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '28px', color: '#71717a', fontSize: '20px' }}
			>
				<span>Xernerx Studios</span>
				<span>Developer & Organization Studio</span>
			</div>
		</div>,
		{ ...size }
	);
}
