/** @format */
'use client';

import { useMemo, useState } from 'react';
import { useDictionary, useToast } from '@xernerx/providers';
import { Input } from '@xernerx/ui';
import { Check, Copy, MessageSquare, MousePointerClick, Terminal, User } from 'lucide-react';
import { SlashCommandCard, getCommandType } from './SlashCommandCard';

type CommandFilterTab = 'all' | 'slash' | 'context';

export default function Commands({ bot }: { bot: any }) {
	const { t } = useDictionary();
	const { toast } = useToast();
	const [searchQuery, setSearchQuery] = useState('');
	const [filterTab, setFilterTab] = useState<CommandFilterTab>('all');
	const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
	const [expandedCmds, setExpandedCmds] = useState<Record<string, boolean>>({});
	const [selectedSubcmd, setSelectedSubcmd] = useState<Record<string, string>>({});
	const [activeOptionFocus, setActiveOptionFocus] = useState<Record<string, string>>({});
	const [optionValues, setOptionValues] = useState<Record<string, Record<string, string>>>({});

	const commands = useMemo(() => (Array.isArray(bot.commands) ? bot.commands : []), [bot.commands]);

	const matchesSearch = useMemo(() => {
		const q = searchQuery.trim().toLowerCase().replace(/^\//, '');
		if (!q) return commands;
		return commands.filter((cmd: any) => {
			const opts = Array.isArray(cmd.options) ? cmd.options : Array.isArray(cmd.body?.options) ? cmd.body.options : [];
			return (
				cmd.name?.toLowerCase().includes(q) ||
				cmd.description?.toLowerCase().includes(q) ||
				opts.some(
					(opt: any) =>
						opt.name?.toLowerCase().includes(q) ||
						opt.description?.toLowerCase().includes(q) ||
						(Array.isArray(opt.options) && opt.options.some((subOpt: any) => subOpt.name?.toLowerCase().includes(q) || subOpt.description?.toLowerCase().includes(q)))
				)
			);
		});
	}, [commands, searchQuery]);

	const slashCommands = useMemo(() => matchesSearch.filter((cmd: any) => getCommandType(cmd) === 1), [matchesSearch]);
	const contextCommands = useMemo(() => matchesSearch.filter((cmd: any) => getCommandType(cmd) !== 1), [matchesSearch]);

	const totalSlashCount = useMemo(() => commands.filter((cmd: any) => getCommandType(cmd) === 1).length, [commands]);
	const totalContextCount = useMemo(() => commands.filter((cmd: any) => getCommandType(cmd) !== 1).length, [commands]);

	const handleCopyCommand = (text: string, cmdName: string, e?: React.MouseEvent) => {
		if (e) e.stopPropagation();
		navigator.clipboard.writeText(text).then(() => {
			setCopiedCmd(cmdName);
			toast({ type: 'success', title: t('app.bots.id.commandCopied', { name: cmdName }), description: text });
			setTimeout(() => setCopiedCmd((prev) => (prev === cmdName ? null : prev)), 2000);
		});
	};

	const toggleCommandExpand = (cmdKey: string) => setExpandedCmds((prev) => ({ ...prev, [cmdKey]: !prev[cmdKey] }));
	const setSampleValue = (cmdKey: string, optName: string, value: string) => setOptionValues((prev) => ({ ...prev, [cmdKey]: { ...(prev[cmdKey] || {}), [optName]: value } }));
	const resetSampleValues = (cmdKey: string, e: React.MouseEvent) => {
		e.stopPropagation();
		setOptionValues((prev) => {
			const next = { ...prev };
			delete next[cmdKey];
			return next;
		});
	};

	if (commands.length === 0) {
		return (
			<div data-bot-tour="commands" className="text-center text-(--text-muted) py-12 border border-dashed border-(--border)/10 rounded-3xl bg-(--foreground)/30 transition-all duration-300">
				{t('app.bots.id.text15')}
			</div>
		);
	}

	const showSlashSection = (filterTab === 'all' || filterTab === 'slash') && slashCommands.length > 0;
	const showContextSection = (filterTab === 'all' || filterTab === 'context') && contextCommands.length > 0;
	const hasAnyVisible = showSlashSection || showContextSection;

	return (
		<div data-bot-tour="commands" className="flex flex-col rounded-3xl transition-all duration-300" style={{ gap: 'var(--ui-gap)' }}>
			<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-(--foreground)/40 border border-(--border)/10 p-4 rounded-3xl backdrop-blur-md">
				<div className="flex-1 max-w-xl">
					<Input
						variant="search"
						shortcut={true}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder={t('app.bots.id.searchCommandsPlaceholder')}
						className="w-full"
					/>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{(
						[
							{ id: 'all', label: t('app.bots.commands.filterAll', { count: commands.length }) },
							{ id: 'slash', label: t('app.bots.commands.filterSlash', { count: totalSlashCount }) },
							{ id: 'context', label: t('app.bots.commands.filterContext', { count: totalContextCount }) },
						] as { id: CommandFilterTab; label: string }[]
					).map((tab) => (
						<button
							key={tab.id}
							type="button"
							onClick={() => setFilterTab(tab.id)}
							className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer border ${
								filterTab === tab.id
									? 'bg-(--accent) text-white border-(--accent) shadow-sm'
									: 'bg-(--background)/60 text-(--text-muted) hover:text-(--text) border-(--border)/10 hover:border-(--accent)/30'
							}`}
						>
							{tab.label}
						</button>
					))}
				</div>
			</div>

			{!hasAnyVisible && (
				<div className="text-center text-(--text-muted) py-12 border border-dashed border-(--border)/10 rounded-3xl bg-(--foreground)/30">
					{t('app.bots.id.noCommandsMatch', { query: searchQuery.trim() || filterTab })}
				</div>
			)}

			{showSlashSection && (
				<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
					<div className="flex items-center justify-between px-1">
						<div className="flex items-center gap-3">
							<div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25">
								<Terminal className="w-4 h-4" />
							</div>
							<div>
								<h3 className="text-base font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{t('app.bots.commands.slashSectionTitle')}
								</h3>
								<p className="text-xs text-(--text-muted)">{t('app.bots.commands.slashSectionSubtitle')}</p>
							</div>
						</div>
						<span className="px-3 py-1 rounded-full bg-(--accent)/10 text-(--accent) border border-(--accent)/20 text-xs font-extrabold">{slashCommands.length}</span>
					</div>

					{slashCommands.map((cmd: any, i: number) => {
						const cmdKey = `slash-${cmd.name || i}`;
						return (
							<SlashCommandCard
								key={cmdKey}
								cmd={cmd}
								cmdKey={cmdKey}
								isExpanded={Boolean(expandedCmds[cmdKey])}
								copiedCmd={copiedCmd}
								selectedSubName={selectedSubcmd[cmdKey]}
								focusedOptionName={activeOptionFocus[cmdKey]}
								cmdValues={optionValues[cmdKey] || {}}
								onToggleExpand={toggleCommandExpand}
								onSelectSubcmd={(key, subName) => setSelectedSubcmd((prev) => ({ ...prev, [key]: subName }))}
								onFocusOption={(key, optName) => setActiveOptionFocus((prev) => ({ ...prev, [key]: optName }))}
								onSetSampleValue={setSampleValue}
								onResetSampleValues={resetSampleValues}
								onCopyCommand={handleCopyCommand}
							/>
						);
					})}
				</div>
			)}

			{showContextSection && (
				<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
					<div className="flex items-center justify-between px-1">
						<div className="flex items-center gap-3">
							<div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25">
								<MousePointerClick className="w-4 h-4" />
							</div>
							<div>
								<h3 className="text-base font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{t('app.bots.commands.contextSectionTitle')}
								</h3>
								<p className="text-xs text-(--text-muted)">{t('app.bots.commands.contextSectionSubtitle')}</p>
							</div>
						</div>
						<span className="px-3 py-1 rounded-full bg-(--accent)/10 text-(--accent) border border-(--accent)/20 text-xs font-extrabold">{contextCommands.length}</span>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--ui-gap)' }}>
						{contextCommands.map((cmd: any, i: number) => {
							const isUserCtx = getCommandType(cmd) === 2;
							const badgeText = isUserCtx ? t('app.bots.commands.userContextBadge') : t('app.bots.commands.messageContextBadge');
							const hintText = isUserCtx ? t('app.bots.commands.userContextHint', { name: cmd.name }) : t('app.bots.commands.messageContextHint', { name: cmd.name });
							return (
								<div
									key={`ctx-${cmd.name || i}`}
									className="flex flex-col justify-between gap-4 bg-(--foreground)/40 border border-(--border)/10 hover:border-(--accent)/30 transition-all rounded-3xl backdrop-blur-md"
									style={{ padding: 'var(--ui-gap)' }}
								>
									<div className="flex items-start justify-between gap-3">
										<div className="flex items-center gap-3 min-w-0">
											<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25 shrink-0">
												{isUserCtx ? <User className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
											</div>
											<div className="min-w-0">
												<div className="flex flex-wrap items-center gap-2">
													<h2 className="text-base font-extrabold text-(--text) truncate">{cmd.name}</h2>
													<span className="px-2.5 py-0.5 rounded-full bg-(--accent)/15 border border-(--accent)/30 text-[11px] font-bold text-(--accent)">{badgeText}</span>
												</div>
												<p className="text-xs text-(--text-muted) mt-1">
													{cmd.description || t('app.bots.commands.contextDefaultDesc', { target: isUserCtx ? 'user' : 'message' })}
												</p>
											</div>
										</div>
										<button
											type="button"
											onClick={(e) => handleCopyCommand(cmd.name, cmd.name, e)}
											className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-(--background)/80 hover:bg-(--background) border border-(--border)/10 hover:border-(--accent)/40 text-xs font-mono font-bold text-(--text-muted) hover:text-(--text) transition-all cursor-pointer shrink-0"
										>
											{copiedCmd === cmd.name ? <Check className="w-3.5 h-3.5 text-(--accent-green)" /> : <Copy className="w-3.5 h-3.5 text-(--accent)" />}
										</button>
									</div>
									<div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-(--background)/60 border border-(--border)/10 text-xs font-mono text-(--text-muted)">
										<MousePointerClick className="w-3.5 h-3.5 text-(--accent) shrink-0" />
										<span className="truncate">{hintText}</span>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
