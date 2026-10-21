/** @format */
'use client';

import { Plus, User as UserIcon, X } from 'lucide-react';
import Image from 'next/image';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { Button, CodeBlock, Confirm, Input, Modal, Selector } from '@xernerx/ui';

export interface MediaModalsProps {
	previewMedia: any | null;
	setPreviewMedia: (media: any | null) => void;
	editMedia: any | null;
	setEditMedia: (media: any | null) => void;
	saving: boolean;
	handleSaveEdit: () => void;
	sharedInput: string;
	setSharedInput: (val: string) => void;
	sharedProfiles: Record<string, any>;
	loadingProfile: boolean;
	addSharedUser: () => void;
	removeSharedUser: (id: string) => void;
	deleteConfirmId: string | null;
	setDeleteConfirmId: (id: string | null) => void;
	deleteConfirmKeyword: string;
	confirmDelete: () => void;
}

export function MediaModals({
	previewMedia,
	setPreviewMedia,
	editMedia,
	setEditMedia,
	saving,
	handleSaveEdit,
	sharedInput,
	setSharedInput,
	sharedProfiles,
	loadingProfile,
	addSharedUser,
	removeSharedUser,
	deleteConfirmId,
	setDeleteConfirmId,
	deleteConfirmKeyword,
	confirmDelete,
}: MediaModalsProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();

	return (
		<>
			{/* Lightbox Preview & Embed Snippets Modal */}
			{previewMedia && (
				<Modal
					open={Boolean(previewMedia)}
					onOpenChange={(open) => !open && setPreviewMedia(null)}
					title={previewMedia.filename}
					description={`${previewMedia.mimeType} • ${(previewMedia.size / 1024).toFixed(1)} KB`}
					maxWidth="max-w-3xl"
				>
					<CodeBlock
						preview={
							previewMedia.mimeType?.startsWith('image/') ? (
								<Image
									src={getEnvUrl(`https://cdn.xernerx.com/raw/${previewMedia._id}`)}
									alt={previewMedia.filename}
									width={600}
									height={320}
									unoptimized
									className="max-h-80 w-auto rounded-2xl object-contain shadow-md"
								/>
							) : previewMedia.mimeType?.startsWith('video/') ? (
								<video src={getEnvUrl(`https://cdn.xernerx.com/raw/${previewMedia._id}`)} controls className="max-h-80 w-auto rounded-2xl shadow-md" />
							) : undefined
						}
						tabs={[
							{
								id: 'raw',
								label: 'CDN URL',
								language: 'url',
								code: getEnvUrl(`https://cdn.xernerx.com/raw/${previewMedia._id}`),
							},
							{
								id: 'view',
								label: 'View URL',
								language: 'url',
								code: getEnvUrl(`https://cdn.xernerx.com/view/${previewMedia._id}`),
							},
							{
								id: 'markdown',
								label: t('app.widgets.formatMarkdown'),
								language: 'markdown',
								code: `![${previewMedia.filename}](${getEnvUrl(`https://cdn.xernerx.com/raw/${previewMedia._id}`)})`,
							},
							{
								id: 'html',
								label: t('app.widgets.formatHtmlImg'),
								language: 'html',
								code: `<img src="${getEnvUrl(`https://cdn.xernerx.com/raw/${previewMedia._id}`)}" alt="${previewMedia.filename}" />`,
							},
						]}
					/>
				</Modal>
			)}

			{/* Edit Privacy / Shared Modal */}
			{editMedia && (
				<Modal
					open={Boolean(editMedia)}
					onOpenChange={(open) => !open && setEditMedia(null)}
					title={t('account.media.modal.title')}
					description={t('account.media.modal.description', { filename: editMedia.filename })}
				>
					<div className="space-y-4">
						<div className="flex flex-col gap-1.5">
							<label className="text-sm font-medium text-(--text)">{t('account.media.modal.privacyLevel')}</label>
							<Selector
								value={editMedia.privacy}
								onChange={(v: string) => setEditMedia({ ...editMedia, privacy: v })}
								options={[
									{ label: t('account.media.privacy.public'), value: 'public' },
									{ label: t('account.media.privacy.limited'), value: 'limited' },
									{ label: t('account.media.privacy.private'), value: 'private' },
								]}
							/>
						</div>

						{editMedia.privacy === 'private' && (
							<div className="flex flex-col gap-3 border border-(--border)/10 rounded-2xl p-4 bg-(--foreground)/30">
								<div>
									<h4 className="text-sm font-semibold text-(--text)">{t('account.media.modal.sharedUsers')}</h4>
									<p className="text-xs text-(--text-muted) mt-1">{t('account.media.modal.sharedUsersDesc')}</p>
								</div>
								<div className="flex gap-2 items-center">
									<Input
										placeholder={t('account.media.modal.sharedUsersPlaceholder')}
										value={sharedInput}
										onChange={(e) => setSharedInput(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault();
												addSharedUser();
											}
										}}
									/>
									<Button variant="secondary" onClick={addSharedUser} loading={loadingProfile} disabled={!sharedInput.trim()} className="shrink-0 h-10">
										<Plus size={16} /> {t('account.media.modal.add')}
									</Button>
								</div>

								{editMedia.shared?.length > 0 && (
									<div className="flex flex-col gap-2 mt-2">
										{editMedia.shared.map((id: string) => {
											const profile = sharedProfiles[id];
											return (
												<div key={id} className="flex items-center justify-between p-2 rounded-xl bg-(--background)/50 border border-(--border)/10">
													<div className="flex items-center gap-3 overflow-hidden">
														{profile?.avatarUrl ? (
															<Image src={profile.avatarUrl} alt="" width={32} height={32} unoptimized className="w-8 h-8 rounded-full bg-(--border)/10" />
														) : (
															<div className="w-8 h-8 rounded-full bg-(--border)/10 flex items-center justify-center">
																<UserIcon size={14} className="text-(--text-muted)" />
															</div>
														)}
														<div className="flex flex-col overflow-hidden">
															<span className="text-sm font-medium text-(--text) truncate">
																{profile?.global_name || profile?.username || t('account.media.modal.unknownUser')}
															</span>
															<span className="text-[10px] font-mono text-(--text-muted) truncate">{id}</span>
														</div>
													</div>
													<button
														type="button"
														onClick={() => removeSharedUser(id)}
														aria-label="Remove"
														className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-(--accent-red)/10 text-(--text-muted) hover:text-(--accent-red) transition-colors cursor-pointer"
													>
														<X size={14} />
													</button>
												</div>
											);
										})}
									</div>
								)}
							</div>
						)}

						<div className="flex justify-end gap-3 mt-6">
							<Button variant="secondary" onClick={() => setEditMedia(null)} disabled={saving}>
								{t('account.media.modal.cancel')}
							</Button>
							<Button variant="primary" onClick={handleSaveEdit} loading={saving}>
								{t('account.media.modal.saveChanges')}
							</Button>
						</div>
					</div>
				</Modal>
			)}

			<Confirm
				open={Boolean(deleteConfirmId)}
				onOpenChange={(open) => !open && setDeleteConfirmId(null)}
				title={t('common.buttons.delete')}
				description={t('account.media.deleteConfirm')}
				confirmKeyword={deleteConfirmKeyword}
				confirmText={t('common.buttons.delete')}
				cancelText={t('common.buttons.cancel')}
				onConfirm={confirmDelete}
				variant="danger"
			/>
		</>
	);
}
