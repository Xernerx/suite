/** @format */
'use client';

import { Button, Input, Modal, Selector } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

export interface SuiteAppVersionInfo {
	id: string;
	name: string;
	domain: string;
	localVersion: string | null;
	canaryVersion: string | null;
	prodVersion: string | null;
	versions: string[];
}

interface IssueModalsProps {
	modalOpen: boolean;
	setModalOpen: (open: boolean) => void;
	title: string;
	setTitle: (val: string) => void;
	description: string;
	setDescription: (val: string) => void;
	product: string;
	handleProductChange: (val: string) => void;
	products: string[];
	botId: string;
	setBotId: (val: string) => void;
	orgBots: { id: string; name: string; avatarUrl: string | null }[];
	activePreviewBot: { name: string; avatarUrl: string | null } | null | undefined;
	logBug: () => void;
	resolveModalOpen: boolean;
	setResolveModalOpen: (open: boolean) => void;
	resolvingIssue: any | null;
	selectedResolvedApp: string;
	handleSubdomainChange: (appId: string) => void;
	suiteApps: SuiteAppVersionInfo[];
	currentSelectedAppInfo: SuiteAppVersionInfo | undefined;
	selectedResolvedVersion: string;
	setSelectedResolvedVersion: (val: string) => void;
	confirmAppResolve: () => void;
}

export function IssueModals({
	modalOpen,
	setModalOpen,
	title,
	setTitle,
	description,
	setDescription,
	product,
	handleProductChange,
	products,
	botId,
	setBotId,
	orgBots,
	activePreviewBot,
	logBug,
	resolveModalOpen,
	setResolveModalOpen,
	resolvingIssue,
	selectedResolvedApp,
	handleSubdomainChange,
	suiteApps,
	currentSelectedAppInfo,
	selectedResolvedVersion,
	setSelectedResolvedVersion,
	confirmAppResolve,
}: IssueModalsProps) {
	const { t } = useDictionary();

	return (
		<>
			<Modal open={modalOpen} onOpenChange={setModalOpen} title={t('admin.dashboard.issues.modalTitle')}>
				<div className="flex flex-col gap-4 pt-4">
					<Input placeholder={t('admin.dashboard.issues.titlePlaceholder')} value={title} onChange={(e) => setTitle(e.target.value)} />
					<Input variant="textarea" rows={4} placeholder={t('admin.dashboard.issues.descPlaceholder')} value={description} onChange={(e) => setDescription(e.target.value)} />
					<Input placeholder={t('admin.dashboard.issues.productPlaceholder')} list="product-tags" value={product} onChange={(e) => handleProductChange(e.target.value)} />
					<datalist id="product-tags">
						{products.map((p) => (
							<option key={p} value={p} />
						))}
					</datalist>

					<div className="flex flex-col gap-2">
						<Input placeholder={t('admin.dashboard.roadmap.botIdPlaceholder')} list="issue-bot-id-tags" value={botId} onChange={(e) => setBotId(e.target.value)} />
						<datalist id="issue-bot-id-tags">
							{orgBots.map((b) => (
								<option key={b.id} value={b.id} label={b.name} />
							))}
						</datalist>
						{activePreviewBot && (
							<div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-(--foreground)/40 border border-(--border)/10 w-fit text-xs">
								{activePreviewBot.avatarUrl && <img src={activePreviewBot.avatarUrl} alt={activePreviewBot.name} className="w-5 h-5 rounded-full object-cover" />}
								<span className="font-semibold text-(--text)">{activePreviewBot.name}</span>
								<span className="text-(--text-muted) font-mono">({botId.trim()})</span>
							</div>
						)}
					</div>

					<div className="flex justify-end mt-4">
						<Button onClick={logBug}>{t('admin.dashboard.issues.save')}</Button>
					</div>
				</div>
			</Modal>

			<Modal open={resolveModalOpen} onOpenChange={setResolveModalOpen} title={t('admin.dashboard.issues.resolveModalTitle')}>
				<div className="flex flex-col gap-4 pt-2">
					<p className="text-sm text-(--text-muted)">{t('admin.dashboard.issues.resolveModalDesc')}</p>
					{resolvingIssue && (
						<div className="p-3 rounded-lg bg-(--foreground)/40 border border-(--border)/10 text-sm">
							<div className="font-bold text-(--text)">{resolvingIssue.title}</div>
							<div className="text-xs text-(--text-muted) mt-0.5 line-clamp-2">{resolvingIssue.description}</div>
						</div>
					)}

					<Selector
						value={selectedResolvedApp}
						onChange={handleSubdomainChange}
						placeholder={t('admin.dashboard.issues.selectSubdomain')}
						options={suiteApps.map((app) => ({
							value: app.id,
							label: `${app.name} (${app.domain})`,
						}))}
					/>

					{currentSelectedAppInfo && (
						<div className="flex flex-wrap items-center gap-2 text-xs">
							{currentSelectedAppInfo.prodVersion && (
								<span className="px-2.5 py-1 rounded-md bg-green-500/10 text-green-400 border border-green-500/20 font-mono">
									{t('admin.dashboard.issues.liveProd', { version: currentSelectedAppInfo.prodVersion })}
								</span>
							)}
							{currentSelectedAppInfo.canaryVersion && (
								<span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
									{t('admin.dashboard.issues.liveCanary', { version: currentSelectedAppInfo.canaryVersion })}
								</span>
							)}
						</div>
					)}

					<Selector
						value={selectedResolvedVersion}
						onChange={setSelectedResolvedVersion}
						placeholder={t('admin.dashboard.issues.selectVersion')}
						options={(currentSelectedAppInfo?.versions || []).map((ver, idx) => ({
							value: ver,
							label: idx === 0 ? `v${ver} (Latest)` : `v${ver}`,
						}))}
					/>

					<Input placeholder={t('admin.dashboard.issues.customVersionPlaceholder')} value={selectedResolvedVersion} onChange={(e) => setSelectedResolvedVersion(e.target.value)} />

					<div className="flex justify-end gap-2 mt-2">
						<Button variant="secondary" onClick={() => setResolveModalOpen(false)}>
							{t('admin.dashboard.issues.cancel')}
						</Button>
						<Button onClick={confirmAppResolve}>{t('admin.dashboard.issues.confirmResolve')}</Button>
					</div>
				</div>
			</Modal>
		</>
	);
}
