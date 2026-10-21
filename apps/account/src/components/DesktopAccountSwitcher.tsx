/** @format */
'use client';

import { Plus, Users } from 'lucide-react';
import { Badge, Button } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import { useEffect, useState } from 'react';

export function DesktopAccountSwitcher() {
	const { t } = useDictionary();
	const [desktopAccounts, setDesktopAccounts] = useState<{ activeSlot: string; accounts: any[] }>({
		activeSlot: 'default',
		accounts: [],
	});

	useEffect(() => {
		const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		if (bridge?.getAccounts) {
			bridge
				.getAccounts()
				.then((accState: any) => {
					if (accState && Array.isArray(accState.accounts)) {
						const unique = Array.from(new Map(accState.accounts.map((a: any) => [a.slot, a])).values());
						setDesktopAccounts({ activeSlot: accState.activeSlot || 'default', accounts: unique });
					}
				})
				.catch(() => {});
		}
	}, []);

	return (
		<div className="bg-(--background)/40 border-t border-(--border)/10 flex flex-col" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
				<div className="flex items-center gap-2.5">
					<Users size={18} className="text-(--accent)" />
					<div className="flex flex-col">
						<h3 className="text-sm font-bold text-(--text)">{t('account.preferences.desktop.accountsTitle')}</h3>
						<p className="text-xs text-(--text-muted)">{t('account.preferences.desktop.accountsDesc')}</p>
					</div>
				</div>
				<Button variant="secondary" size="sm" onClick={() => (window as any).electron?.switchAccount?.('new')} className="flex items-center gap-1.5 shrink-0">
					<Plus size={14} />
					{t('account.preferences.desktop.addAccountSlot')}
				</Button>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
				{desktopAccounts.accounts.map((acc) => {
					const isCurrent = acc.slot === desktopAccounts.activeSlot;
					return (
						<div
							key={acc.slot}
							className={`flex items-center justify-between rounded-2xl border p-3 transition-all ${
								isCurrent ? 'border-(--accent)/40 bg-(--accent)/10' : 'border-(--border)/10 bg-(--foreground)/40'
							}`}
						>
							<div className="flex flex-col min-w-0 pr-2">
								<span className="text-xs font-bold text-(--text) truncate">{acc.globalName || acc.username || acc.slot}</span>
								<span className="text-[11px] text-(--text-muted) truncate">{acc.username ? `@${acc.username}` : t('account.preferences.desktop.unlinkedSlot')}</span>
							</div>
							<div className="flex items-center gap-1.5 shrink-0">
								{isCurrent ? (
									<Badge variant="accent" size="sm">
										{t('account.preferences.desktop.activeAccountBadge')}
									</Badge>
								) : (
									<>
										<Button variant="primary" size="sm" onClick={() => (window as any).electron?.switchAccount?.(acc.slot)}>
											{t('account.preferences.desktop.switchAccountButton')}
										</Button>
										{acc.slot !== 'default' && (
											<Button
												variant="secondary"
												size="sm"
												onClick={async () => {
													const next = await (window as any).electron?.removeAccount?.(acc.slot);
													if (next) setDesktopAccounts(next);
												}}
											>
												{t('account.preferences.desktop.removeSlotButton')}
											</Button>
										)}
									</>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
