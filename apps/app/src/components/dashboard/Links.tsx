/** @format */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Globe, Link as LinkIcon, Loader2, Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { useToast } from '@/providers/ToastProvider';

type LinksState = {
	invite: string;
	website: string;
};

const EMPTY: LinksState = {
	invite: '',
	website: '',
};

export default function Links({ id }: { id: string }) {
	const { toast } = useToast();

	const [baseline, setBaseline] = useState<LinksState>(EMPTY);
	const [form, setForm] = useState<LinksState>(EMPTY);

	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!id) return;

		let cancelled = false;

		(async () => {
			try {
				setLoading(true);

				const res = await fetch(`/api/v1/guilds/${id}/profile`, {
					cache: 'no-store',
				});

				const data = await res.json();

				if (!res.ok) {
					throw new Error(data?.error ?? 'Failed to fetch links');
				}

				if (cancelled) return;

				const next: LinksState = {
					invite: data?.links?.invite ?? '',
					website: data?.links?.website ?? '',
				};

				setBaseline(next);
				setForm(next);
			} catch (err) {
				if (cancelled) return;
				toast(err instanceof Error ? err.message : 'Failed to load links', 'error');
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [id]);

	const hasChanges = useMemo(() => JSON.stringify(form) !== JSON.stringify(baseline), [form, baseline]);

	function update<K extends keyof LinksState>(key: K, value: string) {
		setForm((prev) => ({ ...prev, [key]: value }));
	}

	function reset() {
		setForm(baseline);
	}

	async function save() {
		if (!hasChanges || saving) return;

		try {
			setSaving(true);

			const res = await fetch(`/api/v1/guilds/${id}/profile`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					links: {
						invite: form.invite || undefined,
						website: form.website || undefined,
					},
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data?.error ?? 'Failed to save links');
			}

			const next: LinksState = {
				invite: data?.links?.invite ?? '',
				website: data?.links?.website ?? '',
			};

			setBaseline(next);
			setForm(next);

			toast('Links updated.', 'success');
		} catch (err) {
			toast(err instanceof Error ? err.message : 'Failed to save links', 'error');
		} finally {
			setSaving(false);
		}
	}

	return (
		<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
			{/* actions */}
			<div className="flex justify-end gap-2">
				<motion.button
					whileTap={{ scale: 0.98 }}
					onClick={reset}
					disabled={!hasChanges || saving}
					className="rounded-2xl border px-4 py-2 text-sm disabled:opacity-40"
					style={{
						borderColor: 'var(--border)',
						background: 'color-mix(in srgb, var(--bg-panel) 76%, transparent)',
					}}
				>
					Reset
				</motion.button>

				<motion.button
					whileTap={{ scale: 0.98 }}
					onClick={save}
					disabled={!hasChanges || saving}
					className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm disabled:opacity-40"
					style={{
						borderColor: hasChanges ? 'color-mix(in srgb, var(--accent) 35%, var(--border))' : 'var(--border)',
						background: hasChanges ? 'color-mix(in srgb, var(--accent) 16%, var(--bg-panel))' : 'color-mix(in srgb, var(--bg-panel) 76%, transparent)',
					}}
				>
					{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
					{saving ? 'Saving...' : hasChanges ? 'Save changes' : 'Saved'}
				</motion.button>
			</div>

			<AnimatePresence>
				{loading && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="rounded-2xl border px-4 py-3 text-sm"
						style={{
							borderColor: 'var(--border)',
							background: 'color-mix(in srgb, var(--bg-panel) 76%, transparent)',
						}}
					>
						<div className="flex items-center gap-2">
							<Loader2 className="h-4 w-4 animate-spin" />
							Loading links...
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* content */}
			<motion.section
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				className="rounded-3xl border p-5"
				style={{
					borderColor: 'var(--border)',
					background: 'color-mix(in srgb, var(--bg-panel) 78%, transparent)',
				}}
			>
				<div className="mb-4 flex items-center gap-2">
					<LinkIcon className="h-4 w-4" />
					<h4 className="text-sm font-semibold uppercase tracking-[0.18em]">Links</h4>
				</div>

				<div className="flex flex-col gap-4">
					<Input icon={<LinkIcon className="h-4 w-4" />} label="Invite Link" value={form.invite} onChange={(v) => update('invite', v)} placeholder="https://discord.gg/..." />

					<Input icon={<Globe className="h-4 w-4" />} label="Website" value={form.website} onChange={(v) => update('website', v)} placeholder="https://your-site.com" />
				</div>
			</motion.section>
		</motion.div>
	);
}

function Input({ icon, label, value, onChange, placeholder }: { icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
	return (
		<div className="flex flex-col gap-2">
			<label className="text-sm font-medium">{label}</label>

			<div
				className="flex items-center gap-3 rounded-2xl border px-4 py-3"
				style={{
					borderColor: 'var(--border)',
					background: 'color-mix(in srgb, var(--bg-main) 45%, var(--bg-panel))',
				}}
			>
				<span className="opacity-60">{icon}</span>

				<input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-transparent text-sm outline-none" />
			</div>
		</div>
	);
}
