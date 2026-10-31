/** @format */

import type { Metadata } from 'next';
import { buildOrganizationMetadata } from '@/lib/profileMetadata';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
	const { id } = await params;
	return buildOrganizationMetadata(id);
}

export default function OrganizationLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
