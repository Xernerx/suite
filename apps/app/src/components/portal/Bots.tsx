/** @format */

'use client';

import { Globe, Link2, Loader2, Save, Terminal, Webhook } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import Image from 'next/image';
import { motion } from 'framer-motion';

const views = [
	{ id: 'general', label: 'General', icon: <Globe className="h-4 w-4" /> },
	{ id: 'links', label: 'Links', icon: <Link2 className="h-4 w-4" /> },
	{ id: 'webhooks', label: 'Webhooks', icon: <Webhook className="h-4 w-4" /> },
	{ id: 'commands', label: 'Commands', icon: <Terminal className="h-4 w-4" /> },
];

const inputStyle = {
	borderColor: 'var(--border)',
	background: 'color-mix(in srgb, var(--bg-main) 45%, var(--bg-panel))',
	color: 'var(--text-main)',
};

export default function Bots() {
	const [bots, setBots] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
	const [view, setView] = useState<'general' | 'links' | 'webhooks' | 'commands'>('general');
	const [profile, setProfile] = useState<any | null>(null);
	const [profileLoading, setProfileLoading] = useState(false);
	const [orgs, setOrgs] = useState<any[]>([]);

	useEffect(() => {
		(async () => {
			try {
				setLoading(true);

				const botsData = await fetch('/api/v1/bots').then((res) => res.json());

				const users = await Promise.all(
					botsData.map((bot: any) =>
						fetch(`/api/v1/discord/users/${bot.id}/profile`)
							.then((res) => res.json())
							.then((data) => data.user)
							.catch(() => null)
					)
				);

				const merged = botsData.map((bot: any, i: number) => ({
					...bot,
					user: users[i],
				}));

				setBots(merged);

				// auto select first bot
				if (merged.length > 0) {
					setSelectedBotId(merged[0].id);
				}
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	useEffect(() => {
		if (!selectedBotId) return;

		(async () => {
			try {
				setProfileLoading(true);

				const res = await fetch(`/api/v1/bots/${selectedBotId}/profile`);

				if (res.status === 404) {
					// create empty profile if missing
					await fetch(`/api/v1/bots/${selectedBotId}/profile`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({}),
					});

					const retry = await fetch(`/api/v1/bots/${selectedBotId}/profile`);
					const data = await retry.json();
					setProfile(data);
					return;
				}

				const data = await res.json();
				setProfile(data);
			} finally {
				setProfileLoading(false);
			}
		})();
	}, [selectedBotId]);

	useEffect(() => {
		(async () => {
			try {
				const data = await fetch('/api/v1/organizations').then((r) => r.json());
				setOrgs(data);
			} catch {
				setOrgs([]);
			}
		})();
	}, []);

	if (loading) {
		return (
			<div className="text-sm" style={{ color: 'color-mix(in srgb, var(--text-main) 60%, transparent)' }}>
				Loading bots...
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			{/* selector */}
			<div className="flex gap-2 overflow-x-auto overflow-y-hidden">
				{bots.map((bot) => {
					const isSelected = selectedBotId === bot.id;

					const avatar = bot.user?.avatar
						? `https://cdn.discordapp.com/avatars/${bot.id}/${bot.user.avatar}.png?size=256`
						: `https://cdn.discordapp.com/embed/avatars/${Number(bot.id) % 5}.png`;

					const name = bot.user?.global_name || bot.user?.username || 'Unknown Bot';

					return (
						<button
							key={bot.id}
							type="button"
							onClick={() => setSelectedBotId(bot.id)}
							className="group shrink-0 rounded-3xl border p-1 transition hover:scale-[1.03]"
							style={{
								borderColor: isSelected ? 'color-mix(in srgb, var(--text-main) 18%, var(--border))' : 'transparent',
								background: isSelected ? 'color-mix(in srgb, var(--text-main) 8%, transparent)' : 'transparent',
							}}
							title={name}
						>
							<Image className="h-20 w-20 rounded-2xl object-cover transition" style={{ opacity: isSelected ? 1 : 0.82 }} src={avatar} alt={name} width={80} height={80} />
						</button>
					);
				})}
			</div>
			{/* selected bot info */}
			{selectedBotId && (
				<div
					className="rounded-3xl border p-6"
					style={{
						borderColor: 'var(--border)',
						background: 'color-mix(in srgb, var(--bg-panel) 88%, transparent)',
					}}
				>
					{(() => {
						const bot = bots.find((b) => b.id === selectedBotId);

						if (!bot) return null;

						return (
							<motion.div
								key={bot.id}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.2 }}
								className="relative overflow-hidden rounded-3xl border"
								style={{
									borderColor: 'var(--border)',
									background: 'var(--bg-panel)',
								}}
							>
								{/* banner */}
								<div
									className="absolute inset-0 bg-cover bg-center"
									style={{
										backgroundColor: 'var(--bg-panel)',
										backgroundImage: bot.user?.banner
											? `url(https://cdn.discordapp.com/banners/${bot.id}/${bot.user.banner}.png?size=1024)`
											: bot.user?.avatar
												? `url(https://cdn.discordapp.com/avatars/${bot.id}/${bot.user.avatar}.png?size=512)`
												: undefined,
										filter: bot.user?.banner ? 'brightness(0.72) saturate(0.95)' : 'blur(40px) brightness(0.6) saturate(1.1)',
										transform: bot.user?.banner ? undefined : 'scale(1.2)',
									}}
								/>

								{/* overlays */}
								<div
									className="absolute inset-0"
									style={{
										background: 'linear-gradient(to bottom, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.18) 34%, rgba(0,0,0,0.56) 68%, rgba(0,0,0,0.9) 100%)',
									}}
								/>

								<div
									className="absolute inset-0"
									style={{
										background: 'linear-gradient(to right, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.2) 100%)',
									}}
								/>

								<div
									className="absolute inset-0"
									style={{
										background: 'radial-gradient(circle at top right, color-mix(in srgb, var(--accent) 12%, transparent), transparent 35%)',
									}}
								/>

								{/* content */}
								<div className="relative flex min-h-65 items-end gap-4 px-6 pb-7 pt-6">
									<div
										className="shrink-0 rounded-[1.4rem] border p-1 shadow-2xl backdrop-blur-md"
										style={{
											borderColor: 'var(--border)',
											background: 'color-mix(in srgb, var(--bg-panel) 82%, transparent)',
										}}
									>
										<Image
											className="h-20 w-20 rounded-2xl object-cover"
											src={
												bot.user?.avatar
													? `https://cdn.discordapp.com/avatars/${bot.id}/${bot.user.avatar}.png?size=256`
													: `https://cdn.discordapp.com/embed/avatars/${Number(bot.id) % 5}.png`
											}
											alt="bot"
											width={80}
											height={80}
										/>
									</div>

									<div className="min-w-0 max-w-full">
										<h2
											className="truncate text-2xl font-semibold tracking-tight"
											style={{
												color: '#ffffff',
												textShadow: '0 2px 18px rgba(0,0,0,0.45)',
											}}
										>
											{bot.user?.global_name || bot.user?.username || 'Unknown Bot'}
										</h2>

										<p
											className="truncate text-sm"
											style={{
												color: 'rgba(255,255,255,0.78)',
												textShadow: '0 2px 18px rgba(0,0,0,0.45)',
											}}
										>
											{bot.id}
										</p>
									</div>
								</div>
							</motion.div>
						);
					})()}
				</div>
			)}
			<div className="flex gap-2 overflow-x-auto">
				{views.map((v) => {
					const active = view === v.id;

					return (
						<motion.button
							key={v.id}
							onClick={() => setView(v.id as any)}
							whileTap={{ scale: 0.96 }}
							className="relative flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition"
						>
							{/* active background */}
							{active && (
								<motion.div
									layoutId="bot-view-active"
									className="absolute inset-0 rounded-2xl"
									style={{
										background: 'color-mix(in srgb, var(--accent) 14%, var(--bg-panel))',
										border: '1px solid color-mix(in srgb, var(--accent) 30%, var(--border))',
									}}
									transition={{ type: 'spring', stiffness: 260, damping: 22 }}
								/>
							)}

							{/* content */}
							<span
								className="relative flex items-center gap-2"
								style={{
									color: active ? 'var(--text-main)' : 'color-mix(in srgb, var(--text-main) 65%, transparent)',
								}}
							>
								{v.icon}
								{v.label}
							</span>
						</motion.button>
					);
				})}
			</div>

			<div
				className="rounded-3xl border p-6"
				style={{
					borderColor: 'var(--border)',
					background: 'color-mix(in srgb, var(--bg-panel) 88%, transparent)',
				}}
			>
				{profileLoading ? (
					<div className="flex items-center gap-2 text-sm opacity-60">Loading...</div>
				) : !profile ? null : (
					<>
						{view === 'general' && <GeneralView profile={profile} setProfile={setProfile} id={selectedBotId!} orgs={orgs} />}
						{view === 'links' && <LinksView profile={profile} setProfile={setProfile} id={selectedBotId!} />}
						{view === 'webhooks' && <WebhooksView profile={profile} setProfile={setProfile} id={selectedBotId!} />}
						{view === 'commands' && <CommandsView profile={profile} setProfile={setProfile} id={selectedBotId!} />}
					</>
				)}
			</div>
		</div>
	);
}

function GeneralView({ profile, setProfile, id, orgs }: any) {
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
				throw new Error(updated?.error || 'Failed to save');
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
					Reset
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
					{saving ? 'Saving...' : hasChanges ? 'Save changes' : 'Saved'}
				</motion.button>
			</div>

			{/* TITLE */}
			<div>
				<h4 className="text-sm font-semibold uppercase tracking-[0.18em] opacity-70">General</h4>
			</div>

			{/* FORM */}
			<div className="flex flex-col gap-4">
				<label htmlFor="">Description</label>
				<input
					value={form.description}
					onChange={(e) => updateField('description', e.target.value)}
					placeholder="Short description"
					className="rounded-2xl border px-4 py-3 text-sm outline-none transition"
					style={inputStyle}
				/>

				<label htmlFor="">Long Description</label>
				<textarea
					value={form.info}
					onChange={(e) => updateField('info', e.target.value)}
					placeholder="Long description, supports Markdown"
					rows={6}
					className="resize-none rounded-2xl border px-4 py-3 text-sm outline-none transition"
					style={inputStyle}
				/>

				<label htmlFor="">Organization</label>
				<select
					value={form.organization}
					onChange={(e) => updateField('organization', e.target.value)}
					className="rounded-2xl border px-4 py-3 text-sm outline-none transition"
					style={inputStyle}
				>
					<option value="personal">Personal</option>
					{orgs.map((org: any) => (
						<option key={org._id} value={org._id}>
							{org.name || 'Unnamed org'}
						</option>
					))}
				</select>

				<label htmlFor="">Privacy</label>
				<select
					value={form.privacy}
					onChange={(e) => updateField('privacy', e.target.value as FormState['privacy'])}
					className="rounded-2xl border px-4 py-3 text-sm outline-none transition"
					style={inputStyle}
				>
					<option value="public">Public</option>
					<option value="private">Private</option>
					<option value="limited">Limited</option>
				</select>
			</div>
		</motion.div>
	);
}

function LinksView({ profile, setProfile, id }: any) {
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
				throw new Error(updated?.error || 'Failed to save links');
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
					Reset
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
					{saving ? 'Saving...' : hasChanges ? 'Save changes' : 'Saved'}
				</motion.button>
			</div>

			{/* TITLE */}
			<h4 className="text-sm font-semibold uppercase tracking-[0.18em] opacity-70">Links</h4>

			{/* FORM */}
			<div className="grid gap-4">
				{KEYS.map((k) => (
					<>
						<label htmlFor={k}>{k}</label>
						<input
							name={k}
							key={k}
							value={form[k]}
							onChange={(e) => updateField(k, e.target.value)}
							placeholder={k}
							className="rounded-2xl border px-4 py-3 text-sm outline-none transition"
							style={inputStyle}
						/>
					</>
				))}
			</div>
		</motion.div>
	);
}

function WebhooksView({ profile, setProfile, id }: any) {
	type Hook = {
		name: string;
		url: string;
		description: string;
		data: string;
	};

	function toState(p: any): Hook[] {
		return (p.hooks || []).map((h: any) => ({
			name: h.name || '',
			url: h.url || '',
			description: h.description || '',
			data: h.data || '',
		}));
	}

	const [baseline, setBaseline] = useState<Hook[]>(toState(profile));
	const [form, setForm] = useState<Hook[]>(toState(profile));
	const [saving, setSaving] = useState(false);

	// sync when profile changes
	useEffect(() => {
		const next = toState(profile);
		setBaseline(next);
		setForm(next);
	}, [profile]);

	const hasChanges = useMemo(() => JSON.stringify(form) !== JSON.stringify(baseline), [form, baseline]);

	function updateField(i: number, key: keyof Hook, value: string) {
		setForm((prev) => {
			const next = [...prev];
			next[i] = { ...next[i], [key]: value };
			return next;
		});
	}

	function addHook() {
		setForm((prev) => [...prev, { name: '', url: '', description: '', data: '' }]);
	}

	function removeHook(i: number) {
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
				body: JSON.stringify({ hooks: form }),
			});

			const updated = await res.json();

			if (!res.ok) {
				throw new Error(updated?.error || 'Failed to save webhooks');
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
					Reset
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
					{saving ? 'Saving...' : hasChanges ? 'Save changes' : 'Saved'}
				</motion.button>
			</div>

			{/* LIST */}
			{form.map((h, i) => (
				<motion.div
					key={i}
					initial={{ opacity: 0, y: 6 }}
					animate={{ opacity: 1, y: 0 }}
					className="rounded-3xl border p-5"
					style={{
						borderColor: 'var(--border)',
						background: 'color-mix(in srgb, var(--bg-panel) 78%, transparent)',
					}}
				>
					<div className="mb-4 flex items-center justify-between">
						<span
							className="text-sm font-semibold uppercase tracking-[0.18em]"
							style={{
								color: 'color-mix(in srgb, var(--text-main) 64%, transparent)',
							}}
						>
							Webhook {i + 1}
						</span>

						<button onClick={() => removeHook(i)} className="text-xs opacity-60 hover:opacity-100 transition">
							Remove
						</button>
					</div>

					<div className="grid gap-3">
						<input
							value={h.name}
							onChange={(e) => updateField(i, 'name', e.target.value)}
							placeholder="Webhook name"
							className="rounded-2xl border px-4 py-3 text-sm outline-none"
							style={inputStyle}
						/>

						<input
							value={h.url}
							onChange={(e) => updateField(i, 'url', e.target.value)}
							placeholder="Webhook URL"
							className="rounded-2xl border px-4 py-3 text-sm outline-none"
							style={inputStyle}
						/>

						<textarea
							value={h.description}
							onChange={(e) => updateField(i, 'description', e.target.value)}
							placeholder="Description"
							rows={2}
							className="resize-none rounded-2xl border px-4 py-3 text-sm outline-none"
							style={inputStyle}
						/>

						<textarea
							value={h.data}
							onChange={(e) => updateField(i, 'data', e.target.value)}
							placeholder="Payload (placeholder)"
							rows={3}
							className="resize-none rounded-2xl border px-4 py-3 text-sm outline-none"
							style={inputStyle}
						/>
					</div>
				</motion.div>
			))}

			{/* ADD BUTTON */}
			<button
				onClick={addHook}
				className="rounded-2xl border px-4 py-3 text-sm font-medium transition hover:scale-[1.02]"
				style={{
					borderColor: 'color-mix(in srgb, var(--accent) 30%, var(--border))',
					background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
				}}
			>
				+ Create webhook
			</button>
		</motion.div>
	);
}

function CommandsView({ profile, setProfile, id }: any) {
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
				throw new Error(updated?.error || 'Failed to save commands');
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
					Reset
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
					{saving ? 'Saving...' : hasChanges ? 'Save changes' : 'Saved'}
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
						<span className="text-xs opacity-60">Command {i + 1}</span>

						<button onClick={() => removeCommand(i)} className="text-xs opacity-60 hover:opacity-100 transition">
							Remove
						</button>
					</div>

					<div className="grid gap-3">
						<input value={c.name} onChange={(e) => updateField(i, 'name', e.target.value)} placeholder="Command name" className="rounded-2xl border px-4 py-3 text-sm" style={inputStyle} />

						<input
							value={c.description}
							onChange={(e) => updateField(i, 'description', e.target.value)}
							placeholder="Description"
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
				Add command
			</button>
		</motion.div>
	);
}
