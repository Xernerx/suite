/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { LogIn } from 'lucide-react';
import { Button } from '@xernerx/ui';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import IssueCard from './IssueCard';

export function fuzzySearch(query: string, text: string) {
	if (!query) return true;
	const q = query.toLowerCase().replace(/\s+/g, '');
	const target = text.toLowerCase();
	let i = 0,
		j = 0;
	while (i < q.length && j < target.length) {
		if (q[i] === target[j]) i++;
		j++;
	}
	return i === q.length;
}

interface IssueLoginPromptProps {
	onCancel: () => void;
}

export function IssueLoginPrompt({ onCancel }: IssueLoginPromptProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();

	return (
		<motion.div
			key="login-prompt"
			initial={{ opacity: 0, scale: 0.96, y: 10 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.96, y: -10 }}
			className="p-8 text-center border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm rounded-3xl flex flex-col items-center justify-center gap-4 text-(--text-muted)"
		>
			<div className="text-base font-bold text-(--text)">{t('info.bugs.newBug')}</div>
			<div className="text-sm">{t('info.suggestions.loginToSubmit')}</div>
			<div className="flex items-center gap-2">
				<Button
					onClick={() => {
						if (typeof window !== 'undefined') {
							window.location.href = `${getEnvUrl('https://account.xernerx.com/login')}?redirect=${encodeURIComponent(window.location.href)}`;
						}
					}}
				>
					<LogIn size={16} />
					{t('common.sidebar.login')}
				</Button>
				<Button variant="secondary" onClick={onCancel}>
					{t('info.bugs.cancel')}
				</Button>
			</div>
		</motion.div>
	);
}

interface IssuesResultsListProps {
	filteredIssues: any[];
	search: string;
	highlightedId: string | null;
	hasUser: boolean;
	resolveBot: (itemOrProd: any) => { id: string; name: string; avatarUrl: string | null } | null;
	onToggleProduct: (prod: string) => void;
	onReportAsNew: () => void;
}

export function IssuesResultsList({ filteredIssues, search, highlightedId, hasUser, resolveBot, onToggleProduct, onReportAsNew }: IssuesResultsListProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();

	return (
		<motion.div
			key="search-list"
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -10 }}
			transition={{ duration: 0.2, ease: 'easeOut' }}
			className="flex flex-col gap-4 w-full"
		>
			<AnimatePresence mode="popLayout">
				{filteredIssues.map((s: any) => (
					<IssueCard
						key={s.id}
						issue={s}
						botInfo={resolveBot(s)}
						onToggleProduct={onToggleProduct}
						highlighted={Boolean(highlightedId && (String(s.id) === highlightedId || String(s._id) === highlightedId))}
					/>
				))}
			</AnimatePresence>

			{filteredIssues.length === 0 && !search.trim() && (
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.25 }}
					className="p-8 text-center border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm rounded-xl flex flex-col items-center justify-center gap-2 text-(--text-muted)"
				>
					<div>{t('info.roadmap.knownIssues.noOpenIssues')}</div>
				</motion.div>
			)}

			{filteredIssues.length === 0 && search.trim() && (
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.25 }}
					className="p-8 text-center border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm rounded-xl flex flex-col items-center justify-center gap-4 text-(--text-muted)"
				>
					<div>{t('info.bugs.noMatch', { query: search })}</div>
					{hasUser ? (
						<Button onClick={onReportAsNew}>{t('info.bugs.reportAsNew')}</Button>
					) : (
						<div className="flex flex-col items-center gap-3">
							<div>{t('info.suggestions.loginToSubmit')}</div>
							<Button
								onClick={() => {
									if (typeof window !== 'undefined') {
										sessionStorage.setItem('xernerx_issue_draft', search);
										window.location.href = `${getEnvUrl('https://account.xernerx.com/login')}?redirect=${encodeURIComponent(window.location.href)}`;
									}
								}}
							>
								<LogIn size={16} />
								{t('common.sidebar.login')}
							</Button>
						</div>
					)}
				</motion.div>
			)}
		</motion.div>
	);
}
