/** @format */

import type { Metadata } from 'next';
import { buildBotMetadata, getBotSeoData } from '@/lib/profileMetadata';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
	const { id } = await params;
	return buildBotMetadata(id);
}

export default async function BotLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
	const { id } = await params;
	const seo = await getBotSeoData(id);

	return (
		<>
			{seo && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.jsonLd) }} />}
			{children}
		</>
	);
}
