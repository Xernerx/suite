/** @format */
'use client';

import { Bot } from 'lucide-react';
import { BotRow } from '@xernerx/components';
import { useDictionary } from '@xernerx/providers';

interface OrgBotsTabProps {
	bots: any[];
	selectedOrg: any;
}

export default function OrgBotsTab({ bots, selectedOrg }: OrgBotsTabProps) {
	const { t } = useDictionary();

	const orgBots = bots.filter((b) => b.organization === selectedOrg._id);

	return (
		<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-[2rem] p-8 shadow-xl">
			<div className="flex items-center gap-3 mb-6 text-(--text) font-extrabold text-sm tracking-widest uppercase">
				<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
					<Bot className="w-4 h-4" />
				</div>
				{t('app.portal.bots.header')}
			</div>
			<div className="flex flex-col items-center justify-center w-full">
				{orgBots.length > 0 ? (
					<div className="flex flex-col w-full bg-(--foreground)/30 border border-(--border)/10 rounded-3xl overflow-hidden shadow-sm">
						{orgBots.map((bot) => (
							<BotRow key={bot._id || bot.id} bot={bot} hrefPrefix="/portal/bots" />
						))}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center p-8 bg-(--background)/50 rounded-2xl border border-(--border)/10 border-dashed w-full">
						<Bot className="w-8 h-8 text-(--text-muted) opacity-50 mb-3" />
						<p className="text-sm text-(--text-muted) mb-4">{t('app.portal.bots.noBots')}</p>
					</div>
				)}
			</div>
		</div>
	);
}
