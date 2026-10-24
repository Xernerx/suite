/** @format */
'use client';

import { useEffect, useState } from 'react';
import { Calendar, Check, Copy, Globe, Plus, Rocket, Save, Tag, Terminal, Trash2 } from 'lucide-react';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { Button, Confirm, Input, Selector, Toggle } from '@xernerx/ui';

export interface CommandOptionDraft {
	name: string;
	description: string;
	type: string;
	required: boolean;
}
export interface SlashCommandDraft {
	name: string;
	description: string;
	type: 1 | 2 | 3;
	options: CommandOptionDraft[];
}
export interface BotReleasesAndCommandsManagerProps {
	botId: string;
	botConfig: any;
	setBotConfig: (config: any) => void;
	setOriginalBotConfig?: (config: any) => void;
}

const OPTION_TYPE_CHOICES = ['STRING', 'INTEGER', 'BOOLEAN', 'USER', 'CHANNEL', 'ROLE', 'NUMBER', 'ATTACHMENT'].map((v) => ({ label: v, value: v }));

export default function BotReleasesAndCommandsManager({ botId, botConfig, setBotConfig, setOriginalBotConfig }: BotReleasesAndCommandsManagerProps) {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { toast } = useToast();

	const [vanitySlug, setVanitySlug] = useState<string>(botConfig?.vanitySlug || '');
	const [savingSlug, setSavingSlug] = useState(false);
	const [copiedSlugUrl, setCopiedSlugUrl] = useState(false);

	const [releases, setReleases] = useState<any[]>(Array.isArray(botConfig?.releases) ? botConfig.releases : []);
	const [relVersion, setRelVersion] = useState('');
	const [relTitle, setRelTitle] = useState('');
	const [relBody, setRelBody] = useState('');
	const [publishingRelease, setPublishingRelease] = useState(false);
	const [releaseToDelete, setReleaseToDelete] = useState<any | null>(null);
	const [deletingRelease, setDeletingRelease] = useState(false);

	const [commands, setCommands] = useState<SlashCommandDraft[]>(() =>
		(Array.isArray(botConfig?.commands) ? botConfig.commands : []).map((c: any) => ({
			name: c.name || '',
			description: c.description || '',
			type: c.type === 2 ? 2 : c.type === 3 ? 3 : 1,
			options: (Array.isArray(c.options) ? c.options : []).map((o: any) => ({
				name: o.name || '',
				description: o.description || '',
				type: typeof o.type === 'string' ? o.type.toUpperCase() : 'STRING',
				required: Boolean(o.required),
			})),
		}))
	);
	const [savingCommands, setSavingCommands] = useState(false);

	useEffect(() => {
		setVanitySlug(botConfig?.vanitySlug || '');
	}, [botConfig?.vanitySlug]);

	useEffect(() => {
		if (!isReady || !botId) return;
		fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${botId}/releases`), { credentials: 'include' })
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (Array.isArray(data)) setReleases(data);
				else if (Array.isArray(data?.releases)) setReleases(data.releases);
			})
			.catch(() => null);
	}, [botId, getEnvUrl, isReady]);

	const handleSlugChange = (val: string) => {
		const cleaned = val
			.toLowerCase()
			.replace(/[^a-z0-9-_]/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '')
			.slice(0, 48);
		setVanitySlug(cleaned);
		setBotConfig({ ...botConfig, vanitySlug: cleaned });
	};

	const handleSaveVanitySlug = async () => {
		setSavingSlug(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${botId}/profile`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ vanitySlug }),
			});
			if (res.ok) {
				const updated = { ...botConfig, vanitySlug };
				setBotConfig(updated);
				setOriginalBotConfig?.(JSON.parse(JSON.stringify(updated)));
				toast({ type: 'success', title: t('app.portal.bot.vanity.savedToast') });
			} else {
				const err = await res.json().catch(() => ({}));
				toast({ type: 'error', title: err.error || t('common.toast.saveFailed') });
			}
		} catch {
			toast({ type: 'error', title: t('common.toast.saveError') });
		} finally {
			setSavingSlug(false);
		}
	};

	const handleCopyVanityUrl = () => {
		const url = `https://xernerx.com/bots/${vanitySlug || botId}`;
		navigator.clipboard.writeText(url).then(() => {
			setCopiedSlugUrl(true);
			toast({ type: 'success', title: t('app.bots.id.profileLinkCopied'), description: url });
			setTimeout(() => setCopiedSlugUrl(false), 2000);
		});
	};

	const handlePublishRelease = async () => {
		if (!relVersion.trim() || !relTitle.trim()) {
			toast({ type: 'error', title: t('app.portal.bot.releases.validationError') });
			return;
		}
		setPublishingRelease(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${botId}/releases`), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ version: relVersion.trim(), title: relTitle.trim(), body: relBody.trim() }),
			});
			if (res.ok) {
				const data = await res.json().catch(() => null);
				if (Array.isArray(data)) setReleases(data);
				else if (Array.isArray(data?.releases)) setReleases(data.releases);
				else {
					const created = data?.release || data || { id: String(Date.now()), version: relVersion.trim(), title: relTitle.trim(), body: relBody.trim(), createdAt: new Date().toISOString() };
					setReleases((prev) => [created, ...prev]);
				}
				setRelVersion('');
				setRelTitle('');
				setRelBody('');
				toast({ type: 'success', title: t('app.portal.bot.releases.publishedToast') });
			} else {
				const err = await res.json().catch(() => ({}));
				toast({ type: 'error', title: err.error || t('common.toast.saveFailed') });
			}
		} catch {
			toast({ type: 'error', title: t('common.toast.saveError') });
		} finally {
			setPublishingRelease(false);
		}
	};

	const handleConfirmDeleteRelease = async () => {
		if (!releaseToDelete) return;
		const releaseId = releaseToDelete.id || releaseToDelete._id || releaseToDelete.version;
		setDeletingRelease(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${botId}/releases?releaseId=${encodeURIComponent(releaseId)}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (res.ok) {
				setReleases((prev) => prev.filter((r) => (r.id || r._id || r.version) !== releaseId));
				setReleaseToDelete(null);
				toast({ type: 'success', title: t('app.portal.bot.releases.deletedToast') });
			} else {
				toast({ type: 'error', title: t('common.toast.saveFailed') });
			}
		} catch {
			toast({ type: 'error', title: t('common.toast.saveError') });
		} finally {
			setDeletingRelease(false);
		}
	};

	const syncCommandsToConfig = (nextCommands: SlashCommandDraft[]) => {
		setCommands(nextCommands);
		setBotConfig({ ...botConfig, commands: nextCommands });
	};

	const addCommand = (type: 1 | 2 | 3 = 1) => syncCommandsToConfig([...commands, { name: '', description: '', type, options: [] }]);
	const updateCommand = (idx: number, patch: Partial<SlashCommandDraft>) => syncCommandsToConfig(commands.map((cmd, i) => (i === idx ? { ...cmd, ...patch } : cmd)));
	const removeCommand = (idx: number) => syncCommandsToConfig(commands.filter((_, i) => i !== idx));
	const addOption = (cmdIdx: number) => {
		const target = commands[cmdIdx];
		if (target) updateCommand(cmdIdx, { options: [...target.options, { name: '', description: '', type: 'STRING', required: false }] });
	};
	const updateOption = (cmdIdx: number, optIdx: number, patch: Partial<CommandOptionDraft>) => {
		const target = commands[cmdIdx];
		if (target) updateCommand(cmdIdx, { options: target.options.map((o, j) => (j === optIdx ? { ...o, ...patch } : o)) });
	};
	const removeOption = (cmdIdx: number, optIdx: number) => {
		const target = commands[cmdIdx];
		if (target) updateCommand(cmdIdx, { options: target.options.filter((_, j) => j !== optIdx) });
	};

	const handleSaveCommands = async () => {
		const cleaned = commands
			.filter((c) => c.name.trim())
			.map((c) => {
				const cmdType: 1 | 2 | 3 = c.type === 2 ? 2 : c.type === 3 ? 3 : 1;
				return {
					name: cmdType === 1 ? c.name.trim().toLowerCase().replace(/^\//, '').replace(/\s+/g, '-') : c.name.trim(),
					description: c.description.trim(),
					type: cmdType,
					options:
						cmdType === 1
							? c.options
									.filter((o) => o.name.trim())
									.map((o) => ({
										name: o.name.trim().toLowerCase().replace(/\s+/g, '_'),
										description: o.description.trim(),
										type: o.type || 'STRING',
										required: Boolean(o.required),
									}))
							: [],
				};
			});

		setSavingCommands(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${botId}/profile`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ commands: cleaned }),
			});
			if (res.ok) {
				const updated = { ...botConfig, commands: cleaned };
				setCommands(cleaned);
				setBotConfig(updated);
				setOriginalBotConfig?.(JSON.parse(JSON.stringify(updated)));
				toast({ type: 'success', title: t('app.portal.bot.commandsEditor.savedToast') });
			} else {
				const err = await res.json().catch(() => ({}));
				toast({ type: 'error', title: err.error || t('common.toast.saveFailed') });
			}
		} catch {
			toast({ type: 'error', title: t('common.toast.saveError') });
		} finally {
			setSavingCommands(false);
		}
	};

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			{/* 1. Vanity Slug Card */}
			<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30 shrink-0">
							<Globe className="h-5 w-5" />
						</div>
						<div>
							<h3 className="text-lg font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('app.portal.bot.vanity.title')}
							</h3>
							<p className="text-xs text-(--text-muted)">{t('app.portal.bot.vanity.description')}</p>
						</div>
					</div>
					<div className="flex items-center gap-2 self-start sm:self-auto">
						<Button variant="secondary" onClick={handleCopyVanityUrl} className="gap-1.5 text-xs">
							{copiedSlugUrl ? <Check size={14} className="text-(--accent-green)" /> : <Copy size={14} />}
							<span>xernerx.com/bots/{vanitySlug || botId}</span>
						</Button>
						<Button variant="primary" onClick={handleSaveVanitySlug} loading={savingSlug} className="gap-1.5 text-xs">
							<Save size={14} />
							<span>{t('app.portal.bot.vanity.saveBtn')}</span>
						</Button>
					</div>
				</div>

				<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 rounded-2xl bg-(--background)/50 border border-(--border)/10">
					<span className="text-xs font-mono font-bold text-(--text-muted) shrink-0">https://xernerx.com/bots/</span>
					<div className="flex-1">
						<Input value={vanitySlug} onChange={(e) => handleSlugChange(e.target.value)} placeholder={t('app.portal.bot.vanity.placeholder')} />
					</div>
				</div>
			</div>

			{/* 2. Release Notes Publisher Card */}
			<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30 shrink-0">
							<Rocket className="h-5 w-5" />
						</div>
						<div>
							<h3 className="text-lg font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('app.portal.bot.releases.title')}
							</h3>
							<p className="text-xs text-(--text-muted)">{t('app.portal.bot.releases.subtitle')}</p>
						</div>
					</div>
					<span className="px-3 py-1 rounded-full bg-(--accent)/15 border border-(--accent)/30 text-xs font-extrabold text-(--accent)">
						{t('app.bots.releases.countBadge', { count: releases.length })}
					</span>
				</div>

				<div className="flex flex-col gap-3 p-5 rounded-2xl bg-(--background)/50 border border-(--border)/10">
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<div>
							<label className="block text-xs font-bold text-(--text-muted) uppercase tracking-wider mb-1.5">{t('app.portal.bot.releases.versionLabel')}</label>
							<Input value={relVersion} onChange={(e) => setRelVersion(e.target.value)} placeholder="v1.2.0" />
						</div>
						<div className="sm:col-span-2">
							<label className="block text-xs font-bold text-(--text-muted) uppercase tracking-wider mb-1.5">{t('app.portal.bot.releases.releaseTitleLabel')}</label>
							<Input value={relTitle} onChange={(e) => setRelTitle(e.target.value)} placeholder={t('app.portal.bot.releases.releaseTitlePlaceholder')} />
						</div>
					</div>
					<div>
						<label className="block text-xs font-bold text-(--text-muted) uppercase tracking-wider mb-1.5">{t('app.portal.bot.releases.bodyLabel')}</label>
						<Input variant="textarea" value={relBody} onChange={(e) => setRelBody(e.target.value)} placeholder={t('app.portal.bot.releases.bodyPlaceholder')} className="min-h-[100px]" />
					</div>
					<div className="flex justify-end">
						<Button variant="primary" onClick={handlePublishRelease} loading={publishingRelease} className="gap-1.5">
							<Plus size={15} />
							<span>{t('app.portal.bot.releases.publishBtn')}</span>
						</Button>
					</div>
				</div>

				{releases.length > 0 && (
					<div className="flex flex-col gap-2.5">
						{releases.map((rel, i) => {
							const relId = rel.id || rel._id || `${rel.version}-${i}`;
							return (
								<div key={relId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-(--background)/40 border border-(--border)/10">
									<div className="flex flex-col gap-1 min-w-0">
										<div className="flex flex-wrap items-center gap-2">
											<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-(--accent)/15 border border-(--accent)/30 text-xs font-mono font-extrabold text-(--accent)">
												<Tag size={11} />
												{rel.version}
											</span>
											<span className="font-bold text-sm text-(--text) truncate">{rel.title}</span>
											{rel.createdAt && (
												<span className="inline-flex items-center gap-1 text-[11px] text-(--text-muted)">
													<Calendar size={11} />
													{new Date(rel.createdAt).toLocaleDateString()}
												</span>
											)}
										</div>
										{rel.body && <p className="text-xs text-(--text-muted) line-clamp-2">{rel.body}</p>}
									</div>
									<Button variant="ghost" onClick={() => setReleaseToDelete(rel)} className="text-(--accent-red) hover:bg-(--accent-red)/10 self-end sm:self-auto shrink-0">
										<Trash2 size={15} />
									</Button>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* 3. Visual Slash Command Editor Card */}
			<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30 shrink-0">
							<Terminal className="h-5 w-5" />
						</div>
						<div>
							<h3 className="text-lg font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('app.portal.bot.commandsEditor.title')}
							</h3>
							<p className="text-xs text-(--text-muted)">{t('app.portal.bot.commandsEditor.subtitle')}</p>
						</div>
					</div>
					<div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
						<Button variant="secondary" onClick={() => addCommand(1)} className="gap-1.5 text-xs">
							<Plus size={14} />
							<span>{t('app.portal.bot.commandsEditor.addCommandBtn')}</span>
						</Button>
						<Button variant="secondary" onClick={() => addCommand(2)} className="gap-1.5 text-xs">
							<Plus size={14} />
							<span>{t('app.portal.bot.commandsEditor.addContextBtn')}</span>
						</Button>
						<Button variant="primary" onClick={handleSaveCommands} loading={savingCommands} className="gap-1.5 text-xs">
							<Save size={14} />
							<span>{t('app.portal.bot.commandsEditor.saveCommandsBtn')}</span>
						</Button>
					</div>
				</div>

				{commands.length === 0 ? (
					<div className="text-center py-10 px-4 rounded-2xl border border-dashed border-(--border)/15 bg-(--background)/30 text-xs text-(--text-muted)">
						{t('app.portal.bot.commandsEditor.emptyHint')}
					</div>
				) : (
					<div className="flex flex-col gap-4">
						{commands.map((cmd, cmdIdx) => {
							const isSlash = !cmd.type || cmd.type === 1;
							return (
								<div key={cmdIdx} className="flex flex-col gap-4 p-5 rounded-2xl bg-(--background)/50 border border-(--border)/10">
									<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
										<div className="sm:w-1/4">
											<label className="block text-[11px] font-bold uppercase tracking-wider text-(--text-muted) mb-1">{t('app.portal.bot.commandsEditor.cmdTypeLabel')}</label>
											<Selector
												value={String(cmd.type || 1)}
												onChange={(val) => updateCommand(cmdIdx, { type: Number(val) === 2 ? 2 : Number(val) === 3 ? 3 : 1 })}
												options={(['1:typeSlash', '2:typeUserContext', '3:typeMessageContext'] as const).map((entry) => {
													const [value, key] = entry.split(':');
													return { label: t(`app.portal.bot.commandsEditor.${key}`), value };
												})}
											/>
										</div>
										<div className="sm:w-1/4">
											<label className="block text-[11px] font-bold uppercase tracking-wider text-(--text-muted) mb-1">{t('app.portal.bot.commandsEditor.cmdNameLabel')}</label>
											<Input
												value={cmd.name}
												onChange={(e) => updateCommand(cmdIdx, { name: isSlash ? e.target.value.toLowerCase().replace(/^\//, '') : e.target.value })}
												placeholder={isSlash ? 'help' : 'View Profile'}
											/>
										</div>
										<div className="flex-1">
											<label className="block text-[11px] font-bold uppercase tracking-wider text-(--text-muted) mb-1">{t('app.portal.bot.commandsEditor.cmdDescLabel')}</label>
											<Input
												value={cmd.description}
												onChange={(e) => updateCommand(cmdIdx, { description: e.target.value })}
												placeholder={t('app.portal.bot.commandsEditor.cmdDescPlaceholder')}
											/>
										</div>
										<div className="flex items-end gap-2 pt-2 sm:pt-5">
											{isSlash && (
												<Button variant="secondary" onClick={() => addOption(cmdIdx)} className="gap-1 text-xs">
													<Plus size={13} />
													<span>{t('app.portal.bot.commandsEditor.addOptionBtn')}</span>
												</Button>
											)}
											<Button variant="ghost" onClick={() => removeCommand(cmdIdx)} className="text-(--accent-red) hover:bg-(--accent-red)/10">
												<Trash2 size={15} />
											</Button>
										</div>
									</div>

									{isSlash && cmd.options.length > 0 && (
										<div className="flex flex-col gap-2.5 pl-3 sm:pl-5 border-l-2 border-(--accent)/30">
											{cmd.options.map((opt, optIdx) => (
												<div key={optIdx} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center p-3 rounded-2xl bg-(--foreground)/40 border border-(--border)/10">
													<div className="sm:col-span-3">
														<Input
															value={opt.name}
															onChange={(e) => updateOption(cmdIdx, optIdx, { name: e.target.value.toLowerCase() })}
															placeholder={t('app.portal.bot.commandsEditor.optNamePlaceholder')}
														/>
													</div>
													<div className="sm:col-span-4">
														<Input
															value={opt.description}
															onChange={(e) => updateOption(cmdIdx, optIdx, { description: e.target.value })}
															placeholder={t('app.portal.bot.commandsEditor.optDescPlaceholder')}
														/>
													</div>
													<div className="sm:col-span-3">
														<Selector value={opt.type || 'STRING'} onChange={(val) => updateOption(cmdIdx, optIdx, { type: val })} options={OPTION_TYPE_CHOICES} />
													</div>
													<div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2">
														<div className="flex items-center gap-1.5">
															<Toggle size="sm" checked={Boolean(opt.required)} onChange={(e) => updateOption(cmdIdx, optIdx, { required: e.target.checked })} />
															<span className="text-[11px] font-bold text-(--text-muted)">{t('app.bots.id.text14')}</span>
														</div>
														<button
															type="button"
															onClick={() => removeOption(cmdIdx, optIdx)}
															className="p-1.5 rounded-xl text-(--accent-red) hover:bg-(--accent-red)/10 transition-colors cursor-pointer"
														>
															<Trash2 size={14} />
														</button>
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
			</div>

			<Confirm
				open={Boolean(releaseToDelete)}
				onOpenChange={(open) => !open && setReleaseToDelete(null)}
				title={t('app.portal.bot.releases.deleteConfirmTitle')}
				description={t('app.portal.bot.releases.deleteConfirmDesc', { version: releaseToDelete?.version || '' })}
				confirmText={t('common.buttons.delete')}
				cancelText={t('common.buttons.cancel')}
				variant="danger"
				loading={deletingRelease}
				onConfirm={handleConfirmDeleteRelease}
			/>
		</div>
	);
}
