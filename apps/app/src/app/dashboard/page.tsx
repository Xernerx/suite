/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, Link, Loader2, LucideHome, Settings, Webhook } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import General from '@/components/dashboard/General';
import Image from 'next/image';
import Links from '@/components/dashboard/Links';
import Statistics from '@/components/dashboard/Statistics';
import Virtue from '@/components/dashboard/virtue/General';
import Webhooks from '@/components/dashboard/Webhooks';
import { useSidebar } from '@/providers/SidebarProvider';
import { useToast } from '@/providers/ToastProvider';

type Guild = {
	id: string;
	name: string;
	icon: string | null;
	permissions: string;
	banner: string | null;
};

type GuildsResponse = {
	guilds?: Guild[];
	message?: string;
	cached?: boolean;
	stale?: boolean;
	rateLimited?: boolean;
	cachedAt?: number;
};

export default function Page({ searchParams }: { searchParams: Promise<any> }) {
	const { toast } = useToast();
	const { setNavItems, clearNavItems, view, setView } = useSidebar();

	const [guilds, setGuilds] = useState<Guild[]>([]);
	const [selectedGuildId, setSelectedGuildId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	const [bannerTextMode, setBannerTextMode] = useState<'light' | 'dark'>('light');

	const hasToastedError = useRef(false);
	const hasToastedCacheNotice = useRef(false);

	useEffect(() => {
		setView('general');

		setNavItems([
			{ label: 'Home', href: '/', icon: <LucideHome /> },
			{ label: 'General', onClick: () => setView('general'), icon: <Settings />, view: 'general' },
			{ label: 'Links', onClick: () => setView('links'), icon: <Link />, view: 'links' },
			{ label: 'Webhooks', onClick: () => setView('webhooks'), icon: <Webhook />, view: 'webhooks' },
			{ label: 'Statistics', onClick: () => setView('statistics'), icon: <BarChart3 />, view: 'statistics' },
			{
				label: 'Metamorphosis',
				onClick: () => setView('metamorphosis'),
				icon: (
					<Image
						className="h-6 w-auto rounded-full"
						src="https://cdn.discordapp.com/avatars/881678826906730547/25511e2ef0b8c1b29b487116a9461739.webp?size=4096"
						alt="Metamorphosis"
						width={80}
						height={80}
					/>
				),
				view: 'metamorphosis',
			},
			{
				label: 'Virtue',
				onClick: () => setView('virtue'),
				icon: (
					<Image
						className="h-6 w-auto rounded-full"
						src="https://cdn.discordapp.com/avatars/1484880634844287138/bb9495686b0bab5efa38119c8e2f0bb3.webp?size=4096"
						alt="Virtue"
						width={80}
						height={80}
					/>
				),
				view: 'virtue',
			},
			{
				label: 'Zodiac',
				onClick: () => setView('zodiac'),
				icon: (
					<Image
						className="h-6 w-auto rounded-full"
						src="https://cdn.discordapp.com/avatars/950251264095162418/07a9e067135a204bb0fdc796b44bda63.webp?size=4096"
						alt="Zodiac"
						width={80}
						height={80}
					/>
				),
				view: 'zodiac',
			},
		]);

		(async () => {
			const { view } = await searchParams;

			if (view) setView(view);
		})();

		return () => {
			clearNavItems();
		};
	}, [clearNavItems, setNavItems]);

	useEffect(() => {
		let cancelled = false;

		(async () => {
			try {
				setLoading(true);
				setError(null);

				const response = await fetch('/api/v1/discord/guilds');
				const data: GuildsResponse = await response.json();

				if (!response.ok) {
					throw new Error(data.message ?? `Failed to fetch guilds (${response.status})`);
				}

				if (!cancelled) {
					const fetchedGuilds = data.guilds ?? [];

					const { guild } = await searchParams;

					setGuilds(fetchedGuilds);

					if (guild) {
						if (fetchedGuilds.map((g) => g.id).includes(guild)) setSelectedGuildId(guild);
					}

					if (fetchedGuilds.length > 0) {
						setSelectedGuildId((current) => current ?? fetchedGuilds[0].id);
					}

					if (data.stale && !hasToastedCacheNotice.current) {
						toast('Discord is rate limited, showing cached guilds.', 'warning');
						hasToastedCacheNotice.current = true;
					}
				}
			} catch (err) {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : 'Something went wrong while fetching guilds.');
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [toast]);

	useEffect(() => {
		if (!error) {
			hasToastedError.current = false;
			return;
		}

		if (hasToastedError.current) return;

		toast(error, 'error');
		hasToastedError.current = true;
	}, [error, toast]);

	const selectedGuild = guilds.find((guild) => guild.id === selectedGuildId) ?? null;

	useEffect(() => {
		if (!selectedGuild?.banner) {
			setBannerTextMode('light');
			return;
		}

		const image = new window.Image();
		image.crossOrigin = 'anonymous';
		image.src = `https://cdn.discordapp.com/banners/${selectedGuild.id}/${selectedGuild.banner}.png?size=1024`;

		image.onload = () => {
			try {
				const canvas = document.createElement('canvas');
				const ctx = canvas.getContext('2d');

				if (!ctx) {
					setBannerTextMode('light');
					return;
				}

				const sampleWidth = 64;
				const sampleHeight = 32;

				canvas.width = sampleWidth;
				canvas.height = sampleHeight;

				ctx.drawImage(image, 0, 0, sampleWidth, sampleHeight);

				const { data } = ctx.getImageData(0, 0, sampleWidth, sampleHeight);

				let totalLuminance = 0;
				let pixelCount = 0;

				for (let i = 0; i < data.length; i += 4) {
					const r = data[i];
					const g = data[i + 1];
					const b = data[i + 2];
					const a = data[i + 3];

					if (a < 20) continue;

					const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
					totalLuminance += luminance;
					pixelCount++;
				}

				const averageLuminance = pixelCount > 0 ? totalLuminance / pixelCount : 0;

				setBannerTextMode(averageLuminance > 150 ? 'dark' : 'light');
			} catch {
				setBannerTextMode('light');
			}
		};

		image.onerror = () => {
			setBannerTextMode('light');
		};
	}, [selectedGuild?.id, selectedGuild?.banner]);

	const bannerTextColor = bannerTextMode === 'dark' ? '#111113' : '#ffffff';
	const bannerMutedTextColor = bannerTextMode === 'dark' ? 'rgba(17,17,19,0.72)' : 'rgba(255,255,255,0.78)';
	const bannerTextShadow = bannerTextMode === 'dark' ? '0 1px 10px rgba(255,255,255,0.08)' : '0 2px 18px rgba(0,0,0,0.45)';

	return (
		<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }} className="flex min-h-full flex-col gap-4">
			<AnimatePresence mode="wait">
				{loading ? (
					<motion.div
						key="guild-loading"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						transition={{ duration: 0.2 }}
						className="flex flex-col gap-4"
					>
						<div className="flex gap-2 overflow-x-hidden">
							{Array.from({ length: 6 }).map((_, index) => (
								<div
									key={index}
									className="shrink-0 rounded-3xl border p-1"
									style={{
										borderColor: 'var(--border)',
										background: 'color-mix(in srgb, var(--bg-panel) 62%, transparent)',
									}}
								>
									<div
										className="h-20 w-20 animate-pulse rounded-2xl"
										style={{
											background: 'color-mix(in srgb, var(--text-main) 8%, transparent)',
										}}
									/>
								</div>
							))}
						</div>

						<div
							className="rounded-3xl border p-6"
							style={{
								borderColor: 'var(--border)',
								background: 'color-mix(in srgb, var(--bg-panel) 88%, transparent)',
							}}
						>
							<div
								className="relative overflow-hidden rounded-3xl border"
								style={{
									borderColor: 'var(--border)',
									background: 'var(--bg-panel)',
								}}
							>
								<div
									className="absolute inset-0"
									style={{
										background:
											'radial-gradient(circle at top right, color-mix(in srgb, var(--accent) 10%, transparent), transparent 38%), linear-gradient(180deg, color-mix(in srgb, var(--text-main) 4%, transparent), transparent 58%)',
									}}
								/>

								<div className="relative flex min-h-65 items-end gap-4 px-6 pb-7 pt-6">
									<div
										className="shrink-0 rounded-[1.4rem] border p-1"
										style={{
											borderColor: 'var(--border)',
											background: 'color-mix(in srgb, var(--bg-panel) 82%, transparent)',
										}}
									>
										<div
											className="h-20 w-20 animate-pulse rounded-2xl"
											style={{
												background: 'color-mix(in srgb, var(--text-main) 8%, transparent)',
											}}
										/>
									</div>

									<div className="min-w-0 max-w-full flex-1">
										<div
											className="h-7 w-52 animate-pulse rounded-xl"
											style={{
												background: 'color-mix(in srgb, var(--text-main) 8%, transparent)',
											}}
										/>
										<div
											className="mt-3 h-4 w-36 animate-pulse rounded-lg"
											style={{
												background: 'color-mix(in srgb, var(--text-main) 6%, transparent)',
											}}
										/>

										<div className="mt-4 flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.78)' }}>
											<Loader2 className="h-4 w-4 animate-spin" />
											Loading guilds...
										</div>
									</div>
								</div>
							</div>
						</div>
					</motion.div>
				) : (
					<motion.div
						key="guild-content"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						transition={{ duration: 0.2 }}
						className="flex flex-col gap-4"
					>
						<div className="flex gap-2 overflow-x-auto overflow-y-hidden">
							{guilds.length > 0 ? (
								guilds.map((g, index) => {
									const isSelected = selectedGuildId === g.id;

									return (
										<motion.button
											key={g.id}
											type="button"
											onClick={() => setSelectedGuildId(g.id)}
											initial={{ opacity: 0, y: 10 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ duration: 0.18, delay: index * 0.02 }}
											whileTap={{ scale: 0.98 }}
											className={`group shrink-0 ${isSelected ? 'rounded-3xl' : 'rounded-full'} border p-1 transition`}
											style={{
												borderColor: isSelected ? 'color-mix(in srgb, var(--text-main) 18%, var(--border))' : 'transparent',
												background: isSelected ? 'var(--accent)' : 'transparent',
											}}
											aria-pressed={isSelected}
											title={g.name}
										>
											<Image
												className={`${isSelected ? 'rounded-2xl' : 'rounded-full'} h-20 w-20 object-cover transition`}
												style={{
													opacity: isSelected ? 1 : 0.82,
												}}
												src={g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=256` : 'https://cdn.discordapp.com/embed/avatars/0.png'}
												alt={g.name}
												width={80}
												height={80}
											/>
										</motion.button>
									);
								})
							) : (
								<div className="text-sm" style={{ color: 'color-mix(in srgb, var(--text-main) 60%, transparent)' }}>
									No guilds found.
								</div>
							)}
						</div>

						<div
							className="rounded-3xl border p-6"
							style={{
								borderColor: 'var(--border)',
								background: 'color-mix(in srgb, var(--bg-panel) 88%, transparent)',
							}}
						>
							{selectedGuild ? (
								<motion.div
									key={selectedGuild.id}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.2 }}
									className="relative overflow-hidden rounded-3xl border"
									style={{
										borderColor: 'var(--border)',
										background: 'var(--bg-panel)',
									}}
								>
									<div
										className="absolute inset-0 bg-cover bg-center"
										style={{
											backgroundColor: 'var(--bg-panel)',
											backgroundImage: selectedGuild.banner ? `url(https://cdn.discordapp.com/banners/${selectedGuild.id}/${selectedGuild.banner}.png?size=1024)` : undefined,
											filter: 'brightness(0.72) saturate(0.95)',
										}}
									/>
									<div
										className="absolute inset-0"
										style={{
											background: 'linear-gradient(to bottom, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.18) 34%, rgba(0,0,0,0.56) 68%, rgba(0,0,0,0.9) 100%)',
										}}
									/>
									<div
										className="absolute inset-0"
										style={{
											background: 'linear-gradient(to right, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.2) 100%)',
										}}
									/>
									<div
										className="absolute inset-0"
										style={{
											background: 'radial-gradient(circle at top right, color-mix(in srgb, var(--accent) 12%, transparent), transparent 35%)',
										}}
									/>
									<div className="relative flex min-h-65 items-end gap-4 px-6 pb-7 pt-6">
										<div
											className="shrink-0 rounded-[1.4rem] border p-1 shadow-2xl backdrop-blur-md"
											style={{
												borderColor: 'var(--border)',
												background: 'color-mix(in srgb, var(--bg-panel) 82%, transparent)',
											}}
										>
											<Image
												className="h-20 w-20 rounded-2xl object-cover"
												src={
													selectedGuild.icon
														? `https://cdn.discordapp.com/icons/${selectedGuild.id}/${selectedGuild.icon}.png?size=256`
														: 'https://cdn.discordapp.com/embed/avatars/0.png'
												}
												alt={selectedGuild.name}
												width={80}
												height={80}
											/>
										</div>

										<div className="min-w-0 max-w-full">
											<h2
												className="truncate text-2xl font-semibold tracking-tight"
												style={{
													color: bannerTextColor,
													textShadow: bannerTextShadow,
												}}
											>
												{selectedGuild.name}
											</h2>

											<p
												className="truncate text-sm"
												style={{
													color: bannerMutedTextColor,
													textShadow: bannerTextShadow,
												}}
											>
												{selectedGuild.id}
											</p>
										</div>
									</div>
								</motion.div>
							) : (
								<div className="text-sm" style={{ color: 'color-mix(in srgb, var(--text-main) 60%, transparent)' }}>
									No guild selected.
								</div>
							)}
						</div>

						{view === 'general' && selectedGuild?.id && <General id={selectedGuild.id} name={selectedGuild.name} />}
						{view === 'links' && selectedGuild?.id && <Links id={selectedGuild.id} />}
						{view === 'webhooks' && selectedGuild?.id && <Webhooks id={selectedGuild.id} />}
						{view === 'statistics' && selectedGuild?.id && <Statistics />}
						{view === 'metamorphosis' && <div>Metamorphosis will soon be integrated to this dashboard.</div>}
						{view === 'virtue' && selectedGuild?.id && <Virtue id={selectedGuild.id} />}
						{view === 'zodiac' && <div>Zodiac will soon be integrated to this dashboard.</div>}
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}
