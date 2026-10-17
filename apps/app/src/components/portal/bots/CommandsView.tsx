/** @format */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDictionary } from '@xernerx/providers';

const inputStyle = {
	borderColor: 'var(--border)',
	background: 'color-mix(in srgb, var(--bg-main) 45%, var(--bg-panel))',
	color: 'var(--text-main)',
};

export default function CommandsView({ profile, setProfile, id }: any) {
	const { t } = useDictionary();
	type Command = {
		id: string;
		name: string;
		description: string;
	};

	function toState(p: any): Command[] {
		return (p.commands || []).map((c: any) => ({
			id: c.id || crypto.randomUUID(),
			name: c.name || '',
			description: c.description || '',
		}));
	}

	const [baseline, setBaseline] = useState<Command[]>(toState(profile));
	const [form, setForm] = useState<Command[]>(toState(profile));
	const [saving, setSaving] = useState(false);

	// sync when profile changes
	useEffect(() => {
		const next = toState(profile);
		setBaseline(next);
		setForm(next);
	}, [profile]);

	const hasChanges = useMemo(() => JSON.stringify(form) !== JSON.stringify(baseline), [form, baseline]);

	function updateField(i: number, key: keyof Command, value: string) {
		setForm((prev) => {
			const next = [...prev];
			next[i] = { ...next[i], [key]: value };
			return next;
		});
	}

	function addCommand() {
		setForm((prev) => [...prev, { id: crypto.randomUUID(), name: '', description: '' }]);
	}

	function removeCommand(i: number) {
		setForm((prev) => prev.filter((_, index) => index !== i));
	}

	function resetForm() {
		setForm(baseline);
	}

	async function handleSave() {
		if (!hasChanges || saving) return;

		try {
			setSaving(true);

			const res = await fetch(`/api/v1/bots/${id}/profile`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ commands: form }),
			});

			const updated = await res.json();

			if (!res.ok) {
				throw new Error(updated?.error || t('app.portal.bots.commands.saveFailed'));
			}

			setProfile(updated);

			const next = toState(updated);
			setBaseline(next);
			setForm(next);
		} finally {
			setSaving(false);
		}
	}

	return (
		<motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
			{/* ACTIONS */}
			<div className="flex justify-end gap-2">
				<motion.button
					whileTap={{ scale: 0.98 }}
					onClick={resetForm}
					disabled={!hasChanges || saving}
					className="rounded-2xl border px-4 py-2 text-sm disabled:opacity-40"
					style={{
						borderColor: 'var(--border)',
						background: 'var(--bg-panel)',
						color: 'var(--text-main)',
					}}
				>
					{t('common.actions.reset')}
				</motion.button>

				<motion.button
					whileTap={{ scale: 0.98 }}
					onClick={handleSave}
					disabled={!hasChanges || saving}
					className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm disabled:opacity-40"
					style={{
						borderColor: hasChanges ? 'color-mix(in srgb, var(--accent) 35%, var(--border))' : 'var(--border)',
						background: hasChanges ? 'color-mix(in srgb, var(--accent) 16%, var(--bg-panel))' : 'var(--bg-panel)',
						color: 'var(--text-main)',
					}}
				>
					{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
					{saving ? t('common.actions.saving') : hasChanges ? t('common.actions.saveChanges') : t('common.actions.saved')}
				</motion.button>
			</div>

			{/* LIST */}
			{form.map((c, i) => (
				<div
					key={c.id}
					className="rounded-3xl border p-4"
					style={{
						borderColor: 'var(--border)',
						background: 'color-mix(in srgb, var(--bg-panel) 78%, transparent)',
					}}
				>
					<div className="mb-3 flex justify-between items-center">
						<span className="text-xs opacity-60">{t('app.portal.bots.commands.commandNumber', { number: i + 1 })}</span>

						<button onClick={() => removeCommand(i)} className="text-xs opacity-60 hover:opacity-100 transition">
							{t('common.actions.remove')}
						</button>
					</div>

					<div className="grid gap-3">
						<input
							value={c.name}
							onChange={(e) => updateField(i, 'name', e.target.value)}
							placeholder={t('app.portal.bots.commands.namePlaceholder')}
							className="rounded-2xl border px-4 py-3 text-sm"
							style={inputStyle}
						/>

						<input
							value={c.description}
							onChange={(e) => updateField(i, 'description', e.target.value)}
							placeholder={t('app.portal.bots.commands.descPlaceholder')}
							className="rounded-2xl border px-4 py-3 text-sm"
							style={inputStyle}
						/>
					</div>
				</div>
			))}

			{/* ADD BUTTON */}
			<button
				onClick={addCommand}
				className="rounded-2xl border px-4 py-3 text-sm font-medium transition hover:scale-[1.02]"
				style={{
					borderColor: 'var(--border)',
					background: 'color-mix(in srgb, var(--bg-panel) 76%, transparent)',
				}}
			>
				{t('app.portal.bots.commands.addCommand')}
			</button>
		</motion.div>
	);
}
