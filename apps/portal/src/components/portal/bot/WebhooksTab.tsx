/** @format */
'use client';

import { useState } from 'react';
import { Check, Copy, Eye, EyeOff, KeyRound, Link2, Loader2, RefreshCw, Send, Trash2 } from 'lucide-react';
import { Badge, Button, Confirm, Input, Toggle } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import WebhookDeliveriesCard, { WebhookDeliveryItem } from '@/components/portal/WebhookDeliveriesCard';

function generateWebhookSecret(): string {
	const bytes = new Uint8Array(16);
	if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
		window.crypto.getRandomValues(bytes);
	} else {
		for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
	}
	const hex = Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
	return `whsec_${hex}`;
}

function isLocalWebhookUrl(rawUrl?: string): boolean {
	if (!rawUrl || typeof rawUrl !== 'string') return false;
	try {
		const parsed = new URL(rawUrl.trim());
		const h = parsed.hostname.toLowerCase();
		return (
			h === 'localhost' ||
			h === '127.0.0.1' ||
			h === '[::1]' ||
			h === '0.0.0.0' ||
			h.endsWith('.local') ||
			/^10\.\d+\.\d+\.\d+$/.test(h) ||
			/^192\.168\.\d+\.\d+$/.test(h) ||
			/^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(h)
		);
	} catch {
		return false;
	}
}

interface WebhooksTabProps {
	botConfig: any;
	setBotConfig: (config: any) => void;
	deliveries?: WebhookDeliveryItem[];
	onDeliveriesChange?: (deliveries: WebhookDeliveryItem[]) => void;
}

export default function WebhooksTab({ botConfig, setBotConfig, deliveries = [], onDeliveriesChange }: WebhooksTabProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const [testingIndex, setTestingIndex] = useState<number | null>(null);
	const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null);
	const [revealedSecrets, setRevealedSecrets] = useState<Record<number, boolean>>({});
	const [copiedSecretIdx, setCopiedSecretIdx] = useState<number | null>(null);
	const [localDeliveries, setLocalDeliveries] = useState<WebhookDeliveryItem[]>(deliveries);

	const activeDeliveries = onDeliveriesChange ? deliveries : localDeliveries;
	const updateDeliveries = (next: WebhookDeliveryItem[]) => {
		if (onDeliveriesChange) {
			onDeliveriesChange(next);
		} else {
			setLocalDeliveries(next);
		}
	};

	const handleTestWebhook = async (hook: any, index: number) => {
		if (!hook.url || !hook.url.trim()) {
			toast({ type: 'error', title: t('app.portal.bot.webhooks.urlRequired') });
			return;
		}
		setTestingIndex(index);
		try {
			const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
			if (bridge?.relayLocalWebhook && isLocalWebhookUrl(hook.url)) {
				const localResult = await bridge.relayLocalWebhook({
					url: hook.url.trim(),
					botId: botConfig.id,
					events: hook.events,
				});
				if (localResult?.delivery) {
					updateDeliveries([localResult.delivery, ...activeDeliveries]);
				}
				if (!localResult?.ok) {
					throw new Error(localResult?.error || `HTTP ${localResult?.status || 0}`);
				}
				toast({
					type: 'success',
					title: t('app.portal.bot.webhooks.testSuccess', {
						status: localResult.status,
						latency: localResult.latencyMs,
					}),
				});
				return;
			}

			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${botConfig.id}/hooks/test`), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ url: hook.url, events: hook.events, secret: hook.secret }),
			});
			const data = await res.json();
			if (Array.isArray(data.deliveries)) {
				updateDeliveries(data.deliveries);
			}
			if (!res.ok || !data.ok) {
				throw new Error(data.error || `HTTP ${data.status || res.status}`);
			}
			toast({
				type: 'success',
				title: t('app.portal.bot.webhooks.testSuccess', {
					status: data.status,
					latency: data.latencyMs,
				}),
			});
		} catch (err: any) {
			toast({
				type: 'error',
				title: t('app.portal.bot.webhooks.testFailed', { error: err.message }),
			});
		} finally {
			setTestingIndex(null);
		}
	};

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl p-8 shadow-sm">
				<div className="flex items-center gap-3 mb-6 text-(--text) font-extrabold text-sm tracking-widest uppercase">
					<Link2 className="w-5 h-5 text-(--accent)" />
					<h2>{t('app.portal.bot.webhooks.header')}</h2>
				</div>

				<div className="flex flex-col gap-6">
					{(botConfig.hooks || []).map((hook: any, index: number) => (
						<div key={index} className="flex flex-col gap-4 p-4 border border-(--border)/10 rounded-2xl bg-(--background)/50">
							<div className="flex justify-between items-center gap-2">
								<div className="flex items-center gap-2">
									<h3 className="font-bold">{t('app.portal.bot.webhooks.webhookNumber', { number: index + 1 })}</h3>
									{typeof window !== 'undefined' && Boolean((window as any).electron?.relayLocalWebhook) && isLocalWebhookUrl(hook.url) && (
										<Badge variant="accent" size="sm">
											{t('app.portal.bot.webhooks.localRelayBadge')}
										</Badge>
									)}
								</div>
								<div className="flex items-center gap-2">
									<Button
										variant="secondary"
										onClick={() => handleTestWebhook(hook, index)}
										disabled={testingIndex === index || !hook.url}
										className="flex items-center gap-1.5 text-xs px-3 py-1.5"
									>
										{testingIndex === index ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
										{t('app.portal.bot.webhooks.testButton')}
									</Button>
									<button type="button" onClick={() => setConfirmDeleteIdx(index)} className="p-2 text-(--accent-red)/70 hover:text-(--accent-red) transition-colors cursor-pointer">
										<Trash2 size={16} />
									</button>
								</div>
							</div>
							<div className="flex flex-col gap-1">
								<label className="text-sm font-semibold text-(--text-muted)">{t('app.portal.bot.webhooks.url')}</label>
								<Input
									value={hook.url || ''}
									onChange={(e) => {
										const newHooks = [...(botConfig.hooks || [])];
										newHooks[index] = { ...newHooks[index], url: e.target.value };
										setBotConfig({ ...botConfig, hooks: newHooks });
									}}
									placeholder="https://discord.com/api/webhooks/..."
								/>
							</div>
							<div className="flex flex-col gap-1">
								<div className="flex items-center justify-between gap-2">
									<label className="text-sm font-semibold text-(--text-muted) flex items-center gap-1.5">
										<KeyRound size={13} className="text-(--accent)" />
										<span>{t('app.portal.bot.webhooks.secretLabel')}</span>
									</label>
									<span className="text-[11px] font-mono text-(--text-muted)">X-Xernerx-Signature: sha256=...</span>
								</div>
								<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
									<div className="flex-1">
										<Input
											type={revealedSecrets[index] ? 'text' : 'password'}
											value={hook.secret || ''}
											onChange={(e) => {
												const newHooks = [...(botConfig.hooks || [])];
												newHooks[index] = { ...newHooks[index], secret: e.target.value };
												setBotConfig({ ...botConfig, hooks: newHooks });
											}}
											placeholder={t('app.portal.bot.webhooks.secretPlaceholder')}
										/>
									</div>
									<div className="flex items-center gap-1.5 shrink-0">
										<Button
											type="button"
											variant="secondary"
											size="sm"
											onClick={() => setRevealedSecrets((prev) => ({ ...prev, [index]: !prev[index] }))}
											title={revealedSecrets[index] ? t('app.portal.bot.webhooks.hideSecret') : t('app.portal.bot.webhooks.showSecret')}
										>
											{revealedSecrets[index] ? <EyeOff size={14} /> : <Eye size={14} />}
										</Button>
										<Button
											type="button"
											variant="secondary"
											size="sm"
											onClick={() => {
												const nextSecret = generateWebhookSecret();
												const newHooks = [...(botConfig.hooks || [])];
												newHooks[index] = { ...newHooks[index], secret: nextSecret };
												setBotConfig({ ...botConfig, hooks: newHooks });
												setRevealedSecrets((prev) => ({ ...prev, [index]: true }));
												toast({ type: 'success', title: t('app.portal.bot.webhooks.secretGenerated') });
											}}
											className="flex items-center gap-1.5"
										>
											<RefreshCw size={13} />
											<span>{t('app.portal.bot.webhooks.generateSecret')}</span>
										</Button>
										<Button
											type="button"
											variant="secondary"
											size="sm"
											disabled={!hook.secret}
											onClick={() => {
												if (!hook.secret) return;
												navigator.clipboard.writeText(hook.secret);
												setCopiedSecretIdx(index);
												toast({ type: 'success', title: t('app.portal.bot.webhooks.secretCopied') });
												setTimeout(() => setCopiedSecretIdx(null), 2000);
											}}
											title={t('app.portal.bot.webhooks.copySecret')}
										>
											{copiedSecretIdx === index ? <Check size={14} className="text-(--accent-green)" /> : <Copy size={14} />}
										</Button>
									</div>
								</div>
								<p className="text-xs text-(--text-muted)">{t('app.portal.bot.webhooks.secretHint')}</p>
							</div>
							<div className="flex flex-col gap-2">
								<span className="text-sm font-semibold text-(--text-muted)">{t('app.portal.bot.webhooks.triggers')}</span>
								<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
									{['POST vote', 'POST stat', 'PATCH stat', 'DELETE stat', 'POST review', 'PATCH review', 'DELETE review', 'VOTE review', 'POST release'].map((event) => (
										<label key={event} className="flex items-center gap-2 cursor-pointer">
											<Toggle
												checked={hook.events?.includes(event) || false}
												onChange={() => {
													const newHooks = [...(botConfig.hooks || [])];
													const currentHook = newHooks[index] || { url: '', events: [] };
													const events = currentHook.events || [];
													const nextEvents = events.includes(event) ? events.filter((e: string) => e !== event) : [...events, event];
													newHooks[index] = { ...currentHook, events: nextEvents };
													setBotConfig({ ...botConfig, hooks: newHooks });
												}}
											/>
											<span className="text-sm text-(--text)">{event}</span>
										</label>
									))}
								</div>
							</div>
						</div>
					))}
					<Button
						variant="outline"
						className="w-fit"
						onClick={() => {
							setBotConfig({ ...botConfig, hooks: [...(botConfig.hooks || []), { url: '', secret: generateWebhookSecret(), events: [] }] });
						}}
					>
						{t('app.portal.bot.webhooks.addWebhook')}
					</Button>
				</div>
			</div>

			<WebhookDeliveriesCard botId={botConfig.id} deliveries={activeDeliveries} onDeliveriesChange={updateDeliveries} />

			<Confirm
				open={confirmDeleteIdx !== null}
				onOpenChange={(open) => !open && setConfirmDeleteIdx(null)}
				title={t('app.portal.bot.webhooks.deleteConfirmTitle')}
				description={t('app.portal.bot.webhooks.deleteConfirmDesc', { number: (confirmDeleteIdx ?? 0) + 1 })}
				confirmText={t('common.actions.remove')}
				variant="danger"
				onConfirm={() => {
					if (confirmDeleteIdx !== null) {
						const newHooks = [...(botConfig.hooks || [])];
						newHooks.splice(confirmDeleteIdx, 1);
						setBotConfig({ ...botConfig, hooks: newHooks });
						setConfirmDeleteIdx(null);
					}
				}}
			/>
		</div>
	);
}
