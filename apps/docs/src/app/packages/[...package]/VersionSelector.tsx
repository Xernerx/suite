/** @format */
'use client';

import { useRouter } from 'next/navigation';
import { Selector } from '@xernerx/ui';
import { Box } from 'lucide-react';

export function VersionSelector({ versions, currentVersion, pkgName }: { versions: string[]; currentVersion: string; pkgName: string }) {
	const router = useRouter();

	const options = versions.map((v) => ({
		value: v,
		label: `v${v}`,
	}));

	return (
		<div className="w-64 flex items-center gap-3">
			<div className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 shadow-sm shrink-0">
				<Box size={20} />
			</div>
			<Selector value={currentVersion} options={options} onChange={(value) => router.push(`/packages/${pkgName}/${value}`)} placeholder="Select version..." />
		</div>
	);
}
