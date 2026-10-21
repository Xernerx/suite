/** @format */
'use client';

import { useEffect, useState, use } from 'react';
import { useDictionary, useEnvironment, useSidebar, useSession } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Button } from '@xernerx/ui';
import { User, ArrowLeft, Settings, Bot, Server, LayoutDashboard, Building2, Compass } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Header from '@/components/users/Header';
import Profile from '@/components/users/Profile';

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = use(params);
	const router = useRouter();
	const { getEnvUrl, isReady } = useEnvironment();
	const { view, setNavItems, show, hide } = useSidebar();
	const { t } = useDictionary();
	const { data: session } = useSession();

	const [user, setUser] = useState<any>(null);
	const [discordUser, setDiscordUser] = useState<any>(null);
	const [bots, setBots] = useState<any[]>([]);
	const [organizations, setOrganizations] = useState<any[]>([]);
	const [servers, setServers] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [notFound, setNotFound] = useState(false);

	useEffect(() => {
		show();

		const items: any[] = [
			{ label: t('app.dashboard.nav.explore'), href: '/', icon: Compass, category: t('app.portal.categories.navigation') },
			{ label: t('app.portal.nav.dashboard'), href: '/dashboard', icon: LayoutDashboard, category: t('app.portal.categories.navigation') },
			{ label: t('app.home.text7'), href: '/portal', icon: Building2, category: t('app.portal.categories.navigation') },
			{ label: t('app.users.nav.goBack'), onClick: () => router.back(), icon: ArrowLeft, category: t('app.portal.categories.navigation') },
			{ label: t('app.users.nav.profile'), view: 'profile', icon: User, category: t('app.users.nav.userDetails') },
		];

		if (bots.length > 0) {
			items.push(
				...bots.map((b) => ({
					label: b.discord?.global_name || b.discord?.username || b.name || t('common.unknownBot'),
					href: `/bots/${b.id}`,
					icon: b.discord?.avatar
						? () => (
								<Image
									src={`https://cdn.discordapp.com/avatars/${b.id}/${b.discord.avatar}.png?size=64`}
									alt={b.name}
									width={20}
									height={20}
									unoptimized
									className="w-5 h-5 rounded-full object-cover"
								/>
							)
						: Bot,
					category: t('app.users.nav.publishedBots'),
				}))
			);
		}

		if (organizations.length > 0) {
			items.push(
				...organizations.map((o) => ({
					label: o.name,
					href: `/organization/${o._id}`,
					icon: o.iconUrl ? () => <Image src={getEnvUrl(o.iconUrl)} alt={o.name} width={20} height={20} unoptimized className="w-5 h-5 rounded-full object-cover" /> : Building2,
					category: t('app.users.nav.organizations'),
				}))
			);
		}

		if (servers.length > 0) {
			items.push(
				...servers.map((s) => ({
					label: s.name,
					href: `/servers/${s.id}`,
					icon: s.iconUrl
						? () => <Image src={s.iconUrl} alt={s.name} width={20} height={20} unoptimized className="w-5 h-5 rounded-full object-cover" />
						: s.icon
							? () => (
									<Image
										src={`https://cdn.discordapp.com/icons/${s.id}/${s.icon}.png?size=64`}
										alt={s.name}
										width={20}
										height={20}
										unoptimized
										className="w-5 h-5 rounded-full object-cover"
									/>
								)
							: Server,
					category: t('app.users.nav.officialServers'),
				}))
			);
		}

		const uid = (session as any)?.user?.id;
		if (uid && uid === id) {
			items.push({
				label: t('app.users.editProfile'),
				href: `${getEnvUrl('https://account.xernerx.com/')}?view=profile`,
				icon: Settings,
				category: t('app.users.nav.management'),
			});
		}

		setNavItems(items);
		return () => hide();
	}, [setNavItems, show, hide, id, session, bots, organizations, servers, getEnvUrl, router, t]);

	useEffect(() => {
		setUser(null);
		setDiscordUser(null);
		setNotFound(false);
		setLoading(true);
	}, [id]);

	useEffect(() => {
		if (!isReady) return;
		const fetchData = async () => {
			try {
				const [userRes, discordRes, botsRes, orgsRes] = await Promise.all([
					fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${id}`)),
					fetch(getEnvUrl(`https://api.xernerx.com/core/users/${id}/discord`)),
					fetch(getEnvUrl(`https://api.xernerx.com/secure/bots?owner=${id}`)),
					fetch(getEnvUrl(`https://api.xernerx.com/secure/organizations?user=${id}`)),
				]);

				const uid = (session as any)?.user?.id;
				let userData: any = null;
				let discordData: any = null;

				if (userRes.ok) {
					userData = await userRes.json();
				}
				if (discordRes.ok) {
					discordData = await discordRes.json();
				}

				if (!userData && !discordData) {
					setNotFound(true);
					return;
				}

				if (userData?.privacy === 'private' && uid !== id) {
					setNotFound(true);
					return;
				}

				setUser(userData || { id });
				setDiscordUser(discordData);

				if (botsRes.ok) {
					const fetchedBots = await botsRes.json();
					const publicBots = Array.isArray(fetchedBots) ? fetchedBots.filter((b: any) => b.privacy !== 'private' || uid === id) : [];

					const botsWithDiscord = await Promise.all(
						publicBots.map(async (b: any) => {
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

				let publicOrgs: any[] = [];
				if (orgsRes.ok) {
					const fetchedOrgs = await orgsRes.json();
					publicOrgs = Array.isArray(fetchedOrgs) ? fetchedOrgs.filter((o: any) => o.privacy !== 'private' || uid === id) : [];
					setOrganizations(publicOrgs);
				}

				const orgIdsParam = publicOrgs
					.map((o) => o._id)
					.filter(Boolean)
					.join(',');
				const guildsQueryUrl = orgIdsParam
					? `https://api.xernerx.com/secure/guilds?owner=${id}&organizations=${encodeURIComponent(orgIdsParam)}`
					: `https://api.xernerx.com/secure/guilds?owner=${id}`;
				const guildsRes = await fetch(getEnvUrl(guildsQueryUrl));
				if (guildsRes.ok) {
					const fetchedGuilds = await guildsRes.json();
					const publicGuilds = Array.isArray(fetchedGuilds) ? fetchedGuilds.filter((g: any) => g.privacy !== 'private' || uid === id) : [];
					setServers(publicGuilds);
				}
			} catch (error) {
				console.error('Failed to fetch user profile', error);
				setNotFound(true);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [id, getEnvUrl, isReady, session]);

	if (loading) {
		return (
			<div className="flex-1 flex items-center justify-center min-h-screen">
				<h1 className="sr-only">{t('app.users.nav.profile')}</h1>
				<Loading />
			</div>
		);
	}

	if (notFound || (!user && !discordUser)) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center min-h-screen text-center">
				<h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('app.users.notFoundTitle')}
				</h1>
				<p className="text-(--text-muted) mb-8">{t('app.users.notFoundDesc')}</p>
				<Link href="/">
					<Button variant="primary">{t('app.users.returnHome')}</Button>
				</Link>
			</div>
		);
	}

	const currentView = view || 'profile';

	return (
		<div className="flex flex-col w-full min-h-screen pb-24">
			<Header user={user} discordUser={discordUser} id={id} />

			<div className="mt-4">{currentView === 'profile' && <Profile user={user} bots={bots} organizations={organizations} servers={servers} />}</div>
		</div>
	);
}
