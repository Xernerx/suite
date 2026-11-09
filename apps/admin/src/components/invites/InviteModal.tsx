/** @format */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import { Check, Copy, RotateCcw, Sparkles } from 'lucide-react';
import { useDictionary, useToast } from '@xernerx/providers';
import { Button, Input, Modal, MultiSelector, Selector, Toggle } from '@xernerx/ui';

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

const PERMISSION_ENTRIES: Array<[string, bigint]> = (() => {
	const byBit = new Map<bigint, string>();
	for (const [key, rawBit] of Object.entries(PermissionFlagsBits)) {
		if (key === 'ManageEmojisAndStickers') continue;
		const bit = BigInt(rawBit as bigint);
		if (!byBit.has(bit)) {
			byBit.set(bit, key);
		}
	}
	return Array.from(byBit.entries()).map(([bit, key]) => [key, bit]);
})();

export interface ParsedInviteInput {
	permissions: bigint | null;
	scopes: string[] | null;
	clientId: string | null;
	redirect: boolean | null;
	redirectSlug: string | null;
	source: 'bigint' | 'url';
}

export function parsePermissionBigInt(raw: string | number | bigint | null | undefined): bigint | null {
	if (typeof raw === 'bigint') return raw >= BigInt(0) ? raw : null;
	if (typeof raw === 'number') return Number.isInteger(raw) && raw >= 0 ? BigInt(raw) : null;
	if (typeof raw !== 'string') return null;
	const cleaned = raw.trim().replace(/n$/i, '');
	if (!cleaned) return null;
	if (!/^(?:\d+|0x[0-9a-fA-F]+)$/.test(cleaned)) return null;
	try {
		const val = BigInt(cleaned);
		return val >= BigInt(0) ? val : null;
	} catch {
		return null;
	}
}

export function parseDiscordInviteInput(raw: string): ParsedInviteInput | null {
	const trimmed = raw.trim();
	if (!trimmed) return null;

	const directBigInt = parsePermissionBigInt(trimmed);
	if (directBigInt !== null) {
		return {
			permissions: directBigInt,
			scopes: null,
			clientId: null,
			redirect: null,
			redirectSlug: null,
			source: 'bigint',
		};
	}

	let candidateUrl = trimmed;
	if (/^(?:(?:www\.|canary\.|ptb\.)?discord(?:app)?\.com)\//i.test(candidateUrl)) {
		candidateUrl = `https://${candidateUrl}`;
	} else if (candidateUrl.startsWith('?')) {
		candidateUrl = `https://discord.com/oauth2/authorize${candidateUrl}`;
	} else if (!/^https?:\/\//i.test(candidateUrl) && /(?:^|[?&])(?:permissions|client_id|scope|response_type|redirect_uri)=/i.test(candidateUrl)) {
		candidateUrl = `https://discord.com/oauth2/authorize?${candidateUrl.replace(/^\?/, '')}`;
	}

	try {
		const url = new URL(candidateUrl);
		const permsRaw = url.searchParams.get('permissions');
		const clientIdRaw = url.searchParams.get('client_id')?.trim() || null;
		const scopeRaw = url.searchParams.get('scope');
		const responseTypeRaw = url.searchParams.get('response_type')?.trim().toLowerCase() || null;
		const redirectUriRaw = url.searchParams.get('redirect_uri')?.trim() || null;

		let permissions: bigint | null = null;
		if (permsRaw !== null && permsRaw.trim() !== '') {
			permissions = parsePermissionBigInt(permsRaw);
			if (permissions === null) return null;
		}

		const scopes = scopeRaw
			? scopeRaw
					.split(/[\s,+]+/)
					.map((s) => s.trim())
					.filter(Boolean)
			: null;

		const hasRedirectParams = responseTypeRaw === 'code' || Boolean(redirectUriRaw);
		let redirectSlug: string | null = null;
		if (redirectUriRaw) {
			const match = redirectUriRaw.match(/\/bots\/([^/?#]+)/i);
			if (match?.[1]) {
				redirectSlug = decodeURIComponent(match[1]);
			}
		}

		if (permissions === null && !clientIdRaw && (!scopes || scopes.length === 0) && !hasRedirectParams) {
			return null;
		}

		return {
			permissions,
			scopes: scopes && scopes.length > 0 ? Array.from(new Set(scopes)) : null,
			clientId: clientIdRaw,
			redirect: hasRedirectParams,
			redirectSlug,
			source: 'url',
		};
	} catch {
		return null;
	}
}

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
	selectedPermissions: bigint;
	setSelectedPermissions: React.Dispatch<React.SetStateAction<bigint>>;
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
	selectedPermissions,
	setSelectedPermissions,
	availableBots,
	creating,
	onSave,
}: InviteModalProps) {
	const { t } = useDictionary();
	const { toast } = useToast();

	const [bigintInput, setBigintInput] = useState<string>(selectedPermissions.toString());
	const [oauthUrlInput, setOauthUrlInput] = useState<string>('');
	const [copiedRedirectUri, setCopiedRedirectUri] = useState(false);

	useEffect(() => {
		setBigintInput(selectedPermissions.toString());
	}, [selectedPermissions, open]);

	useEffect(() => {
		if (open) {
			setOauthUrlInput('');
			setCopiedRedirectUri(false);
		}
	}, [open, editId]);

	const matchedBot = useMemo(() => availableBots.find((b) => String(b.id) === newClientId), [availableBots, newClientId]);
	const resolvedRedirectSlug = matchedBot?.vanitySlug || newId.trim() || newClientId.trim() || 'slug';
	const resolvedRedirectUri = `https://app.xernerx.com/bots/${resolvedRedirectSlug}`;
	const encodedRedirectParams = `&response_type=code&redirect_uri=${encodeURIComponent(resolvedRedirectUri)}`;

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

	const applyInviteInput = (raw: string, silentInvalid = false): boolean => {
		const parsed = parseDiscordInviteInput(raw);
		if (!parsed) {
			if (!silentInvalid) {
				toast({ type: 'error', title: t('admin.dashboard.invites.toasts.invalidInviteInput') });
			}
			return false;
		}

		if (parsed.permissions !== null) {
			setSelectedPermissions(parsed.permissions);
			setBigintInput(parsed.permissions.toString());
		}

		if (parsed.scopes && parsed.scopes.length > 0) {
			setNewScopes(parsed.scopes);
		}

		if (parsed.redirect !== null) {
			setNewRedirect(parsed.redirect);
		}

		if (parsed.clientId && (!editId || !newClientId)) {
			selectClientWithAutofill(parsed.clientId, parsed.redirectSlug);
		} else if (!editId && !newId && parsed.redirectSlug) {
			setNewId(parsed.redirectSlug);
		}

		toast({
			type: 'success',
			title: parsed.source === 'url' ? t('admin.dashboard.invites.toasts.appliedInviteUrl') : t('admin.dashboard.invites.toasts.appliedBigInt'),
		});
		return true;
	};

	const handleBigIntChange = (val: string) => {
		if (/(?:https?:\/\/|discord(?:app)?\.com|permissions=|client_id=|redirect_uri=)/i.test(val)) {
			setOauthUrlInput(val);
			applyInviteInput(val, true);
			return;
		}

		setBigintInput(val);
		if (val.trim() === '') {
			setSelectedPermissions(BigInt(0));
			return;
		}

		const parsed = parsePermissionBigInt(val);
		if (parsed !== null) {
			setSelectedPermissions(parsed);
		}
	};

	const handleBigIntBlur = () => {
		if (bigintInput.trim() === '') {
			setBigintInput('0');
			setSelectedPermissions(BigInt(0));
			return;
		}
		const parsed = parsePermissionBigInt(bigintInput);
		setBigintInput((parsed ?? selectedPermissions).toString());
	};

	const togglePermission = (bit: bigint) => {
		setSelectedPermissions((prev) => ((prev & bit) === bit ? prev & ~bit : prev | bit));
	};

	const enabledPermCount = useMemo(() => {
		let count = 0;
		for (const [, bit] of PERMISSION_ENTRIES) {
			if ((selectedPermissions & bit) === bit) count++;
		}
		return count;
	}, [selectedPermissions]);

	const isBigIntInvalid = bigintInput.trim() !== '' && parsePermissionBigInt(bigintInput) === null;

	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title={editId ? t('admin.dashboard.invites.editModalTitle') : t('admin.dashboard.invites.createModalTitle')}
			description={t('admin.dashboard.invites.modalDesc')}
			maxWidth="max-w-4xl"
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

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl bg-(--background)/50 border border-(--border)/10 p-4">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.invites.permissionBigIntLabel')}</label>
						<Input
							type="text"
							inputMode="numeric"
							value={bigintInput}
							onChange={(e) => handleBigIntChange(e.target.value)}
							onBlur={handleBigIntBlur}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									handleBigIntBlur();
								}
							}}
							placeholder={t('admin.dashboard.invites.permissionBigIntPlaceholder')}
							className={`font-mono text-sm ${isBigIntInvalid ? 'border-(--accent-red) focus:ring-(--accent-red)' : ''}`}
						/>
						<span className="text-[11px] text-(--text-muted)">{t('admin.dashboard.invites.permissionBigIntHint')}</span>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.invites.oauthUrlLabel')}</label>
						<div className="flex items-center gap-2">
							<Input
								type="text"
								value={oauthUrlInput}
								onChange={(e) => setOauthUrlInput(e.target.value)}
								onPaste={(e) => {
									const pasted = e.clipboardData.getData('text').trim();
									if (pasted && oauthUrlInput.trim() === '' && parseDiscordInviteInput(pasted)) {
										e.preventDefault();
										setOauthUrlInput(pasted);
										applyInviteInput(pasted);
									}
								}}
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										if (oauthUrlInput.trim()) applyInviteInput(oauthUrlInput);
									}
								}}
								placeholder={t('admin.dashboard.invites.oauthUrlPlaceholder')}
								className="flex-1 text-sm"
							/>
							<Button type="button" variant="secondary" onClick={() => applyInviteInput(oauthUrlInput)} disabled={!oauthUrlInput.trim()} className="shrink-0 flex items-center gap-1.5">
								<Sparkles size={14} />
								<span>{t('admin.dashboard.invites.applyUrlButton')}</span>
							</Button>
						</div>
						<span className="text-[11px] text-(--text-muted)">{t('admin.dashboard.invites.oauthUrlHint')}</span>
					</div>
				</div>

				<div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-2 rounded-2xl bg-(--background)/50 border border-(--border)/10 p-4">
					<div className="flex items-center justify-between gap-2 sticky top-0 py-1.5 z-10 mb-1 border-b border-(--border)/10 bg-(--background)/90 backdrop-blur-md">
						<div className="flex items-center gap-2">
							<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.invites.permMatrix')}</label>
							<span className="rounded-full bg-(--accent)/10 border border-(--accent)/30 px-2.5 py-0.5 text-[11px] font-semibold text-(--accent)">
								{t('admin.dashboard.invites.enabledPermsCount', { count: enabledPermCount })}
							</span>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							disabled={selectedPermissions === BigInt(0)}
							onClick={() => {
								setSelectedPermissions(BigInt(0));
								setBigintInput('0');
							}}
							className="flex items-center gap-1 text-xs"
						>
							<RotateCcw size={12} />
							<span>{t('admin.dashboard.invites.clearPermsButton')}</span>
						</Button>
					</div>

					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
						{PERMISSION_ENTRIES.map(([key, bit]) => {
							const isChecked = (selectedPermissions & bit) === bit;
							return (
								<label
									key={key}
									className={`flex items-center justify-between gap-2 text-[11px] cursor-pointer p-2.5 rounded-2xl transition-colors border ${
										isChecked
											? 'bg-(--accent)/10 border-(--accent)/30 text-(--text) font-medium'
											: 'border-transparent text-(--text-muted) hover:bg-(--foreground)/40 hover:border-(--border)/10'
									}`}
								>
									<span className="truncate flex-1" title={key}>
										{key}
									</span>
									<Toggle checked={isChecked} onChange={() => togglePermission(bit)} size="sm" />
								</label>
							);
						})}
					</div>
				</div>

				<div className="flex justify-end gap-3 pt-4 border-t border-(--border)/10 mt-1">
					<Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
						{t('admin.dashboard.invites.cancel')}
					</Button>
					<Button type="submit" variant="primary" disabled={creating || isBigIntInvalid}>
						{creating ? t('admin.dashboard.invites.saving') : t('admin.dashboard.invites.saveButton')}
					</Button>
				</div>
			</form>
		</Modal>
	);
}
