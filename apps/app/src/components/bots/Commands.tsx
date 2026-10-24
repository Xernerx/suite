/** @format */
'use client';

import { useMemo, useState } from 'react';
import { useDictionary, useToast } from '@xernerx/providers';
import { Button, Input, Selector } from '@xernerx/ui';
import { Check, ChevronDown, ChevronUp, Copy, ListFilter, MessageSquare, MousePointerClick, RotateCcw, Sparkles, Terminal, User } from 'lucide-react';

const DISCORD_OPTION_TYPE_MAP: Record<number, string> = {
	1: 'SUB_COMMAND',
	2: 'SUB_COMMAND_GROUP',
	3: 'STRING',
	4: 'INTEGER',
	5: 'BOOLEAN',
	6: 'USER',
	7: 'CHANNEL',
	8: 'ROLE',
	9: 'MENTIONABLE',
	10: 'NUMBER',
	11: 'ATTACHMENT',
};

type CommandFilterTab = 'all' | 'slash' | 'context';

function resolveOptionType(type: unknown): string {
	if (typeof type === 'number' && DISCORD_OPTION_TYPE_MAP[type]) return DISCORD_OPTION_TYPE_MAP[type];
	if (typeof type === 'string' && type.trim()) {
		const asNum = Number(type);
		return !Number.isNaN(asNum) && DISCORD_OPTION_TYPE_MAP[asNum] ? DISCORD_OPTION_TYPE_MAP[asNum] : type.trim().toUpperCase();
	}
	return 'STRING';
}

function getCommandType(cmd: any): 1 | 2 | 3 {
	const raw = String(cmd?.type ?? cmd?.body?.type ?? '').toUpperCase();
	if (raw === '2' || raw === 'USER' || raw === 'USER_CONTEXT') return 2;
	if (raw === '3' || raw === 'MESSAGE' || raw === 'MESSAGE_CONTEXT') return 3;
	return 1;
}

function extractSubcommands(cmd: any): { name: string; description?: string; options: any[] }[] {
	const rawOptions = Array.isArray(cmd?.options) ? cmd.options : Array.isArray(cmd?.body?.options) ? cmd.body.options : [];
	const subs: { name: string; description?: string; options: any[] }[] = [];
	for (const opt of rawOptions) {
		const resolved = resolveOptionType(opt.type);
		if (resolved === 'SUB_COMMAND') {
			subs.push({ name: opt.name, description: opt.description, options: Array.isArray(opt.options) ? opt.options : [] });
		} else if (resolved === 'SUB_COMMAND_GROUP' && Array.isArray(opt.options)) {
			for (const nested of opt.options) {
				if (resolveOptionType(nested.type) === 'SUB_COMMAND') {
					subs.push({ name: `${opt.name} ${nested.name}`, description: nested.description || opt.description, options: Array.isArray(nested.options) ? nested.options : [] });
				}
			}
		}
	}
	return subs;
}

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

	const getActiveParameters = (cmd: any, cmdKey: string) => {
		const subs = extractSubcommands(cmd);
		if (subs.length > 0) {
			const activeSubName = selectedSubcmd[cmdKey] || subs[0].name;
			const foundSub = subs.find((s) => s.name === activeSubName) || subs[0];
			return { subcommands: subs, activeSub: foundSub, parameters: foundSub.options };
		}
		const rawOptions = Array.isArray(cmd.options) ? cmd.options : Array.isArray(cmd.body?.options) ? cmd.body.options : [];
		return { subcommands: [], activeSub: null, parameters: rawOptions };
	};

	const buildCommandString = (cmd: any, cmdKey: string) => {
		const values = optionValues[cmdKey] || {};
		const { activeSub, parameters } = getActiveParameters(cmd, cmdKey);
		const parts = [activeSub ? `/${cmd.name} ${activeSub.name}` : `/${cmd.name}`];
		for (const opt of parameters) {
			const val = values[opt.name]?.trim();
			if (val) parts.push(`${opt.name}:${val}`);
			else if (opt.required) parts.push(`${opt.name}:<${resolveOptionType(opt.type).toLowerCase()}>`);
		}
		return parts.join(' ');
	};

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
		return <div className="text-center text-(--text-muted) py-12 border border-dashed border-(--border)/10 rounded-3xl bg-(--foreground)/30">{t('app.bots.id.text15')}</div>;
	}

	const showSlashSection = (filterTab === 'all' || filterTab === 'slash') && slashCommands.length > 0;
	const showContextSection = (filterTab === 'all' || filterTab === 'context') && contextCommands.length > 0;
	const hasAnyVisible = showSlashSection || showContextSection;

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
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
						const isExpanded = Boolean(expandedCmds[cmdKey]);
						const { subcommands, activeSub, parameters } = getActiveParameters(cmd, cmdKey);
						const assembledCommand = buildCommandString(cmd, cmdKey);
						const cmdValues = optionValues[cmdKey] || {};
						const hasFilledValues = Object.values(cmdValues).some((v) => Boolean(v?.trim()));

						return (
							<div
								key={cmdKey}
								onClick={() => toggleCommandExpand(cmdKey)}
								className={`bg-(--foreground)/40 border transition-all rounded-3xl backdrop-blur-md cursor-pointer ${
									isExpanded ? 'border-(--accent)/45 shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_16%,transparent)]' : 'border-(--border)/10 hover:border-(--accent)/30'
								}`}
								style={{ padding: 'var(--ui-gap)' }}
							>
								<div className="flex flex-wrap items-center justify-between gap-3">
									<div className="flex items-center gap-3 min-w-0">
										<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25 shrink-0">
											<Terminal className="w-5 h-5" />
										</div>
										<div className="min-w-0">
											<div className="flex flex-wrap items-center gap-2">
												<h2 className="text-lg font-extrabold font-mono text-(--text) truncate">/{cmd.name}</h2>
												{subcommands.length > 0 ? (
													<span className="px-2.5 py-0.5 rounded-full bg-(--accent)/15 border border-(--accent)/30 text-[11px] font-bold text-(--accent)">
														{t('app.bots.commands.subcommandsCount', { count: subcommands.length })}
													</span>
												) : (
													parameters.length > 0 && (
														<span className="px-2.5 py-0.5 rounded-full bg-(--background)/70 border border-(--border)/10 text-[11px] font-bold text-(--text-muted)">
															{t('app.bots.commands.optionsCount', { count: parameters.length })}
														</span>
													)
												)}
											</div>
											<p className="text-sm text-(--text-muted) mt-0.5">{cmd.description || t('common.noDescription')}</p>
										</div>
									</div>

									<div className="flex items-center gap-2 shrink-0">
										<button
											type="button"
											onClick={(e) => handleCopyCommand(assembledCommand, cmd.name, e)}
											title={t('app.bots.id.copyCommand', { name: cmd.name })}
											className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-(--background)/80 hover:bg-(--background) border border-(--border)/10 hover:border-(--accent)/40 text-xs font-mono font-bold text-(--text-muted) hover:text-(--text) transition-all cursor-pointer"
										>
											{copiedCmd === cmd.name ? <Check className="w-3.5 h-3.5 text-(--accent-green)" /> : <Copy className="w-3.5 h-3.5 text-(--accent)" />}
											<span>{t('app.bots.commands.copyBtn', { command: activeSub ? `/${cmd.name} ${activeSub.name}` : `/${cmd.name}` })}</span>
										</button>
										<div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-(--background)/60 border border-(--border)/10 text-(--text-muted)">
											{isExpanded ? <ChevronUp className="w-4 h-4 text-(--accent)" /> : <ChevronDown className="w-4 h-4" />}
										</div>
									</div>
								</div>

								{!isExpanded && (subcommands.length > 0 || parameters.length > 0) && (
									<div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-(--border)/10">
										{subcommands.length > 0
											? subcommands.map((sub) => (
													<span
														key={sub.name}
														className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-(--accent)/12 text-(--accent) border border-(--accent)/30"
													>
														/{cmd.name} {sub.name}
													</span>
												))
											: parameters.map((opt: any, j: number) => {
													const optType = resolveOptionType(opt.type);
													return (
														<span
															key={opt.name || j}
															className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border ${opt.required ? 'bg-(--accent)/15 text-(--accent) border-(--accent)/35' : 'bg-(--background)/60 text-(--text-muted) border-(--border)/15'}`}
														>
															<span>{opt.required ? `[${opt.name}: ${optType} *]` : `[${opt.name}?: ${optType}]`}</span>
															{opt.autocomplete && <Sparkles size={11} className="text-(--accent)" />}
															{Array.isArray(opt.choices) && opt.choices.length > 0 && <ListFilter size={11} className="text-(--accent)" />}
														</span>
													);
												})}
									</div>
								)}

								{isExpanded && (
									<div
										onClick={(e) => e.stopPropagation()}
										className="mt-5 pt-5 border-t border-(--border)/15 flex flex-col cursor-default"
										style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}
									>
										{subcommands.length > 0 && (
											<div className="flex flex-wrap items-center gap-2">
												{subcommands.map((sub) => (
													<button
														key={sub.name}
														type="button"
														onClick={() => setSelectedSubcmd((prev) => ({ ...prev, [cmdKey]: sub.name }))}
														className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold border transition-all cursor-pointer ${
															activeSub?.name === sub.name
																? 'bg-(--accent) text-white border-(--accent) shadow-sm'
																: 'bg-(--background)/60 text-(--text-muted) hover:text-(--text) border-(--border)/15 hover:border-(--accent)/35'
														}`}
													>
														/{cmd.name} {sub.name}
													</button>
												))}
											</div>
										)}

										{activeSub?.description && <p className="text-xs text-(--text-muted)">{activeSub.description}</p>}

										<div className="flex flex-wrap items-center justify-between gap-2">
											<span className="text-xs font-extrabold uppercase tracking-wider text-(--accent) flex items-center gap-1.5">
												<Sparkles size={13} /> {t('app.bots.commands.previewerTitle')}
											</span>
											<div className="flex items-center gap-2">
												{hasFilledValues && (
													<Button variant="ghost" onClick={(e) => resetSampleValues(cmdKey, e)} className="text-xs py-1 px-2.5 h-auto">
														<RotateCcw className="w-3.5 h-3.5 mr-1" /> {t('app.bots.commands.resetValues')}
													</Button>
												)}
												<Button variant="primary" onClick={(e) => handleCopyCommand(assembledCommand, cmd.name, e)} className="text-xs py-1.5 px-3.5 h-auto">
													{copiedCmd === cmd.name ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
													{t('app.bots.commands.copyFullCommand', { command: assembledCommand.length > 36 ? `${assembledCommand.slice(0, 36)}...` : assembledCommand })}
												</Button>
											</div>
										</div>

										<div className="flex flex-wrap items-center gap-2 p-4 rounded-2xl bg-(--background)/70 border border-(--border)/15 shadow-inner font-mono">
											<span className="inline-flex items-center px-3 py-1.5 rounded-full bg-(--accent) text-white text-xs font-extrabold shadow-sm">
												/{cmd.name}
												{activeSub ? ` ${activeSub.name}` : ''}
											</span>

											{parameters.length === 0 ? (
												<span className="text-xs text-(--text-muted) font-sans italic">{t('app.bots.commands.noOptionsHint')}</span>
											) : (
												parameters.map((opt: any, j: number) => {
													const optType = resolveOptionType(opt.type);
													const val = cmdValues[opt.name]?.trim();
													const isFocused = activeOptionFocus[cmdKey] === opt.name;
													const pillLabel = opt.required ? `[${opt.name}: ${optType} *]` : `[${opt.name}?: ${optType}]`;

													return (
														<button
															key={opt.name || j}
															type="button"
															onClick={() => setActiveOptionFocus((prev) => ({ ...prev, [cmdKey]: opt.name }))}
															className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
																isFocused || val
																	? 'bg-(--accent)/20 text-(--accent) border-(--accent)/50 ring-1 ring-(--accent)/30'
																	: opt.required
																		? 'bg-(--accent)/10 text-(--accent) border-(--accent)/30 hover:border-(--accent)'
																		: 'bg-(--foreground)/60 text-(--text-muted) border-(--border)/15 hover:text-(--text)'
															}`}
														>
															<span>{pillLabel}</span>
															{val && <span className="px-1.5 py-0.2 rounded-full bg-(--accent) text-white text-[10px]">= {val}</span>}
															{opt.autocomplete && <Sparkles size={10} className="text-(--accent)" />}
														</button>
													);
												})
											)}
										</div>

										{parameters.length > 0 && (
											<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
												{parameters.map((opt: any, j: number) => {
													const optType = resolveOptionType(opt.type);
													const choices = Array.isArray(opt.choices) ? opt.choices : [];
													const currentValue = cmdValues[opt.name] || '';
													return (
														<div key={opt.name || j} className="flex flex-col justify-between gap-2 p-3.5 rounded-2xl bg-(--background)/50 border border-(--border)/10">
															<div className="flex flex-wrap items-center justify-between gap-2">
																<div className="flex items-center gap-2">
																	<span className="font-mono text-xs font-extrabold text-(--text)">{opt.name}</span>
																	<span className="px-2 py-0.5 rounded-full bg-(--foreground) border border-(--border)/10 text-[10px] font-mono font-bold text-(--accent)">
																		{optType}
																	</span>
																	{opt.required && (
																		<span className="text-[10px] bg-(--accent-red)/15 text-(--accent-red) px-2 py-0.5 rounded-full font-bold">
																			{t('app.bots.id.text14')}
																		</span>
																	)}
																</div>
																<div className="flex items-center gap-1.5">
																	{opt.autocomplete && (
																		<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-(--accent)/10 text-(--accent) text-[10px] font-bold">
																			<Sparkles size={10} /> {t('app.bots.commands.autocompleteBadge')}
																		</span>
																	)}
																	{choices.length > 0 && (
																		<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-(--accent)/10 text-(--accent) text-[10px] font-bold">
																			<ListFilter size={10} /> {t('app.bots.commands.choicesBadge', { count: choices.length })}
																		</span>
																	)}
																</div>
															</div>
															{opt.description && <p className="text-xs text-(--text-muted)">{opt.description}</p>}
															{choices.length > 0 ? (
																<Selector
																	value={currentValue}
																	onChange={(val) => setSampleValue(cmdKey, opt.name, val)}
																	options={[
																		{ label: t('app.bots.commands.selectChoicePlaceholder'), value: '' },
																		...choices.map((c: any) => ({ label: String(c.name ?? c.label ?? c.value ?? c), value: String(c.value ?? c.name ?? c) })),
																	]}
																/>
															) : (
																<Input
																	value={currentValue}
																	onFocus={() => setActiveOptionFocus((prev) => ({ ...prev, [cmdKey]: opt.name }))}
																	onChange={(e) => setSampleValue(cmdKey, opt.name, e.target.value)}
																	placeholder={t('app.bots.commands.sampleValuePlaceholder', { name: opt.name })}
																/>
															)}
														</div>
													);
												})}
											</div>
										)}
									</div>
								)}
							</div>
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
