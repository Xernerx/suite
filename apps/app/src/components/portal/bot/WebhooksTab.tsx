/** @format */
'use client';

import { Link2, Trash2 } from 'lucide-react';
import { Button, Input, Toggle } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

interface WebhooksTabProps {
	botConfig: any;
	setBotConfig: (config: any) => void;
}

export default function WebhooksTab({ botConfig, setBotConfig }: WebhooksTabProps) {
	const { t } = useDictionary();

	return (
		<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-[2rem] p-8 shadow-xl">
			<div className="flex items-center gap-3 mb-6 text-(--text) font-extrabold text-sm tracking-widest uppercase">
				<Link2 className="w-5 h-5 text-(--accent)" />
				<h2>{t('app.portal.bot.webhooks.header')}</h2>
			</div>

			<div className="flex flex-col gap-6">
				{(botConfig.hooks || []).map((hook: any, index: number) => (
					<div key={index} className="flex flex-col gap-4 p-4 border border-(--border)/20 rounded-xl bg-(--foreground)/50">
						<div className="flex justify-between items-center">
							<h3 className="font-bold">{t('app.portal.bot.webhooks.webhookNumber', { number: index + 1 })}</h3>
							<button
								onClick={() => {
									const newHooks = [...botConfig.hooks];
									newHooks.splice(index, 1);
									setBotConfig({ ...botConfig, hooks: newHooks });
								}}
								className="p-2 text-red-500/70 hover:text-red-500 transition-colors"
							>
								<Trash2 size={16} />
							</button>
						</div>
						<div className="flex flex-col gap-1">
							<label className="text-sm font-semibold text-(--text-muted)">{t('app.portal.bot.webhooks.url')}</label>
							<Input
								value={hook.url || ''}
								onChange={(e) => {
									const newHooks = [...botConfig.hooks];
									newHooks[index].url = e.target.value;
									setBotConfig({ ...botConfig, hooks: newHooks });
								}}
								placeholder="https://discord.com/api/webhooks/..."
							/>
						</div>
						<div className="flex flex-col gap-2">
							<span className="text-sm font-semibold text-(--text-muted)">{t('app.portal.bot.webhooks.triggers')}</span>
							<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
								{['POST vote', 'POST stat', 'PATCH stat', 'DELETE stat', 'POST review', 'PATCH review', 'DELETE review', 'VOTE review'].map((event) => (
									<label key={event} className="flex items-center gap-2 cursor-pointer">
										<Toggle
											checked={hook.events?.includes(event) || false}
											onChange={() => {
												const newHooks = [...botConfig.hooks];
												const events = newHooks[index].events || [];
												if (events.includes(event)) {
													newHooks[index].events = events.filter((e: string) => e !== event);
												} else {
													newHooks[index].events = [...events, event];
												}
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
						setBotConfig({ ...botConfig, hooks: [...(botConfig.hooks || []), { url: '', events: [] }] });
					}}
				>
					{t('app.portal.bot.webhooks.addWebhook')}
				</Button>
			</div>
		</div>
	);
}
