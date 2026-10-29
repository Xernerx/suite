/** @format */
'use client';

import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Bot, Hash, Plus, RotateCcw, Save, Shield, Trash2 } from 'lucide-react';
import { Button, Confirm, Input, Selector } from '@xernerx/ui';
import { BotProfilePreview } from '@xernerx/components';
import { useDictionary, useToast } from '@xernerx/providers';
import type { BotDiscordProfile, DiscordChannelOption, DiscordRoleOption, RegisteredBotOption, SupportBotItem, SupportChannelItem } from './types';

interface SupportChannelsTabProps {
	activeGuildId: string;
	channels: SupportChannelItem[];
	discordChannels: DiscordChannelOption[];
	discordRoles: DiscordRoleOption[];
	saving: boolean;
	onSaveChannel: (payload: { id: string; guild: string; name?: string; role?: string; type: 'support' | 'status' }) => Promise<void>;
	onDeleteChannel: (channelId: string) => Promise<void>;
}

export function SupportChannelsTab({ activeGuildId, channels, discordChannels, discordRoles, saving, onSaveChannel, onDeleteChannel }: SupportChannelsTabProps) {
	const { t } = useDictionary();
	const [selectedChannelId, setSelectedChannelId] = useState('');
	const [customChannelId, setCustomChannelId] = useState('');
	const [channelType, setChannelType] = useState<'support' | 'status'>('support');
	const [selectedRoleId, setSelectedRoleId] = useState('');
	const [customRoleId, setCustomRoleId] = useState('');
	const [deleteTarget, setDeleteTarget] = useState<SupportChannelItem | null>(null);

	const handleAdd = async (e: React.FormEvent) => {
		e.preventDefault();
		const targetChannelId = customChannelId.trim() || selectedChannelId;
		if (!targetChannelId || !activeGuildId) return;

		const matchedChannel = discordChannels.find((c) => c.id === targetChannelId);
		const targetRoleId = customRoleId.trim() || selectedRoleId || undefined;

		await onSaveChannel({ id: targetChannelId, guild: activeGuildId, name: matchedChannel?.name, role: targetRoleId, type: channelType });
		setSelectedChannelId('');
		setCustomChannelId('');
		setSelectedRoleId('');
		setCustomRoleId('');
	};

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			<form
				onSubmit={handleAdd}
				className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div>
					<h2 className="text-lg font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('admin.support.channels.formTitle')}
					</h2>
					<p className="text-xs text-(--text-muted)">{t('admin.support.channels.formSubtitle')}</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-(--ui-gap)">
					<div className="flex flex-col gap-2">
						<label className="text-xs font-bold text-(--text)">{t('admin.support.channels.channelSelectLabel')}</label>
						<Selector
							value={selectedChannelId}
							onChange={(val) => setSelectedChannelId(val)}
							placeholder={t('admin.support.channels.channelSelectPlaceholder')}
							options={discordChannels.map((c) => ({ label: `#${c.name}`, value: c.id }))}
						/>
						<label className="text-xs font-bold text-(--text) pt-1">{t('admin.support.channels.customChannelIdLabel')}</label>
						<Input value={customChannelId} onChange={(e) => setCustomChannelId(e.target.value)} placeholder="e.g. 123456789012345678" />
					</div>

					<div className="flex flex-col gap-2">
						<label className="text-xs font-bold text-(--text)">{t('admin.support.channels.typeLabel')}</label>
						<Selector
							value={channelType}
							onChange={(val) => setChannelType((val as 'support' | 'status') || 'support')}
							options={[
								{ label: t('admin.support.channels.typeSupport'), value: 'support' },
								{ label: t('admin.support.channels.typeStatus'), value: 'status' },
							]}
						/>
					</div>

					<div className="flex flex-col gap-2">
						<label className="text-xs font-bold text-(--text)">{t('admin.support.channels.roleSelectLabel')}</label>
						<Selector
							value={selectedRoleId}
							onChange={(val) => setSelectedRoleId(val)}
							placeholder={t('admin.support.channels.roleSelectPlaceholder')}
							options={[{ label: t('admin.support.channels.noRoleOption'), value: '' }, ...discordRoles.map((r) => ({ label: `@${r.name}`, value: r.id }))]}
						/>
						<label className="text-xs font-bold text-(--text) pt-1">{t('admin.support.channels.customRoleIdLabel')}</label>
						<Input value={customRoleId} onChange={(e) => setCustomRoleId(e.target.value)} placeholder="e.g. 987654321098765432" />
					</div>
				</div>

				<div className="flex justify-end">
					<Button type="submit" disabled={saving || (!selectedChannelId && !customChannelId.trim())}>
						<Plus size={16} className="mr-1.5" />
						{t('admin.support.channels.saveButton')}
					</Button>
				</div>
			</form>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-(--ui-gap)">
				{channels.length === 0 ? (
					<div
						className="col-span-full flex flex-col items-center justify-center text-center rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md"
						style={{ padding: 'calc(var(--ui-gap) * 2)', gap: 'calc(var(--ui-gap) * 0.5)' }}
					>
						<Hash size={32} className="text-(--text-muted) opacity-50" />
						<p className="text-sm font-bold text-(--text)">{t('admin.support.channels.emptyTitle')}</p>
						<p className="text-xs text-(--text-muted)">{t('admin.support.channels.emptyDesc')}</p>
					</div>
				) : (
					channels.map((ch) => {
						const roleObj = discordRoles.find((r) => r.id === ch.role);
						const chObj = discordChannels.find((c) => c.id === ch.id);
						const displayName = ch.name || chObj?.name || ch.id;

						return (
							<div
								key={ch.id}
								className="flex items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
								style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
							>
								<div className="flex items-center gap-3 min-w-0">
									<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25">
										<Hash size={20} />
									</div>
									<div className="flex flex-col min-w-0 gap-1">
										<div className="flex items-center gap-2 flex-wrap">
											<span className="text-sm font-bold text-(--text) truncate">#{displayName}</span>
											<span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
												{ch.type}
											</span>
										</div>
										<div className="flex flex-wrap items-center gap-2 text-xs text-(--text-muted)">
											<span className="font-mono">ID: {ch.id}</span>
											<span>•</span>
											<span>Guild: {ch.guild}</span>
											{ch.role && (
												<>
													<span>•</span>
													<span className="inline-flex items-center gap-1 text-(--accent)">
														<Shield size={12} />
														{roleObj ? `@${roleObj.name}` : ch.role}
													</span>
												</>
											)}
										</div>
									</div>
								</div>

								<Button variant="danger" size="sm" onClick={() => setDeleteTarget(ch)}>
									<Trash2 size={14} />
								</Button>
							</div>
						);
					})
				)}
			</div>

			<Confirm
				open={Boolean(deleteTarget)}
				onOpenChange={(open) => {
					if (!open) setDeleteTarget(null);
				}}
				onConfirm={async () => {
					if (!deleteTarget) return;
					await onDeleteChannel(deleteTarget.id);
					setDeleteTarget(null);
				}}
				title={t('admin.support.channels.deleteModalTitle')}
				description={t('admin.support.channels.deleteModalDesc', {
					channel: deleteTarget?.name ? `#${deleteTarget.name}` : deleteTarget?.id || '',
				})}
				confirmText={t('common.buttons.delete')}
				variant="danger"
			/>
		</div>
	);
}

interface SupportBotsTabProps {
	activeGuildId: string;
	bots: SupportBotItem[];
	availableBots: RegisteredBotOption[];
	botProfiles: Record<string, BotDiscordProfile>;
	getEnvUrl: (url: string) => string;
	saving: boolean;
	onAddBot: (payload: { id: string; guild: string; name?: string; avatar?: string }) => Promise<void>;
	onRemoveBot: (botId: string, guildId: string) => Promise<void>;
}

export function SupportBotsTab({ activeGuildId, bots, availableBots, botProfiles, getEnvUrl, saving, onAddBot, onRemoveBot }: SupportBotsTabProps) {
	const { t } = useDictionary();
	const [selectedBotId, setSelectedBotId] = useState('');
	const [customBotId, setCustomBotId] = useState('');
	const [deleteTarget, setDeleteTarget] = useState<SupportBotItem | null>(null);

	const resolveBotDisplay = (botId: string, fallbackName?: string | null, fallbackAvatar?: string | null) => {
		const discordProf = botProfiles[botId];
		const regBot = availableBots.find((b) => b.id === botId);
		const name = discordProf?.name || fallbackName || regBot?.name || regBot?.username || botId;
		const avatar = discordProf?.avatarUrl || fallbackAvatar || regBot?.avatar || null;
		return { name, avatar };
	};

	const handleAdd = async (e: React.FormEvent) => {
		e.preventDefault();
		const targetBotId = customBotId.trim() || selectedBotId;
		if (!targetBotId || !activeGuildId) return;

		const resolved = resolveBotDisplay(targetBotId);
		await onAddBot({
			id: targetBotId,
			guild: activeGuildId,
			name: resolved.name !== targetBotId ? resolved.name : undefined,
			avatar: resolved.avatar || undefined,
		});

		setSelectedBotId('');
		setCustomBotId('');
	};

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			<form
				onSubmit={handleAdd}
				className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div>
					<h2 className="text-lg font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('admin.support.bots.formTitle')}
					</h2>
					<p className="text-xs text-(--text-muted)">{t('admin.support.bots.formSubtitle')}</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-(--ui-gap)">
					<div className="flex flex-col gap-2">
						<label className="text-xs font-bold text-(--text)">{t('admin.support.bots.selectLabel')}</label>
						<Selector
							value={selectedBotId}
							onChange={(val) => setSelectedBotId(val)}
							placeholder={t('admin.support.bots.selectPlaceholder')}
							options={availableBots.map((b) => {
								const { name, avatar } = resolveBotDisplay(b.id, b.name || b.username, b.avatar);
								return {
									value: b.id,
									label: (
										<span className="inline-flex items-center gap-2">
											{avatar ? <img src={avatar} alt={name} className="h-4 w-4 rounded-full object-cover shrink-0" /> : <Bot size={14} className="text-(--accent) shrink-0" />}
											<span>{name}</span>
											<span className="text-xs font-mono text-(--text-muted)">({b.id})</span>
										</span>
									),
								};
							})}
						/>
						{selectedBotId && (
							<div className="pt-1">
								<BotProfilePreview botId={selectedBotId} getEnvUrl={getEnvUrl} onClear={() => setSelectedBotId('')} />
							</div>
						)}
					</div>
					<div className="flex flex-col gap-2">
						<label className="text-xs font-bold text-(--text)">{t('admin.support.bots.customBotIdLabel')}</label>
						<Input value={customBotId} onChange={(e) => setCustomBotId(e.target.value)} placeholder="e.g. 123456789012345678" />
						{customBotId.trim().length >= 15 && (
							<div className="pt-1">
								<BotProfilePreview botId={customBotId.trim()} getEnvUrl={getEnvUrl} onClear={() => setCustomBotId('')} />
							</div>
						)}
					</div>
				</div>

				<div className="flex justify-end">
					<Button type="submit" disabled={saving || (!selectedBotId && !customBotId.trim())}>
						<Plus size={16} className="mr-1.5" />
						{t('admin.support.bots.addButton')}
					</Button>
				</div>
			</form>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-(--ui-gap)">
				{bots.length === 0 ? (
					<div
						className="col-span-full flex flex-col items-center justify-center text-center rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md"
						style={{ padding: 'calc(var(--ui-gap) * 2)', gap: 'calc(var(--ui-gap) * 0.5)' }}
					>
						<Bot size={32} className="text-(--text-muted) opacity-50" />
						<p className="text-sm font-bold text-(--text)">{t('admin.support.bots.emptyTitle')}</p>
						<p className="text-xs text-(--text-muted) max-w-md">{t('admin.support.bots.emptyDesc')}</p>
					</div>
				) : (
					bots.map((bot) => {
						const { name, avatar } = resolveBotDisplay(bot.id, bot.name, bot.avatar);
						return (
							<div
								key={`${bot.guild}-${bot.id}`}
								className="flex items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
								style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
							>
								<div className="flex items-center gap-3 min-w-0">
									<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25 overflow-hidden">
										{avatar ? <img src={avatar} alt={name} className="h-full w-full object-cover" /> : <Bot size={20} />}
									</div>
									<div className="flex flex-col min-w-0">
										<span className="text-sm font-bold text-(--text) truncate">{name}</span>
										<span className="text-xs font-mono text-(--text-muted) truncate">ID: {bot.id}</span>
										<span className="text-[11px] text-(--text-muted) truncate">Guild: {bot.guild}</span>
									</div>
								</div>

								<Button variant="danger" size="sm" onClick={() => setDeleteTarget(bot)}>
									<Trash2 size={14} />
								</Button>
							</div>
						);
					})
				)}
			</div>

			<Confirm
				open={Boolean(deleteTarget)}
				onOpenChange={(open) => {
					if (!open) setDeleteTarget(null);
				}}
				onConfirm={async () => {
					if (!deleteTarget) return;
					await onRemoveBot(deleteTarget.id, deleteTarget.guild);
					setDeleteTarget(null);
				}}
				title={t('admin.support.bots.deleteModalTitle')}
				description={t('admin.support.bots.deleteModalDesc', {
					bot: deleteTarget ? resolveBotDisplay(deleteTarget.id, deleteTarget.name, deleteTarget.avatar).name : '',
				})}
				confirmText={t('common.buttons.delete')}
				variant="danger"
			/>
		</div>
	);
}

interface SupportChecklistTabProps {
	checklist: string[];
	saving: boolean;
	onSaveChecklist: (items: string[]) => Promise<void>;
}

const DEFAULT_CHECKLIST_ITEMS = ['Retried the command?', 'Bot is online?', 'Have someone else try?', 'Checked if you have permissions?'];

export function SupportChecklistTab({ checklist, saving, onSaveChecklist }: SupportChecklistTabProps) {
	const { t } = useDictionary();
	const { remind } = useToast();
	const [items, setItems] = useState<string[]>(checklist);
	const [newQuestion, setNewQuestion] = useState('');
	const [confirmResetOpen, setConfirmResetOpen] = useState(false);

	useEffect(() => {
		setItems(checklist);
	}, [checklist]);

	const isDirty = JSON.stringify(items) !== JSON.stringify(checklist);

	useEffect(() => {
		if (isDirty) {
			remind(
				true,
				() => onSaveChecklist(items),
				() => setItems(checklist),
				saving
			);
		} else {
			remind(false);
		}
		return () => remind(false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isDirty, items, checklist, saving]);

	const handleAddQuestion = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newQuestion.trim()) return;
		setItems((prev) => [...prev, newQuestion.trim()]);
		setNewQuestion('');
	};

	const handleMove = (index: number, direction: -1 | 1) => {
		const target = index + direction;
		if (target < 0 || target >= items.length) return;
		const copy = [...items];
		const [moved] = copy.splice(index, 1);
		copy.splice(target, 0, moved);
		setItems(copy);
	};

	const handleRemove = (index: number) => {
		setItems((prev) => prev.filter((_, idx) => idx !== index));
	};

	return (
		<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div>
					<h2 className="text-lg font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('admin.support.checklist.title')}
					</h2>
					<p className="text-xs text-(--text-muted)">{t('admin.support.checklist.subtitle')}</p>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="secondary" size="sm" onClick={() => setConfirmResetOpen(true)} disabled={saving}>
						<RotateCcw size={14} className="mr-1.5" />
						{t('admin.support.checklist.resetButton')}
					</Button>
					<Button size="sm" onClick={() => onSaveChecklist(items)} disabled={saving || items.length === 0 || !isDirty}>
						<Save size={14} className="mr-1.5" />
						{t('admin.support.checklist.saveButton')}
					</Button>
				</div>
			</div>

			<form onSubmit={handleAddQuestion} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
				<div className="flex-1 flex flex-col gap-2">
					<label className="text-xs font-bold text-(--text)">{t('admin.support.checklist.newQuestionLabel')}</label>
					<Input value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} placeholder={t('admin.support.checklist.newQuestionPlaceholder')} />
				</div>
				<Button type="submit" disabled={!newQuestion.trim()}>
					<Plus size={16} className="mr-1.5" />
					{t('admin.support.checklist.addButton')}
				</Button>
			</form>

			<div className="flex flex-col gap-2.5">
				{items.map((item, idx) => (
					<div key={idx} className="flex items-center justify-between rounded-2xl bg-(--background)/50 border border-(--border)/10 px-4 py-3 gap-3">
						<div className="flex items-center gap-3 min-w-0 flex-1">
							<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-(--accent)/15 text-(--accent) text-xs font-bold border border-(--accent)/25">
								{idx + 1}
							</span>
							<span className="text-sm font-medium text-(--text) truncate">{item}</span>
						</div>

						<div className="flex items-center gap-1.5">
							<Button variant="secondary" size="sm" disabled={idx === 0} onClick={() => handleMove(idx, -1)}>
								<ArrowUp size={14} />
							</Button>
							<Button variant="secondary" size="sm" disabled={idx === items.length - 1} onClick={() => handleMove(idx, 1)}>
								<ArrowDown size={14} />
							</Button>
							<Button variant="danger" size="sm" disabled={items.length <= 1} onClick={() => handleRemove(idx)}>
								<Trash2 size={14} />
							</Button>
						</div>
					</div>
				))}
			</div>

			<Confirm
				open={confirmResetOpen}
				onOpenChange={setConfirmResetOpen}
				title={t('admin.support.checklist.resetButton')}
				description={t('admin.support.checklist.subtitle')}
				confirmText={t('admin.support.checklist.resetButton')}
				variant="danger"
				onConfirm={() => {
					setItems(DEFAULT_CHECKLIST_ITEMS);
					setConfirmResetOpen(false);
				}}
			/>
		</div>
	);
}
