/** @format */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Layers, Shield, ShieldCheck, Sliders } from 'lucide-react';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { Button, Input, Modal, MultiSelector, Selector, Tabs, Toggle } from '@xernerx/ui';
import { countPermissionFlags, InvitePermissionsEditor } from './InvitePermissionsEditor';

const DISCORD_SCOPE_OPTIONS = [
	{ label: 'bot', value: 'bot' },
	{ label: 'applications.commands', value: 'applications.commands' },
	{ label: 'identify', value: 'identify' },
	{ label: 'guilds', value: 'guilds' },
	{ label: 'guilds.join', value: 'guilds.join' },
	{ label: 'guilds.members.read', value: 'guilds.members.read' },
	{ label: 'email', value: 'email' },
	{ label: 'connections', value: 'connections' },
	{ label: 'webhook.incoming', value: 'webhook.incoming' },
];

interface InviteModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editId: string | null;
	newId: string;
	setNewId: (val: string) => void;
	newClientId: string;
	setNewClientId: (val: string) => void;
	newName: string;
	setNewName: (val: string) => void;
	newScopes: string[];
	setNewScopes: (scopes: string[]) => void;
	newRedirect: boolean;
	setNewRedirect: (val: boolean) => void;
	essentialEnabled: boolean;
	setEssentialEnabled: (val: boolean) => void;
	essentialPermissions: bigint;
	setEssentialPermissions: (val: bigint) => void;
	optionalEnabled: boolean;
	setOptionalEnabled: (val: boolean) => void;
	optionalPermissions: bigint;
	setOptionalPermissions: (val: bigint) => void;
	advancedEnabled: boolean;
	setAdvancedEnabled: (val: boolean) => void;
	availableBots: any[];
	creating: boolean;
	onSave: (e: React.FormEvent) => void;
}

export default function InviteModal({
	open,
	onOpenChange,
	editId,
	newId,
	setNewId,
	newClientId,
	setNewClientId,
	newName,
	setNewName,
	newScopes,
	setNewScopes,
	newRedirect,
	setNewRedirect,
	essentialEnabled,
	setEssentialEnabled,
	essentialPermissions,
	setEssentialPermissions,
	optionalEnabled,
	setOptionalEnabled,
	optionalPermissions,
	setOptionalPermissions,
	advancedEnabled,
	setAdvancedEnabled,
	availableBots,
	creating,
	onSave,
}: InviteModalProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();

	const [activePermTab, setActivePermTab] = useState<'essential' | 'optional'>('essential');
	const [copiedRedirectUri, setCopiedRedirectUri] = useState(false);
	const [isEditorInvalid, setIsEditorInvalid] = useState(false);

	useEffect(() => {
		if (open) {
			setCopiedRedirectUri(false);
			setIsEditorInvalid(false);
			if (essentialEnabled) setActivePermTab('essential');
			else if (optionalEnabled) setActivePermTab('optional');
		}
	}, [open, editId]);

	useEffect(() => {
		if (activePermTab === 'essential' && !essentialEnabled && optionalEnabled) {
			setActivePermTab('optional');
		} else if (activePermTab === 'optional' && !optionalEnabled && essentialEnabled) {
			setActivePermTab('essential');
		}
	}, [activePermTab, essentialEnabled, optionalEnabled]);

	const matchedBot = useMemo(() => availableBots.find((b) => String(b.id) === newClientId), [availableBots, newClientId]);
	const resolvedRedirectSlug = matchedBot?.vanitySlug || newId.trim() || newClientId.trim() || 'slug';
	const resolvedRedirectUri = getEnvUrl(`https://app.xernerx.com/bots/${resolvedRedirectSlug}`);
	const encodedRedirectParams = `&response_type=code&redirect_uri=${encodeURIComponent(resolvedRedirectUri)}`;

	const effectiveOptionalPermissions = essentialEnabled ? essentialPermissions | optionalPermissions : optionalPermissions;
	const essentialCount = useMemo(() => countPermissionFlags(essentialPermissions), [essentialPermissions]);
	const optionalCount = useMemo(() => countPermissionFlags(effectiveOptionalPermissions), [effectiveOptionalPermissions]);
	const enabledUrlCount = Number(essentialEnabled) + Number(optionalEnabled) + Number(advancedEnabled);

	const selectClientWithAutofill = (clientIdVal: string, fallbackSlug?: string | null) => {
		setNewClientId(clientIdVal);
		const bot = availableBots.find((b) => String(b.id) === clientIdVal);
		if (bot && !editId) {
			const botDisplayName = bot.discord?.globalName || bot.discord?.username || bot.name || '';
			if (!newName && botDisplayName) setNewName(botDisplayName);
			if (!newId) {
				const slugCandidate =
					bot.vanitySlug ||
					fallbackSlug ||
					botDisplayName
						.toLowerCase()
						.replace(/[^a-z0-9-]+/g, '-')
						.replace(/^-+|-+$/g, '');
				if (slugCandidate) setNewId(slugCandidate);
			}
		} else if (!editId && !newId && fallbackSlug) {
			setNewId(fallbackSlug);
		}
	};

	const handleToggleTier = (tier: 'essential' | 'optional' | 'advanced', nextVal: boolean) => {
		if (!nextVal && enabledUrlCount <= 1) {
			toast({ type: 'error', title: t('admin.dashboard.invites.minOneOptionToast') });
			return;
		}
		if (tier === 'essential') setEssentialEnabled(nextVal);
		else if (tier === 'optional') setOptionalEnabled(nextVal);
		else setAdvancedEnabled(nextVal);
	};

	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title={editId ? t('admin.dashboard.invites.editModalTitle') : t('admin.dashboard.invites.createModalTitle')}
			description={t('admin.dashboard.invites.modalDesc')}
			maxWidth="max-w-(--page-width)"
		>
			<form onSubmit={onSave} className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="flex flex-col gap-2">
						<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.invites.urlSlug')}</label>
						<Input type="text" value={newId} onChange={(e) => setNewId(e.target.value)} required placeholder={t('admin.dashboard.invites.placeholderTodo')} />
					</div>
					<div className="flex flex-col gap-2">
						<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.invites.appName')}</label>
						<Input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder={t('admin.dashboard.invites.placeholderAppName')} />
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="relative z-40 flex flex-col gap-2">
						<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.invites.clientId')}</label>
						<Selector
							value={newClientId}
							onChange={(val) => selectClientWithAutofill(val)}
							options={(() => {
								const opts = availableBots.map((b) => {
									const labelName = b.discord?.globalName || b.discord?.username || b.name || b.id;
									return {
										label: `${labelName} (${b.id})`,
										value: String(b.id),
									};
								});
								if (newClientId && !opts.some((o) => o.value === newClientId)) {
									opts.unshift({ label: newClientId, value: newClientId });
								}
								return opts;
							})()}
							placeholder={t('admin.dashboard.invites.placeholderClientId')}
							toggleClassName="!h-11"
						/>
					</div>

					<div className="relative z-30 flex flex-col gap-2">
						<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.invites.scopes')}</label>
						<MultiSelector
							value={newScopes}
							onChange={setNewScopes}
							options={(() => {
								const opts = [...DISCORD_SCOPE_OPTIONS];
								for (const s of newScopes) {
									if (s && !opts.some((o) => o.value === s)) {
										opts.push({ label: s, value: s });
									}
								}
								return opts;
							})()}
							placeholder={t('admin.dashboard.invites.placeholderScopes')}
							toggleClassName="!h-11"
						/>
					</div>
				</div>

				<div className="flex flex-col gap-2.5 rounded-2xl bg-(--background)/50 border border-(--border)/10 p-4">
					<div className="flex items-center justify-between gap-4">
						<div className="flex flex-col gap-0.5 min-w-0">
							<span className="text-xs font-semibold text-(--text)">{t('admin.dashboard.invites.redirectLabel')}</span>
							<span className="text-[11px] text-(--text-muted)">{t('admin.dashboard.invites.redirectDesc')}</span>
						</div>
						<Toggle checked={newRedirect} onChange={() => setNewRedirect(!newRedirect)} />
					</div>

					{newRedirect && (
						<div className="flex items-center justify-between gap-2 rounded-2xl bg-(--foreground)/30 border border-(--accent)/30 px-3 py-2">
							<code className="text-[11px] font-mono text-(--accent) truncate" title={encodedRedirectParams}>
								{encodedRedirectParams}
							</code>
							<button
								type="button"
								onClick={() => {
									navigator.clipboard.writeText(resolvedRedirectUri);
									setCopiedRedirectUri(true);
									toast({ type: 'success', title: t('admin.dashboard.invites.redirectUriCopied') });
									setTimeout(() => setCopiedRedirectUri(false), 2000);
								}}
								title={t('admin.dashboard.invites.copyRedirectUri')}
								aria-label={t('admin.dashboard.invites.copyRedirectUri')}
								className="shrink-0 flex items-center gap-1 rounded-full bg-(--background)/60 hover:bg-(--foreground) border border-(--border)/10 px-2.5 py-1 text-[11px] font-medium text-(--text-muted) hover:text-(--text) transition-colors cursor-pointer"
							>
								{copiedRedirectUri ? <Check size={12} className="text-(--accent-green)" /> : <Copy size={12} />}
								<span>{resolvedRedirectUri}</span>
							</button>
						</div>
					)}
				</div>

				{/* Multi-Option Tier Configuration */}
				<div className="flex flex-col gap-3 rounded-2xl bg-(--background)/50 border border-(--border)/10 p-4">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<div className="flex flex-col gap-0.5">
							<span className="text-xs font-semibold text-(--text)">{t('admin.dashboard.invites.optionsSectionTitle')}</span>
							<span className="text-[11px] text-(--text-muted)">{t('admin.dashboard.invites.optionsSectionDesc')}</span>
						</div>
						<span className="rounded-full bg-(--accent)/15 border border-(--accent)/30 px-3 py-1 text-[11px] font-bold text-(--accent)">
							{enabledUrlCount === 1 ? t('admin.dashboard.invites.singleUrlBehaviorPill') : t('admin.dashboard.invites.multiUrlBehaviorPill', { count: enabledUrlCount })}
						</span>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<div
							className={`flex items-center justify-between gap-3 rounded-2xl border p-3 transition-colors ${
								essentialEnabled ? 'bg-(--accent)/10 border-(--accent)/30' : 'bg-(--foreground)/20 border-(--border)/10'
							}`}
						>
							<div className="flex items-center gap-2.5 min-w-0">
								<ShieldCheck size={16} className={essentialEnabled ? 'text-(--accent) shrink-0' : 'text-(--text-muted) shrink-0'} />
								<div className="flex flex-col min-w-0">
									<span className="text-xs font-bold text-(--text) truncate">{t('admin.dashboard.invites.optionEssentialTitle')}</span>
									<span className="text-[10px] text-(--text-muted) truncate">{t('admin.dashboard.invites.optionEssentialDesc', { count: essentialCount })}</span>
								</div>
							</div>
							<Toggle checked={essentialEnabled} onChange={() => handleToggleTier('essential', !essentialEnabled)} size="sm" />
						</div>

						<div
							className={`flex items-center justify-between gap-3 rounded-2xl border p-3 transition-colors ${
								optionalEnabled ? 'bg-(--accent)/10 border-(--accent)/30' : 'bg-(--foreground)/20 border-(--border)/10'
							}`}
						>
							<div className="flex items-center gap-2.5 min-w-0">
								<Layers size={16} className={optionalEnabled ? 'text-(--accent) shrink-0' : 'text-(--text-muted) shrink-0'} />
								<div className="flex flex-col min-w-0">
									<span className="text-xs font-bold text-(--text) truncate">{t('admin.dashboard.invites.optionOptionalTitle')}</span>
									<span className="text-[10px] text-(--text-muted) truncate">{t('admin.dashboard.invites.optionOptionalDesc', { count: optionalCount })}</span>
								</div>
							</div>
							<Toggle checked={optionalEnabled} onChange={() => handleToggleTier('optional', !optionalEnabled)} size="sm" />
						</div>

						<div
							className={`flex items-center justify-between gap-3 rounded-2xl border p-3 transition-colors ${
								advancedEnabled ? 'bg-(--accent)/10 border-(--accent)/30' : 'bg-(--foreground)/20 border-(--border)/10'
							}`}
						>
							<div className="flex items-center gap-2.5 min-w-0">
								<Sliders size={16} className={advancedEnabled ? 'text-(--accent) shrink-0' : 'text-(--text-muted) shrink-0'} />
								<div className="flex flex-col min-w-0">
									<span className="text-xs font-bold text-(--text) truncate">{t('admin.dashboard.invites.optionAdvancedTitle')}</span>
									<span className="text-[10px] text-(--text-muted) truncate">{t('admin.dashboard.invites.optionAdvancedDesc')}</span>
								</div>
							</div>
							<Toggle checked={advancedEnabled} onChange={() => handleToggleTier('advanced', !advancedEnabled)} size="sm" />
						</div>
					</div>
				</div>

				{/* Active Permission Editor */}
				{essentialEnabled || optionalEnabled ? (
					<div className="flex flex-col gap-3">
						{essentialEnabled && optionalEnabled && (
							<Tabs
								size="sm"
								tabs={[
									{ id: 'essential', label: `${t('admin.dashboard.invites.tabEssentialPerms')} (${essentialCount})`, icon: <ShieldCheck size={14} /> },
									{ id: 'optional', label: `${t('admin.dashboard.invites.tabOptionalPerms')} (${optionalCount})`, icon: <Layers size={14} /> },
								]}
								activeTab={activePermTab}
								onChange={(id) => setActivePermTab(id as 'essential' | 'optional')}
							/>
						)}

						<InvitePermissionsEditor
							tierKey={activePermTab}
							value={activePermTab === 'essential' ? essentialPermissions : effectiveOptionalPermissions}
							lockedBits={activePermTab === 'optional' && essentialEnabled ? essentialPermissions : BigInt(0)}
							onChangeBits={(next) => {
								if (activePermTab === 'essential') {
									setEssentialPermissions(next);
								} else {
									setOptionalPermissions(next);
								}
							}}
							onValidityChange={setIsEditorInvalid}
							onImportMetadata={(meta) => {
								if (meta.scopes && meta.scopes.length > 0) setNewScopes(meta.scopes);
								if (meta.redirect !== null) setNewRedirect(meta.redirect);
								if (meta.clientId && (!editId || !newClientId)) {
									selectClientWithAutofill(meta.clientId, meta.redirectSlug);
								} else if (!editId && !newId && meta.redirectSlug) {
									setNewId(meta.redirectSlug);
								}
							}}
						/>
					</div>
				) : (
					<div className="flex items-center gap-3 rounded-2xl bg-(--background)/50 border border-(--border)/10 p-4 text-xs text-(--text-muted)">
						<Shield size={16} className="text-(--accent) shrink-0" />
						<span>{t('admin.dashboard.invites.advancedOnlyNotice')}</span>
					</div>
				)}

				<div className="flex justify-end gap-3 pt-4 border-t border-(--border)/10 mt-1">
					<Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
						{t('admin.dashboard.invites.cancel')}
					</Button>
					<Button type="submit" variant="primary" disabled={creating || isEditorInvalid || enabledUrlCount === 0}>
						{creating ? t('admin.dashboard.invites.saving') : t('admin.dashboard.invites.saveButton')}
					</Button>
				</div>
			</form>
		</Modal>
	);
}
