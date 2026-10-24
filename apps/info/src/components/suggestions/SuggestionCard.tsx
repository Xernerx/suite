/** @format */
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { UserProfilePopover } from '@xernerx/components';

interface SuggestionCardProps {
	suggestion: any;
	userId?: string;
	botInfo: { id: string; name: string; avatarUrl: string | null } | null;
	selectedProduct: string | null;
	onSelectProduct: (prod: string | null) => void;
	onVote: (id: string, action: 'upvote' | 'downvote') => void;
}

export function SuggestionCard({ suggestion: s, userId, botInfo, selectedProduct, onSelectProduct, onVote }: SuggestionCardProps) {
	const hasUpvoted = Boolean(userId && s.upvotes?.includes(userId));
	const hasDownvoted = Boolean(userId && s.downvotes?.includes(userId));
	const netVotes = (s.upvotes?.length || 0) - (s.downvotes?.length || 0);

	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 15 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.95 }}
			transition={{ duration: 0.25, ease: 'easeOut' }}
			whileHover={{ y: -2 }}
			className="flex gap-4 p-4 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm transition-colors hover:border-(--accent)/30"
		>
			<div className="flex flex-col items-center gap-1 justify-center shrink-0">
				<motion.button
					whileHover={{ scale: 1.15 }}
					whileTap={{ scale: 0.85 }}
					onClick={() => onVote(s.id, 'upvote')}
					className={`p-2 rounded-xl cursor-pointer ${hasUpvoted ? 'bg-(--accent) text-white' : 'bg-(--foreground)/50 border border-(--border)/10 hover:border-(--accent)/50 transition-colors'}`}
				>
					▲
				</motion.button>
				<span className="font-bold">{netVotes}</span>
				<motion.button
					whileHover={{ scale: 1.15 }}
					whileTap={{ scale: 0.85 }}
					onClick={() => onVote(s.id, 'downvote')}
					className={`p-2 rounded-xl cursor-pointer ${hasDownvoted ? 'bg-(--accent-red) text-white' : 'bg-(--foreground)/50 border border-(--border)/10 hover:border-(--accent)/50 transition-colors'}`}
				>
					▼
				</motion.button>
			</div>
			<div className="flex flex-col justify-center w-full min-w-0">
				<div className="flex justify-between items-start gap-4">
					<div className="font-bold text-lg text-(--text)">{s.title}</div>
					{s.author && (
						<UserProfilePopover userId={String(s.authorId || s.author.id || '')} initialUser={{ name: s.author.name, avatarUrl: s.author.icon }}>
							<div className="flex items-center gap-2 shrink-0 bg-(--foreground)/40 backdrop-blur-md hover:bg-(--accent)/15 border border-(--border)/10 hover:border-(--accent)/35 rounded-full pr-3 pl-1 py-1 transition-all">
								{s.author.icon ? (
									<Image src={s.author.icon} alt={s.author.name} width={24} height={24} unoptimized className="w-6 h-6 rounded-full" />
								) : (
									<div className="w-6 h-6 rounded-full bg-(--accent) flex items-center justify-center text-[10px] text-white font-bold">{s.author.name?.charAt(0) || '?'}</div>
								)}
								<span className="text-xs text-(--text-muted) font-medium truncate max-w-[100px]">{s.author.name}</span>
							</div>
						</UserProfilePopover>
					)}
				</div>
				<div className="text-(--text-muted) text-sm mb-2 mt-1">{s.description}</div>
				<button
					type="button"
					onClick={() => onSelectProduct(selectedProduct === s.productId ? null : s.productId)}
					className="inline-flex items-center gap-1.5 text-xs font-mono bg-(--accent)/10 backdrop-blur-md text-(--accent) px-2.5 py-1 rounded-full border border-(--accent)/25 w-fit cursor-pointer hover:bg-(--accent)/20 transition-colors"
				>
					{botInfo?.avatarUrl && <Image src={botInfo.avatarUrl} alt={botInfo.name} width={16} height={16} unoptimized className="w-4 h-4 rounded-full object-cover" />}
					{botInfo ? botInfo.name : s.productId}
				</button>
			</div>
		</motion.div>
	);
}
