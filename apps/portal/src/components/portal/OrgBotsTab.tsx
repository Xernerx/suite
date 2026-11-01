/** @format */
'use client';

import { useState } from 'react';
import { Bot, Link2, Unlink } from 'lucide-react';
import { BotRow } from '@xernerx/components';
import { Button, Selector } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import OrganizationTreasuryCard from '@/components/portal/OrganizationTreasuryCard';

interface OrgBotsTabProps {
	bots: any[];
	setBots?: React.Dispatch<React.SetStateAction<any[]>>;
	selectedOrg: any;
	orgGuilds?: any[];
}

export default function OrgBotsTab({ bots, setBots, selectedOrg, orgGuilds = [] }: OrgBotsTabProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();

	const [selectedBotId, setSelectedBotId] = useState('');
	const [busyBotId, setBusyBotId] = useState<string | null>(null);

	const orgBots = bots.filter((b) => b.organization === selectedOrg._id);
	const availablePersonalBots = bots.filter((b) => !b.organization || b.organization === 'null' || b.organization === 'undefined');

	const handleLinkBot = async () => {
		if (!selectedBotId) return;
		setBusyBotId(selectedBotId);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${selectedBotId}`), {
				method: 'PATCH',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ organization: selectedOrg._id }),
			});
			if (res.ok) {
				setBots?.((prev) => prev.map((b) => (b.id === selectedBotId ? { ...b, organization: selectedOrg._id } : b)));
				setSelectedBotId('');
				toast({ title: t('app.portal.bots.linkedToast'), type: 'success' });
			} else {
				toast({ title: t('common.toast.saveFailed'), type: 'error' });
			}
		} catch {
			toast({ title: t('common.toast.saveError'), type: 'error' });
		} finally {
			setBusyBotId(null);
		}
	};

	const handleUnlinkBot = async (botId: string) => {
		setBusyBotId(botId);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${botId}`), {
				method: 'PATCH',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ organization: null }),
			});
			if (res.ok) {
				setBots?.((prev) => prev.map((b) => (b.id === botId ? { ...b, organization: null } : b)));
				toast({ title: t('app.portal.bots.unlinkedToast'), type: 'success' });
			} else {
				toast({ title: t('common.toast.saveFailed'), type: 'error' });
			}
		} catch {
			toast({ title: t('common.toast.saveError'), type: 'error' });
		} finally {
			setBusyBotId(null);
		}
	};

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			<OrganizationTreasuryCard orgId={selectedOrg._id} orgName={selectedOrg.name} orgBots={orgBots} orgGuilds={orgGuilds} />
			<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-[2rem] p-8 shadow-xl">
				<div className="flex items-center gap-3 mb-6 text-(--text) font-extrabold text-sm tracking-widest uppercase">
					<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
						<Bot className="w-4 h-4" />
					</div>
					{t('app.portal.bots.header')}
				</div>

				{availablePersonalBots.length > 0 && (
					<div className="flex flex-col gap-2 mb-6 pb-6 border-b border-(--border)/10">
						<label className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">{t('app.portal.bots.linkBotLabel')}</label>
						<div className="flex flex-col sm:flex-row gap-3">
							<div className="flex-1">
								<Selector
									value={selectedBotId}
									onChange={(val) => setSelectedBotId(val)}
									placeholder={t('app.portal.bots.linkBotPlaceholder')}
									options={availablePersonalBots.map((b) => {
										const name = b.discord?.global_name || b.discord?.username || b.name || b.id;
										return {
											value: b.id,
											label: `${name} (${b.id})`,
										};
									})}
								/>
							</div>
							<Button variant="primary" onClick={handleLinkBot} disabled={!selectedBotId || busyBotId !== null} className="shrink-0 gap-2">
								<Link2 className="w-4 h-4" />
								{t('app.portal.bots.linkBotButton')}
							</Button>
						</div>
					</div>
				)}

				<div className="flex flex-col items-center justify-center w-full">
					{orgBots.length > 0 ? (
						<div className="flex flex-col w-full bg-(--foreground)/30 border border-(--border)/10 rounded-3xl overflow-hidden shadow-sm divide-y divide-(--border)/10">
							{orgBots.map((bot) => (
								<div key={bot._id || bot.id} className="flex items-center justify-between pr-4">
									<div className="flex-1 min-w-0">
										<BotRow bot={bot} hrefPrefix="/bots" />
									</div>
									<Button variant="secondary" onClick={() => handleUnlinkBot(bot.id)} disabled={busyBotId === bot.id} className="shrink-0 text-xs py-1.5 px-3 h-auto gap-1.5">
										<Unlink className="w-3.5 h-3.5" />
										{t('app.portal.bots.unlinkBot')}
									</Button>
								</div>
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
		</div>
	);
}
