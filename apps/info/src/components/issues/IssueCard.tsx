/** @format */
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { UserProfilePopover } from '@xernerx/components';
import { Tooltip } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

interface IssueCardProps {
	issue: any;
	botInfo: { id: string; name: string; avatarUrl: string | null } | null;
	selectedProduct: string | null;
	onSelectProduct: (prod: string | null) => void;
}

export default function IssueCard({ issue, botInfo, selectedProduct, onSelectProduct }: IssueCardProps) {
	const { t } = useDictionary();

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
			<div className="flex flex-col justify-center w-full min-w-0">
				<div className="flex justify-between items-start gap-4">
					<div className="font-bold text-lg text-(--text)">{issue.title}</div>
					{(issue.author || issue.authorId) && (
						<UserProfilePopover userId={String(issue.authorId || issue.author?.id || '')} initialUser={{ name: issue.author?.name, avatarUrl: issue.author?.icon }}>
							<div className="flex items-center gap-2 shrink-0 bg-(--foreground)/40 backdrop-blur-md hover:bg-(--accent)/15 border border-(--border)/10 hover:border-(--accent)/35 rounded-full pr-3 pl-1 py-1 transition-all">
								{issue.author?.icon ? (
									<Image src={issue.author.icon} alt={issue.author.name || ''} width={24} height={24} unoptimized className="w-6 h-6 rounded-full" />
								) : (
									<div className="w-6 h-6 rounded-full bg-(--accent) flex items-center justify-center text-[10px] text-white font-bold">{(issue.author?.name || '?').charAt(0)}</div>
								)}
								<span className="text-xs text-(--text-muted) font-medium truncate max-w-[100px]">{issue.author?.name || issue.authorId}</span>
							</div>
						</UserProfilePopover>
					)}
				</div>
				<div className="text-(--text-muted) text-sm mb-2 mt-1 whitespace-pre-wrap">{issue.description}</div>
				<div className="flex flex-wrap items-center gap-2 mt-2">
					<Tooltip content={issue.status === 'resolved' ? t('info.bugs.tooltips.resolved') : issue.acknowledged ? t('info.bugs.tooltips.verified') : t('info.bugs.tooltips.submitted')}>
						<div className="flex items-center gap-1.5 bg-(--background)/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-(--border)/10 cursor-help transition-colors hover:border-(--border)/30">
							<span className={`w-2 h-2 rounded-full ${issue.status === 'resolved' ? 'bg-(--accent-green)' : issue.acknowledged ? 'bg-(--accent)' : 'bg-(--accent-orange)'}`}></span>
							<span className="text-xs uppercase font-bold text-(--text-muted)">
								{issue.status === 'resolved' ? t('info.bugs.status.resolved') : issue.acknowledged ? t('info.bugs.status.verified') : t('info.bugs.status.submitted')}
							</span>
						</div>
					</Tooltip>

					{issue.resolvedApp && issue.resolvedVersion && (
						<Tooltip
							content={t(`info.bugs.releaseTooltips.${issue.releaseStatus || 'pending'}`, {
								app: issue.resolvedApp,
								version: issue.resolvedVersion,
							})}
						>
							<div
								className={`inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full border cursor-help backdrop-blur-md ${
									issue.releaseStatus === 'production'
										? 'bg-(--accent-green)/15 text-(--accent-green) border-(--accent-green)/30'
										: issue.releaseStatus === 'canary'
											? 'bg-(--accent-orange)/15 text-(--accent-orange) border-(--accent-orange)/30'
											: 'bg-(--accent)/15 text-(--accent) border-(--accent)/30'
								}`}
							>
								<span>
									{t(`info.bugs.releaseStatus.${issue.releaseStatus || 'pending'}`, {
										app: issue.resolvedApp,
										version: issue.resolvedVersion,
									})}
								</span>
							</div>
						</Tooltip>
					)}

					<button
						type="button"
						onClick={() => onSelectProduct(selectedProduct === issue.productId ? null : issue.productId)}
						className="inline-flex items-center gap-1.5 text-xs font-mono bg-(--accent)/10 backdrop-blur-md text-(--accent) px-2.5 py-1 rounded-full border border-(--accent)/25 w-fit cursor-pointer hover:bg-(--accent)/20 transition-colors"
					>
						{botInfo?.avatarUrl && <Image src={botInfo.avatarUrl} alt={botInfo.name} width={16} height={16} unoptimized className="w-4 h-4 rounded-full object-cover" />}
						{botInfo ? botInfo.name : issue.productId}
					</button>
				</div>
			</div>
		</motion.div>
	);
}
