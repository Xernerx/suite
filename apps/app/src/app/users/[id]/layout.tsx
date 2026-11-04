/** @format */

import type { Metadata } from 'next';
import { buildUserMetadata, getUserSeoData } from '@/lib/profileMetadata';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
	const { id } = await params;
	return buildUserMetadata(id);
}

export default async function UserLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
	const { id } = await params;
	const seo = await getUserSeoData(id);

	return (
		<>
			{seo && (
				<>
					<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.jsonLd) }} />
					<article className="sr-only">
						<h1>{seo.name}</h1>
						<p>{seo.description}</p>
						{seo.info && seo.info !== seo.description && <p>{seo.info}</p>}
					</article>
				</>
			)}
			{children}
		</>
	);
}
