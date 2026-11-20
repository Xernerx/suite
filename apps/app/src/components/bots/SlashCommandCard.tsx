/** @format */
'use client';

import { useDictionary } from '@xernerx/providers';
import { Button, Input, Selector } from '@xernerx/ui';
import { Check, ChevronDown, ChevronUp, Copy, ListFilter, RotateCcw, Sparkles, Terminal } from 'lucide-react';

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

export function resolveOptionType(type: unknown): string {
	if (typeof type === 'number' && DISCORD_OPTION_TYPE_MAP[type]) return DISCORD_OPTION_TYPE_MAP[type];
	if (typeof type === 'string' && type.trim()) {
		const asNum = Number(type);
		return !Number.isNaN(asNum) && DISCORD_OPTION_TYPE_MAP[asNum] ? DISCORD_OPTION_TYPE_MAP[asNum] : type.trim().toUpperCase();
	}
	return 'STRING';
}

export function getCommandType(cmd: any): 1 | 2 | 3 {
	const raw = String(cmd?.type ?? cmd?.body?.type ?? '').toUpperCase();
	if (raw === '2' || raw === 'USER' || raw === 'USER_CONTEXT') return 2;
	if (raw === '3' || raw === 'MESSAGE' || raw === 'MESSAGE_CONTEXT') return 3;
	return 1;
}

export function extractSubcommands(cmd: any): { name: string; description?: string; options: any[] }[] {
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

interface SlashCommandCardProps {
	cmd: any;
	cmdKey: string;
	isExpanded: boolean;
	copiedCmd: string | null;
	selectedSubName?: string;
	focusedOptionName?: string;
	cmdValues: Record<string, string>;
	onToggleExpand: (cmdKey: string) => void;
	onSelectSubcmd: (cmdKey: string, subName: string) => void;
	onFocusOption: (cmdKey: string, optName: string) => void;
	onSetSampleValue: (cmdKey: string, optName: string, value: string) => void;
	onResetSampleValues: (cmdKey: string, e: React.MouseEvent) => void;
	onCopyCommand: (text: string, cmdName: string, e?: React.MouseEvent) => void;
}

export function SlashCommandCard({
	cmd,
	cmdKey,
	isExpanded,
	copiedCmd,
	selectedSubName,
	focusedOptionName,
	cmdValues,
	onToggleExpand,
	onSelectSubcmd,
	onFocusOption,
	onSetSampleValue,
	onResetSampleValues,
	onCopyCommand,
}: SlashCommandCardProps) {
	const { t } = useDictionary();

	const subcommands = extractSubcommands(cmd);
	const activeSub = subcommands.length > 0 ? subcommands.find((s) => s.name === (selectedSubName || subcommands[0].name)) || subcommands[0] : null;
	const rawOptions = Array.isArray(cmd.options) ? cmd.options : Array.isArray(cmd.body?.options) ? cmd.body.options : [];
	const parameters = activeSub ? activeSub.options : rawOptions;

	const parts = [activeSub ? `/${cmd.name} ${activeSub.name}` : `/${cmd.name}`];
	for (const opt of parameters) {
		const val = cmdValues[opt.name]?.trim();
		if (val) parts.push(`${opt.name}:${val}`);
		else if (opt.required) parts.push(`${opt.name}:<${resolveOptionType(opt.type).toLowerCase()}>`);
	}
	const assembledCommand = parts.join(' ');
	const hasFilledValues = Object.values(cmdValues).some((v) => Boolean(v?.trim()));

	return (
		<div
			onClick={() => onToggleExpand(cmdKey)}
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
									{subcommands.length === 1 ? t('app.bots.commands.subcommandCountSingular', { count: 1 }) : t('app.bots.commands.subcommandsCount', { count: subcommands.length })}
								</span>
							) : (
								parameters.length > 0 && (
									<span className="px-2.5 py-0.5 rounded-full bg-(--background)/70 border border-(--border)/10 text-[11px] font-bold text-(--text-muted)">
										{parameters.length === 1 ? t('app.bots.commands.optionCountSingular', { count: 1 }) : t('app.bots.commands.optionsCount', { count: parameters.length })}
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
						onClick={(e) => onCopyCommand(assembledCommand, cmd.name, e)}
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
				<div onClick={(e) => e.stopPropagation()} className="mt-5 pt-5 border-t border-(--border)/15 flex flex-col cursor-default" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
					{subcommands.length > 0 && (
						<div className="flex flex-wrap items-center gap-2">
							{subcommands.map((sub) => (
								<button
									key={sub.name}
									type="button"
									onClick={() => onSelectSubcmd(cmdKey, sub.name)}
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
								<Button variant="ghost" onClick={(e) => onResetSampleValues(cmdKey, e)} className="text-xs py-1 px-2.5 h-auto">
									<RotateCcw className="w-3.5 h-3.5 mr-1" /> {t('app.bots.commands.resetValues')}
								</Button>
							)}
							<Button variant="primary" onClick={(e) => onCopyCommand(assembledCommand, cmd.name, e)} className="text-xs py-1.5 px-3.5 h-auto">
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
								const isFocused = focusedOptionName === opt.name;
								const pillLabel = opt.required ? `[${opt.name}: ${optType} *]` : `[${opt.name}?: ${optType}]`;

								return (
									<button
										key={opt.name || j}
										type="button"
										onClick={() => onFocusOption(cmdKey, opt.name)}
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
													<span className="text-[10px] bg-(--accent-red)/15 text-(--accent-red) px-2 py-0.5 rounded-full font-bold">{t('app.bots.id.text14')}</span>
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
														<ListFilter size={10} />{' '}
														{choices.length === 1
															? t('app.bots.commands.choiceBadgeSingular', { count: 1 })
															: t('app.bots.commands.choicesBadge', { count: choices.length })}
													</span>
												)}
											</div>
										</div>
										{opt.description && <p className="text-xs text-(--text-muted)">{opt.description}</p>}
										{choices.length > 0 ? (
											<Selector
												value={currentValue}
												onChange={(val) => onSetSampleValue(cmdKey, opt.name, val)}
												options={[
													{ label: t('app.bots.commands.selectChoicePlaceholder'), value: '' },
													...choices.map((c: any) => ({ label: String(c.name ?? c.label ?? c.value ?? c), value: String(c.value ?? c.name ?? c) })),
												]}
											/>
										) : (
											<Input
												value={currentValue}
												onFocus={() => onFocusOption(cmdKey, opt.name)}
												onChange={(e) => onSetSampleValue(cmdKey, opt.name, e.target.value)}
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
}
