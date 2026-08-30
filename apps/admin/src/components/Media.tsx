/** @format */
'use client';

import { useEnvironment, useToast, usePermissions } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Button, Modal, Input, Selector } from '@xernerx/ui';
import { useEffect, useState } from 'react';
import { Trash, Upload, ExternalLink, Settings, Plus, X, User as UserIcon, Users } from 'lucide-react';

export default function Media() {
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { hasPermission } = usePermissions();
	const canManage = hasPermission('manageMedia');
	const canUpload = hasPermission('uploadMedia');

	const [media, setMedia] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [editMedia, setEditMedia] = useState<any | null>(null);
	const [saving, setSaving] = useState(false);

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
				toast({ type: 'error', title: 'Discord User Not Found' });
			}
		} catch {
			toast({ type: 'error', title: 'Failed to fetch user' });
		} finally {
			setLoadingProfile(false);
		}
	};

	const removeSharedUser = (id: string) => {
		const newShared = (editMedia.shared || []).filter((s: string) => s !== id);
		setEditMedia({ ...editMedia, shared: newShared });
	};

	const fetchMedia = async () => {
		try {
			const url = canManage ? 'https://cdn.xernerx.com/media?admin=true' : 'https://cdn.xernerx.com/media';
			const res = await fetch(getEnvUrl(url), { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				setMedia(data.media || []);
			}
		} catch (err) {
			console.error(err);
			toast({ type: 'error', title: 'Error fetching media' });
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchMedia();
	}, []);

	const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files || e.target.files.length === 0) return;
		const file = e.target.files[0];

		setUploading(true);
		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('privacy', 'public');

			const res = await fetch(getEnvUrl('https://cdn.xernerx.com/upload'), {
				method: 'POST',
				body: formData,
				credentials: 'include',
			});

			if (res.ok) {
				toast({ type: 'success', title: 'Uploaded successfully!' });
				fetchMedia();
			} else {
				throw new Error('Upload failed');
			}
		} catch (err) {
			console.error(err);
			toast({ type: 'error', title: 'Failed to upload media' });
		} finally {
			setUploading(false);
			e.target.value = '';
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm('Are you sure you want to delete this media?')) return;

		try {
			const res = await fetch(getEnvUrl(`https://cdn.xernerx.com/media/${id}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (res.ok) {
				toast({ type: 'success', title: 'Deleted media' });
				setMedia(media.filter((m) => m._id !== id));
			} else {
				throw new Error('Delete failed');
			}
		} catch (err) {
			console.error(err);
			toast({ type: 'error', title: 'Failed to delete media' });
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
				toast({ type: 'success', title: 'Media updated!' });
				setMedia(media.map((m) => (m._id === editMedia._id ? data.media : m)));
				setEditMedia(null);
			} else {
				throw new Error('Failed to update media');
			}
		} catch (err) {
			console.error(err);
			toast({ type: 'error', title: 'Failed to update media metadata' });
		} finally {
			setSaving(false);
		}
	};

	if (loading) return <Loading />;

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Media Library</h1>
					<p className="text-(--text-muted) text-sm mt-1">Manage and view your uploaded media.</p>
				</div>
				<div className="flex items-center gap-3">
					{(canUpload || canManage) && (
						<div>
							<input type="file" id="media-upload" className="hidden" onChange={handleUpload} disabled={uploading} />
							<label htmlFor="media-upload">
								<Button variant="primary" loading={uploading} style={{ pointerEvents: 'none' }}>
									<Upload size={16} /> Upload Media
								</Button>
							</label>
						</div>
					)}
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{media.map((item) => (
					<div
						key={item._id}
						className="relative group bg-(--foreground) border border-(--border)/10 rounded-xl overflow-hidden shadow-sm hover:border-(--border)/30 transition-all flex flex-col"
					>
						<div className="aspect-square relative bg-(--background)/50 w-full overflow-hidden flex items-center justify-center">
							{item.mimeType?.startsWith('image/') ? (
								<img src={getEnvUrl(`https://cdn.xernerx.com/raw/${item._id}`)} alt={item.filename} className="object-cover w-full h-full" />
							) : (
								<div className="text-(--text-muted) font-mono text-xs">{item.mimeType}</div>
							)}

							<div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
								<a href={getEnvUrl(`https://cdn.xernerx.com/view/${item._id}`)} target="_blank" rel="noopener noreferrer">
									<Button variant="secondary" size="icon">
										<ExternalLink size={16} />
									</Button>
								</a>
								<Button variant="primary" size="icon" onClick={() => setEditMedia({ ...item, shared: Array.isArray(item.shared) ? item.shared : [] })}>
									<Settings size={16} />
								</Button>
								<Button variant="danger" size="icon" onClick={() => handleDelete(item._id)}>
									<Trash size={16} />
								</Button>
							</div>
						</div>
						<div className="p-3">
							<div className="font-medium text-sm truncate" title={item.filename}>
								{item.filename}
							</div>
							<div className="text-xs text-(--text-muted) mt-1 flex items-center justify-between">
								<span>{(item.size / 1024).toFixed(1)} KB</span>
								<div className="flex items-center gap-1.5">
									{item.shared?.length > 0 && (
										<span className="flex items-center gap-1 text-[9px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded border border-blue-500/20 font-bold uppercase tracking-wider">
											<Users size={10} /> Shared
										</span>
									)}
									<span className="uppercase">{item.privacy}</span>
								</div>
							</div>
						</div>
					</div>
				))}
				{media.length === 0 && <div className="col-span-full py-12 text-center text-(--text-muted)">No media found.</div>}
			</div>

			{editMedia && (
				<Modal
					open={!!editMedia}
					onOpenChange={(open) => {
						if (!open) setEditMedia(null);
					}}
					title="Edit Media Metadata"
					description={`Editing metadata for ${editMedia.filename}`}
				>
					<div className="space-y-4">
						<Selector
							label="Privacy Level"
							value={editMedia.privacy}
							onChange={(v: string) => setEditMedia({ ...editMedia, privacy: v })}
							options={[
								{ label: 'Public', value: 'public' },
								{ label: 'Limited', value: 'limited' },
								{ label: 'Private', value: 'private' },
							]}
						/>

						{editMedia.privacy === 'private' && (
							<div className="flex flex-col gap-3 border border-(--border)/10 rounded-2xl p-4 bg-(--foreground)/30">
								<div>
									<h4 className="text-sm font-semibold text-(--text)">Shared Users</h4>
									<p className="text-xs text-(--text-muted) mt-1">Add Discord User IDs who can view this private file.</p>
								</div>
								<div className="flex gap-2 items-center">
									<Input
										placeholder="e.g. 123456789012345678"
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
										<Plus size={16} /> Add
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
															<img src={profile.avatarUrl} alt="" className="w-8 h-8 rounded-full bg-(--border)/10" />
														) : (
															<div className="w-8 h-8 rounded-full bg-(--border)/10 flex items-center justify-center">
																<UserIcon size={14} className="text-(--text-muted)" />
															</div>
														)}
														<div className="flex flex-col overflow-hidden">
															<span className="text-sm font-medium text-(--text) truncate">{profile?.global_name || profile?.username || 'Unknown User'}</span>
															<span className="text-[10px] font-mono text-(--text-muted) truncate">{id}</span>
														</div>
													</div>
													<button
														type="button"
														onClick={() => removeSharedUser(id)}
														className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-500/10 text-(--text-muted) hover:text-red-500 transition-colors"
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
								Cancel
							</Button>
							<Button variant="primary" onClick={handleSaveEdit} loading={saving}>
								Save Changes
							</Button>
						</div>
					</div>
				</Modal>
			)}
		</div>
	);
}
