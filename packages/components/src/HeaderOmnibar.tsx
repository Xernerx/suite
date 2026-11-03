/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Bot, Building2, Check, Coins, Compass, Copy, FileCode2, Home, Moon, RotateCw, Server, Sun, User, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDictionary, useEnvironment, useTheme, useToast, useUser } from '@xernerx/providers';
import { Input } from '@xernerx/ui';

const SUBDOMAIN_ROUTES: Record<string, { path: string; label: string }[]> = {
	app: [
		{ path: '/', label: 'Explore Hub' },
		{ path: '/bots', label: 'Bot Directory' },
		{ path: '/servers', label: 'Server Directory' },
		{ path: '/leaderboard', label: 'Global Leaderboards' },
		{ path: '/dashboard', label: 'Server & Bot Dashboard' },
		{ path: '/overlay', label: 'Live Companion Overlay' },
	],
	portal: [
		{ path: '/', label: 'Developer Portal Studio' },
		{ path: '/?org=personal', label: 'Personal Developer Workspace' },
	],
	account: [
		{ path: '/', label: 'Profile & Identity' },
		{ path: '/?view=appearance', label: 'Theme & Appearance' },
		{ path: '/?view=tokens', label: 'Developer API Tokens' },
		{ path: '/?view=billing', label: 'Subscriptions & Billing' },
		{ path: '/?view=devices', label: 'Trusted Devices & QR Login' },
	],
	store: [
		{ path: '/', label: 'Store & Subscriptions' },
		{ path: '/?tab=credits', label: 'Virtual Credits & Daily Gift' },
	],
	info: [
		{ path: '/', label: 'System Status & Uptime' },
		{ path: '/roadmap', label: 'Public Roadmap' },
		{ path: '/suggestions', label: 'Feature Suggestions' },
		{ path: '/issues', label: 'Bug Tracker' },
		{ path: '/faq', label: 'Frequently Asked Questions' },
		{ path: '/changelog', label: 'Suite Changelog' },
	],
	docs: [
		{ path: '/', label: 'Documentation Home' },
		{ path: '/api/v1', label: 'v1 REST API Reference' },
		{ path: '/cdn', label: 'CDN Media Reference' },
		{ path: '/websocket', label: 'WebSocket Gateway Reference' },
		{ path: '/packages', label: 'TypeScript SDK Packages' },
	],
	haste: [
		{ path: '/', label: 'New Code Paste' },
		{ path: '/?view=mine', label: 'My Saved Pastes' },
	],
	blog: [
		{ path: '/', label: 'Blog Home & Latest Articles' },
		{ path: '/platform-and-bot-security-architecture', label: 'Platform & Bot Security Architecture' },
		{ path: '/the-customization-update-stage-render-forms-and-cosmetics-studio', label: 'The Customization Update' },
		{ path: '/rss.xml', label: 'RSS 2.0 Syndication Feed' },
	],
	www: [
		{ path: '/', label: 'Xernerx Showcase' },
		{ path: '/download', label: 'Download Desktop App' },
		{ path: '/applications', label: 'Team Applications' },
		{ path: '/security', label: 'Platform & Bot Security' },
		{ path: '/terms', label: 'Terms of Service' },
		{ path: '/privacy', label: 'Privacy Policy' },
		{ path: '/cookies', label: 'Cookie Policy' },
	],
};

export function SubSelector({ name, options, defaultValue, onSelectOption }: { name: string; options: string[]; defaultValue: string; onSelectOption?: (val: string) => void }) {
	const [isOpen, setIsOpen] = useState(false);
	const [value, setValue] = useState(defaultValue);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setValue(defaultValue);
	}, [defaultValue]);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		};
		if (isOpen) {
			window.addEventListener('click', handleClickOutside);
		}
		return () => window.removeEventListener('click', handleClickOutside);
	}, [isOpen]);

	return (
		<div ref={ref} className="relative flex items-center">
			<input type="hidden" name={name} value={value} />
			<div className="text-sm font-medium text-(--text) cursor-pointer hover:text-(--accent) transition-colors flex items-center select-none" onClick={() => setIsOpen(!isOpen)}>
				{value}
			</div>

			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, y: -5, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -5, scale: 0.95 }}
						transition={{ duration: 0.15 }}
						className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 bg-(--background) border border-(--border)/10 rounded-xl shadow-xl overflow-hidden min-w-[120px] z-[9999] flex flex-col p-1"
					>
						{options.map((option) => (
							<div
								key={option}
								className={`px-3 py-1.5 text-sm font-medium rounded-xl cursor-pointer transition-colors ${value === option ? 'bg-(--accent)/10 text-(--accent)' : 'text-(--text) hover:bg-(--foreground)'}`}
								onClick={() => {
									setValue(option);
									onSelectOption?.(option);
									setIsOpen(false);
								}}
							>
								{option}
							</div>
						))}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

interface HeaderOmnibarProps {
	isOpen: boolean;
	onClose: () => void;
	urlState: { pre: string; env: string; path: string };
	resolveOmnibarUrl: (pre: string, env: string, rawPath: string) => string;
	hasAdminAccess?: boolean;
	hasHostingAccess?: boolean;
}

export function HeaderOmnibar({ isOpen, onClose, urlState, resolveOmnibarUrl, hasAdminAccess = false, hasHostingAccess = false }: HeaderOmnibarProps) {
	const { t } = useDictionary();
	const { toast } = useToast();
	const { getEnvUrl } = useEnvironment();
	const { resolvedTheme, setTheme } = useTheme();
	const { user } = useUser();

	const containerRef = useRef<HTMLDivElement>(null);
	const urlFormRef = useRef<HTMLFormElement>(null);
	const [urlCopied, setUrlCopied] = useState(false);
	const [selectedPre, setSelectedPre] = useState(urlState.pre);
	const [selectedEnv, setSelectedEnv] = useState(urlState.env);
	const [pathInput, setPathInput] = useState(urlState.path);
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [liveMatches, setLiveMatches] = useState<{ type: 'bot' | 'server' | 'org'; id: string; name: string; href: string }[]>([]);

	useEffect(() => {
		setSelectedPre(urlState.pre);
		setSelectedEnv(urlState.env);
		setPathInput(urlState.path);
	}, [urlState.pre, urlState.env, urlState.path, isOpen]);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setDropdownOpen(false);
			}
		};
		if (dropdownOpen) {
			window.addEventListener('mousedown', handleClickOutside);
		}
		return () => window.removeEventListener('mousedown', handleClickOutside);
	}, [dropdownOpen]);

	const cleanQuery = useMemo(() => pathInput.replace(/^\/+/, '').trim(), [pathInput]);

	useEffect(() => {
		if (!isOpen || cleanQuery.length < 2) {
			setLiveMatches([]);
			return;
		}
		const searchTerm = cleanQuery.replace(/^(bots|servers|organization|users)\//i, '').trim();
		if (searchTerm.length < 2) {
			setLiveMatches([]);
			return;
		}
		const timer = setTimeout(() => {
			Promise.all([
				fetch(getEnvUrl(`https://api.xernerx.com/secure/bots?search=${encodeURIComponent(searchTerm)}&limit=3`))
					.then((r) => (r.ok ? r.json() : []))
					.catch(() => []),
				fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds?search=${encodeURIComponent(searchTerm)}&limit=3`))
					.then((r) => (r.ok ? r.json() : []))
					.catch(() => []),
				fetch(getEnvUrl(`https://api.xernerx.com/secure/organizations?search=${encodeURIComponent(searchTerm)}&limit=2`))
					.then((r) => (r.ok ? r.json() : []))
					.catch(() => []),
			]).then(([botsRes, guildsRes, orgsRes]) => {
				const matches: { type: 'bot' | 'server' | 'org'; id: string; name: string; href: string }[] = [];
				if (Array.isArray(botsRes)) {
					botsRes.slice(0, 3).forEach((b: any) => {
						const slug = b.vanitySlug || b.id;
						matches.push({
							type: 'bot',
							id: b.id,
							name: b.discord?.global_name || b.discord?.username || b.name || b.id,
							href: resolveOmnibarUrl('app', selectedEnv, `/bots/${slug}`),
						});
					});
				}
				if (Array.isArray(guildsRes)) {
					guildsRes.slice(0, 3).forEach((g: any) => {
						const slug = g.vanitySlug || g.id;
						matches.push({
							type: 'server',
							id: g.id,
							name: g.name || g.id,
							href: resolveOmnibarUrl('app', selectedEnv, `/servers/${slug}`),
						});
					});
				}
				if (Array.isArray(orgsRes)) {
					orgsRes.slice(0, 2).forEach((o: any) => {
						const slug = o.vanitySlug || o._id;
						matches.push({
							type: 'org',
							id: o._id,
							name: o.name || o._id,
							href: resolveOmnibarUrl('app', selectedEnv, `/organization/${slug}`),
						});
					});
				}
				setLiveMatches(matches);
			});
		}, 180);
		return () => clearTimeout(timer);
	}, [cleanQuery, isOpen, getEnvUrl, resolveOmnibarUrl, selectedEnv]);

	const filteredRoutes = useMemo(() => {
		const routes = SUBDOMAIN_ROUTES[selectedPre] || [{ path: '/', label: 'Home' }];
		if (!cleanQuery) return routes.slice(0, 5);
		const q = cleanQuery.toLowerCase();
		return routes.filter((r) => r.path.toLowerCase().includes(q) || r.label.toLowerCase().includes(q)).slice(0, 5);
	}, [selectedPre, cleanQuery]);

	const subdomainOptions = [
		'app',
		'portal',
		'www',
		'blog',
		'api',
		'cdn',
		'haste',
		'docs',
		...(hasAdminAccess ? ['admin'] : []),
		...(hasHostingAccess ? ['hosting'] : []),
		'account',
		'store',
		'info',
	];
	if (!subdomainOptions.includes(urlState.pre)) subdomainOptions.push(urlState.pre);

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					ref={containerRef}
					initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
					animate={{ height: 44, opacity: 1, transitionEnd: { overflow: 'visible' } }}
					exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
					transition={{ type: 'spring', stiffness: 400, damping: 30 }}
					className="flex items-center w-full shrink-0 bg-(--background) gap-3 relative z-[999]"
					style={{
						paddingLeft: 'calc(1rem + env(safe-area-inset-left, 0px))',
						paddingRight: 'calc(1rem + env(safe-area-inset-right, 0px))',
					}}
				>
					<div className="flex items-center gap-1">
						<button
							type="button"
							aria-label={t('common.navigation.back')}
							title={t('common.navigation.back')}
							onClick={() => window.history.back()}
							className="text-(--text-muted) hover:text-(--text) hover:bg-(--foreground) p-1.5 rounded-xl transition-all"
						>
							<ArrowLeft size={16} strokeWidth={2.5} />
						</button>
						<button
							type="button"
							aria-label={t('common.navigation.forward')}
							title={t('common.navigation.forward')}
							onClick={() => window.history.forward()}
							className="text-(--text-muted) hover:text-(--text) hover:bg-(--foreground) p-1.5 rounded-xl transition-all"
						>
							<ArrowRight size={16} strokeWidth={2.5} />
						</button>
						<button
							type="button"
							aria-label={t('common.navigation.reload')}
							title={t('common.navigation.reload')}
							onClick={() => window.location.reload()}
							className="text-(--text-muted) hover:text-(--text) hover:bg-(--foreground) p-1.5 rounded-xl transition-all"
						>
							<RotateCw size={16} strokeWidth={2.5} />
						</button>
						<button
							type="button"
							aria-label={t('common.navigation.home')}
							title={t('common.navigation.home')}
							onClick={() => (window.location.href = '/')}
							className="text-(--text-muted) hover:text-(--text) hover:bg-(--foreground) p-1.5 rounded-xl transition-all ml-1"
						>
							<Home size={16} strokeWidth={2.5} />
						</button>
					</div>

					<div className="relative flex-1 ml-1">
						<form
							ref={urlFormRef}
							className="flex w-full items-center bg-(--foreground) rounded-full h-[30px] px-3 border border-(--border)/10 focus-within:ring-2 focus-within:ring-(--accent)/20 focus-within:border-(--accent) transition-all shadow-sm"
							onSubmit={(e) => {
								e.preventDefault();
								const pre = (e.currentTarget.elements.namedItem('pre') as HTMLSelectElement)?.value || selectedPre;
								const env = (e.currentTarget.elements.namedItem('env') as HTMLSelectElement)?.value || selectedEnv;
								const path = (e.currentTarget.elements.namedItem('path') as HTMLInputElement)?.value || pathInput;
								setDropdownOpen(false);
								window.location.href = resolveOmnibarUrl(pre, env, path);
							}}
						>
							<span className="text-(--text-muted) select-none text-sm font-medium pr-1">https://</span>
							<SubSelector name="pre" options={subdomainOptions} defaultValue={urlState.pre} onSelectOption={(val) => setSelectedPre(val)} />
							<span className="text-(--text-muted) select-none text-sm font-medium px-0.5">.</span>
							<SubSelector name="env" options={['public', 'canary', 'dev']} defaultValue={urlState.env} onSelectOption={(val) => setSelectedEnv(val)} />
							<span className="text-(--text-muted) select-none text-sm font-medium pl-0.5 pr-2">.xernerx.com</span>
							<Input
								name="path"
								type="text"
								value={pathInput}
								onChange={(e) => {
									setPathInput(e.target.value);
									setDropdownOpen(true);
								}}
								onFocus={() => setDropdownOpen(true)}
								placeholder={t('components.header.omnibar.placeholder')}
								className="!bg-transparent !border-none !p-0 !rounded-none !ring-0 outline-none text-sm font-medium w-full text-(--text) placeholder:text-(--text-muted)/70"
								autoFocus
							/>
						</form>

						<AnimatePresence>
							{dropdownOpen && (
								<motion.div
									initial={{ opacity: 0, y: -4, scale: 0.99 }}
									animate={{ opacity: 1, y: 0, scale: 1 }}
									exit={{ opacity: 0, y: -4, scale: 0.99 }}
									transition={{ duration: 0.14 }}
									className="absolute top-[calc(100%+8px)] left-0 right-0 rounded-2xl bg-(--background)/95 backdrop-blur-xl border border-(--border)/15 shadow-2xl p-2 z-[9998] flex flex-col gap-2 max-h-[360px] overflow-y-auto"
								>
									{filteredRoutes.length > 0 && (
										<div className="flex flex-col gap-1">
											<span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-(--text-muted)">
												{t('components.header.omnibar.routesHeading', { app: selectedPre })}
											</span>
											{filteredRoutes.map((route) => (
												<button
													key={`${selectedPre}-${route.path}`}
													type="button"
													onClick={() => {
														setDropdownOpen(false);
														window.location.href = resolveOmnibarUrl(selectedPre, selectedEnv, route.path);
													}}
													className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl hover:bg-(--foreground) text-left transition-colors cursor-pointer group"
												>
													<span className="flex items-center gap-2 min-w-0">
														<Compass className="w-3.5 h-3.5 text-(--accent) shrink-0" />
														<span className="text-xs font-bold text-(--text) group-hover:text-(--accent) truncate">{route.label}</span>
														<span className="text-[11px] font-mono text-(--text-muted) truncate">{route.path}</span>
													</span>
													<span className="px-2 py-0.5 rounded-full bg-(--accent)/10 text-(--accent) text-[10px] font-bold">{t('components.header.omnibar.badgeRoute')}</span>
												</button>
											))}
										</div>
									)}

									{liveMatches.length > 0 && (
										<div className="flex flex-col gap-1 pt-1 border-t border-(--border)/10">
											<span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-(--text-muted)">
												{t('components.header.omnibar.liveResultsHeading')}
											</span>
											{liveMatches.map((match) => {
												const Icon = match.type === 'bot' ? Bot : match.type === 'server' ? Server : Building2;
												const badgeLabel =
													match.type === 'bot'
														? t('components.header.omnibar.badgeBot')
														: match.type === 'server'
															? t('components.header.omnibar.badgeServer')
															: t('components.header.omnibar.badgeOrg');
												return (
													<button
														key={`${match.type}-${match.id}`}
														type="button"
														onClick={() => {
															setDropdownOpen(false);
															window.location.href = match.href;
														}}
														className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl hover:bg-(--foreground) text-left transition-colors cursor-pointer group"
													>
														<span className="flex items-center gap-2 min-w-0">
															<Icon className="w-3.5 h-3.5 text-(--accent) shrink-0" />
															<span className="text-xs font-bold text-(--text) group-hover:text-(--accent) truncate">{match.name}</span>
														</span>
														<span className="px-2 py-0.5 rounded-full bg-(--accent)/15 text-(--accent) text-[10px] font-bold">{badgeLabel}</span>
													</button>
												);
											})}
										</div>
									)}

									<div className="flex flex-col gap-1 pt-1 border-t border-(--border)/10">
										<span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-(--text-muted)">
											{t('components.header.omnibar.quickActionsHeading')}
										</span>
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
											<button
												type="button"
												onClick={() => {
													setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
													setDropdownOpen(false);
												}}
												className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-(--foreground) text-left text-xs font-semibold text-(--text) transition-colors cursor-pointer"
											>
												{resolvedTheme === 'dark' ? <Sun className="w-3.5 h-3.5 text-(--accent)" /> : <Moon className="w-3.5 h-3.5 text-(--accent)" />}
												<span className="truncate">{t('components.header.omnibar.actionToggleTheme')}</span>
											</button>
											<button
												type="button"
												onClick={() => {
													setDropdownOpen(false);
													window.location.href = resolveOmnibarUrl('haste', selectedEnv, '/');
												}}
												className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-(--foreground) text-left text-xs font-semibold text-(--text) transition-colors cursor-pointer"
											>
												<FileCode2 className="w-3.5 h-3.5 text-(--accent)" />
												<span className="truncate">{t('components.header.omnibar.actionNewPaste')}</span>
											</button>
											<button
												type="button"
												onClick={() => {
													setDropdownOpen(false);
													window.location.href = resolveOmnibarUrl('store', selectedEnv, '/?tab=credits');
												}}
												className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-(--foreground) text-left text-xs font-semibold text-(--text) transition-colors cursor-pointer"
											>
												<Coins className="w-3.5 h-3.5 text-(--accent)" />
												<span className="truncate">{t('components.header.omnibar.actionDailyCredits')}</span>
											</button>
											{user?.id && (
												<button
													type="button"
													onClick={() => {
														navigator.clipboard.writeText(String(user.id));
														toast({ type: 'success', title: t('components.header.omnibar.discordIdCopied'), description: String(user.id) });
														setDropdownOpen(false);
													}}
													className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-(--foreground) text-left text-xs font-semibold text-(--text) transition-colors cursor-pointer"
												>
													<User className="w-3.5 h-3.5 text-(--accent)" />
													<span className="truncate">{t('components.header.omnibar.actionCopyDiscordId')}</span>
												</button>
											)}
										</div>
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>

					<div className="flex items-center gap-1">
						<button
							type="button"
							aria-label={t('components.header.copyUrl')}
							title={t('components.header.copyUrl')}
							onClick={() => {
								const targetUrl = resolveOmnibarUrl(selectedPre, selectedEnv, pathInput);
								navigator.clipboard.writeText(targetUrl).then(() => {
									setUrlCopied(true);
									toast({ type: 'success', title: t('components.header.urlCopied'), description: targetUrl });
									setTimeout(() => setUrlCopied(false), 2000);
								});
							}}
							className="text-(--text-muted) hover:text-(--text) hover:bg-(--foreground) p-1.5 rounded-xl transition-all cursor-pointer"
						>
							{urlCopied ? <Check size={16} strokeWidth={2.5} className="text-(--accent-green)" /> : <Copy size={16} strokeWidth={2.5} />}
						</button>

						<button
							type="button"
							aria-label={t('common.close')}
							title={t('common.close')}
							onClick={onClose}
							className="text-(--text-muted) hover:text-(--accent-red) hover:bg-(--accent-red)/10 p-1.5 rounded-xl transition-all cursor-pointer"
						>
							<X size={16} strokeWidth={2.5} />
						</button>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
