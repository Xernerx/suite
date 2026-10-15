/** @format */
'use client';

import { Shield, Plus, Trash2 } from 'lucide-react';
import { Button, Input } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

interface OrgRolesTabProps {
	orgConfig: any;
	setOrgConfig: (config: any) => void;
}

export default function OrgRolesTab({ orgConfig, setOrgConfig }: OrgRolesTabProps) {
	const { t } = useDictionary();

	return (
		<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-[2rem] p-8 shadow-xl">
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-3 text-(--text) font-extrabold text-sm tracking-widest uppercase">
					<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
						<Shield className="w-4 h-4" />
					</div>
					{t('app.portal.roles.header')}
				</div>
				<Button
					variant="primary"
					onClick={() => {
						const newRole = { id: `role-${Date.now()}`, name: t('app.portal.roles.defaultRoleName'), permissions: '0' };
						setOrgConfig({ ...orgConfig, roles: [...(orgConfig.roles || []), newRole] });
					}}
					className="shadow-sm text-xs py-1.5 h-auto"
				>
					<Plus className="w-4 h-4 mr-1" />
					{t('app.portal.roles.addRole')}
				</Button>
			</div>
			<p className="text-sm text-(--text-muted) mb-6">{t('app.portal.roles.description')}</p>

			<div className="flex flex-col gap-4">
				{!orgConfig.roles || orgConfig.roles.length === 0 ? (
					<div className="text-center py-10 text-(--text-muted) bg-(--background)/50 rounded-2xl border border-(--border)/10">{t('app.portal.roles.noRoles')}</div>
				) : (
					orgConfig.roles.map((role: any, index: number) => (
						<div key={role.id} className="flex items-center gap-4 bg-(--background)/50 border border-(--border)/10 p-4 rounded-2xl">
							<div className="flex flex-col flex-1 gap-1">
								<Input
									value={role.name}
									onChange={(e) => {
										const newRoles = orgConfig.roles.map((r: any, i: number) => (i === index ? { ...r, name: e.target.value } : r));
										setOrgConfig({ ...orgConfig, roles: newRoles });
									}}
									placeholder={t('app.portal.roles.placeholder')}
									className="w-full sm:w-64"
								/>
							</div>
							<button
								onClick={() => {
									const newRoles = orgConfig.roles.filter((r: any) => r.id !== role.id);
									setOrgConfig({ ...orgConfig, roles: newRoles });
								}}
								className="p-2 rounded-xl text-red-400 hover:bg-red-400/10 transition-colors"
							>
								<Trash2 className="w-5 h-5" />
							</button>
						</div>
					))
				)}
			</div>
		</div>
	);
}
