/** @format */
'use client';

import { Cloud, Columns2, Copy, ExternalLink, KeyRound, Maximize2, Minimize2, RefreshCw, Server, Settings2, ShieldCheck, Terminal } from 'lucide-react';
import { Badge, Button } from '@xernerx/ui';
import { useDictionary, useEnvironment, useSession, useTheme, useToast, useUser } from '@xernerx/providers';
import { useCallback, useEffect, useRef, useState } from 'react';
import HostingSshModal, { buildThemedNodeUrl, DEFAULT_HOSTING_NODES, isVercelNode, type HostingNodeConfig, resolveNodeSshTarget } from './HostingSshModal';
import HostingNodeConfigModal from './HostingNodeConfigModal';
import HostingVercelPanel from './HostingVercelPanel';

export { DEFAULT_HOSTING_NODES, isVercelNode, type HostingNodeConfig };

interface NodePingState {
	status: 'checking' | 'online' | 'unreachable';
	latencyMs: number | null;
}

interface HostingConsoleProps {
	activeView: string;
	onSelectView: (view: string) => void;
	nodes: HostingNodeConfig[];
	onNodesUpdated: (nextNodes: HostingNodeConfig[]) => void;
	configModalOpen: boolean;
	setConfigModalOpen: (open: boolean) => void;
	canManageSettings: boolean;
}

export default function HostingConsole({ activeView, onSelectView, nodes, onNodesUpdated, configModalOpen, setConfigModalOpen, canManageSettings }: HostingConsoleProps) {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { resolvedTheme } = useTheme();
	const { toast } = useToast();
	const { data: session } = useSession();
	const { user: discordUser } = useUser();

	const activeUser = discordUser || session?.user;
	const userId = (activeUser as any)?.id;

	const [fullBleed, setFullBleed] = useState(false);
	const [reloadCounters, setReloadCounters] = useState<Record<string, number>>({});
	const [savingConfig, setSavingConfig] = useState(false);
	const [easypanelConn, setEasypanelConn] = useState<{ username: string; secret?: string; token?: string } | null>(null);
	const [vercelConn, setVercelConn] = useState<{ username: string; secret?: string; token?: string } | null>(null);
	const [sshModalOpen, setSshModalOpen] = useState(false);
	const [sshModalNode, setSshModalNode] = useState<HostingNodeConfig | undefined>(undefined);
	const [nodePings, setNodePings] = useState<Record<string, NodePingState>>({});
	const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({});

	const probeNodesReachability = useCallback(async () => {
		for (const node of nodes) {
			if (!node.url) continue;
			setNodePings((prev) => ({
				...prev,
				[node.id]: { status: prev[node.id]?.status || 'checking', latencyMs: prev[node.id]?.latencyMs ?? null },
			}));
			const start = performance.now();
			const controller = new AbortController();
			const timer = setTimeout(() => controller.abort(), 5000);
			try {
				const targetProbeUrl = isVercelNode(node) ? 'https://www.xernerx.com/api/version' : node.url;
				await fetch(targetProbeUrl, { mode: 'no-cors', cache: 'no-store', signal: controller.signal });
				const elapsed = Math.max(1, Math.round(performance.now() - start));
				setNodePings((prev) => ({ ...prev, [node.id]: { status: 'online', latencyMs: elapsed } }));
			} catch {
				setNodePings((prev) => ({ ...prev, [node.id]: { status: 'unreachable', latencyMs: null } }));
			} finally {
				clearTimeout(timer);
			}
		}
	}, [nodes]);

	useEffect(() => {
		probeNodesReachability();
		const interval = setInterval(probeNodesReachability, 30000);
		return () => clearInterval(interval);
	}, [probeNodesReachability]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		try {
			const domain = process.env.NEXT_PUBLIC_DOMAIN || 'xernerx.com';
			const cookieAttrs = window.location.hostname.endsWith(domain) ? `domain=.${domain}; path=/; max-age=31536000; SameSite=Lax` : 'path=/; max-age=31536000; SameSite=Lax';
			document.cookie = `color-theme=${resolvedTheme}; ${cookieAttrs}`;
		} catch {}
		Object.values(iframeRefs.current).forEach((frame) => {
			try {
				frame?.contentWindow?.postMessage({ type: 'theme', theme: resolvedTheme, colorScheme: resolvedTheme }, '*');
			} catch {}
		});
	}, [resolvedTheme]);

	const loadUserConnections = useCallback(() => {
		if (!isReady || !userId) return;
		fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${userId}?includeSecrets=true`), { credentials: 'include', cache: 'no-store' })
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (Array.isArray(data?.connections)) {
					const foundEp = data.connections.find((c: any) => c.provider === 'easypanel');
					setEasypanelConn(foundEp || null);
					const foundVercel = data.connections.find((c: any) => c.provider === 'vercel');
					setVercelConn(foundVercel || null);
				}
			})
			.catch(() => {});
	}, [isReady, userId, getEnvUrl]);

	useEffect(() => {
		loadUserConnections();
	}, [loadUserConnections]);

	const handleCopyCred = async (value: string, label: string) => {
		try {
			await navigator.clipboard.writeText(value);
			toast({ type: 'success', title: t('hosting.console.copiedToast', { field: label }) });
		} catch {}
	};

	const isSplitView = activeView === 'split';
	const selectedNode = nodes.find((n) => n.id === activeView) || nodes[0] || DEFAULT_HOSTING_NODES[0];

	const handleReloadNode = (nodeId: string) => {
		setReloadCounters((prev) => ({ ...prev, [nodeId]: (prev[nodeId] || 0) + 1 }));
		probeNodesReachability();
		toast({ type: 'info', title: t('hosting.console.reloadingToast', { node: nodeId }) });
	};

	const handleReloadCurrent = () => {
		probeNodesReachability();
		if (isSplitView) {
			const nextCounters = { ...reloadCounters };
			nodes.forEach((n) => {
				nextCounters[n.id] = (nextCounters[n.id] || 0) + 1;
			});
			setReloadCounters(nextCounters);
			toast({ type: 'info', title: t('hosting.console.reloadingAllToast') });
			return;
		}
		if (selectedNode) {
			handleReloadNode(selectedNode.id);
		}
	};

	const handleSaveNodesConfig = async (sanitized: HostingNodeConfig[]) => {
		setSavingConfig(true);
		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/hosting_nodes_config'), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					name: 'Hosting Nodes Configuration',
					value: JSON.stringify(sanitized),
				}),
			});

			if (res.ok) {
				onNodesUpdated(sanitized);
				setConfigModalOpen(false);
				toast({ type: 'success', title: t('hosting.configModal.savedToast') });
			} else {
				toast({ type: 'error', title: t('common.toast.saveFailed') });
			}
		} catch {
			toast({ type: 'error', title: t('common.toast.saveError') });
		} finally {
			setSavingConfig(false);
		}
	};

	return (
		<div
			className={`flex flex-col flex-1 w-full ${fullBleed ? 'max-w-none' : 'max-w-(--page-width) mx-auto'} h-[calc(100dvh-50px-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] overflow-hidden`}
			style={{
				padding: fullBleed ? '0px' : 'calc(var(--ui-gap) * 0.75)',
				gap: fullBleed ? '0px' : 'calc(var(--ui-gap) * 0.75)',
				fontSize: 'var(--text-scale, 14px)',
			}}
		>
			{/* Top Node Control Strip */}
			<div
				className={`flex flex-wrap items-center justify-between border border-(--border)/10 bg-(--foreground)/35 backdrop-blur-md shadow-sm shrink-0 transition-all ${
					fullBleed ? 'rounded-none border-x-0 border-t-0 px-3 py-1.5' : 'rounded-2xl px-4 py-2.5'
				}`}
				style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}
			>
				<div className="flex flex-wrap items-center gap-2 min-w-0">
					<div className="flex items-center gap-1.5 rounded-xl bg-(--background)/60 border border-(--border)/10 p-1">
						{nodes.map((node) => {
							const isSelected = !isSplitView && selectedNode?.id === node.id;
							const ping = nodePings[node.id];
							const isUnreachable = ping?.status === 'unreachable';
							const dotClass = isUnreachable
								? 'bg-(--accent-red)'
								: ping?.status === 'checking'
									? 'bg-(--accent-orange) animate-pulse'
									: isSelected
										? 'bg-(--accent-green) animate-pulse'
										: 'bg-(--accent-green)/75';

							return (
								<button
									key={node.id}
									type="button"
									onClick={() => onSelectView(node.id)}
									className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
										isSelected ? 'bg-(--accent) text-(--text) shadow-xs' : 'text-(--text-muted) hover:text-(--text) hover:bg-(--foreground)/50'
									}`}
								>
									<span className={`h-2 w-2 rounded-full ${dotClass}`} />
									{isVercelNode(node) ? <Cloud size={13} /> : <Server size={13} />}
									<span>{node.name}</span>
									{ping?.latencyMs !== null && ping?.latencyMs !== undefined && <span className="text-[10px] font-mono opacity-80">{ping.latencyMs}ms</span>}
								</button>
							);
						})}
						{nodes.length > 1 && (
							<button
								type="button"
								onClick={() => onSelectView('split')}
								className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
									isSplitView ? 'bg-(--accent) text-(--text) shadow-xs' : 'text-(--text-muted) hover:text-(--text) hover:bg-(--foreground)/50'
								}`}
							>
								<Columns2 size={13} />
								<span>{t('hosting.console.splitView')}</span>
							</button>
						)}
					</div>

					<Badge variant="accent" size="sm" icon={<ShieldCheck size={11} />}>
						{t('hosting.console.staffGuardedBadge')}
					</Badge>

					{!isSplitView && selectedNode && (
						<span className="hidden lg:inline-flex items-center gap-1.5 rounded-full bg-(--background)/60 border border-(--border)/10 px-3 py-1 font-mono text-[11px] text-(--text-muted) truncate max-w-md">
							{selectedNode.url}
						</span>
					)}
				</div>

				<div className="flex flex-wrap items-center gap-2 shrink-0">
					{!isSplitView && isVercelNode(selectedNode) ? (
						vercelConn ? (
							<div className="inline-flex items-center gap-1.5 rounded-xl bg-(--background)/60 border border-(--border)/10 px-2.5 py-1">
								<Cloud size={12} className="text-(--accent) shrink-0" />
								<span className="text-[11px] font-bold text-(--text) max-w-36 truncate">@{vercelConn.username}</span>
							</div>
						) : (
							<a
								href={`${getEnvUrl('https://account.xernerx.com')}/api/connections/vercel?returnTo=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/?node=vercel` : 'https://hosting.xernerx.com/?node=vercel')}`}
								className="inline-flex items-center gap-1.5 rounded-2xl bg-(--accent)/10 hover:bg-(--accent)/20 border border-(--accent)/25 px-3 py-1.5 text-xs font-bold text-(--accent) transition-colors"
							>
								<Cloud size={13} />
								<span className="hidden sm:inline">{t('account.connections.vercel.oauthButton')}</span>
							</a>
						)
					) : easypanelConn ? (
						<div className="inline-flex items-center gap-1 rounded-xl bg-(--background)/60 border border-(--border)/10 px-2 py-1">
							<KeyRound size={12} className="text-(--accent) shrink-0" />
							<button
								type="button"
								onClick={() => handleCopyCred(easypanelConn.username, t('hosting.console.emailField'))}
								title={t('hosting.console.copyEmailTooltip')}
								className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold text-(--text) hover:bg-(--foreground)/50 transition-colors cursor-pointer"
							>
								<Copy size={11} className="text-(--accent)" />
								<span className="max-w-36 truncate">{easypanelConn.username}</span>
							</button>
							{easypanelConn.secret && (
								<button
									type="button"
									onClick={() => handleCopyCred(easypanelConn.secret || '', t('hosting.console.passwordField'))}
									title={t('hosting.console.copyPasswordTooltip')}
									className="inline-flex items-center gap-1 rounded-lg bg-(--accent)/15 hover:bg-(--accent)/25 border border-(--accent)/25 px-2 py-0.5 text-[11px] font-bold text-(--accent) transition-colors cursor-pointer"
								>
									<Copy size={11} />
									<span>{t('hosting.console.copyPassword')}</span>
								</button>
							)}
						</div>
					) : (
						<a
							href={`${getEnvUrl('https://account.xernerx.com')}/?view=connections&open=easypanel`}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1.5 rounded-2xl bg-(--accent)/10 hover:bg-(--accent)/20 border border-(--accent)/25 px-3 py-1.5 text-xs font-bold text-(--accent) transition-colors"
						>
							<KeyRound size={13} />
							<span className="hidden sm:inline">{t('hosting.console.linkAccount')}</span>
						</a>
					)}

					{(!selectedNode || !isVercelNode(selectedNode) || isSplitView) && (
						<Button
							variant="secondary"
							size="sm"
							onClick={() => {
								const sshNode = selectedNode && !isVercelNode(selectedNode) ? selectedNode : nodes.find((n) => !isVercelNode(n)) || DEFAULT_HOSTING_NODES[0];
								setSshModalNode(sshNode);
								setSshModalOpen(true);
							}}
							className="flex items-center gap-1.5"
						>
							<Terminal size={13} className="text-(--accent)" />
							<span className="font-mono text-[11px]">
								{resolveNodeSshTarget(selectedNode && !isVercelNode(selectedNode) ? selectedNode : nodes.find((n) => !isVercelNode(n)) || DEFAULT_HOSTING_NODES[0])}
							</span>
						</Button>
					)}

					<Button variant="secondary" size="sm" onClick={handleReloadCurrent} className="flex items-center gap-1.5">
						<RefreshCw size={13} />
						<span className="hidden sm:inline">{isSplitView ? t('hosting.console.reloadAll') : t('hosting.console.reloadNode')}</span>
					</Button>

					{!isSplitView && selectedNode && (
						<a
							href={selectedNode.url}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1.5 rounded-2xl bg-(--background)/60 hover:bg-(--background) border border-(--border)/15 px-3 py-1.5 text-xs font-bold text-(--text) transition-colors"
						>
							<ExternalLink size={13} className="text-(--accent)" />
							<span className="hidden sm:inline">{t('hosting.console.openExternal')}</span>
						</a>
					)}

					{canManageSettings && (
						<Button variant="secondary" size="sm" onClick={() => setConfigModalOpen(true)} className="flex items-center gap-1.5">
							<Settings2 size={13} />
							<span className="hidden sm:inline">{t('hosting.console.configureNodes')}</span>
						</Button>
					)}

					<Button
						variant={fullBleed ? 'primary' : 'secondary'}
						size="sm"
						onClick={() => setFullBleed((prev) => !prev)}
						title={fullBleed ? t('hosting.console.exitFullBleed') : t('hosting.console.enterFullBleed')}
						className="flex items-center gap-1.5"
					>
						{fullBleed ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
						<span className="hidden md:inline">{fullBleed ? t('hosting.console.exitFullBleed') : t('hosting.console.enterFullBleed')}</span>
					</Button>
				</div>
			</div>

			{/* Persistent Multi-Node Iframe Stage */}
			<div
				className={`flex-1 w-full min-h-0 ${isSplitView ? 'grid grid-cols-1 lg:grid-cols-2' : 'flex flex-col'}`}
				style={{ gap: isSplitView && !fullBleed ? 'calc(var(--ui-gap) * 0.75)' : '0px' }}
			>
				{nodes.map((node) => {
					const isVisible = isSplitView || selectedNode?.id === node.id;
					const reloadKey = reloadCounters[node.id] || 0;
					const ping = nodePings[node.id];
					return (
						<div
							key={node.id}
							className={`${
								isVisible ? 'flex flex-col flex-1 min-h-0 w-full h-full' : 'hidden'
							} overflow-hidden ${fullBleed ? 'rounded-none border-0' : 'rounded-3xl border border-(--border)/10'} bg-(--foreground)/30 backdrop-blur-md shadow-sm`}
						>
							{isSplitView && (
								<div className="flex items-center justify-between px-3.5 py-2 bg-(--background)/70 border-b border-(--border)/10 shrink-0">
									<div className="flex items-center gap-2 min-w-0">
										<span className={`h-2 w-2 rounded-full ${ping?.status === 'unreachable' ? 'bg-(--accent-red)' : 'bg-(--accent-green) animate-pulse'} shrink-0`} />
										<span className="text-xs font-extrabold text-(--text) truncate" style={{ fontFamily: 'var(--font-fredoka)' }}>
											{node.name}
										</span>
										{node.region && <span className="text-[10px] font-semibold text-(--accent)">({node.region})</span>}
										{ping?.latencyMs !== null && ping?.latencyMs !== undefined && <span className="text-[10px] font-mono text-(--text-muted)">{ping.latencyMs}ms</span>}
										<span className="font-mono text-[11px] text-(--text-muted) truncate hidden sm:inline">{node.url}</span>
									</div>
									<div className="flex items-center gap-1.5 shrink-0">
										<button
											type="button"
											onClick={() => handleReloadNode(node.id)}
											title={t('hosting.console.reloadNode')}
											className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-(--foreground)/50 hover:bg-(--accent)/20 text-(--text-muted) hover:text-(--accent) transition-colors cursor-pointer"
										>
											<RefreshCw size={12} />
										</button>
										<a
											href={node.url}
											target="_blank"
											rel="noopener noreferrer"
											title={t('hosting.console.openExternal')}
											className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-(--foreground)/50 hover:bg-(--accent)/20 text-(--text-muted) hover:text-(--accent) transition-colors"
										>
											<ExternalLink size={12} />
										</a>
									</div>
								</div>
							)}

							{isVercelNode(node) ? (
								<HostingVercelPanel userId={userId} reloadTrigger={reloadKey} onTokenUpdated={loadUserConnections} />
							) : (
								<iframe
									key={`${node.id}-${reloadKey}`}
									ref={(el) => {
										iframeRefs.current[node.id] = el;
									}}
									src={buildThemedNodeUrl(node.url, resolvedTheme)}
									onLoad={(e) => {
										try {
											e.currentTarget.contentWindow?.postMessage({ type: 'theme', theme: resolvedTheme, colorScheme: resolvedTheme }, '*');
										} catch {}
									}}
									title={`Easypanel — ${node.name}`}
									data-theme={resolvedTheme}
									style={{
										colorScheme: resolvedTheme,
										filter: resolvedTheme === 'dark' ? 'invert(0.92) hue-rotate(180deg)' : 'none',
									}}
									className="w-full h-full flex-1 border-0 bg-(--background) transition-[filter] duration-200"
									allow="clipboard-read; clipboard-write; fullscreen"
								/>
							)}
						</div>
					);
				})}
			</div>

			<HostingNodeConfigModal open={configModalOpen} onOpenChange={setConfigModalOpen} nodes={nodes} savingConfig={savingConfig} onSaveNodes={handleSaveNodesConfig} />

			<HostingSshModal open={sshModalOpen} onOpenChange={setSshModalOpen} activeNode={sshModalNode || selectedNode} nodes={nodes} userId={userId} defaultPassword={easypanelConn?.secret} />
		</div>
	);
}
