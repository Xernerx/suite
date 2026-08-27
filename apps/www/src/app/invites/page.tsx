import { database } from '@xernerx/lib/server';
import { ENV } from '@xernerx/lib';
import { ArrowUpRight, Link } from 'lucide-react';
import React from 'react';

export const revalidate = 60; // Revalidate every minute

async function getBotProfile(clientId: string) {
	const apiHost = ENV.ENVIRONMENT === 'DEVELOPMENT' ? 'http://localhost:4001' : 'https://api.xernerx.com';
	try {
		const res = await fetch(`${apiHost}/core/users/${clientId}/discord`, { next: { revalidate: 3600 } });
		if (!res.ok) return null;
		return await res.json();
	} catch {
		return null;
	}
}

export default async function InvitesPage() {
	const invitesData = await (await database('xernerx')).models.core.AppInvite.find().sort({ createdAt: -1 });

	const invites = await Promise.all(
		invitesData.map(async (invite: any) => {
			const bot = await getBotProfile(invite.clientId);
			return {
				...invite.toObject(),
				botName: bot?.global_name || bot?.username || invite.name,
				botAvatar: bot?.avatarUrl || null,
			};
		})
	);

	return (
		<div className="min-h-screen py-32 relative">
			<div className="max-w-7xl mx-auto px-6 relative z-10">
				<div className="mb-16">
					<h1 className="text-5xl font-extrabold mb-4 text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
						Application Invites
					</h1>
					<p className="text-lg text-(--text-muted) max-w-2xl leading-relaxed">
						Quickly add our verified applications and services to your Discord server. These official invites are pre-configured with the exact permissions each bot needs to function
						flawlessly.
					</p>
				</div>

				{invites.length === 0 ? (
					<div className="text-center py-32 rounded-3xl bg-(--foreground)/30 backdrop-blur-xl border border-(--border)/10">
						<p className="text-(--text-muted)">No invites are currently available.</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						{invites.map((invite) => (
							<a
								key={invite.id}
								href={`/invites/${invite.id}`}
								className="group flex flex-col p-8 rounded-[2rem] bg-(--foreground)/30 backdrop-blur-xl border border-(--border)/10 hover:border-(--accent)/40 shadow-xl hover:shadow-[0_10px_40px_-10px_color-mix(in_srgb,var(--accent)_30%,transparent)] transition-all overflow-hidden relative"
							>
								<div className="absolute top-0 right-0 p-8 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
									<ArrowUpRight className="text-(--text)" size={24} />
								</div>

								{invite.botAvatar ? (
									<img
										src={invite.botAvatar}
										alt={invite.botName}
										className="w-14 h-14 rounded-2xl mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-md"
									/>
								) : (
									<div className="w-14 h-14 rounded-2xl bg-(--accent)/10 flex items-center justify-center text-(--accent) mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
										<Link size={24} />
									</div>
								)}

								<h3 className="font-bold text-2xl text-(--text) mb-2">{invite.botName}</h3>
								<p className="text-sm text-(--text-muted) flex items-center gap-2">
									<span className="font-mono bg-(--foreground)/50 px-2 py-1 rounded text-xs">/invites/{invite.id}</span>
								</p>
							</a>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
