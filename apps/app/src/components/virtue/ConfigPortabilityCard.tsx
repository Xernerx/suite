/** @format */
'use client';

import { useEffect, useState } from 'react';
import { Copy, Download, FileJson, Sparkles, Upload } from 'lucide-react';
import { Button, Input, Modal, Selector } from '@xernerx/ui';
import { useDictionary, useEnvironment, useSession, useToast } from '@xernerx/providers';

export interface VirtueConfigShape {
	mode: 'easy' | 'casual' | 'balanced' | 'hard' | 'extreme';
	cycles: {
		daily: boolean;
		weekly: boolean;
		monthly: boolean;
	};
	roles: {
		ignored: string[];
		tracked: string[];
	};
	levelUp: boolean;
	levelMessage: string;
	levelChannel: string | null;
	autoDelete: number;
}

interface ConfigPortabilityCardProps {
	guildId: string;
	currentConfig: VirtueConfigShape;
	onApplyConfig: (config: Partial<VirtueConfigShape>) => void;
	managedGuilds?: { id: string; name: string }[];
}

export default function ConfigPortabilityCard({ guildId, currentConfig, onApplyConfig, managedGuilds = [] }: ConfigPortabilityCardProps) {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { data: session } = useSession();
	const { toast } = useToast();

	const [guilds, setGuilds] = useState<{ id: string; name: string }[]>(managedGuilds);
	const [sourceGuildId, setSourceGuildId] = useState<string>('');
	const [cloning, setCloning] = useState<boolean>(false);

	const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
	const [importJsonText, setImportJsonText] = useState<string>('');

	useEffect(() => {
		if (managedGuilds.length > 0) {
			setGuilds(managedGuilds.filter((g) => g.id !== guildId));
			return;
		}
		if (!isReady) return;
		const sessionData = session as any;
		if (!sessionData?.user?.id) return;

		const fetchManagedGuilds = async () => {
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/core/users/${sessionData.user.id}/discord/guilds`), {
					headers: sessionData.accessToken ? { Authorization: `Bearer ${sessionData.accessToken}` } : undefined,
				});
				if (res.ok) {
					const data = await res.json();
					if (Array.isArray(data)) {
						const filtered = data.filter((g: any) => {
							if (g.id === guildId) return false;
							const perms = BigInt(g.permissions || 0);
							return (perms & BigInt(0x8)) === BigInt(0x8) || (perms & BigInt(0x20)) === BigInt(0x20);
						});
						setGuilds(filtered.map((g: any) => ({ id: g.id, name: g.name })));
					}
				}
			} catch (err) {
				console.error('Failed to fetch managed guilds for Virtue portability:', err);
			}
		};

		fetchManagedGuilds();
	}, [guildId, managedGuilds, isReady, session, getEnvUrl]);

	const handleExportJson = () => {
		const exportPayload = {
			schema: 'xernerx.virtue.v1',
			exportedAt: new Date().toISOString(),
			sourceGuildId: guildId,
			config: currentConfig,
		};
		const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `virtue-config-${guildId}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		toast({
			type: 'success',
			title: t('app.dashboard.virtue.portability.exportSuccess'),
		});
	};

	const handleApplyImportedJson = () => {
		try {
			const parsed = JSON.parse(importJsonText);
			const cfg = parsed.config || parsed;
			if (!cfg || typeof cfg !== 'object') {
				throw new Error('Invalid Virtue configuration object');
			}
			onApplyConfig({
				mode: cfg.mode,
				cycles: cfg.cycles,
				roles: cfg.roles,
				levelUp: cfg.levelUp,
				levelMessage: cfg.levelMessage,
				levelChannel: cfg.levelChannel,
				autoDelete: cfg.autoDelete,
			});
			setImportModalOpen(false);
			setImportJsonText('');
			toast({
				type: 'success',
				title: t('app.dashboard.virtue.portability.importSuccess'),
			});
		} catch {
			toast({
				type: 'error',
				title: t('app.dashboard.virtue.portability.importError'),
			});
		}
	};

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === 'string') {
				setImportJsonText(reader.result);
			}
		};
		reader.readAsText(file);
	};

	const handleCloneFromServer = async () => {
		if (!sourceGuildId) return;
		setCloning(true);
		try {
			let res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${sourceGuildId}/virtue`), {
				credentials: 'include',
			});
			if (!res.ok) {
				res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/virtue/guilds/${sourceGuildId}`), {
					credentials: 'include',
				});
			}
			if (!res.ok) {
				throw new Error(t('app.dashboard.virtue.portability.cloneNotFound'));
			}
			const data = await res.json();
			onApplyConfig({
				mode: data.mode,
				cycles: data.cycles,
				roles: data.roles,
				levelUp: data.levelUp,
				levelMessage: data.levelMessage,
				levelChannel: data.levelChannel,
				autoDelete: data.autoDelete,
			});
			const sourceName = guilds.find((g) => g.id === sourceGuildId)?.name || sourceGuildId;
			toast({
				type: 'success',
				title: t('app.dashboard.virtue.portability.cloneSuccess', { server: sourceName }),
			});
		} catch (err: any) {
			toast({
				type: 'error',
				title: err.message || t('app.dashboard.virtue.portability.cloneFailed'),
			});
		} finally {
			setCloning(false);
		}
	};

	return (
		<>
			<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
							<FileJson size={18} />
						</div>
						<div>
							<h3 className="text-base font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('app.dashboard.virtue.portability.title')}
							</h3>
							<p className="text-xs text-(--text-muted)">{t('app.dashboard.virtue.portability.subtitle')}</p>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<Button variant="secondary" size="sm" onClick={handleExportJson}>
							<Download size={14} className="text-(--accent)" />
							<span>{t('app.dashboard.virtue.portability.exportBtn')}</span>
						</Button>

						<Button variant="secondary" size="sm" onClick={() => setImportModalOpen(true)}>
							<Upload size={14} className="text-(--accent)" />
							<span>{t('app.dashboard.virtue.portability.importBtn')}</span>
						</Button>
					</div>
				</div>

				{/* Cross-Server Config Cloning Row */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-(--background)/50 border border-(--border)/10 p-3.5">
					<div className="flex flex-col">
						<span className="text-xs font-extrabold text-(--text)">{t('app.dashboard.virtue.portability.cloneTitle')}</span>
						<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.virtue.portability.cloneDesc')}</span>
					</div>

					<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto sm:min-w-80">
						<div className="flex-1">
							<Selector
								value={sourceGuildId}
								onChange={setSourceGuildId}
								placeholder={t('app.dashboard.virtue.portability.selectServerPlaceholder')}
								options={guilds.map((g) => ({
									value: g.id,
									label: g.name,
								}))}
							/>
						</div>
						<Button variant="primary" size="sm" onClick={handleCloneFromServer} loading={cloning} disabled={!sourceGuildId} className="shrink-0">
							{!cloning && <Copy size={13} />}
							<span>{t('app.dashboard.virtue.portability.cloneBtn')}</span>
						</Button>
					</div>
				</div>
			</div>

			<Modal
				open={importModalOpen}
				onOpenChange={setImportModalOpen}
				title={t('app.dashboard.virtue.portability.modalTitle')}
				description={t('app.dashboard.virtue.portability.modalDesc')}
				maxWidth="max-w-lg"
			>
				<div className="flex flex-col gap-3">
					<label className="inline-flex items-center justify-center gap-2 rounded-2xl border border-dashed border-(--accent)/40 bg-(--accent)/10 hover:bg-(--accent)/15 p-3 text-xs font-bold text-(--accent) cursor-pointer transition-colors">
						<Upload size={14} />
						<span>{t('app.dashboard.virtue.portability.uploadFileLabel')}</span>
						<input type="file" accept="application/json,.json" className="hidden" onChange={handleFileUpload} />
					</label>

					<Input
						variant="textarea"
						rows={8}
						value={importJsonText}
						onChange={(e) => setImportJsonText(e.target.value)}
						placeholder={t('app.dashboard.virtue.portability.jsonPlaceholder')}
						className="font-mono text-xs"
					/>

					<div className="flex items-center justify-end gap-2 pt-2">
						<Button variant="ghost" onClick={() => setImportModalOpen(false)}>
							{t('common.buttons.cancel')}
						</Button>
						<Button variant="primary" onClick={handleApplyImportedJson} disabled={!importJsonText.trim()}>
							<Sparkles size={14} />
							<span>{t('app.dashboard.virtue.portability.applyBtn')}</span>
						</Button>
					</div>
				</div>
			</Modal>
		</>
	);
}
