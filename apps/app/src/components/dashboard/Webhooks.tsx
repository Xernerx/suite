/** @format */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Plus, Save, Trash2, Webhook as WebhookIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { useToast } from '@/providers/ToastProvider';

type Hook = {
	name: string;
	url: string;
	description: string;
	data: string;
};

const EMPTY_HOOK: Hook = {
	name: '',
	url: '',
	description: '',
	data: '',
};

export default function Webhooks({ id }: { id: string }) {
	const { toast } = useToast();

	const [baseline, setBaseline] = useState<Hook[]>([]);
	const [hooks, setHooks] = useState<Hook[]>([]);

	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!id) return;

		let cancelled = false;

		(async () => {
			try {
				setLoading(true);

				const response = await fetch(`/api/v1/guilds/${id}/profile`, {
					cache: 'no-store',
				});

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data?.error ?? 'Failed to fetch webhooks');
				}

				if (cancelled) return;

				const nextHooks: Hook[] = Array.isArray(data?.hooks)
					? data.hooks.map((hook: Partial<Hook>) => ({
							name: hook.name ?? '',
							url: hook.url ?? '',
							description: hook.description ?? '',
							data: hook.data ?? '',
						}))
					: [];

				setBaseline(nextHooks);
				setHooks(nextHooks);
			} catch (error) {
				if (cancelled) return;

				toast(error instanceof Error ? error.message : 'Failed to load webhooks', 'error');
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [id]);

	const hasChanges = useMemo(() => JSON.stringify(hooks) !== JSON.stringify(baseline), [hooks, baseline]);

	function updateHook(index: number, key: keyof Hook, value: string) {
		setHooks((current) => current.map((hook, i) => (i === index ? { ...hook, [key]: value } : hook)));
	}

	function addHook() {
		setHooks((current) => [...current, { ...EMPTY_HOOK }]);
	}

	function removeHook(index: number) {
		setHooks((current) => current.filter((_, i) => i !== index));
	}

	function resetHooks() {
		setHooks(baseline);
	}

	async function handleSave() {
		if (!id || !hasChanges || saving) return;

		const cleanedHooks = hooks.map((hook) => ({
			name: hook.name.trim(),
			url: hook.url.trim(),
			description: hook.description.trim(),
			data: hook.data.trim(),
		}));

		const invalidHook = cleanedHooks.find((hook) => !hook.name || !hook.url);

		if (invalidHook) {
			toast('Each webhook needs at least a name and url.', 'error');
			return;
		}

		try {
			setSaving(true);

			const response = await fetch(`/api/v1/guilds/${id}/profile`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					hooks: cleanedHooks,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data?.error ?? 'Failed to save webhooks');
			}

			const nextHooks: Hook[] = Array.isArray(data?.hooks)
				? data.hooks.map((hook: Partial<Hook>) => ({
						name: hook.name ?? '',
						url: hook.url ?? '',
						description: hook.description ?? '',
						data: hook.data ?? '',
					}))
				: [];

			setBaseline(nextHooks);
			setHooks(nextHooks);

			toast('Webhooks updated.', 'success');
		} catch (error) {
			toast(error instanceof Error ? error.message : 'Failed to save webhooks', 'error');
		} finally {
			setSaving(false);
		}
	}

	return (
		<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center justify-end gap-2">
				<motion.button
					whileTap={{ scale: 0.98 }}
					type="button"
					onClick={addHook}
					className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition"
					style={{
						borderColor: 'color-mix(in srgb, var(--accent) 22%, var(--border))',
						background: 'color-mix(in srgb, var(--accent) 10%, var(--bg-panel))',
						color: 'var(--text-main)',
					}}
				>
					<Plus className="h-4 w-4" />
					Add webhook
				</motion.button>

				<motion.button
					whileTap={{ scale: 0.98 }}
					type="button"
					onClick={resetHooks}
					disabled={!hasChanges || saving}
					className="rounded-2xl border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45"
					style={{
						borderColor: 'var(--border)',
						background: 'color-mix(in srgb, var(--bg-panel) 76%, transparent)',
						color: 'var(--text-main)',
					}}
				>
					Reset
				</motion.button>

				<motion.button
					whileTap={{ scale: 0.98 }}
					type="button"
					onClick={handleSave}
					disabled={!hasChanges || saving}
					className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45"
					style={{
						borderColor: hasChanges ? 'color-mix(in srgb, var(--accent) 35%, var(--border))' : 'var(--border)',
						background: hasChanges ? 'color-mix(in srgb, var(--accent) 16%, var(--bg-panel))' : 'color-mix(in srgb, var(--bg-panel) 76%, transparent)',
						color: 'var(--text-main)',
					}}
				>
					{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
					{saving ? 'Saving...' : hasChanges ? 'Save changes' : 'Saved'}
				</motion.button>
			</div>

			<AnimatePresence>
				{loading && (
					<motion.div
						initial={{ opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -6 }}
						className="rounded-2xl border px-4 py-3 text-sm"
						style={{
							borderColor: 'var(--border)',
							background: 'color-mix(in srgb, var(--bg-panel) 76%, transparent)',
							color: 'color-mix(in srgb, var(--text-main) 65%, transparent)',
						}}
					>
						<div className="flex items-center gap-2">
							<Loader2 className="h-4 w-4 animate-spin" />
							Loading webhooks...
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{!loading && hooks.length === 0 && (
				<motion.section
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					className="rounded-3xl border p-5"
					style={{
						borderColor: 'var(--border)',
						background: 'color-mix(in srgb, var(--bg-panel) 78%, transparent)',
					}}
				>
					<div className="flex items-center gap-3">
						<div
							className="flex h-10 w-10 items-center justify-center rounded-2xl border"
							style={{
								borderColor: 'var(--border)',
								background: 'color-mix(in srgb, var(--bg-main) 36%, var(--bg-panel))',
								color: 'color-mix(in srgb, var(--text-main) 72%, transparent)',
							}}
						>
							<WebhookIcon className="h-4 w-4" />
						</div>

						<div className="min-w-0">
							<p className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>
								No webhooks yet
							</p>
							<p className="text-sm" style={{ color: 'color-mix(in srgb, var(--text-main) 62%, transparent)' }}>
								Create your first webhook to start sending guild events somewhere useful.
							</p>
						</div>
					</div>
				</motion.section>
			)}

			<div className="flex flex-col gap-4">
				{hooks.map((hook, index) => (
					<motion.section
						key={`${index}-${baseline[index]?.name ?? 'new'}`}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: Math.min(index * 0.03, 0.18), duration: 0.2 }}
						className="rounded-3xl border p-5"
						style={{
							borderColor: 'var(--border)',
							background: 'color-mix(in srgb, var(--bg-panel) 78%, transparent)',
						}}
					>
						<div className="mb-4 flex items-center justify-between gap-3">
							<div className="flex items-center gap-2">
								<WebhookIcon className="h-4 w-4" style={{ color: 'color-mix(in srgb, var(--text-main) 70%, transparent)' }} />
								<h4 className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: 'color-mix(in srgb, var(--text-main) 64%, transparent)' }}>
									Webhook {index + 1}
								</h4>
							</div>

							<motion.button
								whileTap={{ scale: 0.98 }}
								type="button"
								onClick={() => removeHook(index)}
								className="inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition"
								style={{
									borderColor: 'color-mix(in srgb, #ff4d67 25%, var(--border))',
									background: 'color-mix(in srgb, #ff4d67 10%, transparent)',
									color: '#ffb2bf',
								}}
							>
								<Trash2 className="h-4 w-4" />
								Remove
							</motion.button>
						</div>

						<div className="grid gap-4 xl:grid-cols-2">
							<Input label="Name" value={hook.name} placeholder="Server log webhook" onChange={(value) => updateHook(index, 'name', value)} />

							<Input label="URL" value={hook.url} placeholder="https://discord.com/api/webhooks/..." onChange={(value) => updateHook(index, 'url', value)} />

							<Textarea label="Description" value={hook.description} placeholder="What this webhook is used for" rows={4} onChange={(value) => updateHook(index, 'description', value)} />

							<Textarea label="Data" value={hook.data} placeholder="Placeholder until data-type selection exists" rows={4} onChange={(value) => updateHook(index, 'data', value)} />
						</div>
					</motion.section>
				))}
			</div>
		</motion.div>
	);
}

function Input({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) {
	return (
		<div className="flex flex-col gap-2">
			<label className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>
				{label}
			</label>

			<input
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				className="rounded-2xl border px-4 py-3 text-sm outline-none transition"
				style={{
					borderColor: 'var(--border)',
					background: 'color-mix(in srgb, var(--bg-main) 45%, var(--bg-panel))',
					color: 'var(--text-main)',
				}}
			/>
		</div>
	);
}

function Textarea({ label, value, placeholder, rows, onChange }: { label: string; value: string; placeholder: string; rows: number; onChange: (value: string) => void }) {
	return (
		<div className="flex flex-col gap-2">
			<label className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>
				{label}
			</label>

			<textarea
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				rows={rows}
				className="resize-none rounded-2xl border px-4 py-3 text-sm outline-none transition"
				style={{
					borderColor: 'var(--border)',
					background: 'color-mix(in srgb, var(--bg-main) 45%, var(--bg-panel))',
					color: 'var(--text-main)',
				}}
			/>
		</div>
	);
}
