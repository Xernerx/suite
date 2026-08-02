/** @format */
'use client';

import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

type Bot = {
	id: string;
	description?: string;
	info?: string;
	owners?: string[];
	organization?: string;
	verified?: boolean;
	privacy?: 'public' | 'private' | 'limited';
	links?: Record<string, string>;
	commands?: { id: string; name: string; description: string }[];
};

export default function About({ bot }: { bot: Bot }) {
	const links = bot.links ?? {};
	const entries = Object.entries(links).filter(([, v]) => v);

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				gap: '1.25rem',
				marginTop: '1.5rem',
			}}
		>
			{/* ================= LINKS CONTAINER ================= */}
			{entries.length > 0 && (
				<div
					style={{
						border: '1px solid var(--border)',
						borderRadius: '0.75rem',
						background: 'var(--container)',
						padding: '0.75rem',
						display: 'flex',
						gap: '0.5rem',
						flexWrap: 'wrap',
					}}
				>
					{entries.map(([key, value]) => (
						<a
							key={key}
							href={value}
							target="_blank"
							style={{
								padding: '0.35rem 0.65rem',
								fontSize: '0.75rem',
								borderRadius: '0.5rem',
								border: '1px solid var(--border)',
								background: 'rgba(255,255,255,0.04)',
								opacity: 0.9,
							}}
						>
							{key}
						</a>
					))}
				</div>
			)}

			{/* ================= CONTENT CONTAINER ================= */}
			{(bot.info || bot.description) && (
				<div
					style={{
						border: '1px solid var(--border)',
						borderRadius: '0.75rem',
						background: 'var(--container)',
						padding: '1.25rem',
					}}
				>
					<div
						style={{
							fontWeight: 600,
							marginBottom: '0.75rem',
							fontSize: '0.95rem',
							opacity: 0.9,
						}}
					>
						About
					</div>

					<div
						style={{
							opacity: 0.85,
							lineHeight: 1.6,
							fontSize: '0.95rem',
						}}
					>
						<ReactMarkdown
							remarkPlugins={[remarkGfm]}
							rehypePlugins={[rehypeSanitize]}
							components={{
								h1: ({ children }) => <h1 style={{ fontSize: '1.4rem', marginTop: '1rem' }}>{children}</h1>,
								h2: ({ children }) => <h2 style={{ fontSize: '1.2rem', marginTop: '0.8rem' }}>{children}</h2>,
								p: ({ children }) => <p style={{ marginBottom: '0.6rem' }}>{children}</p>,
								a: ({ href, children }) => (
									<a
										href={href}
										target="_blank"
										style={{
											color: 'var(--accent)',
											textDecoration: 'underline',
										}}
									>
										{children}
									</a>
								),
								code: ({ children }) => (
									<code
										style={{
											background: 'rgba(255,255,255,0.08)',
											padding: '0.15rem 0.3rem',
											borderRadius: '0.3rem',
											fontSize: '0.85rem',
										}}
									>
										{children}
									</code>
								),
								ul: ({ children }) => <ul style={{ paddingLeft: '1.2rem' }}>{children}</ul>,
							}}
						>
							{bot.info || bot.description}
						</ReactMarkdown>
					</div>
				</div>
			)}
		</div>
	);
}
