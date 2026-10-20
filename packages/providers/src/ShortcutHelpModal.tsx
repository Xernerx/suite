/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Command, FileText, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useDictionary } from './DictionaryProvider';
import { useEnvironment } from './EnvironmentProvider';

export type ShortcutItem = {
	key: string;
	description: string;
	icon?: React.ElementType;
};

function ChangelogModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const [changelogData, setChangelogData] = useState<{
		versions: string[];
		selectedVersion: string;
		content: string;
	} | null>(null);
	const [isDropdownOpen, setDropdownOpen] = useState(false);

	const fetchChangelog = (version?: string) => {
		const url = version ? `/api/changelog?version=${encodeURIComponent(version)}` : '/api/changelog';
		fetch(url)
			.then((res) => res.json())
			.then((data) => setChangelogData(data))
			.catch(() => setChangelogData(null));
	};

	useEffect(() => {
		if (isOpen) {
			fetchChangelog();
		}
	}, [isOpen]);

	const renderFormattedChangelog = (raw: string) => {
		const lines = raw.split('\n');
		return (
			<div className="flex flex-col gap-2.5 text-sm">
				{lines.map((line, i) => {
					const trimmed = line.trim();
					if (!trimmed) return null;
					if (trimmed.startsWith('## ')) {
						return (
							<h3 key={i} className="text-base font-bold text-(--text) border-b border-(--border)/10 pb-1.5 mt-1">
								v{trimmed.replace(/^##\s*/, '')}
							</h3>
						);
					}
					if (trimmed.startsWith('### ')) {
						const sectionName = trimmed.replace(/^###\s*/, '');
						return (
							<span
								key={i}
								className="inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-(--accent)/15 text-(--accent) border border-(--accent)/25 mt-2"
							>
								{sectionName}
							</span>
						);
					}
					if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
						const itemText = trimmed.replace(/^[-*]\s*/, '');
						return (
							<div key={i} className="flex items-start gap-2.5 pl-2 text-(--text-muted) leading-relaxed">
								<span className="h-1.5 w-1.5 rounded-full bg-(--accent) mt-2 shrink-0" />
								<span>{itemText}</span>
							</div>
						);
					}
					return (
						<p key={i} className="text-(--text-muted) leading-relaxed">
							{trimmed}
						</p>
					);
				})}
			</div>
		);
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 20 }}
						transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
						className="relative w-full max-w-2xl rounded-3xl bg-(--foreground) border border-(--border)/10 shadow-2xl z-10 max-h-[85vh] flex flex-col"
						style={{
							padding: 'var(--ui-gap)',
							gap: 'var(--ui-gap)',
						}}
					>
						<div className="flex items-center justify-between pb-3 border-b border-(--border)/10 shrink-0">
							<div className="flex items-center gap-3">
								<div
									className="flex h-10 w-10 items-center justify-center rounded-xl"
									style={{
										background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
										color: 'var(--accent)',
									}}
								>
									<FileText size={20} />
								</div>
								<div>
									<h2 className="text-lg font-semibold text-(--text)">{t('common.shortcutsprovider.title')}</h2>
									<p className="text-xs text-(--text-muted)">{t('common.shortcutsprovider.description')}</p>
								</div>
							</div>

							<div className="flex items-center gap-3">
								{changelogData?.versions && changelogData.versions.length > 0 && (
									<div className="relative">
										<button
											onClick={() => setDropdownOpen((prev) => !prev)}
											className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-(--background) border border-(--border)/10 text-xs font-mono text-(--text) hover:border-(--accent) transition cursor-pointer"
										>
											<span>{changelogData.selectedVersion ? `v${changelogData.selectedVersion}` : t('common.shortcutsprovider.selectVersion')}</span>
											<ChevronDown size={14} className="text-(--text-muted)" />
										</button>

										<AnimatePresence>
											{isDropdownOpen && (
												<motion.div
													initial={{ opacity: 0, y: 4 }}
													animate={{ opacity: 1, y: 0 }}
													exit={{ opacity: 0, y: 4 }}
													className="absolute right-0 mt-2 w-40 rounded-xl bg-(--background) border border-(--border)/10 shadow-xl p-1 z-20 max-h-48 overflow-y-auto"
												>
													{changelogData.versions.map((ver) => (
														<button
															key={ver}
															onClick={() => {
																setDropdownOpen(false);
																fetchChangelog(ver);
															}}
															className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition cursor-pointer ${changelogData.selectedVersion === ver ? 'bg-(--accent)/10 text-(--accent) font-semibold' : 'text-(--text) hover:bg-(--foreground)'}`}
														>
															v{ver}
														</button>
													))}
												</motion.div>
											)}
										</AnimatePresence>
									</div>
								)}

								<button onClick={onClose} className="rounded-lg p-2 text-(--text-muted) hover:bg-(--background) hover:text-(--text) transition cursor-pointer">
									<X size={18} />
								</button>
							</div>
						</div>

						<div
							className="overflow-y-auto pr-2 flex-1 bg-(--background) rounded-2xl border border-(--border)/10"
							style={{
								padding: 'var(--ui-gap)',
							}}
						>
							{changelogData ? renderFormattedChangelog(changelogData.content) : <span className="text-sm text-(--text-muted)">{t('common.shortcutsprovider.loadingChangelog')}</span>}
						</div>

						<div className="pt-2 border-t border-(--border)/10 flex items-center justify-between text-xs text-(--text-muted) shrink-0 px-1">
							<a href={getEnvUrl('https://info.xernerx.com/changelog')} className="text-(--accent) hover:underline font-semibold">
								{t('common.shortcutsprovider.viewFullChangelog')} →
							</a>
							<span>
								{t('common.shortcutsprovider.description4')} <kbd className="font-mono text-(--text)">{t('common.shortcutsprovider.text')}</kbd>{' '}
								{t('common.shortcutsprovider.description5')}
							</span>
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}

export function HelpModal({ isOpen, onClose, shortcuts }: { isOpen: boolean; onClose: () => void; shortcuts: ShortcutItem[] }) {
	const { t } = useDictionary();
	const { environment } = useEnvironment();
	const [electronVersion, setElectronVersion] = useState<string | null>(null);
	const [appVersion, setAppVersion] = useState<string>('1.0.0');
	const [isChangelogOpen, setChangelogOpen] = useState(false);

	useEffect(() => {
		const win = window as any;
		if (win.electron?.version) {
			setElectronVersion(win.electron.version);
		}
		fetch('/api/version')
			.then((res) => res.json())
			.then((data) => {
				if (data.version) setAppVersion(data.version);
			})
			.catch(() => {});
	}, []);

	return (
		<>
			<AnimatePresence>
				{isOpen && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
						<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 20 }}
							transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
							className="relative w-full max-w-lg rounded-3xl bg-(--foreground) border border-(--border)/10 shadow-2xl z-10 max-h-[85vh] flex flex-col"
							style={{
								padding: 'var(--ui-gap)',
								gap: 'var(--ui-gap)',
							}}
						>
							<div className="flex items-center justify-between pb-3 border-b border-(--border)/10 shrink-0">
								<div className="flex items-center gap-3">
									<div
										className="flex h-10 w-10 items-center justify-center rounded-xl"
										style={{
											background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
											color: 'var(--accent)',
										}}
									>
										<Command size={20} />
									</div>
									<div>
										<h2 className="text-lg font-semibold text-(--text)">{t('common.shortcutsprovider.title2')}</h2>
										<p className="text-xs text-(--text-muted)">{t('common.shortcutsprovider.description2')}</p>
									</div>
								</div>

								<button onClick={onClose} className="rounded-lg p-2 text-(--text-muted) hover:bg-(--background) hover:text-(--text) transition">
									<X size={18} />
								</button>
							</div>

							<div
								className="flex flex-col overflow-y-auto pr-1"
								style={{
									gap: 'calc(var(--ui-gap) * 0.5)',
								}}
							>
								{shortcuts.map((item, idx) => {
									const IconComponent = item.icon || Command;
									return (
										<div key={idx} className="flex items-center justify-between rounded-xl px-4 py-3 bg-(--background) border border-(--border)/10">
											<div className="flex items-center gap-3 text-sm text-(--text)">
												<IconComponent size={16} className="text-(--accent)" />
												<span>{t(item.description)}</span>
											</div>

											<kbd className="rounded-md px-2.5 py-1 text-xs font-mono font-medium bg-(--foreground) text-(--text) border border-(--border)/10 shadow-sm">{item.key}</kbd>
										</div>
									);
								})}
							</div>

							<div className="pt-3 border-t border-(--border)/10 flex items-center justify-between text-xs text-(--text-muted) shrink-0 px-1">
								<div className="flex items-center gap-2">
									<span>
										{environment}:{' '}
										<button
											onClick={() => setChangelogOpen(true)}
											className="text-(--text) font-mono underline hover:text-(--accent) transition cursor-pointer"
											title={t('common.shortcutsprovider.tooltip')}
										>
											<strong>{appVersion}</strong>
										</button>
									</span>
									{electronVersion && (
										<>
											<span>•</span>
											<span>
												{t('common.shortcutsprovider.description3')}
												<strong className="text-(--text) font-mono">{electronVersion}</strong>
											</span>
										</>
									)}
								</div>
								<span>
									{t('common.shortcutsprovider.description4')}
									<kbd className="font-mono text-(--text)">{t('common.shortcutsprovider.text')}</kbd>
									{t('common.shortcutsprovider.description5')}
								</span>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>

			<ChangelogModal isOpen={isChangelogOpen} onClose={() => setChangelogOpen(false)} />
		</>
	);
}
