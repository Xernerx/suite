/** @format */
'use client';

import { CheckCircle2, Cloud, GitBranch, GitCommit, Globe, Play, Settings2, TriangleAlert } from 'lucide-react';
import { Button } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

export interface VercelDeploymentItem {
	id: string;
	name: string;
	url: string | null;
	inspectorUrl: string | null;
	state: string;
	target: string;
	createdAt: number | null;
	readyAt: number | null;
	buildingAt: number | null;
	branch: string;
	commitSha: string | null;
	commitMessage: string | null;
	author: string | null;
}

interface HostingVercelDeploymentsProps {
	connected: boolean;
	deployments: VercelDeploymentItem[];
	redeployingId: string | null;
	onRedeploy: (deploymentId: string, name: string, target: string) => void;
	onStartOAuth: () => void;
}

export function HostingVercelDeployments({ connected, deployments, redeployingId, onRedeploy, onStartOAuth }: HostingVercelDeploymentsProps) {
	const { t } = useDictionary();

	if (!connected) {
		return (
			<div
				className="flex flex-col items-center justify-center rounded-3xl bg-(--background)/60 border border-(--accent)/25 p-8 text-center max-w-xl mx-auto my-auto"
				style={{ gap: 'var(--ui-gap)' }}
			>
				<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
					<Cloud size={28} />
				</div>
				<div className="flex flex-col gap-1">
					<h3 className="text-lg font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('hosting.vercel.connectCardTitle')}
					</h3>
					<p className="text-xs text-(--text-muted) leading-relaxed">{t('hosting.vercel.connectCardDesc')}</p>
				</div>
				<div className="flex flex-wrap items-center justify-center gap-2">
					<Button variant="primary" onClick={onStartOAuth} className="flex items-center gap-1.5">
						<Cloud size={14} />
						<span>{t('account.connections.vercel.oauthButton')}</span>
					</Button>
				</div>
			</div>
		);
	}

	if (deployments.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-2xl bg-(--background)/50 border border-(--border)/10 p-8 text-center text-xs text-(--text-muted) gap-2">
				<TriangleAlert size={22} className="text-(--accent)" />
				<span>{t('hosting.vercel.noDeployments')}</span>
			</div>
		);
	}

	return (
		<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
			{deployments.map((d) => {
				const isReadyState = d.state === 'READY';
				const isErrorState = d.state === 'ERROR' || d.state === 'CANCELED';
				return (
					<div
						key={d.id}
						className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-(--background)/60 border border-(--border)/10 p-3.5 hover:border-(--accent)/30 transition-all"
					>
						<div className="flex flex-col gap-1 min-w-0">
							<div className="flex flex-wrap items-center gap-2">
								<span className="text-sm font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{d.name}
								</span>
								<span
									className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
										isReadyState
											? 'bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/25'
											: isErrorState
												? 'bg-(--accent-red)/15 text-(--accent-red) border border-(--accent-red)/25'
												: 'bg-(--accent-orange)/15 text-(--accent-orange) border border-(--accent-orange)/25'
									}`}
								>
									{isReadyState && <CheckCircle2 size={10} />}
									{d.state}
								</span>
								<span className="rounded-full bg-(--accent)/15 text-(--accent) border border-(--accent)/25 px-2 py-0.5 text-[10px] font-bold uppercase">{d.target}</span>
								{d.createdAt && <span className="text-[11px] text-(--text-muted)">{new Date(d.createdAt).toLocaleString()}</span>}
							</div>

							<div className="flex flex-wrap items-center gap-2 text-xs text-(--text-muted) font-mono">
								<span className="inline-flex items-center gap-1 text-(--accent)">
									<GitBranch size={11} />
									{d.branch}
								</span>
								{d.commitSha && (
									<span className="inline-flex items-center gap-1">
										<GitCommit size={11} />
										{d.commitSha}
									</span>
								)}
								{d.commitMessage && <span className="truncate max-w-md font-sans text-(--text)">{d.commitMessage}</span>}
							</div>
						</div>

						<div className="flex flex-wrap items-center gap-2 shrink-0">
							<Button variant="secondary" size="sm" loading={redeployingId === d.id} onClick={() => onRedeploy(d.id, d.name, d.target)} className="flex items-center gap-1.5">
								<Play size={12} className="text-(--accent)" />
								<span>{t('hosting.vercel.redeployButton')}</span>
							</Button>
							{d.url && (
								<a
									href={d.url}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1 rounded-xl bg-(--foreground)/50 hover:bg-(--accent)/20 border border-(--border)/10 px-2.5 py-1.5 text-xs font-bold text-(--text) transition-colors"
								>
									<Globe size={12} className="text-(--accent)" />
									<span>{t('hosting.vercel.visitUrl')}</span>
								</a>
							)}
							{d.inspectorUrl && (
								<a
									href={d.inspectorUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1 rounded-xl bg-(--foreground)/50 hover:bg-(--accent)/20 border border-(--border)/10 px-2.5 py-1.5 text-xs font-bold text-(--text) transition-colors"
								>
									<Settings2 size={12} className="text-(--accent)" />
									<span>{t('hosting.vercel.inspectLogs')}</span>
								</a>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}
