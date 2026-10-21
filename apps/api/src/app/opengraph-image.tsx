/** @format */

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Xernerx API — Core Backend Gateway & REST Endpoints';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
	return new ImageResponse(
		<div
			style={{
				height: '100%',
				width: '100%',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'flex-start',
				justifyContent: 'space-between',
				backgroundColor: '#0b0d12',
				backgroundImage: 'radial-gradient(circle at 85% 20%, rgba(124, 58, 237, 0.28), transparent 55%)',
				padding: '72px 80px',
				color: '#ffffff',
				fontFamily: 'sans-serif',
			}}
		>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: '14px',
					padding: '10px 22px',
					borderRadius: '9999px',
					backgroundColor: 'rgba(124, 58, 237, 0.16)',
					border: '1px solid rgba(124, 58, 237, 0.4)',
					color: '#c4b5fd',
					fontSize: '22px',
					fontWeight: 700,
				}}
			>
				api.xernerx.com
			</div>

			<div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '960px' }}>
				<div style={{ fontSize: '68px', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.02em' }}>Xernerx API Gateway</div>
				<div style={{ fontSize: '30px', color: '#9ca3af', lineHeight: 1.4 }}>Core RESTful endpoints, Bearer token validation, Discord guild synchronization, and webhook routing.</div>
			</div>

			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', fontSize: '22px', color: '#6b7280' }}>
				<span>Xernerx Studios</span>
				<span style={{ color: '#a78bfa', fontWeight: 700 }}>REST v1 • Core • Webhooks</span>
			</div>
		</div>,
		{ ...size }
	);
}
