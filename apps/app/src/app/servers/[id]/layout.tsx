/** @format */

import type { Metadata } from 'next';
import { buildServerMetadata, getServerSeoData } from '@/lib/profileMetadata';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
	const { id } = await params;
	return buildServerMetadata(id);
}

export default async function ServerLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
	const { id } = await params;
	const seo = await getServerSeoData(id);

	return (
		<>
			{seo && (
				<>
					<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.jsonLd) }} />
					<article className="sr-only">
						<h1>{`${seo.name} — Discord Server`}</h1>
						<p>{seo.description}</p>
						{seo.info && seo.info !== seo.description && (
							<section>
								<h2>{`About ${seo.name}`}</h2>
								<p>{seo.info}</p>
							</section>
						)}
					</article>
				</>
			)}
			{children}
		</>
	);
}
