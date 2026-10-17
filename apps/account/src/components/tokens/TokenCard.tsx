/** @format */
'use client';

import { motion } from 'framer-motion';
import { Settings2 } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';
import { TokenListInfo } from './types';

interface TokenCardProps {
	token: TokenListInfo;
	index: number;
	onSelect: (id: string) => void;
}

const statusColors = {
	active: 'text-(--accent-green) bg-(--accent-green)/10 border-(--accent-green)/20',
	inactive: 'text-(--text-muted) bg-(--border)/10 border-(--border)/20',
	suspended: 'text-(--accent-red) bg-(--accent-red)/10 border-(--accent-red)/20',
	pending: 'text-(--accent-orange) bg-(--accent-orange)/10 border-(--accent-orange)/20',
};

export default function TokenCard({ token, index, onSelect }: TokenCardProps) {
	const { t } = useDictionary();

	return (
		<motion.div
			initial={{
				opacity: 0,
				y: 10,
			}}
			animate={{
				opacity: 1,
				y: 0,
			}}
			transition={{
				delay: index * 0.05,
			}}
			onClick={() => onSelect(token.id || token._id)}
			className="group relative flex cursor-pointer flex-col justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm transition-all hover:border-(--accent)/50 hover:shadow-md"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
			}}
		>
			<div className="flex items-start justify-between">
				<div
					className="flex flex-col"
					style={{
						gap: 'calc(var(--ui-gap) * 0.2)',
					}}
				>
					<h3 className="text-base font-semibold text-(--text) truncate max-w-[180px]">{token.name}</h3>
					<p className="text-xs font-mono text-(--text-muted)">...{token.id?.slice(-6)}</p>
				</div>
				<span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusColors[token.status]}`}>{token.status}</span>
			</div>
			<div className="flex items-center text-xs font-medium text-(--accent) opacity-0 transition-opacity group-hover:opacity-100 mt-2">
				<Settings2 size={14} className="mr-1.5" /> {t('account.tokens.manageSettings')}
			</div>
		</motion.div>
	);
}
