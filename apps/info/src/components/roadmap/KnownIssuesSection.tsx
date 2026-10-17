/** @format */
'use client';

import { useDictionary } from '@xernerx/providers';
import { Tooltip } from '@xernerx/ui';
import { motion, AnimatePresence } from 'framer-motion';

interface KnownIssuesSectionProps {
	issues: any[];
	resolveBot: (itemOrProd: any) => { name: string; avatarUrl: string | null } | null;
}

export default function KnownIssuesSection({ issues, resolveBot }: KnownIssuesSectionProps) {
	const { t } = useDictionary();

	return (
		<motion.div
			initial={{ opacity: 1, y: 0 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: '-50px' }}
			transition={{ duration: 0.5, ease: 'easeOut' }}
			className="flex flex-col max-w-7xl mx-auto w-full p-8 md:p-12 mt-12 mb-24 rounded-[2.5rem] border border-(--border)/10 gap-8 bg-(--foreground)/10 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden group"
		>
			<div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-(--accent)/5 via-transparent to-transparent pointer-events-none z-0"></div>
			<div className="absolute -top-32 -right-32 w-96 h-96 bg-(--accent)/10 rounded-full blur-[100px] pointer-events-none z-0 group-hover:bg-(--accent)/20 transition-all duration-700"></div>

			<div className="flex flex-col gap-2 text-center md:text-left relative z-10">
				<h2 className="text-3xl font-bold text-(--text)">{t('info.roadmap.knownIssues.title')}</h2>
				<p className="text-(--text-muted)">{t('info.roadmap.knownIssues.description')}</p>
			</div>

			<div className="flex flex-col gap-10 relative z-10">
				<div className="flex flex-col gap-4">
					<h3 className="font-bold flex items-center gap-2 text-lg text-(--text)">
						<span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse"></span> {t('info.roadmap.knownIssues.openIssues')}
					</h3>
					<div className="flex flex-col gap-4">
						{issues.filter((i: any) => i.status === 'open' && i.acknowledged).length === 0 ? (
							<div className="p-6 text-center text-(--text-muted) font-medium text-sm border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-xl rounded-2xl shadow-inner">
								{t('info.roadmap.knownIssues.noOpenIssues')}
							</div>
						) : (
							<AnimatePresence mode="popLayout">
								{issues
									.filter((i: any) => i.status === 'open' && i.acknowledged)
									.map((issue: any) => {
										const issueBotInfo = resolveBot(issue);
										return (
											<motion.div
												layout
												initial={{ opacity: 1, y: 0 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, scale: 0.95 }}
												transition={{ duration: 0.25, ease: 'easeOut' }}
												key={issue.id}
												className="flex flex-col p-6 bg-(--foreground)/40 backdrop-blur-xl rounded-2xl border border-(--border)/10 shadow-xl transition-all duration-300 hover:border-red-500/60 hover:bg-(--foreground)/60 hover:shadow-[0_8px_24px_rgba(239,68,68,0.15)] hover:-translate-y-1 hover:z-20 gap-3 relative group/card"
											>
												<div className="absolute top-0 left-0 w-1.5 h-full bg-red-500/40 group-hover/card:bg-red-500 transition-colors duration-300 rounded-l-2xl"></div>
												<div className="flex justify-between items-start mb-2">
													<div className="flex items-center gap-2">
														<span className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg tracking-widest border border-red-500/20">
															{issueBotInfo?.avatarUrl && <img src={issueBotInfo.avatarUrl} alt={issueBotInfo.name} className="w-4 h-4 rounded-full object-cover" />}
															{issueBotInfo ? issueBotInfo.name : issue.productId}
														</span>
														<Tooltip position="bottom" content={issue.acknowledged ? t('info.bugs.tooltips.verified') : t('info.bugs.tooltips.submitted')}>
															<div className="flex items-center gap-1.5 bg-(--background)/50 px-2 py-1 rounded-md border border-(--border)/10 cursor-help transition-colors hover:border-(--border)/30">
																<span className={`w-2 h-2 rounded-full ${issue.acknowledged ? 'bg-blue-500' : 'bg-yellow-500'}`}></span>
																<span className="text-[10px] uppercase font-bold text-(--text-muted)">
																	{issue.acknowledged ? t('info.bugs.status.verified') : t('info.bugs.status.submitted')}
																</span>
															</div>
														</Tooltip>
													</div>
													<span className="text-xs font-medium text-(--text-muted) bg-(--foreground)/50 px-2 py-1 rounded-md">
														{new Date(issue.createdAt).toLocaleDateString()}
													</span>
												</div>
												<div className="flex flex-col">
													<div className="font-bold text-xl text-(--text) group-hover/card:text-(--accent) transition-colors">{issue.title}</div>
													<div className="text-sm text-(--text-muted) mt-3 leading-relaxed">{issue.description}</div>
												</div>
											</motion.div>
										);
									})}
							</AnimatePresence>
						)}
					</div>
				</div>

				<div className="flex flex-col gap-4">
					<h3 className="font-bold flex items-center gap-2 text-lg text-(--text)">
						<span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]"></span> {t('info.roadmap.knownIssues.recentlyResolved')}
					</h3>
					<div className="flex flex-col gap-4">
						{issues.filter((i: any) => i.status === 'resolved').length === 0 ? (
							<div className="p-6 text-center text-(--text-muted) font-medium text-sm border border-(--border)/10 bg-(--foreground)/20 backdrop-blur-xl rounded-2xl shadow-inner">
								{t('info.roadmap.knownIssues.noResolvedIssues')}
							</div>
						) : (
							<AnimatePresence mode="popLayout">
								{issues
									.filter((i: any) => i.status === 'resolved')
									.map((issue: any) => {
										const issueBotInfo = resolveBot(issue);
										const releaseStatus: 'production' | 'canary' | 'pending' | null = issue.resolvedApp && issue.resolvedVersion ? issue.releaseStatus || 'pending' : null;
										const releaseBadgeColor =
											releaseStatus === 'production'
												? 'text-green-400 bg-green-500/10 border-green-500/20'
												: releaseStatus === 'canary'
													? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
													: 'text-purple-400 bg-purple-500/10 border-purple-500/20';
										const releaseDotColor = releaseStatus === 'production' ? 'bg-green-500' : releaseStatus === 'canary' ? 'bg-amber-500' : 'bg-purple-500';
										return (
											<motion.div
												layout
												initial={{ opacity: 1, y: 0 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, scale: 0.95 }}
												transition={{ duration: 0.25, ease: 'easeOut' }}
												key={issue.id}
												className="flex flex-col p-6 bg-(--foreground)/20 backdrop-blur-xl rounded-2xl border border-(--border)/5 shadow-lg transition-all duration-300 hover:border-green-500/40 hover:bg-(--foreground)/40 gap-3 relative overflow-hidden opacity-75 hover:opacity-100 group/card"
											>
												<div className="absolute top-0 left-0 w-1.5 h-full bg-green-500/30 group-hover/card:bg-green-500 transition-colors duration-300 rounded-l-2xl"></div>
												<div className="flex flex-wrap justify-between items-start gap-2 mb-2">
													<div className="flex flex-wrap items-center gap-2">
														<span className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg tracking-widest border border-green-500/20">
															{issueBotInfo?.avatarUrl && <img src={issueBotInfo.avatarUrl} alt={issueBotInfo.name} className="w-4 h-4 rounded-full object-cover" />}
															{issueBotInfo ? issueBotInfo.name : issue.productId}
														</span>
														{releaseStatus && (
															<Tooltip
																position="bottom"
																content={t(`info.bugs.releaseTooltips.${releaseStatus}`, {
																	app: issue.resolvedApp,
																	version: issue.resolvedVersion,
																})}
															>
																<div className={`inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded-lg border cursor-help ${releaseBadgeColor}`}>
																	<span className={`w-2 h-2 rounded-full ${releaseDotColor}`}></span>
																	<span>
																		{t(`info.bugs.releaseStatus.${releaseStatus}`, {
																			app: issue.resolvedApp,
																			version: issue.resolvedVersion,
																		})}
																	</span>
																</div>
															</Tooltip>
														)}
													</div>
													<span className="text-xs font-medium text-(--text-muted) bg-(--foreground)/40 px-2 py-1 rounded-md">
														{t('info.roadmap.knownIssues.fixedOn', {
															date: new Date(issue.resolvedAt || issue.updatedAt).toLocaleDateString(),
														})}
													</span>
												</div>
												<div className="flex flex-col">
													<div className="font-bold text-lg line-through text-(--text-muted) group-hover/card:text-(--text) transition-colors">{issue.title}</div>
												</div>
											</motion.div>
										);
									})}
							</AnimatePresence>
						)}
					</div>
				</div>
			</div>
		</motion.div>
	);
}
