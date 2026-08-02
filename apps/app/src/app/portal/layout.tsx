/** @format */

import { Book, LogIn } from 'lucide-react';

import Link from 'next/link';
import { authOptions } from '@/lib/schema/auth';
import { getServerSession } from 'next-auth';

export default async function Layout({ children }: { children: React.ReactNode }) {
	const session = await getServerSession(authOptions);

	if (!session) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center p-6">
				<div className="flex max-w-sm flex-col items-center gap-5 text-center" style={{ color: 'var(--text-main)' }}>
					{/* TITLE */}
					<h1 className="text-lg font-semibold">This area requires authentication</h1>

					{/* CONTEXT */}
					<p
						className="text-sm leading-6"
						style={{
							color: 'color-mix(in srgb, var(--text-main) 65%, transparent)',
						}}
					>
						Sign in to access developer features like managing bots, tokens, and statistics. If you’re just exploring, you can view the API documentation instead.
					</p>

					{/* ACTIONS */}
					<div className="flex gap-3">
						<Link
							href="/api/auth/signin"
							className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition hover:scale-[1.02]"
							style={{
								borderColor: 'var(--border)',
								background: 'var(--container)',
							}}
						>
							<LogIn className="h-4 w-4" />
							Sign in
						</Link>

						<Link
							href="/docs"
							className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition hover:scale-[1.02]"
							style={{
								borderColor: 'var(--border)',
								background: 'var(--container)',
								opacity: 0.85,
							}}
						>
							<Book className="h-4 w-4" />
							Docs
						</Link>
					</div>
				</div>
			</div>
		);
	}

	return <>{children}</>;
}
