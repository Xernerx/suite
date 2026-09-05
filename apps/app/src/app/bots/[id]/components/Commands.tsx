'use client';

import { useDictionary } from '@xernerx/providers';
import { Terminal } from 'lucide-react';

export default function Commands({ bot }: { bot: any }) {
	const { t } = useDictionary();

	return (
		<div className="flex flex-col gap-4">
			{bot.commands && bot.commands.length > 0 ? (
				bot.commands.map((cmd: any, i: number) => (
					<div key={i} className="bg-(--foreground)/50 border border-(--border)/10 p-6 rounded-3xl">
						<div className="flex items-center gap-3 mb-2">
							<Terminal className="w-5 h-5 text-(--accent)" />
							<h3 className="text-xl font-bold font-mono">/{cmd.name}</h3>
						</div>
						<p className="text-(--text-muted) mb-4">{cmd.description}</p>

						{cmd.options && cmd.options.length > 0 && (
							<div className="bg-(--background) rounded-2xl p-4 border border-(--border)/10">
								<h4 className="text-xs font-bold text-(--text-muted) uppercase tracking-wider mb-3">{t('app.bots.id.text13')}</h4>
								<div className="flex flex-col gap-2">
									{cmd.options.map((opt: any, j: number) => (
										<div key={j} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-(--border)/10 last:border-0 gap-2">
											<div className="flex items-center gap-2">
												<span className="font-mono text-sm font-semibold">{opt.name}</span>
												{opt.required && <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold">{t('app.bots.id.text14')}</span>}
											</div>
											<span className="text-sm text-(--text-muted)">{opt.description}</span>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				))
			) : (
				<div className="text-center text-(--text-muted) py-12 border border-dashed border-(--border)/10 rounded-3xl bg-(--foreground)/30">{t('app.bots.id.text15')}</div>
			)}
		</div>
	);
}
