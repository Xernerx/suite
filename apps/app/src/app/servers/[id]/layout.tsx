/** @format */

import type { Metadata } from 'next';
import { buildServerMetadata } from '@/lib/profileMetadata';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
	const { id } = await params;
	return buildServerMetadata(id);
}

export default function ServerLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
