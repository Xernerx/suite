/** @format */
'use client';

import { Cloud, Compass, Database, Layers, LayoutDashboard, Search, Shield, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

import Banner from '@/../public/banner.svg';
import Link from 'next/link';
import { Roles } from '@/lib/roles';
import Supporters from '@/components/Supporters';
import { motion } from 'framer-motion';
import { usePlatform } from '@/providers/PlatformProvider';
import { useSession } from 'next-auth/react';
import { useSidebar } from '@/providers/SidebarProvider';
import { useToast } from '@/providers/ToastProvider';
import { useUser } from '@/providers/UserProvider';

export default function Home() {
	const { type } = usePlatform();
	const { setNavItems, clearNavItems, show } = useSidebar();
	const { data: session } = useSession();
	const { toast } = useToast();
	const { user } = useUser();

	const [support, setSupport] = useState(false);
	const [results, setResults] = useState<any[]>([]);
	const [search, setSearch] = useState('');
	const [loadingSearch, setLoadingSearch] = useState(false);

	useEffect(() => {
		show();

		const items = [
			{ label: 'Explore', icon: <Compass />, href: '/explore' },
			{ label: 'Dashboard', icon: <LayoutDashboard />, href: '/dashboard' },
			{ label: 'Portal', icon: <Layers />, href: '/portal' },
		];

		if (user?.role === Roles.Owner || user?.role === Roles.Admin || user?.role === Roles.Moderator)
			items.push({ label: 'Admin', icon: <ShieldCheck />, href: '/admin' }, { label: 'Hosting', icon: <Cloud />, href: '/admin/hosting' });

		setNavItems(items);

		return () => clearNavItems();
	}, [user, session]);

	useEffect(() => {
		(async () => {
			const response = await fetch('/api/v1/discord/guilds').then((res) => res.json());

			const guild = response.guilds?.find((g) => g.id === '687429190165069838');

			if (session) setSupport(!guild);
		})();
	}, [session]);

	const handleJoin = async () => {
		const response = await fetch('/api/v1/guilds/687429190165069838/join', { method: 'PUT' });

		if (response.ok) toast((await response.json()).message, 'success');
		if (!response.ok) toast((await response.json()).message, 'error');
	};

	return (
		<div className="flex flex-col gap-6">
			{/* HERO */}
			<motion.div
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				className="relative overflow-hidden rounded-3xl border p-8"
				style={{
					borderColor: 'var(--border)',
					background: 'var(--bg-panel)',
				}}
			>
				{/* subtle background glow */}
				<div
					className="absolute inset-0"
					style={{
						background: 'radial-gradient(circle at top right, color-mix(in srgb, var(--accent) 14%, transparent), transparent 40%)',
					}}
				/>

				<div className="relative flex flex-col gap-6">
					<div
						className="relative overflow-hidden rounded-2xl border"
						style={{
							borderColor: 'var(--border)',
							background: 'var(--bg-panel)',
							height: 'clamp(260px, 38vh, 360px)', // ← bigger + responsive
						}}
					>
						{/* glow */}
						<div
							className="absolute inset-0"
							style={{
								background: 'radial-gradient(circle at top right, color-mix(in srgb, var(--accent) 22%, transparent), transparent 55%)',
							}}
						/>

						{/* banner */}
						<div
							className="absolute inset-0 flex items-center justify-center"
							style={{
								color: 'var(--accent)',
								opacity: 0.95,
							}}
						>
							<Banner className="h-[65%] w-auto" />
						</div>

						{/* overlay */}
						<div
							className="absolute inset-0"
							style={{
								background: 'linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.7))',
							}}
						/>

						{/* text */}
						<div className="relative flex h-full items-end px-8 pb-8">
							<div className="flex flex-col">
								<span
									className="text-2xl font-semibold"
									style={{
										color: '#fff',
										textShadow: '0 3px 18px rgba(0,0,0,0.7)',
									}}
								>
									<Link href={process.env.NEXT_PUBLIC_APP_URL || 'https://www.xernerx.com'}>Xernerx</Link>
								</span>

								<span
									className="text-sm"
									style={{
										color: 'rgba(255,255,255,0.75)',
									}}
								>
									Manage bots, servers, and organizations
								</span>
							</div>
						</div>
					</div>

					{/* SEARCH */}
					<div
						className="flex items-center gap-3 rounded-2xl border px-4 py-3"
						style={{
							borderColor: 'var(--border)',
							background: 'color-mix(in srgb, var(--bg-main) 45%, var(--bg-panel))',
						}}
					>
						<Search
							className="h-4 w-4"
							style={{
								color: 'color-mix(in srgb, var(--text-main) 55%, transparent)',
							}}
						/>

						<input
							onChange={async (e) => {
								const value = e.target.value;
								setSearch(value);

								if (!value.trim()) return setResults([]);

								setLoadingSearch(true);

								try {
									const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
									const data = await res.json();

									setResults(data.results || []);
								} finally {
									setLoadingSearch(false);
								}
							}}
							type="search"
							placeholder="Search bots, servers, organizations..."
							className="w-full bg-transparent text-sm outline-none"
							style={{ color: 'var(--text-main)' }}
						/>
					</div>
					{search && (
						<div className="mt-2 rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg-panel)' }}>
							{loadingSearch && <div className="p-3 text-xs opacity-60">Searching...</div>}

							{results.map((r) => (
								<Link key={r.id} href={r.href} className="block px-4 py-2 text-sm hover:bg-white/5">
									{r.label}
									<span className="ml-2 text-xs opacity-50">{r.type}</span>
								</Link>
							))}

							{!loadingSearch && results.length === 0 && <div className="p-3 text-xs opacity-60">No results</div>}
						</div>
					)}
				</div>
			</motion.div>

			{/* QUICK ACTIONS */}
			<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid gap-4 md:grid-cols-3">
				{[
					{
						label: 'Explore',
						desc: 'Discover bots and servers',
						icon: <Compass className="h-5 w-5" />,
						href: '/explore',
					},
					{
						label: 'Dashboard',
						desc: 'Manage your servers and everything connected to them',
						icon: <LayoutDashboard className="h-5 w-5" />,
						href: '/dashboard',
					},
					{
						label: 'Portal',
						desc: 'Developer tools for managing bots and organizations',
						icon: <Layers className="h-5 w-5" />,
						href: '/portal',
					},
				].map((item) => (
					<a
						key={item.label}
						href={item.href}
						className="group rounded-3xl border p-5 transition hover:scale-[1.02]"
						style={{
							borderColor: 'var(--border)',
							background: 'color-mix(in srgb, var(--bg-panel) 82%, transparent)',
						}}
					>
						<div className="flex flex-col gap-3">
							<div
								className="flex h-10 w-10 items-center justify-center rounded-2xl border"
								style={{
									borderColor: 'var(--border)',
									background: 'color-mix(in srgb, var(--bg-main) 35%, var(--bg-panel))',
								}}
							>
								{item.icon}
							</div>

							<div className="flex flex-col gap-1">
								<span className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>
									{item.label}
								</span>

								<span
									className="text-xs"
									style={{
										color: 'color-mix(in srgb, var(--text-main) 60%, transparent)',
									}}
								>
									{item.desc}
								</span>
							</div>
						</div>
					</a>
				))}
			</motion.div>

			{/* SESSION NOTICE */}
			{!session && (
				<motion.a
					href="/api/auth/signin"
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					whileHover={{ scale: 1.01 }}
					className="group relative overflow-hidden rounded-2xl border px-4 py-4 text-sm transition"
					style={{
						borderColor: 'color-mix(in srgb, var(--accent) 22%, var(--border))',
						background: 'color-mix(in srgb, var(--accent) 10%, var(--bg-panel))',
					}}
				>
					{/* glow */}
					<div
						className="absolute inset-0 opacity-0 transition group-hover:opacity-100"
						style={{
							background: 'radial-gradient(circle at top right, color-mix(in srgb, var(--accent) 18%, transparent), transparent 45%)',
						}}
					/>

					<div className="relative flex items-center justify-between gap-4">
						<div className="flex flex-col">
							<span className="font-medium" style={{ color: 'var(--text-main)' }}>
								Sign in required
							</span>

							<span
								className="text-xs"
								style={{
									color: 'color-mix(in srgb, var(--text-main) 65%, transparent)',
								}}
							>
								Access your servers, bots, and organizations.
							</span>
						</div>

						<span className="text-xs font-medium opacity-70 transition group-hover:opacity-100" style={{ color: 'var(--text-main)' }}>
							Sign in →
						</span>
					</div>
				</motion.a>
			)}

			{/* INSTALL NOTICE */}
			{type === 'browser' && (
				<motion.a
					href="/download" // or wherever you handle install
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					whileHover={{ scale: 1.01 }}
					className="group relative overflow-hidden rounded-2xl border px-4 py-4 text-sm transition"
					style={{
						borderColor: 'color-mix(in srgb, var(--accent) 22%, var(--border))',
						background: 'color-mix(in srgb, var(--accent) 10%, var(--bg-panel))',
					}}
				>
					{/* glow */}
					<div
						className="absolute inset-0 opacity-0 transition group-hover:opacity-100"
						style={{
							background: 'radial-gradient(circle at top right, color-mix(in srgb, var(--accent) 18%, transparent), transparent 45%)',
						}}
					/>

					<div className="relative flex items-center justify-between gap-4">
						<div className="flex flex-col">
							<span className="font-medium" style={{ color: 'var(--text-main)' }}>
								Install Xernerx App
							</span>

							<span
								className="text-xs"
								style={{
									color: 'color-mix(in srgb, var(--text-main) 65%, transparent)',
								}}
							>
								Use the app with better performance and full feature access.
							</span>
						</div>

						<span className="text-xs font-medium opacity-70 transition group-hover:opacity-100" style={{ color: 'var(--text-main)' }}>
							Install →
						</span>
					</div>
				</motion.a>
			)}

			{support && (
				<motion.button
					onClick={handleJoin}
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					whileHover={{ scale: 1.01 }}
					className="group relative overflow-hidden rounded-2xl border px-4 py-4 text-sm transition"
					style={{
						borderColor: 'color-mix(in srgb, var(--accent) 22%, var(--border))',
						background: 'color-mix(in srgb, var(--accent) 10%, var(--bg-panel))',
					}}
				>
					{/* glow */}
					<div
						className="absolute inset-0 opacity-0 transition group-hover:opacity-100"
						style={{
							background: 'radial-gradient(circle at top right, color-mix(in srgb, var(--accent) 18%, transparent), transparent 45%)',
						}}
					/>

					<div className="relative flex items-center justify-between gap-4">
						<div className="flex flex-col">
							<span className="font-medium" style={{ color: 'var(--text-main)' }}>
								Join Support server
							</span>

							<span
								className="text-xs"
								style={{
									color: 'color-mix(in srgb, var(--text-main) 65%, transparent)',
								}}
							>
								Get help, information and updates about our services.
							</span>
						</div>

						<span className="text-xs font-medium opacity-70 transition group-hover:opacity-100" style={{ color: 'var(--text-main)' }}>
							Join →
						</span>
					</div>
				</motion.button>
			)}

			<Supporters />
		</div>
	);
}
