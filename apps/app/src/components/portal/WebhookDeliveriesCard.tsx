/** @format */
'use client';

import { useState } from 'react';
import { Activity, CheckCircle2, ChevronDown, ChevronUp, Clock, RefreshCw, RotateCcw, XCircle } from 'lucide-react';
import { Button } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';

export interface WebhookDeliveryItem {
	id: string;
	event: string;
	url: string;
	status: number;
	ok: boolean;
	latencyMs: number;
	payload?: Record<string, any>;
	responseSnippet?: string;
	timestamp: string | Date;
}

interface WebhookDeliveriesCardProps {
	botId: string;
	deliveries: WebhookDeliveryItem[];
	onDeliveriesChange: (nextDeliveries: WebhookDeliveryItem[]) => void;
}

export default function WebhookDeliveriesCard({ botId, deliveries, onDeliveriesChange }: WebhookDeliveriesCardProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();

	const [replayingId, setReplayingId] = useState<string | null>(null);
	const [refreshing, setRefreshing] = useState(false);
	const [expandedId, setExpandedId] = useState<string | null>(null);

	const handleRefresh = async () => {
		setRefreshing(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${botId}/hooks`), {
				credentials: 'include',
			});
			if (res.ok) {
				const data = await res.json();
				const list = Array.isArray(data?.deliveries) ? data.deliveries : (Array.isArray(data) ? data : []).flatMap((h: any) => h.deliveries || []);
				onDeliveriesChange(list);
			}
		} catch (err) {
			console.error('Failed to refresh webhook deliveries:', err);
		} finally {
			setRefreshing(false);
		}
	};

	const handleReplay = async (delivery: WebhookDeliveryItem) => {
		setReplayingId(delivery.id);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${botId}/hooks/replay`), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					deliveryId: delivery.id,
					hookUrl: delivery.url,
				}),
			});
			const data = await res.json().catch(() => ({}));
			if (Array.isArray(data.deliveries)) {
				onDeliveriesChange(data.deliveries);
			}
			if (!res.ok || !data.ok) {
				throw new Error(data.error || `HTTP ${data.status || res.status}`);
			}
			toast({
				type: 'success',
				title: t('app.portal.bot.webhooks.deliveries.replaySuccess', {
					status: data.status,
					latency: data.latencyMs,
				}),
			});
		} catch (err: any) {
			toast({
				type: 'error',
				title: t('app.portal.bot.webhooks.deliveries.replayFailed', {
					error: err.message || 'Error',
				}),
			});
		} finally {
			setReplayingId(null);
		}
	};

	return (
		<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--border)/10 pb-3">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
						<Activity className="h-5 w-5" />
					</div>
					<div>
						<h3 className="text-base font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('app.portal.bot.webhooks.deliveries.title')}
						</h3>
						<p className="text-xs text-(--text-muted)">{t('app.portal.bot.webhooks.deliveries.subtitle')}</p>
					</div>
				</div>

				<Button variant="secondary" size="sm" onClick={handleRefresh} loading={refreshing}>
					{!refreshing && <RefreshCw size={13} />}
					<span>{t('app.portal.bot.webhooks.deliveries.refresh')}</span>
				</Button>
			</div>

			{deliveries.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-2xl border border-(--border)/10 bg-(--background)/50 p-8 text-center">
					<Clock className="h-7 w-7 text-(--text-muted) opacity-60 mb-2" />
					<p className="text-sm font-bold text-(--text)">{t('app.portal.bot.webhooks.deliveries.emptyTitle')}</p>
					<p className="text-xs text-(--text-muted) mt-1 max-w-md">{t('app.portal.bot.webhooks.deliveries.emptyDesc')}</p>
				</div>
			) : (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					{deliveries.map((delivery) => {
						const isExpanded = expandedId === delivery.id;
						const formattedTime = delivery.timestamp ? new Date(delivery.timestamp).toLocaleString() : '—';

						return (
							<div
								key={delivery.id}
								className="flex flex-col rounded-2xl border border-(--border)/10 bg-(--background)/50 transition-all"
								style={{ padding: 'calc(var(--ui-gap) * 0.75)', gap: 'calc(var(--ui-gap) * 0.5)' }}
							>
								<div className="flex flex-wrap items-center justify-between gap-2">
									<div className="flex flex-wrap items-center gap-2 min-w-0">
										<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
											{delivery.event}
										</span>

										<span
											className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
												delivery.ok
													? 'bg-(--accent-green)/15 text-(--accent-green) border-(--accent-green)/30'
													: 'bg-(--accent-red)/15 text-(--accent-red) border-(--accent-red)/30'
											}`}
										>
											{delivery.ok ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
											{delivery.status > 0
												? `${delivery.status} ${delivery.ok ? t('app.portal.bot.webhooks.deliveries.statusOk') : t('app.portal.bot.webhooks.deliveries.statusError')}`
												: t('app.portal.bot.webhooks.deliveries.statusUnreachable')}
										</span>

										<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono text-(--text-muted) bg-(--foreground)/40 border border-(--border)/10">
											<Clock size={11} className="text-(--accent)" />
											{delivery.latencyMs}ms
										</span>

										<span className="text-xs text-(--text-muted) font-mono truncate max-w-xs">{delivery.url}</span>
									</div>

									<div className="flex items-center gap-2 shrink-0">
										<span className="text-[11px] text-(--text-muted) hidden sm:inline">{formattedTime}</span>

										<Button
											variant="ghost"
											size="sm"
											onClick={() => setExpandedId(isExpanded ? null : delivery.id)}
											aria-label={t('app.portal.bot.webhooks.deliveries.inspectPayload')}
										>
											{isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
											<span className="text-xs">{t('app.portal.bot.webhooks.deliveries.inspectPayload')}</span>
										</Button>

										<Button variant="secondary" size="sm" loading={replayingId === delivery.id} onClick={() => handleReplay(delivery)}>
											{replayingId !== delivery.id && <RotateCcw size={13} className="text-(--accent)" />}
											<span>{t('app.portal.bot.webhooks.deliveries.replayButton')}</span>
										</Button>
									</div>
								</div>

								{isExpanded && (
									<div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-2 border-t border-(--border)/10 text-xs font-mono">
										<div className="flex flex-col gap-1">
											<span className="text-[11px] font-sans font-bold uppercase tracking-wider text-(--text-muted)">
												{t('app.portal.bot.webhooks.deliveries.requestPayload')}
											</span>
											<pre className="p-3 rounded-2xl bg-(--foreground)/50 border border-(--border)/10 text-(--text) overflow-x-auto max-h-44">
												{JSON.stringify(delivery.payload || {}, null, 2)}
											</pre>
										</div>
										<div className="flex flex-col gap-1">
											<span className="text-[11px] font-sans font-bold uppercase tracking-wider text-(--text-muted)">
												{t('app.portal.bot.webhooks.deliveries.responseSnippet')}
											</span>
											<pre className="p-3 rounded-2xl bg-(--foreground)/50 border border-(--border)/10 text-(--text-muted) overflow-x-auto max-h-44 whitespace-pre-wrap">
												{delivery.responseSnippet || t('app.portal.bot.webhooks.deliveries.emptyResponse')}
											</pre>
										</div>
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
