/** @format */
'use client';

import { useRouter } from 'next/navigation';
import { Selector } from '@xernerx/ui';
import { Box } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';

export function VersionSelector({ versions, currentVersion, pkgName }: { versions: string[]; currentVersion: string; pkgName: string }) {
	const router = useRouter();
	const { t } = useDictionary();

	const options = versions.map((v) => ({
		value: v,
		label: `v${v}`,
	}));

	return (
		<div className="w-56 flex items-center gap-2.5 shrink-0">
			<div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-(--accent)/30 bg-(--accent)/15 text-(--accent) shadow-sm shrink-0">
				<Box size={18} />
			</div>
			<Selector value={currentVersion} options={options} onChange={(value) => router.push(`/packages/${pkgName}/${value}`)} placeholder={t('docs.packages.details.selectVersion')} />
		</div>
	);
}
