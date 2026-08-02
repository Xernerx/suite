/** @format */
'use client';

import { Calendar, Globe, Info, Save, Shield, User } from 'lucide-react';
import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';
import { useUser } from '@/providers/UserProvider';

type Profile = {
	id: string;
	description?: string;
	info?: string;
	birthday?: string;
	gender?: string;
	pronouns?: string;
	timezone?: string;
	privacy?: string;
	locale?: string;
};

export default function Profile() {
	const { user } = useUser();

	const [profile, setProfile] = useState<Profile | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!user?.id) return;

		const load = async () => {
			const res = await fetch(`/api/v1/users/${user.id}/profile`);
			const data = await res.json();
			setProfile(data);
			setLoading(false);
		};

		load();
		setLoading(false);
	}, [user]);

	const updateField = (key: keyof Profile, value: any) => {
		setProfile((prev) => (prev ? { ...prev, [key]: value } : prev));
	};

	const save = async () => {
		if (!profile) return;

		setSaving(true);

		try {
			const res = await fetch(`/api/v1/users/${profile.id}/profile`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(profile),
			});

			const data = await res.json();

			setProfile(data);
		} catch {}

		setSaving(false);
	};

	if (!user || loading || !profile) {
		return <div style={{ color: 'var(--text-muted)' }}>Loading...</div>;
	}

	return (
		<div className="flex flex-col w-full" style={{ gap: 'calc(var(--ui-gap) * 2)' }}>
			{/* HEADER CARD */}
			<motion.div
				initial={{ opacity: 0, y: 6 }}
				animate={{ opacity: 1, y: 0 }}
				className="flex items-center justify-between rounded-xl"
				style={{
					background: 'var(--container)',
					border: '1px solid var(--border)',
					padding: 'calc(var(--ui-gap) * 1.5)',
				}}
			>
				<div className="flex items-center gap-3">
					<div
						className="p-2 rounded-md"
						style={{
							background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
							color: 'rgb(var(--accent))',
						}}
					>
						<User size={16} />
					</div>

					<div className="flex flex-col">
						<span className="text-sm font-medium">Profile</span>
						<span className="text-xs" style={{ color: 'var(--text-muted)' }}>
							Manage your public identity and preferences.
						</span>
					</div>
				</div>

				<button
					onClick={save}
					disabled={saving}
					className="flex items-center gap-2 rounded-md text-sm transition"
					style={{
						padding: '8px 12px',
						background: 'var(--accent)',
						color: '#fff',
						opacity: saving ? 0.7 : 1,
					}}
				>
					<Save size={14} />
					{saving ? 'Saving...' : 'Save'}
				</button>
			</motion.div>

			{/* GRID */}
			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2" style={{ gap: 'calc(var(--ui-gap) * 2)' }}>
				<Card title="General" icon={<Info size={14} />}>
					<Input label="Description" value={profile.description} onChange={(v) => updateField('description', v)} />
					<Textarea label="Info" value={profile.info} onChange={(v) => updateField('info', v)} />
				</Card>

				<Card title="Personal" icon={<Calendar size={14} />}>
					<Input label="Birthday" type="date" value={profile.birthday ? profile.birthday.split('T')[0] : ''} onChange={(v) => updateField('birthday', v)} />
					<Select label="Gender" value={profile.gender} options={['male', 'female', 'other']} onChange={(v) => updateField('gender', v)} />
					<Input label="Pronouns" value={profile.pronouns} onChange={(v) => updateField('pronouns', v)} />
				</Card>

				<Card title="Regional" icon={<Globe size={14} />}>
					<Input label="Timezone" value={profile.timezone} onChange={(v) => updateField('timezone', v)} />
					<Input label="Locale" value={profile.locale} onChange={(v) => updateField('locale', v)} />
				</Card>

				<Card title="Privacy" icon={<Shield size={14} />}>
					<Select label="Visibility" value={profile.privacy} options={['public', 'private', 'limited']} onChange={(v) => updateField('privacy', v)} />
				</Card>
			</div>
		</div>
	);
}

/* ================= CARD ================= */

function Card({ title, icon, children }: any) {
	return (
		<div
			className="flex flex-col rounded-xl"
			style={{
				background: 'var(--container)',
				border: '1px solid var(--border)',
				padding: 'calc(var(--ui-gap) * 1.5)',
				gap: 'calc(var(--ui-gap) * 1.2)',
			}}
		>
			<div className="flex items-center gap-2 text-sm font-medium">
				<div
					className="p-1.5 rounded-md"
					style={{
						background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
						color: 'rgb(var(--accent))',
					}}
				>
					{icon}
				</div>
				{title}
			</div>

			{children}
		</div>
	);
}

/* ================= INPUTS ================= */

function Input({ label, value, onChange, type = 'text' }: any) {
	return (
		<div className="flex flex-col gap-1">
			<label className="text-xs" style={{ color: 'var(--text-muted)' }}>
				{label}
			</label>
			<input
				type={type}
				value={value || ''}
				onChange={(e) => onChange(e.target.value)}
				className="px-3 py-2 rounded-md text-sm outline-none transition"
				style={{
					background: 'var(--bg-main)',
					border: '1px solid var(--border)',
					color: 'var(--text-main)',
				}}
				onFocus={(e) => {
					e.currentTarget.style.border = '1px solid rgb(var(--accent))';
				}}
				onBlur={(e) => {
					e.currentTarget.style.border = '1px solid var(--border)';
				}}
			/>
		</div>
	);
}

function Textarea({ label, value, onChange }: any) {
	return (
		<div className="flex flex-col gap-1">
			<label className="text-xs" style={{ color: 'var(--text-muted)' }}>
				{label}
			</label>
			<textarea
				value={value || ''}
				onChange={(e) => onChange(e.target.value)}
				className="px-3 py-2 rounded-md text-sm outline-none resize-none transition"
				style={{
					background: 'var(--bg-main)',
					border: '1px solid var(--border)',
					color: 'var(--text-main)',
					minHeight: 90,
				}}
			/>
		</div>
	);
}

function Select({ label, value, options, onChange }: any) {
	return (
		<div className="flex flex-col gap-1">
			<label className="text-xs" style={{ color: 'var(--text-muted)' }}>
				{label}
			</label>
			<select
				value={value || ''}
				onChange={(e) => onChange(e.target.value)}
				className="px-3 py-2 rounded-md text-sm outline-none transition"
				style={{
					background: 'var(--bg-main)',
					border: '1px solid var(--border)',
					color: 'var(--text-main)',
				}}
			>
				<option value="">Select</option>
				{options.map((o: string) => (
					<option key={o} value={o}>
						{o}
					</option>
				))}
			</select>
		</div>
	);
}
