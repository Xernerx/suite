/** @format */

import type { Metadata } from 'next';
import { buildBotMetadata } from '@/lib/profileMetadata';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
	const { id } = await params;
	return buildBotMetadata(id);
}

export default function BotLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
