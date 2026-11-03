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
			{seo && (
				<>
					<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.jsonLd) }} />
					<article className="sr-only">
						<h1>{`${seo.name} — Discord Bot`}</h1>
						<p>{seo.description}</p>
						{seo.info && seo.info !== seo.description && (
							<section>
								<h2>{`About ${seo.name}`}</h2>
								<p>{seo.info}</p>
							</section>
						)}
						{seo.tags.length > 0 && (
							<section>
								<h2>Tags &amp; Categories</h2>
								<ul>
									{seo.tags.map((tag) => (
										<li key={tag}>{tag}</li>
									))}
								</ul>
							</section>
						)}
						{seo.commands.length > 0 && (
							<section>
								<h2>{`${seo.name} Slash Commands`}</h2>
								<ul>
									{seo.commands.map((cmd) => (
										<li key={cmd.name}>{cmd.description ? `/${cmd.name} — ${cmd.description}` : `/${cmd.name}`}</li>
									))}
								</ul>
							</section>
						)}
					</article>
				</>
			)}
			{children}
		</>
	);
}
