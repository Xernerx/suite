/** @format */
'use client';

import { Check, Copy, Terminal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDictionary } from '@xernerx/providers';

export type PackageManagerId = 'npm' | 'pnpm' | 'yarn';

const PKG_MANAGERS: readonly PackageManagerId[] = ['npm', 'pnpm', 'yarn'];
const STORAGE_KEY = 'xernerx_docs_pkgman';
const EVENT_NAME = 'xernerx:pkgman-change';

export function formatInstallCommand(pkgMan: PackageManagerId, pkgName: string, version?: string): string {
	const target = version ? `${pkgName}@${version}` : pkgName;
	switch (pkgMan) {
		case 'npm':
			return `npm install ${target}`;
		case 'yarn':
			return `yarn add ${target}`;
		case 'pnpm':
		default:
			return `pnpm add ${target}`;
	}
}

export function PackageInstallBar({ pkgName, version, fullWidth = false }: { pkgName: string; version?: string; fullWidth?: boolean }) {
	const { t } = useDictionary();
	const [pkgMan, setPkgMan] = useState<PackageManagerId>('pnpm');
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY) as PackageManagerId | null;
			if (stored && PKG_MANAGERS.includes(stored)) {
				setPkgMan(stored);
			}
		} catch {}

		const handleSync = (e: Event) => {
			const detail = (e as CustomEvent<PackageManagerId>).detail;
			if (detail && PKG_MANAGERS.includes(detail)) {
				setPkgMan(detail);
			}
		};
		window.addEventListener(EVENT_NAME, handleSync);
		return () => window.removeEventListener(EVENT_NAME, handleSync);
	}, []);

	const selectManager = (next: PackageManagerId) => {
		setPkgMan(next);
		try {
			localStorage.setItem(STORAGE_KEY, next);
		} catch {}
		window.dispatchEvent(new CustomEvent<PackageManagerId>(EVENT_NAME, { detail: next }));
	};

	const command = formatInstallCommand(pkgMan, pkgName, version);

	const handleCopy = () => {
		navigator.clipboard.writeText(command);
		setCopied(true);
		setTimeout(() => setCopied(false), 1800);
	};

	return (
		<div className={`${fullWidth ? 'flex w-full' : 'inline-flex'} flex-wrap items-center justify-between gap-2.5 px-3 py-1.5 rounded-2xl bg-(--foreground)/40 border border-(--border)/10`}>
			<div className="flex items-center gap-2 min-w-0">
				<Terminal size={13} className="text-(--accent) shrink-0" />
				<div className="inline-flex items-center gap-0.5 p-0.5 rounded-xl bg-(--background)/60 border border-(--border)/10 shrink-0">
					{PKG_MANAGERS.map((pm) => {
						const active = pkgMan === pm;
						return (
							<button
								key={pm}
								type="button"
								onClick={() => selectManager(pm)}
								className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer ${
									active ? 'bg-(--accent) text-white shadow-2xs' : 'text-(--text-muted) hover:text-(--text)'
								}`}
							>
								{pm}
							</button>
						);
					})}
				</div>
				<code className="text-xs font-mono text-(--text) truncate">{command}</code>
			</div>

			<button
				type="button"
				onClick={handleCopy}
				className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-(--background)/70 hover:bg-(--accent)/15 text-(--text-muted) hover:text-(--accent) border border-(--border)/10 transition-colors cursor-pointer shrink-0"
			>
				{copied ? <Check size={11} className="text-(--accent-green)" /> : <Copy size={11} />}
				<span>{copied ? t('docs.api.common.copied') : t('app.widgets.copy')}</span>
			</button>
		</div>
	);
}
