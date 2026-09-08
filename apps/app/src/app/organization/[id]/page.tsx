/** @format */
'use client';

import { useEffect, useState, use } from 'react';
import { useDictionary, useEnvironment, useSidebar, useSession } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Button } from '@xernerx/ui';
import { User, ArrowLeft, Settings, Users, Bot, Server, LayoutDashboard, Building2, Compass } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Header from './components/Header';
import Profile from './components/Profile';

export default function OrganizationPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = use(params);
	const router = useRouter();
	const { getEnvUrl, isReady } = useEnvironment();
	const { view, setNavItems, show, hide } = useSidebar();
	const { t } = useDictionary();
	const { data: session } = useSession();

	const [organization, setOrganization] = useState<any>(null);
	const [bots, setBots] = useState<any[]>([]);
	const [servers, setServers] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		show();

		const items: any[] = [
			{ label: t('app.dashboard.nav.explore') || 'Explore', href: '/', icon: Compass, category: 'Navigation' },
			{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, category: 'Navigation' },
			{ label: 'Developer Portal', href: '/portal', icon: Building2, category: 'Navigation' },
			{ label: 'Go Back', onClick: () => router.back(), icon: ArrowLeft, category: 'Navigation' },
			{ label: 'Profile', view: 'profile', icon: User, category: 'Organization Details' },
		];

		if (bots.length > 0) {
			items.push(
				...bots.map((b) => ({
					label: b.discord?.global_name || b.discord?.username || b.name || 'Unknown Bot',
					href: `/bots/${b.id}`,
					icon: b.discord?.avatar
						? () => <img src={`https://cdn.discordapp.com/avatars/${b.id}/${b.discord.avatar}.png?size=64`} alt={b.name} className="w-5 h-5 rounded-full object-cover" />
						: Bot,
					category: 'Published Bots',
				}))
			);
		}

		if (servers.length > 0) {
			items.push(
				...servers.map((s) => ({
					label: s.name,
					href: `/servers/${s.id}`,
					icon: s.iconUrl
						? () => <img src={s.iconUrl} alt={s.name} className="w-5 h-5 rounded-full object-cover" />
						: s.icon
							? () => <img src={`https://cdn.discordapp.com/icons/${s.id}/${s.icon}.png?size=64`} alt={s.name} className="w-5 h-5 rounded-full object-cover" />
							: Server,
					category: 'Official Servers',
				}))
			);
		}

		const uid = (session as any)?.user?.id;
		if (organization && uid && (organization.owner === uid || organization.members?.includes(uid))) {
			items.push({ label: 'Settings', href: `/portal?tab=organizations&org=${organization._id}`, icon: Settings, category: 'Management' });
		}

		setNavItems(items);
		return () => hide();
	}, [setNavItems, show, hide, organization, session, bots, servers]);

	useEffect(() => {
		setOrganization(null);
		setLoading(true);
	}, [id]);

	useEffect(() => {
		if (!isReady) return;
		const fetchData = async () => {
			try {
				const [orgRes, botsRes, serversRes] = await Promise.all([
					fetch(getEnvUrl(`https://api.xernerx.com/secure/organizations/${id}`)),
					fetch(getEnvUrl(`https://api.xernerx.com/secure/bots?organization=${id}`)),
					fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds?organization=${id}`)),
				]);

				if (orgRes.ok) {
					const orgData = await orgRes.json();

					// Fetch Discord profiles for owner and members
					const memberIds = [...new Set([orgData.owner, ...(orgData.members || [])])];

					// Fetch the member role mappings
					let memberRoleMappings: any[] = [];
					try {
						const membersApiRes = await fetch(getEnvUrl(`https://api.xernerx.com/secure/organizations/${id}/members`));
						if (membersApiRes.ok) {
							memberRoleMappings = await membersApiRes.json();
						}
					} catch (e) {
						console.error('Failed to fetch organization member roles mapping');
					}

					const membersWithDiscord = await Promise.all(
						memberIds.map(async (memberId: string) => {
							try {
								const res = await fetch(getEnvUrl(`https://api.xernerx.com/core/users/${memberId}/discord`));
								if (res.ok) {
									const discordData = await res.json();
									const roleMapping = memberRoleMappings.find((m) => m.userId === memberId);
									return {
										...discordData,
										id: memberId,
										roles: roleMapping?.roles || [],
									};
								}
							} catch (e) {
								console.error('Failed to fetch Discord data for member', memberId);
							}
							return { id: memberId, roles: [] };
						})
					);
					orgData.membersData = membersWithDiscord.filter((m) => m && m.username);

					setOrganization(orgData);
				}
				if (botsRes.ok) {
					const fetchedBots = await botsRes.json();

					const botsWithDiscord = await Promise.all(
						fetchedBots.map(async (b: any) => {
							try {
								const res = await fetch(getEnvUrl(`https://api.xernerx.com/core/users/${b.id}/discord`));
								if (res.ok) {
									b.discord = await res.json();
								}
							} catch (e) {
								console.error('Failed to fetch Discord data for bot', b.id);
							}
							return b;
						})
					);

					setBots(botsWithDiscord);
				}
				if (serversRes.ok) {
					setServers(await serversRes.json());
				}
			} catch (error) {
				console.error('Failed to fetch organization profile', error);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [id, getEnvUrl, isReady]);

	if (loading) {
		return (
			<div className="flex-1 flex items-center justify-center min-h-screen">
				<Loading />
			</div>
		);
	}

	if (!organization) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center min-h-screen text-center">
				<h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-fredoka)' }}>
					Organization Not Found
				</h2>
				<p className="text-(--text-muted) mb-8">This organization does not exist or is private.</p>
				<Link href="/">
					<Button variant="primary">Return Home</Button>
				</Link>
			</div>
		);
	}

	const currentView = view || 'profile';

	return (
		<div className="flex flex-col w-full min-h-screen pb-24">
			<Header organization={organization} id={id} servers={servers} />

			<div className="mt-4">{currentView === 'profile' && <Profile organization={organization} bots={bots} servers={servers} />}</div>
		</div>
	);
}
