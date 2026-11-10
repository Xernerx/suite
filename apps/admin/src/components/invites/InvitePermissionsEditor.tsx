/** @format */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import { RotateCcw, Sparkles } from 'lucide-react';
import { useDictionary, useToast } from '@xernerx/providers';
import { Button, Input, Toggle } from '@xernerx/ui';

export const PERMISSION_ENTRIES: Array<[string, bigint]> = (() => {
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

export function countPermissionFlags(bits: bigint): number {
	let count = 0;
	for (const [, bit] of PERMISSION_ENTRIES) {
		if ((bits & bit) === bit) count++;
	}
	return count;
}

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

interface InvitePermissionsEditorProps {
	tierKey: 'essential' | 'optional';
	value: bigint;
	lockedBits: bigint;
	onChangeBits: (next: bigint) => void;
	onValidityChange?: (invalid: boolean) => void;
	onImportMetadata: (meta: { scopes: string[] | null; clientId: string | null; redirect: boolean | null; redirectSlug: string | null }) => void;
}

export function InvitePermissionsEditor({ tierKey, value, lockedBits, onChangeBits, onValidityChange, onImportMetadata }: InvitePermissionsEditorProps) {
	const { t } = useDictionary();
	const { toast } = useToast();

	const effectiveValue = value | lockedBits;
	const [bigintInput, setBigintInput] = useState<string>(effectiveValue.toString());
	const [oauthUrlInput, setOauthUrlInput] = useState<string>('');

	useEffect(() => {
		setBigintInput((value | lockedBits).toString());
	}, [value, lockedBits, tierKey]);

	useEffect(() => {
		setOauthUrlInput('');
	}, [tierKey]);

	const isBigIntInvalid = bigintInput.trim() !== '' && parsePermissionBigInt(bigintInput) === null;

	useEffect(() => {
		onValidityChange?.(isBigIntInvalid);
	}, [isBigIntInvalid, onValidityChange]);

	const applyInviteInput = (raw: string, silentInvalid = false): boolean => {
		const parsed = parseDiscordInviteInput(raw);
		if (!parsed) {
			if (!silentInvalid) {
				toast({ type: 'error', title: t('admin.dashboard.invites.toasts.invalidInviteInput') });
			}
			return false;
		}

		if (parsed.permissions !== null) {
			const merged = parsed.permissions | lockedBits;
			onChangeBits(merged);
			setBigintInput(merged.toString());
		}

		onImportMetadata({
			scopes: parsed.scopes,
			clientId: parsed.clientId,
			redirect: parsed.redirect,
			redirectSlug: parsed.redirectSlug,
		});

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
			onChangeBits(lockedBits);
			return;
		}

		const parsed = parsePermissionBigInt(val);
		if (parsed !== null) {
			onChangeBits(parsed | lockedBits);
		}
	};

	const handleBigIntBlur = () => {
		if (bigintInput.trim() === '') {
			onChangeBits(lockedBits);
			setBigintInput(lockedBits.toString());
			return;
		}
		const parsed = parsePermissionBigInt(bigintInput);
		const next = (parsed ?? effectiveValue) | lockedBits;
		onChangeBits(next);
		setBigintInput(next.toString());
	};

	const togglePermission = (bit: bigint) => {
		if ((lockedBits & bit) === bit) return;
		const next = (effectiveValue & bit) === bit ? effectiveValue & ~bit : effectiveValue | bit;
		onChangeBits(next | lockedBits);
	};

	const enabledPermCount = useMemo(() => countPermissionFlags(effectiveValue), [effectiveValue]);

	return (
		<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
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
						disabled={effectiveValue === lockedBits}
						onClick={() => {
							onChangeBits(lockedBits);
							setBigintInput(lockedBits.toString());
						}}
						className="flex items-center gap-1 text-xs"
					>
						<RotateCcw size={12} />
						<span>{t('admin.dashboard.invites.clearPermsButton')}</span>
					</Button>
				</div>

				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
					{PERMISSION_ENTRIES.map(([key, bit]) => {
						const isInherited = (lockedBits & bit) === bit;
						const isChecked = (effectiveValue & bit) === bit;
						return (
							<label
								key={key}
								className={`flex items-center justify-between gap-2 text-[11px] p-2.5 rounded-2xl transition-colors border ${isInherited ? 'cursor-default' : 'cursor-pointer'} ${
									isChecked
										? 'bg-(--accent)/10 border-(--accent)/30 text-(--text) font-medium'
										: 'border-transparent text-(--text-muted) hover:bg-(--foreground)/40 hover:border-(--border)/10'
								}`}
							>
								<div className="flex items-center gap-1.5 min-w-0 flex-1">
									<span className="truncate" title={key}>
										{key}
									</span>
									{isInherited && (
										<span className="shrink-0 rounded-full bg-(--accent)/20 px-1.5 py-0.5 text-[9px] font-bold text-(--accent)">
											{t('admin.dashboard.invites.inheritedFromEssentialBadge')}
										</span>
									)}
								</div>
								<Toggle checked={isChecked} disabled={isInherited} onChange={() => togglePermission(bit)} size="sm" />
							</label>
						);
					})}
				</div>
			</div>
		</div>
	);
}
