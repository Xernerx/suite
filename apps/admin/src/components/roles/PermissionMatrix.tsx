/** @format */
'use client';

import React from 'react';
import { Toggle } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import { permissions } from '@xernerx/lib';

interface PermissionMatrixProps {
	permissionsState: Record<string, boolean>;
	onChange: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export function PermissionMatrix({ permissionsState, onChange }: PermissionMatrixProps) {
	const { t } = useDictionary();

	return (
		<div
			className="flex flex-col pt-2"
			style={{
				gap: 'calc(var(--ui-gap) * 0.5)',
			}}
		>
			<h4 className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">{t('admin.roles.permissionsHeader')}</h4>
			<div
				className="flex flex-col rounded-2xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md overflow-hidden"
				style={{
					padding: 'var(--ui-gap)',
					gap: 'var(--ui-gap)',
				}}
			>
				{permissions.map((perm) => (
					<div key={perm.key} className="flex items-center justify-between">
						<div className="flex flex-col">
							<span className="text-xs font-semibold text-(--text)">{t(`admin.permissions.${perm.key}.label`)}</span>
							<span className="text-[11px] text-(--text-muted)">{t(`admin.permissions.${perm.key}.description`)}</span>
						</div>
						<Toggle
							checked={permissionsState[perm.key] ?? perm.defaultValue}
							onChange={(e) => {
								const isChecked = e.target.checked;
								onChange((prev) => ({
									...prev,
									[perm.key]: isChecked,
								}));
							}}
							size="sm"
						/>
					</div>
				))}
			</div>
		</div>
	);
}
