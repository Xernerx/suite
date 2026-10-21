/** @format */
'use client';

import { useMemo, useState } from 'react';
import { useDictionary, useToast } from '@xernerx/providers';
import { Input } from '@xernerx/ui';
import { Terminal, Copy, Check } from 'lucide-react';

export default function Commands({ bot }: { bot: any }) {
	const { t } = useDictionary();
	const { toast } = useToast();
	const [searchQuery, setSearchQuery] = useState('');
	const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

	const commands = Array.isArray(bot.commands) ? bot.commands : [];

	const filteredCommands = useMemo(() => {
		const q = searchQuery.trim().toLowerCase().replace(/^\//, '');
		if (!q) return commands;
		return commands.filter(
			(cmd: any) =>
				cmd.name?.toLowerCase().includes(q) ||
				cmd.description?.toLowerCase().includes(q) ||
				(Array.isArray(cmd.options) && cmd.options.some((opt: any) => opt.name?.toLowerCase().includes(q) || opt.description?.toLowerCase().includes(q)))
		);
	}, [commands, searchQuery]);

	const handleCopyCommand = (name: string) => {
		const text = `/${name}`;
		navigator.clipboard.writeText(text).then(() => {
			setCopiedCmd(name);
			toast({ type: 'success', title: t('app.bots.id.commandCopied', { name }) });
			setTimeout(() => setCopiedCmd((prev) => (prev === name ? null : prev)), 2000);
		});
	};

	if (commands.length === 0) {
		return <div className="text-center text-(--text-muted) py-12 border border-dashed border-(--border)/10 rounded-3xl bg-(--foreground)/30">{t('app.bots.id.text15')}</div>;
	}

	return (
		<div className="flex flex-col gap-5">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-(--foreground)/40 border border-(--border)/10 p-4 rounded-2xl">
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
				<span className="px-3 py-1.5 rounded-xl bg-(--accent)/10 text-(--accent) border border-(--accent)/20 text-xs font-bold uppercase tracking-wider self-start sm:self-auto">
					{t('app.bots.id.commandsCount', { count: filteredCommands.length })}
				</span>
			</div>

			{filteredCommands.length > 0 ? (
				<div className="flex flex-col gap-4">
					{filteredCommands.map((cmd: any, i: number) => (
						<div key={cmd.name || i} className="bg-(--foreground)/50 border border-(--border)/10 hover:border-(--accent)/30 transition-colors p-6 rounded-3xl">
							<div className="flex items-center justify-between gap-3 mb-2">
								<div className="flex items-center gap-3 min-w-0">
									<Terminal className="w-5 h-5 text-(--accent) shrink-0" />
									<h2 className="text-xl font-bold font-mono truncate">/{cmd.name}</h2>
								</div>
								<button
									type="button"
									onClick={() => handleCopyCommand(cmd.name)}
									title={t('app.bots.id.copyCommand', { name: cmd.name })}
									className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-(--background)/80 hover:bg-(--background) border border-(--border)/10 hover:border-(--accent)/40 text-xs font-mono text-(--text-muted) hover:text-(--text) transition-all cursor-pointer shrink-0"
								>
									{copiedCmd === cmd.name ? <Check className="w-3.5 h-3.5 text-(--accent-green)" /> : <Copy className="w-3.5 h-3.5" />}
									<span>/{cmd.name}</span>
								</button>
							</div>
							<p className="text-(--text-muted) mb-4">{cmd.description}</p>

							{cmd.options && cmd.options.length > 0 && (
								<div className="bg-(--background) rounded-2xl p-4 border border-(--border)/10">
									<h3 className="text-xs font-bold text-(--text-muted) uppercase tracking-wider mb-3">{t('app.bots.id.text13')}</h3>
									<div className="flex flex-col gap-2">
										{cmd.options.map((opt: any, j: number) => (
											<div key={j} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-(--border)/10 last:border-0 gap-2">
												<div className="flex items-center gap-2">
													<span className="font-mono text-sm font-semibold">{opt.name}</span>
													{opt.required && (
														<span className="text-[10px] bg-(--accent-red)/10 text-(--accent-red) px-2 py-0.5 rounded-full font-bold">{t('app.bots.id.text14')}</span>
													)}
												</div>
												<span className="text-sm text-(--text-muted)">{opt.description}</span>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					))}
				</div>
			) : (
				<div className="text-center text-(--text-muted) py-12 border border-dashed border-(--border)/10 rounded-3xl bg-(--foreground)/30">
					{t('app.bots.id.noCommandsMatch', { query: searchQuery.trim() })}
				</div>
			)}
		</div>
	);
}
