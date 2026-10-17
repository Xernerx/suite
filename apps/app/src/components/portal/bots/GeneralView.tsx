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

export default function GeneralView({ profile, setProfile, id, orgs }: any) {
	const { t } = useDictionary();
	type FormState = {
		description: string;
		info: string;
		organization: string;
		privacy: 'public' | 'private' | 'limited';
	};

	function toForm(p: any): FormState {
		return {
			description: p.description || '',
			info: p.info || '',
			organization: p.organization || 'personal',
			privacy: p.privacy || 'private',
		};
	}

	const [baseline, setBaseline] = useState<FormState>(toForm(profile));
	const [form, setForm] = useState<FormState>(toForm(profile));
	const [saving, setSaving] = useState(false);

	// sync when profile changes
	useEffect(() => {
		const next = toForm(profile);
		setBaseline(next);
		setForm(next);
	}, [profile]);

	const hasChanges = useMemo(() => JSON.stringify(form) !== JSON.stringify(baseline), [form, baseline]);

	function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
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
				body: JSON.stringify(form),
			});

			const updated = await res.json();

			if (!res.ok) {
				throw new Error(updated?.error || t('app.portal.bots.general.saveFailed'));
			}

			setProfile(updated);

			const next = toForm(updated);
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
			<div>
				<h4 className="text-sm font-semibold uppercase tracking-[0.18em] opacity-70">{t('app.portal.bot.tabs.general')}</h4>
			</div>

			{/* FORM */}
			<div className="flex flex-col gap-4">
				<label htmlFor="">{t('app.portal.bots.general.descriptionLabel')}</label>
				<input
					value={form.description}
					onChange={(e) => updateField('description', e.target.value)}
					placeholder={t('app.portal.bots.general.shortDescPlaceholder')}
					className="rounded-2xl border px-4 py-3 text-sm outline-none transition"
					style={inputStyle}
				/>

				<label htmlFor="">{t('app.portal.bots.general.longDescLabel')}</label>
				<textarea
					value={form.info}
					onChange={(e) => updateField('info', e.target.value)}
					placeholder={t('app.portal.bots.general.longDescPlaceholder')}
					rows={6}
					className="resize-none rounded-2xl border px-4 py-3 text-sm outline-none transition"
					style={inputStyle}
				/>

				<label htmlFor="">{t('app.portal.bots.general.organizationLabel')}</label>
				<select
					value={form.organization}
					onChange={(e) => updateField('organization', e.target.value)}
					className="rounded-2xl border px-4 py-3 text-sm outline-none transition"
					style={inputStyle}
				>
					<option value="personal">{t('app.portal.bots.general.personal')}</option>
					{orgs.map((org: any) => (
						<option key={org._id} value={org._id}>
							{org.name || t('app.portal.bots.general.unnamedOrg')}
						</option>
					))}
				</select>

				<label htmlFor="">{t('app.portal.bots.general.privacyLabel')}</label>
				<select
					value={form.privacy}
					onChange={(e) => updateField('privacy', e.target.value as FormState['privacy'])}
					className="rounded-2xl border px-4 py-3 text-sm outline-none transition"
					style={inputStyle}
				>
					<option value="public">{t('app.portal.settings.public')}</option>
					<option value="private">{t('app.portal.settings.private')}</option>
					<option value="limited">{t('app.portal.settings.limited')}</option>
				</select>
			</div>
		</motion.div>
	);
}
