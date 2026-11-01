/** @format */
'use client';

import { motion } from 'framer-motion';
import { Activity, Bot, Clock, ExternalLink, Settings2 } from 'lucide-react';
import Image from 'next/image';
import { useDictionary, useEnvironment } from '@xernerx/providers';
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
	const { getEnvUrl } = useEnvironment();
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
				{token.botInfo ? (
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-(--accent)/15 text-(--accent) border border-(--accent)/30 max-w-full truncate">
						{token.botInfo.avatarUrl ? (
							<Image src={token.botInfo.avatarUrl} alt={token.botInfo.name} width={14} height={14} unoptimized className="w-3.5 h-3.5 rounded-full object-cover shrink-0" />
						) : (
							<Bot size={12} className="shrink-0" />
						)}
						<span className="truncate">{token.botInfo.name}</span>
					</span>
				) : (
					<Badge variant="muted" size="sm" icon={<Bot size={11} />}>
						{t('account.tokens.unboundBadge')}
					</Badge>
				)}
				<Badge variant="muted" size="sm" icon={<Activity size={11} />}>
					{t('account.tokens.requestsBadge', { count: (token.requestCount ?? 0).toLocaleString() })}
				</Badge>
				<Badge variant="muted" size="sm" icon={<Clock size={11} />}>
					{token.lastUsedAt ? t('account.tokens.lastUsedBadge', { date: new Date(token.lastUsedAt).toLocaleDateString() }) : t('account.tokens.neverUsedBadge')}
				</Badge>
			</div>

			<div className="flex items-center justify-between gap-2 mt-1">
				<div className="flex items-center text-xs font-medium text-(--accent) opacity-0 transition-opacity group-hover:opacity-100">
					<Settings2 size={14} className="mr-1.5" /> {t('account.tokens.manageSettings')}
				</div>
				{token.botId && (
					<a
						href={getEnvUrl(`https://portal.xernerx.com/?bot=${token.botId}`)}
						onClick={(e) => e.stopPropagation()}
						className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-(--background)/60 hover:bg-(--accent)/15 text-(--text-muted) hover:text-(--accent) border border-(--border)/10 hover:border-(--accent)/30 transition-colors"
					>
						<ExternalLink size={11} />
						<span>{t('account.tokens.openInPortal')}</span>
					</a>
				)}
			</div>
		</motion.div>
	);
}
