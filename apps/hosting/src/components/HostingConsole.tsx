/** @format */
'use client';

import { Columns2, Copy, ExternalLink, KeyRound, Maximize2, Minimize2, Plus, RefreshCw, RotateCcw, Save, Server, Settings2, ShieldCheck, Terminal, Trash2 } from 'lucide-react';
import { Badge, Button, Input, Modal } from '@xernerx/ui';
import { useDictionary, useEnvironment, useSession, useTheme, useToast, useUser } from '@xernerx/providers';
import { useEffect, useRef, useState } from 'react';
import HostingSshModal, { buildThemedNodeUrl, DEFAULT_HOSTING_NODES, type HostingNodeConfig, resolveNodeSshTarget } from './HostingSshModal';

export { DEFAULT_HOSTING_NODES, type HostingNodeConfig };

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
	const [draftNodes, setDraftNodes] = useState<HostingNodeConfig[]>(nodes);
	const [savingConfig, setSavingConfig] = useState(false);
	const [easypanelConn, setEasypanelConn] = useState<{ username: string; secret?: string; token?: string } | null>(null);
	const [sshModalOpen, setSshModalOpen] = useState(false);
	const [sshModalNode, setSshModalNode] = useState<HostingNodeConfig | undefined>(undefined);
	const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({});

	useEffect(() => {
		setDraftNodes(nodes);
	}, [nodes]);

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

	useEffect(() => {
		if (!isReady || !userId) return;
		fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${userId}?includeSecrets=true`), { credentials: 'include', cache: 'no-store' })
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (Array.isArray(data?.connections)) {
					const foundEp = data.connections.find((c: any) => c.provider === 'easypanel');
					if (foundEp) setEasypanelConn(foundEp);
				}
			})
			.catch(() => {});
	}, [isReady, userId, getEnvUrl]);

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
		toast({ type: 'info', title: t('hosting.console.reloadingToast', { node: nodeId }) });
	};

	const handleReloadCurrent = () => {
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

	const handleUpdateDraftNode = (index: number, field: keyof HostingNodeConfig, value: string) => {
		setDraftNodes((prev) => prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)));
	};

	const handleAddDraftNode = () => {
		const nextIdx = draftNodes.length + 1;
		setDraftNodes((prev) => [...prev, { id: `node-${nextIdx}`, name: `node-${nextIdx}`, url: `https://node-${nextIdx}.xernerx.com`, region: `Node ${nextIdx}` }]);
	};

	const handleRemoveDraftNode = (index: number) => {
		if (draftNodes.length <= 1) return;
		setDraftNodes((prev) => prev.filter((_, idx) => idx !== index));
	};

	const handleResetDefaultNodes = () => {
		setDraftNodes(DEFAULT_HOSTING_NODES);
	};

	const handleSaveNodesConfig = async () => {
		const sanitized = draftNodes
			.map((n) => ({
				id: (n.id || n.name || 'node')
					.trim()
					.toLowerCase()
					.replace(/[^a-z0-9-_]/g, '-'),
				name: (n.name || n.id || 'node').trim(),
				url: (n.url || '').trim(),
				region: (n.region || '').trim(),
				sshTarget: (n.sshTarget || '').trim(),
				sshPort: (n.sshPort || '22').trim(),
			}))
			.filter((n) => n.id && n.url);

		if (sanitized.length === 0) {
			toast({ type: 'error', title: t('hosting.configModal.invalidError') });
			return;
		}

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
			className="flex flex-col flex-1 w-full h-[calc(100vh-50px)] overflow-hidden"
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
							return (
								<button
									key={node.id}
									type="button"
									onClick={() => onSelectView(node.id)}
									className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
										isSelected ? 'bg-(--accent) text-(--text) shadow-xs' : 'text-(--text-muted) hover:text-(--text) hover:bg-(--foreground)/50'
									}`}
								>
									<span className={`h-2 w-2 rounded-full ${isSelected ? 'bg-(--accent-green) animate-pulse' : 'bg-(--accent-green)/70'}`} />
									<Server size={13} />
									<span>{node.name}</span>
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
					{easypanelConn ? (
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

					<Button
						variant="secondary"
						size="sm"
						onClick={() => {
							setSshModalNode(selectedNode);
							setSshModalOpen(true);
						}}
						className="flex items-center gap-1.5"
					>
						<Terminal size={13} className="text-(--accent)" />
						<span className="font-mono text-[11px]">{resolveNodeSshTarget(selectedNode)}</span>
					</Button>

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

			{/* Persistent Multi-Node Iframe Stage (All nodes stay mounted in DOM for 0ms switching) */}
			<div
				className={`flex-1 w-full min-h-0 ${isSplitView ? 'grid grid-cols-1 lg:grid-cols-2' : 'flex flex-col'}`}
				style={{ gap: isSplitView && !fullBleed ? 'calc(var(--ui-gap) * 0.75)' : '0px' }}
			>
				{nodes.map((node) => {
					const isVisible = isSplitView || selectedNode?.id === node.id;
					const reloadKey = reloadCounters[node.id] || 0;
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
										<span className="h-2 w-2 rounded-full bg-(--accent-green) animate-pulse shrink-0" />
										<span className="text-xs font-extrabold text-(--text) truncate" style={{ fontFamily: 'var(--font-fredoka)' }}>
											{node.name}
										</span>
										{node.region && <span className="text-[10px] font-semibold text-(--accent)">({node.region})</span>}
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
						</div>
					);
				})}
			</div>

			{/* Node URLs Configuration Modal */}
			<Modal open={configModalOpen} onOpenChange={setConfigModalOpen} maxWidth="max-w-2xl" title={t('hosting.configModal.title')} description={t('hosting.configModal.description')}>
				<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
					<div className="rounded-2xl bg-(--accent)/10 border border-(--accent)/25 p-3 text-xs text-(--text-muted)">{t('hosting.configModal.cookieHint')}</div>

					<div className="flex flex-col max-h-[50vh] overflow-y-auto pr-1" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
						{draftNodes.map((node, index) => (
							<div key={index} className="flex flex-col rounded-2xl bg-(--background)/50 border border-(--border)/10 p-3.5" style={{ gap: 'calc(var(--ui-gap) * 0.6)' }}>
								<div className="flex items-center justify-between gap-2">
									<span className="text-xs font-extrabold uppercase tracking-wider text-(--accent)">{t('hosting.configModal.nodeLabel', { index: index + 1 })}</span>
									{draftNodes.length > 1 && (
										<button
											type="button"
											onClick={() => handleRemoveDraftNode(index)}
											className="inline-flex items-center gap-1 text-xs font-semibold text-(--text-muted) hover:text-(--accent-red) transition-colors cursor-pointer"
										>
											<Trash2 size={13} />
											<span>{t('hosting.configModal.deleteNode')}</span>
										</button>
									)}
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 'calc(var(--ui-gap) * 0.6)' }}>
									<div className="flex flex-col gap-1">
										<span className="text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">{t('hosting.configModal.nameField')}</span>
										<Input
											value={node.name}
											onChange={(e) => {
												const val = e.target.value;
												handleUpdateDraftNode(index, 'name', val);
												handleUpdateDraftNode(
													index,
													'id',
													val
														.toLowerCase()
														.replace(/[^a-z0-9-_]/g, '-')
														.replace(/-+/g, '-')
												);
											}}
											placeholder="one-dummi"
										/>
									</div>
									<div className="flex flex-col gap-1">
										<span className="text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">{t('hosting.configModal.regionField')}</span>
										<Input value={node.region || ''} onChange={(e) => handleUpdateDraftNode(index, 'region', e.target.value)} placeholder="Primary Node" />
									</div>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 'calc(var(--ui-gap) * 0.6)' }}>
									<div className="sm:col-span-2 flex flex-col gap-1">
										<span className="text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">{t('hosting.configModal.urlField')}</span>
										<Input value={node.url} onChange={(e) => handleUpdateDraftNode(index, 'url', e.target.value)} placeholder="https://one-dummi.xernerx.com" />
									</div>
									<div className="flex flex-col gap-1">
										<span className="text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">{t('hosting.configModal.sshField')}</span>
										<Input value={node.sshTarget || ''} onChange={(e) => handleUpdateDraftNode(index, 'sshTarget', e.target.value)} placeholder="root@123.45.67.89" />
									</div>
								</div>
							</div>
						))}
					</div>

					<div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-(--border)/10">
						<div className="flex items-center gap-2">
							<Button variant="secondary" size="sm" onClick={handleAddDraftNode} className="flex items-center gap-1.5">
								<Plus size={14} />
								{t('hosting.configModal.addNode')}
							</Button>
							<Button variant="ghost" size="sm" onClick={handleResetDefaultNodes} className="flex items-center gap-1.5 text-(--text-muted)">
								<RotateCcw size={14} />
								{t('hosting.configModal.resetDefaults')}
							</Button>
						</div>

						<div className="flex items-center gap-2">
							<Button variant="secondary" size="sm" onClick={() => setConfigModalOpen(false)}>
								{t('hosting.configModal.cancel')}
							</Button>
							<Button variant="primary" size="sm" onClick={handleSaveNodesConfig} loading={savingConfig} className="flex items-center gap-1.5">
								<Save size={14} />
								{t('hosting.configModal.save')}
							</Button>
						</div>
					</div>
				</div>
			</Modal>

			<HostingSshModal open={sshModalOpen} onOpenChange={setSshModalOpen} activeNode={sshModalNode || selectedNode} nodes={nodes} userId={userId} />
		</div>
	);
}
