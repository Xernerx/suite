/** @format */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDictionary, useEnvironment, usePermissions, useToast, useUser } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Button, EmptyState, Input, Selector, Tabs } from '@xernerx/ui';
import { Image as ImageIcon, ShieldAlert, Tag, Trash, Upload, X } from 'lucide-react';
import { MediaModals } from './media/MediaModals';
import { MediaGridCard } from './media/MediaGridCard';
import { MediaCropModal, type MediaUploadMeta } from './MediaCropModal';

export interface MediaManagerProps {
	scope?: 'self' | 'admin';
}

export function MediaManager({ scope = 'self' }: MediaManagerProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { user } = useUser();
	const { toast } = useToast();
	const { hasPermission } = usePermissions();
	const canManage = hasPermission('manageMedia');
	const canUpload = hasPermission('uploadMedia');
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [media, setMedia] = useState<any[]>([]);
	const [quota, setQuota] = useState<{ used: number; max: number; extraSlots: number } | null>(null);
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [pendingCropFile, setPendingCropFile] = useState<File | null>(null);
	const [editMedia, setEditMedia] = useState<any | null>(null);
	const [previewMedia, setPreviewMedia] = useState<any | null>(null);
	const [saving, setSaving] = useState(false);
	const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

	const [searchQuery, setSearchQuery] = useState('');
	const [privacyFilter, setPrivacyFilter] = useState<'all' | 'public' | 'limited' | 'private' | 'shared'>('all');
	const [folderFilter, setFolderFilter] = useState<string>('all');
	const [tagFilter, setTagFilter] = useState<string | null>(null);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [bulkBusy, setBulkBusy] = useState(false);

	const [copiedId, setCopiedId] = useState<string | null>(null);
	const [isDragging, setIsDragging] = useState(false);

	const [sharedInput, setSharedInput] = useState('');
	const [sharedProfiles, setSharedProfiles] = useState<Record<string, any>>({});
	const [loadingProfile, setLoadingProfile] = useState(false);

	useEffect(() => {
		if (editMedia?.privacy === 'private' && Array.isArray(editMedia.shared)) {
			editMedia.shared.forEach((id: string) => {
				setSharedProfiles((prev) => {
					if (prev[id]) return prev;
					fetch(getEnvUrl(`https://api.xernerx.com/core/users/${id}/discord`))
						.then((res) => (res.ok ? res.json() : null))
						.then((profile) => {
							if (profile) setSharedProfiles((curr) => ({ ...curr, [id]: profile }));
						})
						.catch(() => {});
					return { ...prev, [id]: { loading: true } };
				});
			});
		}
	}, [editMedia?.privacy, editMedia?.shared, getEnvUrl]);

	const addSharedUser = async () => {
		const id = sharedInput.trim();
		if (!id || editMedia.shared?.includes(id)) return;
		setLoadingProfile(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/core/users/${id}/discord`));
			if (res.ok) {
				const profile = await res.json();
				setSharedProfiles((prev) => ({ ...prev, [id]: profile }));
				setEditMedia({ ...editMedia, shared: [...(editMedia.shared || []), id] });
				setSharedInput('');
			} else {
				toast({ type: 'error', title: t('admin.dashboard.media.toasts.userNotFound') });
			}
		} catch {
			toast({ type: 'error', title: t('admin.dashboard.media.toasts.fetchUserFailed') });
		} finally {
			setLoadingProfile(false);
		}
	};

	const removeSharedUser = (id: string) => {
		setEditMedia({ ...editMedia, shared: (editMedia.shared || []).filter((s: string) => s !== id) });
	};

	const fetchMedia = useCallback(async () => {
		try {
			const endpoint = scope === 'admin' && canManage ? 'https://cdn.xernerx.com/media?admin=true' : 'https://cdn.xernerx.com/media';
			const res = await fetch(getEnvUrl(endpoint), { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				setMedia(data.media || []);
				if (data.quota) setQuota(data.quota);
			}
		} catch {
			toast({ type: 'error', title: t('admin.dashboard.media.toasts.fetchMediaFailed') });
		} finally {
			setLoading(false);
		}
	}, [scope, canManage, getEnvUrl, toast, t]);

	useEffect(() => {
		fetchMedia();
	}, [fetchMedia]);

	const uploadFile = useCallback(
		async (file: File, meta?: MediaUploadMeta) => {
			if (!user?.id || (!canUpload && !canManage)) return;
			const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
			setUploading(true);
			bridge?.setProgressBar?.(0.35, 'normal');
			try {
				const formData = new FormData();
				formData.append('file', file);
				formData.append('privacy', 'public');
				if (meta?.folder) formData.append('folder', meta.folder);
				if (meta?.tags && meta.tags.length > 0) formData.append('tags', JSON.stringify(meta.tags));

				const res = await fetch(getEnvUrl(`https://cdn.xernerx.com/upload/${user.id}`), {
					method: 'POST',
					body: formData,
					credentials: 'include',
				});

				if (res.ok) {
					bridge?.setProgressBar?.(1, 'normal');
					setTimeout(() => bridge?.setProgressBar?.(-1, 'none'), 650);
					toast({ type: 'success', title: t('admin.dashboard.media.toasts.uploadSuccess') });
					setPendingCropFile(null);
					fetchMedia();
				} else {
					bridge?.setProgressBar?.(-1, 'none');
					throw new Error(t('admin.dashboard.media.toasts.uploadFailed'));
				}
			} catch {
				bridge?.setProgressBar?.(-1, 'none');
				toast({ type: 'error', title: t('admin.dashboard.media.toasts.uploadFailed') });
			} finally {
				setUploading(false);
			}
		},
		[user?.id, canUpload, canManage, getEnvUrl, toast, t, fetchMedia]
	);

	const stageFileForUpload = useCallback(
		(file: File) => {
			if (file.type.startsWith('image/') && !file.type.includes('gif')) {
				setPendingCropFile(file);
			} else {
				uploadFile(file);
			}
		},
		[uploadFile]
	);

	const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files || e.target.files.length === 0) return;
		stageFileForUpload(e.target.files[0]);
		e.target.value = '';
	};

	useEffect(() => {
		if (!canUpload && !canManage) return;
		const handlePaste = (e: ClipboardEvent) => {
			if (uploading || editMedia || previewMedia || pendingCropFile) return;
			const target = e.target as HTMLElement;
			if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;
			const items = e.clipboardData?.items;
			if (!items) return;
			for (let i = 0; i < items.length; i++) {
				if (items[i].kind === 'file') {
					const file = items[i].getAsFile();
					if (file) {
						e.preventDefault();
						stageFileForUpload(file);
						break;
					}
				}
			}
		};
		window.addEventListener('paste', handlePaste);
		return () => window.removeEventListener('paste', handlePaste);
	}, [canUpload, canManage, uploading, editMedia, previewMedia, pendingCropFile, stageFileForUpload]);

	const handleCopyRawUrl = (id: string) => {
		const rawUrl = getEnvUrl(`https://cdn.xernerx.com/raw/${id}`);
		navigator.clipboard.writeText(rawUrl).then(() => {
			setCopiedId(id);
			toast({ type: 'success', title: t('account.media.urlCopied'), description: rawUrl });
			setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
		});
	};

	const availableFolders = useMemo(() => {
		const set = new Set<string>(['Uncategorized', 'Avatars', 'Banners', 'Showcases']);
		media.forEach((m) => {
			if (m.folder) set.add(m.folder);
		});
		return Array.from(set);
	}, [media]);

	const filteredMedia = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		return media.filter((item) => {
			if (privacyFilter === 'shared') {
				if (!Array.isArray(item.shared) || item.shared.length === 0) return false;
			} else if (privacyFilter !== 'all' && item.privacy !== privacyFilter) {
				return false;
			}
			if (folderFilter !== 'all' && (item.folder || 'Uncategorized') !== folderFilter) {
				return false;
			}
			if (tagFilter && (!Array.isArray(item.tags) || !item.tags.includes(tagFilter))) {
				return false;
			}
			if (!q) return true;
			const tagMatch = Array.isArray(item.tags) && item.tags.some((tg: string) => tg.toLowerCase().includes(q));
			return item.filename?.toLowerCase().includes(q) || item.mimeType?.toLowerCase().includes(q) || item._id?.toLowerCase().includes(q) || tagMatch;
		});
	}, [media, searchQuery, privacyFilter, folderFilter, tagFilter]);

	const toggleSelect = (id: string) => {
		setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
	};

	const handleBulkPrivacy = async (privacy: 'public' | 'limited' | 'private') => {
		if (selectedIds.length === 0 || bulkBusy) return;
		setBulkBusy(true);
		try {
			const res = await fetch(getEnvUrl('https://cdn.xernerx.com/media'), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ ids: selectedIds, privacy }),
			});
			if (!res.ok) throw new Error('Bulk update failed');
			setMedia((prev) => prev.map((m) => (selectedIds.includes(m._id) ? { ...m, privacy } : m)));
			setSelectedIds([]);
			toast({ type: 'success', title: t('admin.dashboard.media.toasts.updateSuccess') });
		} catch {
			toast({ type: 'error', title: t('admin.dashboard.media.toasts.updateFailed') });
		} finally {
			setBulkBusy(false);
		}
	};

	const handleBulkDelete = async () => {
		if (selectedIds.length === 0 || bulkBusy) return;
		setBulkBusy(true);
		try {
			await Promise.all(
				selectedIds.map((id) =>
					fetch(getEnvUrl(`https://cdn.xernerx.com/media/${id}`), {
						method: 'DELETE',
						credentials: 'include',
					})
				)
			);
			setMedia((prev) => prev.filter((m) => !selectedIds.includes(m._id)));
			setSelectedIds([]);
			toast({ type: 'success', title: t('admin.dashboard.media.toasts.deleteSuccess') });
		} catch {
			toast({ type: 'error', title: t('admin.dashboard.media.toasts.deleteFailed') });
		} finally {
			setBulkBusy(false);
		}
	};

	const confirmDelete = async () => {
		if (!deleteConfirmId) return;
		const id = deleteConfirmId;
		setDeleteConfirmId(null);
		try {
			const res = await fetch(getEnvUrl(`https://cdn.xernerx.com/media/${id}`), { method: 'DELETE', credentials: 'include' });
			if (res.ok) {
				toast({ type: 'success', title: t('admin.dashboard.media.toasts.deleteSuccess') });
				setMedia((prev) => prev.filter((m) => m._id !== id));
				if (previewMedia?._id === id) setPreviewMedia(null);
			} else {
				throw new Error();
			}
		} catch {
			toast({ type: 'error', title: t('admin.dashboard.media.toasts.deleteFailed') });
		}
	};

	const handleSaveEdit = async () => {
		if (!editMedia) return;
		setSaving(true);
		try {
			const res = await fetch(getEnvUrl(`https://cdn.xernerx.com/media/${editMedia._id}`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					privacy: editMedia.privacy,
					shared: editMedia.shared || [],
					folder: editMedia.folder || 'Uncategorized',
					tags: Array.isArray(editMedia.tags) ? editMedia.tags : [],
				}),
				credentials: 'include',
			});

			if (res.ok) {
				const data = await res.json();
				toast({ type: 'success', title: t('admin.dashboard.media.toasts.updateSuccess') });
				setMedia((prev) => prev.map((m) => (m._id === editMedia._id ? { ...m, ...data.media } : m)));
				setEditMedia(null);
			} else {
				throw new Error();
			}
		} catch {
			toast({ type: 'error', title: t('admin.dashboard.media.toasts.updateFailed') });
		} finally {
			setSaving(false);
		}
	};

	if (loading) return <Loading />;

	const filterTabs = [
		{ id: 'all', label: t('account.media.filterAll'), count: media.length },
		{ id: 'public', label: t('account.media.privacy.public') },
		{ id: 'limited', label: t('account.media.privacy.limited') },
		{ id: 'private', label: t('account.media.privacy.private') },
		{ id: 'shared', label: t('account.media.shared') },
	];

	const folderOptions = [{ value: 'all', label: t('account.media.allFolders') }, ...availableFolders.map((f) => ({ value: f, label: f }))];

	return (
		<div
			className={`flex flex-col max-w-(--page-width) mx-auto w-full rounded-3xl transition-all ${isDragging ? 'ring-2 ring-(--accent) bg-(--accent)/5 p-4' : ''}`}
			style={{ gap: 'var(--ui-gap)', ...(scope === 'self' ? { padding: 'var(--ui-gap)' } : {}) }}
			onDragOver={(e) => {
				if (!canUpload && !canManage) return;
				e.preventDefault();
				setIsDragging(true);
			}}
			onDragLeave={() => setIsDragging(false)}
			onDrop={(e) => {
				if (!canUpload && !canManage) return;
				e.preventDefault();
				setIsDragging(false);
				const file = e.dataTransfer?.files?.[0];
				if (file) stageFileForUpload(file);
			}}
		>
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-3xl font-extrabold tracking-tight text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{scope === 'admin' ? t('admin.dashboard.media.title') : t('account.media.title')}
					</h1>
					<p className="text-(--text-muted) text-sm mt-1">{scope === 'admin' ? t('admin.dashboard.media.subtitle') : t('account.media.description')}</p>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					{scope === 'self' && quota && (
						<a
							href={getEnvUrl('https://store.xernerx.com/?category=credits')}
							className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-(--foreground)/35 hover:bg-(--accent)/15 border border-(--border)/15 hover:border-(--accent)/35 text-xs font-bold text-(--text) transition-all"
						>
							<span className="font-mono text-(--accent)">
								{quota.used} / {quota.max}
							</span>
							<span className="text-(--text-muted)">{t('account.media.slotsUsed')}</span>
						</a>
					)}
					{scope === 'self' && canManage && (
						<a href={getEnvUrl('https://admin.xernerx.com/?view=media')}>
							<Button variant="secondary">
								<ShieldAlert size={16} className="text-(--accent-orange)" /> {t('account.media.switchToAdmin')}
							</Button>
						</a>
					)}
					{(canUpload || canManage) && (
						<div>
							<input ref={fileInputRef} type="file" id="media-upload" className="hidden" onChange={handleUpload} disabled={uploading} />
							<Button variant="primary" loading={uploading} onClick={() => fileInputRef.current?.click()}>
								<Upload size={16} /> {t('admin.dashboard.media.uploadButton')}
							</Button>
						</div>
					)}
				</div>
			</div>

			{/* Search, Folder & Privacy Filter Bar */}
			<div className="relative z-30 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 p-4 rounded-3xl">
				<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
					<div className="flex-1 max-w-md">
						<Input variant="search" shortcut={true} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('account.media.searchPlaceholder')} />
					</div>
					<div className="w-full sm:w-48">
						<Selector value={folderFilter} options={folderOptions} onChange={setFolderFilter} />
					</div>
					{tagFilter && (
						<button
							type="button"
							onClick={() => setTagFilter(null)}
							className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-(--accent)/15 text-(--accent) border border-(--accent)/30 cursor-pointer shrink-0"
						>
							<Tag size={12} /> #{tagFilter} <X size={12} />
						</button>
					)}
				</div>
				<Tabs size="sm" fullWidth={false} tabs={filterTabs} activeTab={privacyFilter} onChange={(id) => setPrivacyFilter(id as typeof privacyFilter)} />
			</div>

			{/* Bulk Action Bar */}
			{selectedIds.length > 0 && (
				<div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-(--accent)/10 border border-(--accent)/30">
					<span className="text-xs font-bold text-(--text)">{t('account.media.bulk.selectedCount', { count: selectedIds.length })}</span>
					<div className="flex flex-wrap items-center gap-2">
						<Button size="sm" variant="secondary" onClick={() => setSelectedIds(filteredMedia.map((m) => m._id))}>
							{t('account.media.bulk.selectAll')}
						</Button>
						<Button size="sm" variant="secondary" onClick={() => handleBulkPrivacy('public')} disabled={bulkBusy}>
							{t('account.media.privacy.public')}
						</Button>
						<Button size="sm" variant="secondary" onClick={() => handleBulkPrivacy('limited')} disabled={bulkBusy}>
							{t('account.media.privacy.limited')}
						</Button>
						<Button size="sm" variant="secondary" onClick={() => handleBulkPrivacy('private')} disabled={bulkBusy}>
							{t('account.media.privacy.private')}
						</Button>
						<Button size="sm" variant="danger" onClick={handleBulkDelete} loading={bulkBusy}>
							<Trash size={13} /> {t('common.buttons.delete')}
						</Button>
						<Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
							{t('account.media.bulk.clear')}
						</Button>
					</div>
				</div>
			)}

			{/* Media Grid */}
			{filteredMedia.length > 0 ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{filteredMedia.map((item) => (
						<MediaGridCard
							key={item._id}
							item={item}
							rawUrl={getEnvUrl(`https://cdn.xernerx.com/raw/${item._id}`)}
							viewUrl={getEnvUrl(`https://cdn.xernerx.com/view/${item._id}`)}
							isSelected={selectedIds.includes(item._id)}
							copiedId={copiedId}
							onToggleSelect={toggleSelect}
							onPreview={setPreviewMedia}
							onCopyUrl={handleCopyRawUrl}
							onEdit={setEditMedia}
							onDelete={setDeleteConfirmId}
							onSelectTag={setTagFilter}
						/>
					))}
				</div>
			) : (
				<EmptyState icon={<ImageIcon size={24} />} title={t('account.media.noMedia')} description={t('account.media.dropzoneHint')} />
			)}

			<MediaCropModal
				file={pendingCropFile}
				open={Boolean(pendingCropFile)}
				onClose={() => setPendingCropFile(null)}
				onConfirm={(croppedFile, meta) => uploadFile(croppedFile, meta)}
				uploading={uploading}
				availableFolders={availableFolders}
			/>

			<MediaModals
				previewMedia={previewMedia}
				setPreviewMedia={setPreviewMedia}
				editMedia={editMedia}
				setEditMedia={setEditMedia}
				saving={saving}
				handleSaveEdit={handleSaveEdit}
				sharedInput={sharedInput}
				setSharedInput={setSharedInput}
				sharedProfiles={sharedProfiles}
				loadingProfile={loadingProfile}
				addSharedUser={addSharedUser}
				removeSharedUser={removeSharedUser}
				deleteConfirmId={deleteConfirmId}
				setDeleteConfirmId={setDeleteConfirmId}
				deleteConfirmKeyword={media.find((m) => m._id === deleteConfirmId)?.filename || deleteConfirmId || 'DELETE'}
				confirmDelete={confirmDelete}
			/>
		</div>
	);
}
