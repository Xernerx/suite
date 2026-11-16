/** @format */
'use client';

import { Activity, Radio } from 'lucide-react';
import { CodeBlock } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import type { WebsocketDispatchHistoryItem } from './websocketPlaygroundPresets';

interface WebsocketPlaygroundResponsePanelProps {
	service: string;
	method: string;
	action: string;
	latencyMs: number | null;
	responseJson: string;
	lastRequestJson: string;
	previewRequestFrame: string;
	history: WebsocketDispatchHistoryItem[];
	onSelectHistoryItem: (item: WebsocketDispatchHistoryItem) => void;
}

export function WebsocketPlaygroundResponsePanel({
	service,
	method,
	action,
	latencyMs,
	responseJson,
	lastRequestJson,
	previewRequestFrame,
	history,
	onSelectHistoryItem,
}: WebsocketPlaygroundResponsePanelProps) {
	const { t } = useDictionary();

	return (
		<div className="lg:col-span-6 flex flex-col gap-4">
			<div className="flex flex-col gap-1.5">
				<div className="flex items-center justify-between">
					<span className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">
						{responseJson ? t('docs.websocket.playground.responseHeading') : t('docs.websocket.playground.framePreviewHeading')}
					</span>
					<span className="inline-flex items-center gap-1 text-[11px] font-mono text-(--accent)">
						<Radio size={12} />
						wss://ws.xernerx.com
					</span>
				</div>

				<div className="rounded-2xl overflow-hidden border border-(--border)/10 bg-(--background)/50 text-sm">
					<CodeBlock
						key={responseJson ? `res-${latencyMs}` : `req-${service}-${method}-${action}`}
						tabs={
							responseJson
								? [
										{
											label: t('docs.websocket.playground.responseTab'),
											language: 'json',
											code: responseJson,
										},
										{
											label: t('docs.websocket.playground.requestTab'),
											language: 'json',
											code: lastRequestJson || previewRequestFrame,
										},
									]
								: [
										{
											label: t('docs.websocket.playground.requestTab'),
											language: 'json',
											code: previewRequestFrame,
										},
									]
						}
					/>
				</div>
			</div>

			{history.length > 0 && (
				<div className="flex flex-col gap-1.5">
					<span className="text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">{t('docs.websocket.playground.recentDispatches')}</span>
					<div className="flex flex-wrap items-center gap-1.5">
						{history.map((h) => (
							<button
								key={h.id}
								type="button"
								onClick={() => onSelectHistoryItem(h)}
								className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-(--background)/60 hover:bg-(--accent)/15 text-(--text) border border-(--border)/10 hover:border-(--accent)/30 transition-colors cursor-pointer"
							>
								<span className="font-bold text-(--accent)">{h.method}</span>
								<span>
									{h.service}/{h.action || 'default'}
								</span>
								<span className="text-(--text-muted)">({h.latencyMs}ms)</span>
							</button>
						))}
					</div>
				</div>
			)}

			<div className="p-3.5 rounded-2xl bg-(--background)/50 border border-(--border)/10 flex items-start gap-2.5">
				<Activity size={16} className="text-(--accent) shrink-0 mt-0.5" />
				<p className="text-xs text-(--text-muted) leading-relaxed">{t('docs.websocket.playground.helperNote')}</p>
			</div>
		</div>
	);
}
