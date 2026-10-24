/** @format */
'use client';

import { useEffect, useState } from 'react';
import { Gamepad2, Layers, Plus, Users } from 'lucide-react';
import { useDictionary, useEnvironment, useTheme } from '@xernerx/providers';
import { Button, Toggle } from '@xernerx/ui';

export function SidebarUserDesktopSection({ onClose }: { onClose?: () => void }) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { preferences } = useTheme();
	const [desktopAccounts, setDesktopAccounts] = useState<{ activeSlot: string; accounts: any[] } | null>(null);
	const [discordRpcEnabled, setDiscordRpcEnabled] = useState(true);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const bridge = (window as any).electron;
		bridge
			?.getAccounts?.()
			?.then?.((state: any) => {
				if (state && Array.isArray(state.accounts)) {
					const unique = Array.from(new Map(state.accounts.map((a: any) => [a.slot, a])).values());
					setDesktopAccounts({ activeSlot: state.activeSlot || 'default', accounts: unique });
				}
			})
			?.catch?.(() => {});
		const applyMeta = (meta: any) => meta && typeof meta.discordRpc === 'boolean' && setDiscordRpcEnabled(meta.discordRpc);
		if (bridge?.metadata) applyMeta(bridge.metadata);
		bridge
			?.getMetadata?.()
			?.then?.(applyMeta)
			?.catch?.(() => {});
		const unsub = bridge?.onMetadataUpdated?.(applyMeta);
		return () => unsub?.();
	}, []);

	return (
		<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
			{preferences.developerMode && (
				<div className="bg-(--foreground)/30 backdrop-blur-md rounded-xl flex flex-col overflow-hidden text-sm font-semibold text-(--text-muted) border border-(--border)/5">
					<Button
						onClick={() => {
							const bridge = (window as any).electron;
							if (bridge?.toggleOverlay) bridge.toggleOverlay();
							else window.open(getEnvUrl('https://app.xernerx.com/overlay'), 'xernerx-overlay', 'width=380,height=520,menubar=no,toolbar=no,location=no,status=no');
							onClose?.();
						}}
						className="flex"
					>
						<Layers size={16} className="shrink-0 text-(--accent)" /> <span className="truncate">{t('components.cards.sidebaruser.launchOverlay')}</span>
					</Button>
				</div>
			)}

			<div className="flex items-center justify-between rounded-xl border border-(--border)/10 bg-(--background)/40 px-2.5 py-1.5">
				<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-(--text)">
					<Gamepad2 size={13} className="text-(--accent)" />
					{t('account.preferences.desktopItems.discordRpc.title')}
				</span>
				<Toggle
					checked={discordRpcEnabled}
					onChange={async (val) => {
						const next = typeof val === 'boolean' ? val : val.target.checked;
						setDiscordRpcEnabled(next);
						await (window as any).electron?.updateMetadata?.({ discordRpc: next });
					}}
					suppressHydrationWarning
				/>
			</div>

			<div className="flex flex-col rounded-xl border border-(--border)/10 bg-(--background)/40 p-2 gap-1.5">
				<div className="flex items-center justify-between px-1">
					<span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-(--text-muted)">
						<Users size={11} className="text-(--accent)" />
						{t('components.cards.sidebaruser.switchAccount')}
					</span>
					<button
						type="button"
						onClick={() => (window as any).electron?.switchAccount?.('new')}
						className="inline-flex items-center gap-1 text-[10px] font-bold text-(--accent) hover:underline cursor-pointer"
					>
						<Plus size={11} />
						{t('components.cards.sidebaruser.addAccount')}
					</button>
				</div>

				{desktopAccounts?.accounts
					?.filter((acc) => acc.slot !== desktopAccounts.activeSlot)
					.map((acc) => (
						<button
							key={acc.slot}
							type="button"
							onClick={() => (window as any).electron?.switchAccount?.(acc.slot)}
							className="flex items-center justify-between rounded-xl bg-(--foreground)/40 hover:bg-(--foreground) px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer"
						>
							<span className="font-semibold text-(--text) truncate">{acc.globalName || acc.username || acc.slot}</span>
							<span className="text-[10px] font-bold text-(--accent)">{t('account.preferences.desktop.switchAccountButton')}</span>
						</button>
					))}
			</div>
		</div>
	);
}
