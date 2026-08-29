// /** @format */
// 'use client';

// import { AnimatePresence, motion } from 'framer-motion';
// import { Bot, Globe, Loader2, Lock, Save, ShieldCheck, Trash2 } from 'lucide-react';
// import { useEffect, useMemo, useState } from 'react';

// import { useToast } from '@/providers/ToastProvider';

// type GuildProfile = {
// 	id: string;
// 	description?: string;
// 	info?: string;
// 	organization?: string;
// 	bot?: boolean;
// 	verified?: boolean;
// 	privacy?: 'public' | 'private' | 'limited';
// 	locale?: string;
// };

// type FormState = {
// 	description: string;
// 	info: string;
// 	organization: string;
// 	privacy: 'public' | 'private' | 'limited';
// };

// const EMPTY_FORM: FormState = {
// 	description: '',
// 	info: '',
// 	organization: 'personal',
// 	privacy: 'private',
// };

// function toFormState(data: GuildProfile): FormState {
// 	return {
// 		description: data.description ?? '',
// 		info: data.info ?? '',
// 		organization: data.organization ?? 'personal',
// 		privacy: data.privacy ?? 'private',
// 	};
// }

// export default function General({ id, name }: { id?: string; name?: string }) {
// 	const { toast } = useToast();

// 	const [profile, setProfile] = useState<GuildProfile | null>(null);
// 	const [baseline, setBaseline] = useState<FormState>(EMPTY_FORM);
// 	const [form, setForm] = useState<FormState>(EMPTY_FORM);
// 	const [orgs, setOrgs] = useState<any[]>([]);

// 	const [loading, setLoading] = useState(false);
// 	const [saving, setSaving] = useState(false);
// 	const [deleting, setDeleting] = useState(false);

// 	useEffect(() => {
// 		if (!id) {
// 			setProfile(null);
// 			setBaseline(EMPTY_FORM);
// 			setForm(EMPTY_FORM);
// 			setLoading(false);
// 			return;
// 		}

// 		let cancelled = false;

// 		(async () => {
// 			try {
// 				setLoading(true);

// 				const getResponse = await fetch(`/api/v1/guilds/${id}/profile`, {
// 					method: 'GET',
// 					cache: 'no-store',
// 				});

// 				let data: GuildProfile | { error?: string } = await getResponse.json();

// 				if (getResponse.status === 404) {
// 					const createResponse = await fetch(`/api/v1/guilds/${id}/profile`, {
// 						method: 'POST',
// 						headers: {
// 							'Content-Type': 'application/json',
// 						},
// 						body: JSON.stringify({ id, name }),
// 					});

// 					data = await createResponse.json();

// 					if (!createResponse.ok) {
// 						throw new Error((data as { error?: string })?.error ?? 'Failed to create guild profile');
// 					}
// 				} else if (!getResponse.ok) {
// 					throw new Error((data as { error?: string })?.error ?? 'Failed to fetch guild profile');
// 				}

// 				if (cancelled) return;

// 				const nextProfile = data as GuildProfile;
// 				const nextForm = toFormState(nextProfile);

// 				setProfile(nextProfile);
// 				setBaseline(nextForm);
// 				setForm(nextForm);
// 			} catch (error) {
// 				if (cancelled) return;

// 				toast(error instanceof Error ? error.message : 'Failed to load guild profile', 'error');
// 				setProfile(null);
// 				setBaseline(EMPTY_FORM);
// 				setForm(EMPTY_FORM);
// 			} finally {
// 				if (!cancelled) {
// 					setLoading(false);
// 					setSaving(false);
// 					setDeleting(false);
// 				}
// 			}
// 		})();

// 		return () => {
// 			cancelled = true;
// 		};
// 	}, [id, name]);

// 	useEffect(() => {
// 		(async () => {
// 			try {
// 				const data = await fetch('/api/v1/organizations').then((r) => r.json());
// 				setOrgs(data);
// 			} catch {
// 				setOrgs([]);
// 			}
// 		})();
// 	}, []);

// 	const hasChanges = useMemo(() => JSON.stringify(form) !== JSON.stringify(baseline), [form, baseline]);

// 	function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
// 		setForm((current) => ({
// 			...current,
// 			[key]: value,
// 		}));
// 	}

// 	function resetForm() {
// 		setForm(baseline);
// 	}

// 	async function handleSave() {
// 		if (!id || !hasChanges || saving || deleting) return;

// 		try {
// 			setSaving(true);

// 			const response = await fetch(`/api/v1/guilds/${id}/profile`, {
// 				method: 'PATCH',
// 				headers: {
// 					'Content-Type': 'application/json',
// 				},
// 				body: JSON.stringify(form),
// 			});

// 			const data = await response.json();

// 			if (!response.ok) {
// 				throw new Error(data?.error ?? 'Failed to save guild data');
// 			}

// 			const nextProfile = data as GuildProfile;
// 			const nextForm = toFormState(nextProfile);

// 			setProfile(nextProfile);
// 			setBaseline(nextForm);
// 			setForm(nextForm);

// 			toast('Guild settings saved.', 'success');
// 		} catch (error) {
// 			toast(error instanceof Error ? error.message : 'Failed to save guild data.', 'error');
// 		} finally {
// 			setSaving(false);
// 		}
// 	}

// 	async function handleDelete() {
// 		if (!id || saving || deleting) return;

// 		const confirmed = window.confirm('Delete this guild profile data? This cannot be undone.');

// 		if (!confirmed) return;

// 		try {
// 			setDeleting(true);

// 			const response = await fetch(`/api/v1/guilds/${id}/profile`, {
// 				method: 'DELETE',
// 			});

// 			const data = await response.json();

// 			if (!response.ok) {
// 				throw new Error(data?.error ?? 'Failed to delete guild data');
// 			}

// 			const recreatedResponse = await fetch(`/api/v1/guilds/${id}/profile`, {
// 				method: 'POST',
// 				headers: {
// 					'Content-Type': 'application/json',
// 				},
// 				body: JSON.stringify({ id, name }),
// 			});

// 			const recreatedData = await recreatedResponse.json();

// 			if (!recreatedResponse.ok) {
// 				throw new Error(recreatedData?.error ?? 'Guild data deleted, but failed to recreate defaults');
// 			}

// 			const nextProfile = recreatedData as GuildProfile;
// 			const nextForm = toFormState(nextProfile);

// 			setProfile(nextProfile);
// 			setBaseline(nextForm);
// 			setForm(nextForm);

// 			toast('Guild data deleted and reset to defaults.', 'success');
// 		} catch (error) {
// 			toast(error instanceof Error ? error.message : 'Failed to delete guild data.', 'error');
// 		} finally {
// 			setDeleting(false);
// 		}
// 	}

// 	if (!id) return null;

// 	return (
// 		<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="flex flex-col gap-4">
// 			<div className="flex flex-wrap items-center justify-end gap-2">
// 				<motion.button
// 					whileTap={{ scale: 0.98 }}
// 					type="button"
// 					onClick={resetForm}
// 					disabled={!hasChanges || saving || deleting}
// 					className="rounded-2xl border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45"
// 					style={{
// 						borderColor: 'var(--border)',
// 						background: 'color-mix(in srgb, var(--bg-panel) 76%, transparent)',
// 						color: 'var(--text-main)',
// 					}}
// 				>
// 					Reset
// 				</motion.button>

// 				<motion.button
// 					whileTap={{ scale: 0.98 }}
// 					type="button"
// 					onClick={handleSave}
// 					disabled={!hasChanges || saving || deleting}
// 					className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45"
// 					style={{
// 						borderColor: hasChanges ? 'color-mix(in srgb, var(--accent) 35%, var(--border))' : 'var(--border)',
// 						background: hasChanges ? 'color-mix(in srgb, var(--accent) 16%, var(--bg-panel))' : 'color-mix(in srgb, var(--bg-panel) 76%, transparent)',
// 						color: 'var(--text-main)',
// 					}}
// 				>
// 					{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
// 					{saving ? 'Saving...' : hasChanges ? 'Save changes' : 'Saved'}
// 				</motion.button>
// 			</div>

// 			<AnimatePresence>
// 				{loading && (
// 					<motion.div
// 						initial={{ opacity: 0, y: 6 }}
// 						animate={{ opacity: 1, y: 0 }}
// 						exit={{ opacity: 0, y: -6 }}
// 						className="rounded-2xl border px-4 py-3 text-sm"
// 						style={{
// 							borderColor: 'var(--border)',
// 							background: 'color-mix(in srgb, var(--bg-panel) 76%, transparent)',
// 							color: 'color-mix(in srgb, var(--text-main) 65%, transparent)',
// 						}}
// 					>
// 						<div className="flex items-center gap-2">
// 							<Loader2 className="h-4 w-4 animate-spin" />
// 							Loading profile...
// 						</div>
// 					</motion.div>
// 				)}
// 			</AnimatePresence>

// 			<div className="grid gap-4 xl:grid-cols-2">
// 				<motion.section
// 					initial={{ opacity: 0, y: 10 }}
// 					animate={{ opacity: 1, y: 0 }}
// 					transition={{ delay: 0.03, duration: 0.2 }}
// 					className="rounded-3xl border p-5"
// 					style={{
// 						borderColor: 'var(--border)',
// 						background: 'color-mix(in srgb, var(--bg-panel) 78%, transparent)',
// 					}}
// 				>
// 					<div className="mb-4 flex items-center gap-2">
// 						<ShieldCheck className="h-4 w-4" style={{ color: 'color-mix(in srgb, var(--text-main) 70%, transparent)' }} />
// 						<h4 className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: 'color-mix(in srgb, var(--text-main) 64%, transparent)' }}>
// 							Server
// 						</h4>
// 					</div>

// 					<div className="flex flex-col gap-4">
// 						{!profile?.bot && (
// 							<div
// 								className="rounded-2xl border px-4 py-3 text-sm leading-6"
// 								style={{
// 									borderColor: 'color-mix(in srgb, var(--accent) 16%, var(--border))',
// 									background: 'color-mix(in srgb, var(--accent) 8%, var(--bg-panel))',
// 									color: 'color-mix(in srgb, var(--text-main) 82%, transparent)',
// 								}}
// 							>
// 								This data is derived directly from your server. To sync and populate it, the{' '}
// 								<a
// 									href="/invite/xernerx"
// 									className="font-medium underline underline-offset-4 transition"
// 									style={{
// 										color: 'var(--text-main)',
// 									}}
// 								>
// 									Xernerx Bot
// 								</a>{' '}
// 								must be added to the server.
// 							</div>
// 						)}

// 						<Field icon={<Bot className="h-4 w-4" />} label="Bot Connected" value={profile?.bot ? 'Yes' : 'No'} />
// 						<Field icon={<ShieldCheck className="h-4 w-4" />} label="Verified" value={profile?.verified ? 'Yes' : 'No'} />
// 						<Field icon={<Globe className="h-4 w-4" />} label="Locale" value={profile?.locale || '—'} />
// 					</div>
// 				</motion.section>

// 				<motion.section
// 					initial={{ opacity: 0, y: 10 }}
// 					animate={{ opacity: 1, y: 0 }}
// 					transition={{ delay: 0.06, duration: 0.2 }}
// 					className="rounded-3xl border p-5"
// 					style={{
// 						borderColor: 'var(--border)',
// 						background: 'color-mix(in srgb, var(--bg-panel) 78%, transparent)',
// 					}}
// 				>
// 					<div className="mb-4 flex items-center gap-2">
// 						<Globe className="h-4 w-4" style={{ color: 'color-mix(in srgb, var(--text-main) 70%, transparent)' }} />
// 						<h4 className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: 'color-mix(in srgb, var(--text-main) 64%, transparent)' }}>
// 							Info
// 						</h4>
// 					</div>

// 					<div className="flex flex-col gap-4">
// 						<div className="flex flex-col gap-2">
// 							<label className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>
// 								Description
// 							</label>

// 							<input
// 								value={form.description}
// 								onChange={(e) => updateField('description', e.target.value)}
// 								placeholder="Short guild description"
// 								className="rounded-2xl border px-4 py-3 text-sm outline-none transition"
// 								style={{
// 									borderColor: 'var(--border)',
// 									background: 'color-mix(in srgb, var(--bg-main) 45%, var(--bg-panel))',
// 									color: 'var(--text-main)',
// 								}}
// 							/>
// 						</div>

// 						<div className="flex flex-col gap-2">
// 							<label className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>
// 								Long Description
// 							</label>

// 							<textarea
// 								value={form.info}
// 								onChange={(e) => updateField('info', e.target.value)}
// 								placeholder="Longer guild information"
// 								rows={7}
// 								className="resize-none rounded-2xl border px-4 py-3 text-sm outline-none transition"
// 								style={{
// 									borderColor: 'var(--border)',
// 									background: 'color-mix(in srgb, var(--bg-main) 45%, var(--bg-panel))',
// 									color: 'var(--text-main)',
// 								}}
// 							/>
// 						</div>

// 						<div className="flex flex-col gap-2">
// 							<label className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>
// 								Organization
// 							</label>

// 							<select
// 								value={form.organization || 'personal'}
// 								onChange={(e) => updateField('organization', e.target.value)}
// 								className="rounded-2xl border px-4 py-3 text-sm outline-none transition"
// 								style={{
// 									borderColor: 'var(--border)',
// 									background: 'color-mix(in srgb, var(--bg-main) 45%, var(--bg-panel))',
// 									color: 'var(--text-main)',
// 								}}
// 							>
// 								<option value="personal">Personal</option>

// 								{orgs.map((org: any) => (
// 									<option key={org._id} value={org._id}>
// 										{org.name || 'Unnamed org'}
// 									</option>
// 								))}
// 							</select>
// 						</div>
// 					</div>
// 				</motion.section>
// 			</div>

// 			<motion.section
// 				initial={{ opacity: 0, y: 10 }}
// 				animate={{ opacity: 1, y: 0 }}
// 				transition={{ delay: 0.09, duration: 0.2 }}
// 				className="rounded-3xl border p-5"
// 				style={{
// 					borderColor: 'var(--border)',
// 					background: 'color-mix(in srgb, var(--bg-panel) 78%, transparent)',
// 				}}
// 			>
// 				<div className="mb-4 flex items-center gap-2">
// 					<Lock className="h-4 w-4" style={{ color: 'color-mix(in srgb, var(--text-main) 70%, transparent)' }} />
// 					<h4 className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: 'color-mix(in srgb, var(--text-main) 64%, transparent)' }}>
// 						Privacy & Data
// 					</h4>
// 				</div>

// 				<div className="flex flex-col gap-4">
// 					<div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
// 						<div className="flex flex-col gap-2">
// 							<label className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>
// 								Privacy
// 							</label>

// 							<select
// 								value={form.privacy}
// 								onChange={(e) => updateField('privacy', e.target.value as FormState['privacy'])}
// 								className="rounded-2xl border px-4 py-3 text-sm outline-none transition"
// 								style={{
// 									borderColor: 'var(--border)',
// 									background: 'color-mix(in srgb, var(--bg-main) 45%, var(--bg-panel))',
// 									color: 'var(--text-main)',
// 								}}
// 							>
// 								<option value="public">Public</option>
// 								<option value="private">Private</option>
// 								<option value="limited">Limited</option>
// 							</select>
// 						</div>
// 					</div>

// 					<div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
// 						<div className="flex flex-col gap-2">
// 							<label className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>
// 								Delete Data
// 							</label>

// 							<div
// 								className="rounded-2xl border px-4 py-3 text-sm"
// 								style={{
// 									borderColor: 'color-mix(in srgb, #ff4d67 18%, var(--border))',
// 									background: 'color-mix(in srgb, #ff4d67 8%, transparent)',
// 									color: 'color-mix(in srgb, var(--text-main) 78%, transparent)',
// 								}}
// 							>
// 								Delete server data for this server. Will not remove our bots.
// 							</div>
// 						</div>

// 						<motion.button
// 							whileTap={{ scale: 0.98 }}
// 							type="button"
// 							onClick={handleDelete}
// 							disabled={saving || deleting}
// 							className="inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45"
// 							style={{
// 								borderColor: 'color-mix(in srgb, #ff4d67 25%, var(--border))',
// 								background: 'color-mix(in srgb, #ff4d67 12%, transparent)',
// 								color: '#ffb2bf',
// 							}}
// 						>
// 							{deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
// 							{deleting ? 'Deleting...' : 'Delete guild data'}
// 						</motion.button>
// 					</div>
// 				</div>
// 			</motion.section>
// 		</motion.div>
// 	);
// }

// function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
// 	return (
// 		<div className="flex flex-col gap-2">
// 			<label className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>
// 				{label}
// 			</label>

// 			<div
// 				className="flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm"
// 				style={{
// 					borderColor: 'var(--border)',
// 					background: 'color-mix(in srgb, var(--bg-main) 36%, var(--bg-panel))',
// 					color: 'color-mix(in srgb, var(--text-main) 86%, transparent)',
// 				}}
// 			>
// 				<span style={{ color: 'color-mix(in srgb, var(--text-main) 62%, transparent)' }}>{icon}</span>
// 				<span>{value}</span>
// 			</div>
// 		</div>
// 	);
// }
