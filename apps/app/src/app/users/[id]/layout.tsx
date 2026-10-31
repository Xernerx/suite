/** @format */

import type { Metadata } from 'next';
import { buildUserMetadata } from '@/lib/profileMetadata';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
	const { id } = await params;
	return buildUserMetadata(id);
}

export default function UserLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
