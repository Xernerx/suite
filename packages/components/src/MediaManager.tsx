/** @format */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useDictionary, useEnvironment, usePermissions, useToast, useUser } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Badge, Button, EmptyState, Input, Tabs } from '@xernerx/ui';
import { Check, Copy, ExternalLink, Eye, FileText, Film, Image as ImageIcon, Settings, ShieldAlert, Trash, Upload, Users } from 'lucide-react';
import { MediaModals } from './media/MediaModals';

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
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [editMedia, setEditMedia] = useState<any | null>(null);
	const [previewMedia, setPreviewMedia] = useState<any | null>(null);
	const [saving, setSaving] = useState(false);
	const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

	const [searchQuery, setSearchQuery] = useState('');
	const [privacyFilter, setPrivacyFilter] = useState<'all' | 'public' | 'limited' | 'private' | 'shared'>('all');
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
				const newShared = [...(editMedia.shared || []), id];
				setEditMedia({ ...editMedia, shared: newShared });
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
		const newShared = (editMedia.shared || []).filter((s: string) => s !== id);
		setEditMedia({ ...editMedia, shared: newShared });
	};

	const fetchMedia = useCallback(async () => {
		try {
			const endpoint = scope === 'admin' && canManage ? 'https://cdn.xernerx.com/media?admin=true' : 'https://cdn.xernerx.com/media';
			const res = await fetch(getEnvUrl(endpoint), { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				setMedia(data.media || []);
			}
		} catch (err) {
			console.error(err);
			toast({ type: 'error', title: t('admin.dashboard.media.toasts.fetchMediaFailed') });
		} finally {
			setLoading(false);
		}
	}, [scope, canManage, getEnvUrl, toast, t]);

	useEffect(() => {
		fetchMedia();
	}, [fetchMedia]);

	const uploadFile = useCallback(
		async (file: File) => {
			if (!user?.id || (!canUpload && !canManage)) return;
			setUploading(true);
			try {
				const formData = new FormData();
				formData.append('file', file);
				formData.append('privacy', 'public');

				const res = await fetch(getEnvUrl(`https://cdn.xernerx.com/upload/${user.id}`), {
					method: 'POST',
					body: formData,
					credentials: 'include',
				});

				if (res.ok) {
					toast({ type: 'success', title: t('admin.dashboard.media.toasts.uploadSuccess') });
					fetchMedia();
				} else {
					throw new Error(t('admin.dashboard.media.toasts.uploadFailed'));
				}
			} catch (err) {
				console.error(err);
				toast({ type: 'error', title: t('admin.dashboard.media.toasts.uploadFailed') });
			} finally {
				setUploading(false);
			}
		},
		[user?.id, canUpload, canManage, getEnvUrl, toast, t, fetchMedia]
	);

	const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files || e.target.files.length === 0) return;
		const file = e.target.files[0];
		await uploadFile(file);
		e.target.value = '';
	};

	useEffect(() => {
		if (!canUpload && !canManage) return;
		const handlePaste = (e: ClipboardEvent) => {
			if (uploading || editMedia || previewMedia) return;
			const target = e.target as HTMLElement;
			if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;
			const items = e.clipboardData?.items;
			if (!items) return;
			for (let i = 0; i < items.length; i++) {
				if (items[i].kind === 'file') {
					const file = items[i].getAsFile();
					if (file) {
						e.preventDefault();
						uploadFile(file);
						break;
					}
				}
			}
		};
		window.addEventListener('paste', handlePaste);
		return () => window.removeEventListener('paste', handlePaste);
	}, [canUpload, canManage, uploading, editMedia, previewMedia, uploadFile]);

	const handleCopyRawUrl = (id: string) => {
		const rawUrl = getEnvUrl(`https://cdn.xernerx.com/raw/${id}`);
		navigator.clipboard.writeText(rawUrl).then(() => {
			setCopiedId(id);
			toast({ type: 'success', title: t('account.media.urlCopied'), description: rawUrl });
			setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
		});
	};

	const filteredMedia = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		return media.filter((item) => {
			if (privacyFilter === 'shared') {
				if (!Array.isArray(item.shared) || item.shared.length === 0) return false;
			} else if (privacyFilter !== 'all' && item.privacy !== privacyFilter) {
				return false;
			}
			if (!q) return true;
			return item.filename?.toLowerCase().includes(q) || item.mimeType?.toLowerCase().includes(q) || item._id?.toLowerCase().includes(q);
		});
	}, [media, searchQuery, privacyFilter]);

	const confirmDelete = async () => {
		if (!deleteConfirmId) return;
		const id = deleteConfirmId;
		setDeleteConfirmId(null);

		try {
			const res = await fetch(getEnvUrl(`https://cdn.xernerx.com/media/${id}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (res.ok) {
				toast({ type: 'success', title: t('admin.dashboard.media.toasts.deleteSuccess') });
				setMedia((prev) => prev.filter((m) => m._id !== id));
				if (previewMedia?._id === id) setPreviewMedia(null);
			} else {
				throw new Error(t('admin.dashboard.media.toasts.deleteFailed'));
			}
		} catch (err) {
			console.error(err);
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
				}),
				credentials: 'include',
			});

			if (res.ok) {
				const data = await res.json();
				toast({ type: 'success', title: t('admin.dashboard.media.toasts.updateSuccess') });
				setMedia((prev) => prev.map((m) => (m._id === editMedia._id ? data.media : m)));
				setEditMedia(null);
			} else {
				throw new Error(t('admin.dashboard.media.toasts.updateFailed'));
			}
		} catch (err) {
			console.error(err);
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

	return (
		<div
			className={`flex flex-col rounded-3xl transition-all ${isDragging ? 'ring-2 ring-(--accent) bg-(--accent)/5 p-4' : ''}`}
			style={{ gap: 'var(--ui-gap)' }}
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
				if (file) uploadFile(file);
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
				<div className="flex items-center gap-3">
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

			{/* Interactive Glassmorphic Dropzone Banner */}
			{(canUpload || canManage) && (
				<button
					type="button"
					onClick={() => fileInputRef.current?.click()}
					disabled={uploading}
					className={`flex items-center justify-between w-full rounded-3xl border border-dashed transition-all cursor-pointer text-left ${
						isDragging
							? 'border-(--accent) bg-(--accent)/15 shadow-[0_0_25px_color-mix(in_srgb,var(--accent)_25%,transparent)]'
							: 'border-(--border)/20 bg-(--foreground)/25 hover:border-(--accent)/40 hover:bg-(--accent)/5'
					}`}
					style={{ padding: 'calc(var(--ui-gap) * 0.75) var(--ui-gap)', gap: 'var(--ui-gap)' }}
				>
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-2xl bg-(--accent)/10 border border-(--accent)/20 flex items-center justify-center text-(--accent) shrink-0">
							<Upload size={18} />
						</div>
						<div className="flex flex-col">
							<span className="text-xs font-bold text-(--text)">{t('admin.dashboard.media.uploadButton')}</span>
							<span className="text-xs text-(--text-muted)">{t('account.media.dropzoneHint')}</span>
						</div>
					</div>
					<Badge variant="accent" size="sm">
						CDN
					</Badge>
				</button>
			)}

			{/* Search & Filter Bar */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 p-4 rounded-3xl">
				<div className="flex-1 max-w-md">
					<Input
						variant="search"
						shortcut={true}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder={t('account.media.searchPlaceholder')}
						className="w-full"
					/>
				</div>
				<Tabs size="sm" fullWidth={false} tabs={filterTabs} activeTab={privacyFilter} onChange={(id) => setPrivacyFilter(id as typeof privacyFilter)} />
			</div>

			{/* Media Grid */}
			{filteredMedia.length > 0 ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{filteredMedia.map((item) => {
						const rawUrl = getEnvUrl(`https://cdn.xernerx.com/raw/${item._id}`);
						const isImage = item.mimeType?.startsWith('image/');
						const isVideo = item.mimeType?.startsWith('video/');

						return (
							<div
								key={item._id}
								className="relative group bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl overflow-hidden shadow-sm hover:border-(--accent)/30 transition-all flex flex-col"
							>
								<div
									onClick={() => setPreviewMedia(item)}
									className="aspect-square relative bg-(--background)/50 w-full overflow-hidden flex items-center justify-center cursor-pointer"
								>
									{isImage ? (
										<Image
											src={rawUrl}
											alt={item.filename}
											width={300}
											height={300}
											unoptimized
											className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
										/>
									) : isVideo ? (
										<div className="flex flex-col items-center gap-2 text-(--accent)">
											<Film size={32} />
											<span className="text-[11px] font-mono text-(--text-muted)">{item.mimeType}</span>
										</div>
									) : (
										<div className="flex flex-col items-center gap-2 text-(--accent)">
											<FileText size={32} />
											<span className="text-[11px] font-mono text-(--text-muted)">{item.mimeType}</span>
										</div>
									)}

									<div
										onClick={(e) => e.stopPropagation()}
										className="absolute inset-0 bg-(--background)/80 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
									>
										<Button variant="secondary" size="icon" title={t('app.widgets.previewTitle')} onClick={() => setPreviewMedia(item)}>
											<Eye size={16} />
										</Button>
										<Button variant="secondary" size="icon" title={t('account.media.copyUrl')} onClick={() => handleCopyRawUrl(item._id)}>
											{copiedId === item._id ? <Check size={16} className="text-(--accent-green)" /> : <Copy size={16} />}
										</Button>
										<a href={getEnvUrl(`https://cdn.xernerx.com/view/${item._id}`)} target="_blank" rel="noopener noreferrer">
											<Button variant="secondary" size="icon">
												<ExternalLink size={16} />
											</Button>
										</a>
										<Button variant="primary" size="icon" onClick={() => setEditMedia({ ...item, shared: Array.isArray(item.shared) ? item.shared : [] })}>
											<Settings size={16} />
										</Button>
										<Button variant="danger" size="icon" onClick={() => setDeleteConfirmId(item._id)}>
											<Trash size={16} />
										</Button>
									</div>
								</div>
								<div className="p-3.5 flex flex-col gap-1.5">
									<div className="font-semibold text-sm text-(--text) truncate" title={item.filename}>
										{item.filename}
									</div>
									<div className="text-xs text-(--text-muted) flex items-center justify-between">
										<span>{(item.size / 1024).toFixed(1)} KB</span>
										<div className="flex items-center gap-1.5">
											{item.shared?.length > 0 && (
												<Badge variant="accent" size="sm" icon={<Users size={10} />}>
													{t('account.media.shared')}
												</Badge>
											)}
											<Badge variant={item.privacy === 'public' ? 'success' : item.privacy === 'limited' ? 'warning' : 'muted'} size="sm">
												{item.privacy}
											</Badge>
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			) : (
				<EmptyState icon={<ImageIcon size={24} />} title={t('account.media.noMedia')} description={t('account.media.dropzoneHint')} />
			)}

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
