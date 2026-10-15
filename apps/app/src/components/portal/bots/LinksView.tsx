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

export default function LinksView({ profile, setProfile, id }: any) {
	const { t } = useDictionary();
	type LinksState = Record<string, string>;

	const KEYS = ['invite', 'support', 'community', 'github', 'website', 'privacy', 'terms'];

	function toState(p: any): LinksState {
		const base: LinksState = {};
		for (const k of KEYS) {
			base[k] = p.links?.[k] || '';
		}
		return base;
	}

	const [baseline, setBaseline] = useState<LinksState>(toState(profile));
	const [form, setForm] = useState<LinksState>(toState(profile));
	const [saving, setSaving] = useState(false);

	// sync when profile changes
	useEffect(() => {
		const next = toState(profile);
		setBaseline(next);
		setForm(next);
	}, [profile]);

	const hasChanges = useMemo(() => JSON.stringify(form) !== JSON.stringify(baseline), [form, baseline]);

	function updateField(key: string, value: string) {
		setForm((prev) => ({
			...prev,
			[key]: value,
		}));
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
				body: JSON.stringify({
					links: form,
				}),
			});

			const updated = await res.json();

			if (!res.ok) {
				throw new Error(updated?.error || t('app.portal.bots.links.saveFailed'));
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

			{/* TITLE */}
			<h4 className="text-sm font-semibold uppercase tracking-[0.18em] opacity-70">{t('app.portal.bot.tabs.links')}</h4>

			{/* FORM */}
			<div className="grid gap-4">
				{KEYS.map((k) => (
					<div key={k} className="flex flex-col gap-1">
						<label htmlFor={k} className="capitalize">
							{t(`app.portal.links.${k}`) || k}
						</label>
						<input
							name={k}
							value={form[k]}
							onChange={(e) => updateField(k, e.target.value)}
							placeholder={t(`app.portal.links.${k}`) || k}
							className="rounded-2xl border px-4 py-3 text-sm outline-none transition"
							style={inputStyle}
						/>
					</div>
				))}
			</div>
		</motion.div>
	);
}
