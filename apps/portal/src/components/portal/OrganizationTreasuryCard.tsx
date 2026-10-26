/** @format */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Coins, History, PlusCircle, Rocket, Sparkles } from 'lucide-react';
import { Button, Input, Selector } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast, useUser } from '@xernerx/providers';

interface OrganizationTreasuryCardProps {
	orgId: string;
	orgName: string;
	orgBots?: any[];
	orgGuilds?: any[];
	onOrgVanityUnlocked?: () => void;
}

export default function OrganizationTreasuryCard({ orgId, orgName, orgBots = [], orgGuilds = [], onOrgVanityUnlocked }: OrganizationTreasuryCardProps) {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { toast } = useToast();
	const { user, mutate: mutateUser } = useUser();

	const [balance, setBalance] = useState<number>(0);
	const [ledger, setLedger] = useState<any[]>([]);
	const [loading, setLoading] = useState<boolean>(true);

	const [depositAmount, setDepositAmount] = useState<string>('250');
	const [depositing, setDepositing] = useState<boolean>(false);

	const [boostTargetKey, setBoostTargetKey] = useState<string>('');
	const [boostDuration, setBoostDuration] = useState<'24h' | '7d' | 'vanity'>('24h');
	const [boosting, setBoosting] = useState<boolean>(false);

	const targetOptions = [
		{
			value: `organization:${orgId}`,
			label: `🏢 ${orgName}`,
		},
		...orgBots.map((b) => ({
			value: `bot:${b.id}`,
			label: `🤖 ${b.discord?.global_name || b.discord?.username || b.name || b.id}`,
		})),
		...orgGuilds.map((g) => ({
			value: `server:${g.id}`,
			label: `🛡️ ${g.name || g.id}`,
		})),
	];

	useEffect(() => {
		if (!boostTargetKey && targetOptions.length > 0) {
			setBoostTargetKey(targetOptions[0].value);
		}
	}, [orgBots.length, orgGuilds.length]);

	const fetchTreasury = useCallback(async () => {
		if (!isReady || !orgId) return;
		setLoading(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/organizations/${orgId}/treasury`), {
				credentials: 'include',
			});
			if (res.ok) {
				const data = await res.json();
				setBalance(Number(data.treasuryBalance) || 0);
				setLedger(Array.isArray(data.treasuryLedger) ? data.treasuryLedger : []);
			}
		} catch (err) {
			console.error('Failed to fetch org treasury:', err);
		} finally {
			setLoading(false);
		}
	}, [orgId, getEnvUrl, isReady]);

	useEffect(() => {
		fetchTreasury();
	}, [fetchTreasury]);

	const handleDeposit = async () => {
		const amountNum = Math.floor(Number(depositAmount) || 0);
		if (amountNum < 50) {
			toast({ type: 'error', title: t('app.portal.treasury.minDepositError') });
			return;
		}
		setDepositing(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/organizations/${orgId}/treasury`), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ action: 'deposit', amount: amountNum }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(data.error || t('app.portal.treasury.depositFailed'));
			}
			setBalance(Number(data.treasuryBalance) || 0);
			if (Array.isArray(data.treasuryLedger)) setLedger(data.treasuryLedger);
			await mutateUser();
			toast({
				type: 'success',
				title: t('app.portal.treasury.depositSuccess', { amount: amountNum.toLocaleString(), org: orgName }),
			});
		} catch (err: any) {
			toast({ type: 'error', title: err.message || t('app.portal.treasury.depositFailed') });
		} finally {
			setDepositing(false);
		}
	};

	const handleBoost = async () => {
		if (!boostTargetKey) return;
		const [targetType, targetId] = boostTargetKey.split(':');
		if (!targetId) return;

		if (targetType === 'organization' && boostDuration !== 'vanity') {
			toast({ type: 'error', title: t('app.portal.treasury.orgOnlyVanityError') });
			return;
		}

		setBoosting(true);
		try {
			const payload =
				boostDuration === 'vanity'
					? {
							action: 'unlock_vanity',
							targetType,
							targetId,
						}
					: {
							action: 'boost',
							targetType,
							targetId,
							duration: boostDuration,
						};

			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/organizations/${orgId}/treasury`), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(payload),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(data.error || t('app.portal.treasury.boostFailed'));
			}
			setBalance(Number(data.treasuryBalance) || 0);
			if (Array.isArray(data.treasuryLedger)) setLedger(data.treasuryLedger);
			if (boostDuration === 'vanity' && targetType === 'organization') {
				onOrgVanityUnlocked?.();
			}
			toast({
				type: 'success',
				title: boostDuration === 'vanity' ? t('app.dashboard.settings.vanityUnlockSuccessTitle') : t('app.portal.treasury.boostSuccess', { duration: boostDuration }),
			});
		} catch (err: any) {
			toast({ type: 'error', title: err.message || t('app.portal.treasury.boostFailed') });
		} finally {
			setBoosting(false);
		}
	};

	const boostCost = boostDuration === '7d' ? 5000 : boostDuration === 'vanity' ? 2000 : 1000;

	return (
		<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			{/* Header & Pool Balance */}
			<div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-(--border)/10">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
						<Coins size={20} />
					</div>
					<div>
						<h3 className="text-lg font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('app.portal.treasury.title')}
						</h3>
						<p className="text-xs text-(--text-muted)">{t('app.portal.treasury.subtitle')}</p>
					</div>
				</div>

				<div className="flex items-center gap-3 rounded-2xl bg-(--background)/60 border border-(--accent)/30 px-4 py-2">
					<Sparkles size={16} className="text-(--accent)" />
					<div className="flex flex-col">
						<span className="text-[10px] font-extrabold uppercase tracking-wider text-(--text-muted)">{t('app.portal.treasury.poolBalance')}</span>
						<span className="text-lg font-extrabold text-(--accent) font-mono">{balance.toLocaleString()}</span>
					</div>
				</div>
			</div>

			{/* Deposit & Team Spotlight Boost Controls */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{/* Deposit Personal Credits into Organization Pool */}
				<div className="flex flex-col justify-between gap-3 rounded-2xl bg-(--background)/50 border border-(--border)/10 p-4">
					<div className="flex items-center justify-between">
						<span className="text-xs font-extrabold uppercase tracking-wider text-(--text)">{t('app.portal.treasury.depositHeading')}</span>
						<span className="text-xs text-(--text-muted) font-mono">{t('app.portal.treasury.yourBalance', { balance: (user?.credits?.balance ?? 0).toLocaleString() })}</span>
					</div>

					<div className="flex flex-wrap items-center gap-1.5">
						{[100, 250, 1000, 5000].map((preset) => (
							<button
								key={preset}
								type="button"
								onClick={() => setDepositAmount(String(preset))}
								className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border transition-colors cursor-pointer ${
									depositAmount === String(preset)
										? 'bg-(--accent) text-white border-(--accent)'
										: 'bg-(--foreground)/40 text-(--text-muted) border-(--border)/10 hover:text-(--text)'
								}`}
							>
								+{preset.toLocaleString()}
							</button>
						))}
					</div>

					<div className="flex items-center gap-2">
						<Input variant="number" min={50} value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="250" />
						<Button variant="primary" onClick={handleDeposit} loading={depositing} className="shrink-0">
							{!depositing && <PlusCircle size={15} />}
							<span>{t('app.portal.treasury.depositButton')}</span>
						</Button>
					</div>
				</div>

				{/* Spend Treasury on Spotlight Boost */}
				<div className="flex flex-col justify-between gap-3 rounded-2xl bg-(--background)/50 border border-(--border)/10 p-4">
					<div className="flex items-center justify-between">
						<span className="text-xs font-extrabold uppercase tracking-wider text-(--text)">{t('app.portal.treasury.boostHeading')}</span>
						<span className="text-xs font-mono font-bold text-(--accent)">{t('app.portal.treasury.costLabel', { cost: boostCost.toLocaleString() })}</span>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
						<Selector items={true} value={boostTargetKey} onChange={setBoostTargetKey} placeholder={t('app.portal.treasury.selectTarget')} options={targetOptions} />
						<Selector
							items={true}
							value={boostDuration}
							onChange={(val) => setBoostDuration(val as '24h' | '7d' | 'vanity')}
							options={[
								{ value: '24h', label: t('app.portal.treasury.duration24h') },
								{ value: '7d', label: t('app.portal.treasury.duration7d') },
								{ value: 'vanity', label: t('app.portal.treasury.unlockVanityOption') },
							]}
						/>
					</div>

					<Button variant="secondary" onClick={handleBoost} loading={boosting} disabled={!boostTargetKey || balance < boostCost} className="w-full">
						{!boosting && <Rocket size={15} className="text-(--accent)" />}
						<span>{boostDuration === 'vanity' ? t('app.dashboard.settings.unlockVanityBtn') : t('app.portal.treasury.boostButton')}</span>
					</Button>
				</div>
			</div>

			{/* Recent Treasury Ledger */}
			<div className="flex flex-col gap-2">
				<div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-(--text-muted)">
					<History size={13} className="text-(--accent)" />
					<span>{t('app.portal.treasury.ledgerHeading')}</span>
				</div>

				{!loading && ledger.length === 0 ? (
					<div className="rounded-2xl bg-(--background)/40 border border-(--border)/10 p-4 text-center text-xs text-(--text-muted)">{t('app.portal.treasury.emptyLedger')}</div>
				) : (
					<div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
						{ledger.slice(0, 12).map((entry) => {
							const isDeposit = entry.type === 'deposit';
							return (
								<div key={entry.id} className="flex items-center justify-between gap-2 rounded-2xl bg-(--background)/50 border border-(--border)/10 px-3.5 py-2 text-xs">
									<div className="flex items-center gap-2 min-w-0">
										{isDeposit ? <ArrowDownLeft size={14} className="text-(--accent-green) shrink-0" /> : <ArrowUpRight size={14} className="text-(--accent) shrink-0" />}
										<span className="font-bold text-(--text) truncate">{entry.username}</span>
										<span className="text-(--text-muted) truncate">
											{isDeposit ? t('app.portal.treasury.depositedEntry') : t('app.portal.treasury.boostedEntry', { target: entry.targetName || entry.targetId })}
										</span>
									</div>
									<span className={`font-mono font-bold shrink-0 ${isDeposit ? 'text-(--accent-green)' : 'text-(--accent)'}`}>
										{isDeposit ? `+${Number(entry.amount).toLocaleString()}` : `-${Number(entry.amount).toLocaleString()}`}
									</span>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
