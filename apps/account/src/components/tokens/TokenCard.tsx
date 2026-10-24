/** @format */
'use client';

import { motion } from 'framer-motion';
import { Activity, Clock, Settings2 } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';
import { Badge, CopyButton } from '@xernerx/ui';
import { TokenListInfo } from './types';

interface TokenCardProps {
	token: TokenListInfo;
	index: number;
	onSelect: (id: string) => void;
}

const statusVariants: Record<TokenListInfo['status'], 'success' | 'muted' | 'danger' | 'warning'> = {
	active: 'success',
	inactive: 'muted',
	suspended: 'danger',
	pending: 'warning',
};

export default function TokenCard({ token, index, onSelect }: TokenCardProps) {
	const { t } = useDictionary();
	const tokenId = token.id || token._id;

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.05 }}
			onClick={() => onSelect(tokenId)}
			className="group relative flex cursor-pointer flex-col justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm transition-all hover:border-(--accent)/50 hover:shadow-md"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
			}}
		>
			<div className="flex items-start justify-between">
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<h2 className="text-base font-semibold text-(--text) truncate max-w-[180px]">{token.name}</h2>
					{tokenId && <CopyButton value={tokenId} label={`...${tokenId.slice(-6)}`} toastTitle={t('account.tokens.idCopied')} />}
				</div>
				<Badge variant={statusVariants[token.status]} dot>
					{token.status}
				</Badge>
			</div>

			<div className="flex flex-wrap items-center gap-1.5">
				<Badge variant="muted" size="sm" icon={<Activity size={11} />}>
					{t('account.tokens.requestsBadge', { count: (token.requestCount ?? 0).toLocaleString() })}
				</Badge>
				<Badge variant="muted" size="sm" icon={<Clock size={11} />}>
					{token.lastUsedAt ? t('account.tokens.lastUsedBadge', { date: new Date(token.lastUsedAt).toLocaleDateString() }) : t('account.tokens.neverUsedBadge')}
				</Badge>
			</div>

			<div className="flex items-center text-xs font-medium text-(--accent) opacity-0 transition-opacity group-hover:opacity-100 mt-1">
				<Settings2 size={14} className="mr-1.5" /> {t('account.tokens.manageSettings')}
			</div>
		</motion.div>
	);
}
