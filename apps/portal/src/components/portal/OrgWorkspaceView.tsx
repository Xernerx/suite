/** @format */
'use client';

import React from 'react';
import { Tabs } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import { useDictionary } from '@xernerx/providers';
import OrgWorkspaceHeader from '@/components/portal/OrgWorkspaceHeader';
import OrgInfoTab from '@/components/portal/OrgInfoTab';
import OrgMembersTab from '@/components/portal/OrgMembersTab';
import OrgRolesTab from '@/components/portal/OrgRolesTab';
import OrgBotsTab from '@/components/portal/OrgBotsTab';
import OrgServersTab from '@/components/portal/OrgServersTab';
import OrgLinksTab from '@/components/portal/OrgLinksTab';
import OrgSettingsTab from '@/components/portal/OrgSettingsTab';
import { VALID_ORG_TABS } from '@/lib/portalHelpers';

interface OrgWorkspaceViewProps {
	session: any;
	selectedOrg: any;
	configLoading: boolean;
	orgConfig: any;
	setOrgConfig: React.Dispatch<React.SetStateAction<any>>;
	setOriginalOrgConfig: React.Dispatch<React.SetStateAction<any>>;
	activeTab: string;
	onTabChange: (tab: string) => void;
	pendingUploads: Record<string, File>;
	handleUpload: (e: React.ChangeEvent<HTMLInputElement>, field: 'iconUrl' | 'bannerUrl') => void;
	uploadingMedia: string | null;
	memberProfiles: Record<string, any>;
	pendingInvites: any[];
	orgMembers: any[];
	setOrgMembers: React.Dispatch<React.SetStateAction<any[]>>;
	bots: any[];
	setBots: React.Dispatch<React.SetStateAction<any[]>>;
	orgGuilds: any[];
	setOrgGuilds: React.Dispatch<React.SetStateAction<any[]>>;
	managedGuilds: any[];
	setIsConfirmDeleteOpen: (open: boolean) => void;
}

export default function OrgWorkspaceView({
	session,
	selectedOrg,
	configLoading,
	orgConfig,
	setOrgConfig,
	setOriginalOrgConfig,
	activeTab,
	onTabChange,
	pendingUploads,
	handleUpload,
	uploadingMedia,
	memberProfiles,
	pendingInvites,
	orgMembers,
	setOrgMembers,
	bots,
	setBots,
	orgGuilds,
	setOrgGuilds,
	managedGuilds,
	setIsConfirmDeleteOpen,
}: OrgWorkspaceViewProps) {
	const { t } = useDictionary();

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			<OrgWorkspaceHeader organization={selectedOrg} />
			{configLoading ? (
				<div className="flex flex-col w-full h-full text-center items-center justify-center py-20 text-(--text-muted)">
					<Loading variant="default" />
				</div>
			) : orgConfig ? (
				<div className="flex flex-col w-full gap-8 mt-4">
					<Tabs activeTab={activeTab} onChange={onTabChange} tabs={VALID_ORG_TABS.map((id) => ({ id, label: t(`app.portal.tabs.${id}`) }))} />
					{activeTab === 'info' && (
						<OrgInfoTab orgConfig={orgConfig} setOrgConfig={setOrgConfig} pendingUploads={pendingUploads} handleUpload={handleUpload} uploadingMedia={uploadingMedia} />
					)}
					{activeTab === 'members' && (
						<OrgMembersTab
							session={session}
							selectedOrg={selectedOrg}
							orgConfig={orgConfig}
							setOrgConfig={setOrgConfig}
							setOriginalOrgConfig={setOriginalOrgConfig}
							memberProfiles={memberProfiles}
							pendingInvites={pendingInvites}
							orgMembers={orgMembers}
							setOrgMembers={setOrgMembers}
						/>
					)}
					{activeTab === 'roles' && <OrgRolesTab orgConfig={orgConfig} setOrgConfig={setOrgConfig} />}
					{activeTab === 'bots' && <OrgBotsTab bots={bots} setBots={setBots} selectedOrg={selectedOrg} orgGuilds={orgGuilds} />}
					{activeTab === 'servers' && <OrgServersTab orgConfig={orgConfig} setOrgConfig={setOrgConfig} orgGuilds={orgGuilds} setOrgGuilds={setOrgGuilds} managedGuilds={managedGuilds} />}
					{activeTab === 'links' && <OrgLinksTab orgConfig={orgConfig} setOrgConfig={setOrgConfig} />}
					{activeTab === 'settings' && (
						<OrgSettingsTab
							orgConfig={orgConfig}
							setOrgConfig={setOrgConfig}
							onVanityUnlocked={() => {
								setOrgConfig((prev: any) => (prev ? { ...prev, vanityUnlocked: true } : prev));
								setOriginalOrgConfig((prev: any) => (prev ? { ...prev, vanityUnlocked: true } : prev));
							}}
							setIsConfirmDeleteOpen={setIsConfirmDeleteOpen}
							orgBots={bots.filter((b) => b.organization === selectedOrg._id)}
							orgGuilds={orgGuilds}
						/>
					)}
				</div>
			) : null}
		</div>
	);
}
