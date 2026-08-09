// /** @format */

// 'use client';

// import { useEffect, useState } from 'react';

// import { Plus } from 'lucide-react';
// import { motion } from 'framer-motion';
// import { useUser } from '@/providers/UserProvider';

// export default function Organizations() {
// 	const { user } = useUser();

// 	const [orgs, setOrgs] = useState<any[]>([]);
// 	const [loading, setLoading] = useState(true);
// 	const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
// 	const [profile, setProfile] = useState<any | null>(null);
// 	const [profileLoading, setProfileLoading] = useState(false);

// 	// fetch org ids
// 	useEffect(() => {
// 		(async () => {
// 			try {
// 				setLoading(true);

// 				const data = await fetch('/api/v1/organizations').then((r) => r.json());

// 				setOrgs(data);

// 				if (data.length > 0) {
// 					setSelectedOrgId(data[0]._id);
// 				}
// 			} finally {
// 				setLoading(false);
// 			}
// 		})();
// 	}, []);

// 	// fetch profile
// 	useEffect(() => {
// 		if (!selectedOrgId) return;

// 		(async () => {
// 			try {
// 				setProfileLoading(true);

// 				const res = await fetch(`/api/v1/organizations/${selectedOrgId}/profile`);

// 				if (res.status === 404) {
// 					await fetch(`/api/v1/organizations/${selectedOrgId}/profile`, {
// 						method: 'POST',
// 						headers: { 'Content-Type': 'application/json' },
// 						body: JSON.stringify({ name: `${user?.global_name || user?.username}'s Organization` }),
// 					});

// 					const retry = await fetch(`/api/v1/organizations/${selectedOrgId}/profile`);
// 					const data = await retry.json();
// 					setProfile(data);
// 					return;
// 				}

// 				const data = await res.json();
// 				setProfile(data);
// 			} finally {
// 				setProfileLoading(false);
// 			}
// 		})();
// 	}, [selectedOrgId]);

// 	// create org properly (no fake IDs)
// 	async function createOrg() {
// 		const res = await fetch(`/api/v1/organizations/create/profile`, {
// 			method: 'POST',
// 			headers: { 'Content-Type': 'application/json' },
// 			body: JSON.stringify({ name: `${user?.global_name || user?.username}'s Organization` }),
// 		});

// 		const created = await res.json();

// 		setOrgs((prev) => [...prev, created]);
// 		setSelectedOrgId(created._id);
// 	}

// 	if (loading) {
// 		return (
// 			<div className="text-sm" style={{ color: 'color-mix(in srgb, var(--text-main) 60%, transparent)' }}>
// 				Loading organizations...
// 			</div>
// 		);
// 	}

// 	return (
// 		<div className="flex flex-col gap-4">
// 			{/* selector */}
// 			<div className="flex gap-2 overflow-x-auto overflow-y-hidden">
// 				{orgs?.map((org) => {
// 					const isSelected = selectedOrgId === org._id;

// 					return (
// 						<button
// 							key={org._id}
// 							onClick={() => setSelectedOrgId(org._id)}
// 							className="group shrink-0 rounded-3xl border p-1 transition hover:scale-[1.03]"
// 							style={{
// 								borderColor: isSelected ? 'color-mix(in srgb, var(--text-main) 18%, var(--border))' : 'transparent',
// 								background: isSelected ? 'color-mix(in srgb, var(--text-main) 8%, transparent)' : 'transparent',
// 							}}
// 						>
// 							<div className="flex h-20 w-20 items-center justify-center rounded-2xl text-sm font-semibold">
// 								{org?.name
// 									?.split(' ')
// 									.map((s) => s[0])
// 									.join('') ?? 'O'}
// 							</div>
// 						</button>
// 					);
// 				})}

// 				{/* create button */}
// 				<button
// 					onClick={createOrg}
// 					className="flex h-22 w-22 shrink-0 items-center justify-center rounded-3xl border transition hover:scale-[1.05]"
// 					style={{
// 						borderColor: 'color-mix(in srgb, var(--accent) 30%, var(--border))',
// 						background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
// 					}}
// 				>
// 					<Plus className="h-6 w-6" />
// 				</button>
// 			</div>

// 			{/* banner */}
// 			{selectedOrgId && (
// 				<div
// 					className="rounded-3xl border p-6"
// 					style={{
// 						borderColor: 'var(--border)',
// 						background: 'color-mix(in srgb, var(--bg-panel) 88%, transparent)',
// 					}}
// 				>
// 					<motion.div
// 						key={selectedOrgId}
// 						initial={{ opacity: 0, y: 10 }}
// 						animate={{ opacity: 1, y: 0 }}
// 						className="relative overflow-hidden rounded-3xl border"
// 						style={{
// 							borderColor: 'var(--border)',
// 							background: 'var(--bg-panel)',
// 						}}
// 					>
// 						<div
// 							className="absolute inset-0"
// 							style={{
// 								background: 'radial-gradient(circle at top right, color-mix(in srgb, var(--accent) 12%, transparent), transparent 35%)',
// 							}}
// 						/>

// 						<div className="relative flex min-h-65 items-end gap-4 px-6 pb-7 pt-6">
// 							<div
// 								className="shrink-0 rounded-[1.4rem] border p-1 shadow-2xl backdrop-blur-md"
// 								style={{
// 									borderColor: 'var(--border)',
// 									background: 'color-mix(in srgb, var(--bg-panel) 82%, transparent)',
// 								}}
// 							>
// 								<div className="flex h-20 w-20 items-center justify-center rounded-2xl text-xl font-semibold">
// 									{profile?.name
// 										?.split(' ')
// 										.map((s) => s[0])
// 										.join('') ?? 'O'}
// 								</div>
// 							</div>

// 							<div>
// 								<h2 className="text-2xl font-semibold" style={{ color: 'var(--text-main)' }}>
// 									{profile?.name ?? 'Organization'}
// 								</h2>

// 								<p
// 									className="text-sm"
// 									style={{
// 										color: 'color-mix(in srgb, var(--text-main) 65%, transparent)',
// 									}}
// 								>
// 									{selectedOrgId}
// 								</p>
// 							</div>
// 						</div>
// 					</motion.div>
// 				</div>
// 			)}

// 			{/* content */}
// 			<div
// 				className="rounded-3xl border p-6"
// 				style={{
// 					borderColor: 'var(--border)',
// 					background: 'color-mix(in srgb, var(--bg-panel) 88%, transparent)',
// 				}}
// 			>
// 				{profileLoading ? <div className="text-sm opacity-60">Loading...</div> : profile ? <OrgGeneral profile={profile} setProfile={setProfile} id={selectedOrgId!} /> : null}
// 			</div>
// 		</div>
// 	);
// }

// function OrgGeneral({ profile, setProfile, id }: any) {
// 	const [form, setForm] = useState({
// 		name: profile.name || '',
// 		description: profile.description || '',
// 	});

// 	const [baseline, setBaseline] = useState(form);
// 	const [saving, setSaving] = useState(false);

// 	useEffect(() => {
// 		const next = {
// 			name: profile.name || '',
// 			description: profile.description || '',
// 		};

// 		setForm(next);
// 		setBaseline(next);
// 	}, [profile]);

// 	const hasChanges = JSON.stringify(form) !== JSON.stringify(baseline);

// 	function updateField(key: string, value: string) {
// 		setForm((prev) => ({ ...prev, [key]: value }));
// 	}

// 	async function handleSave() {
// 		if (!hasChanges || saving) return;

// 		try {
// 			setSaving(true);

// 			const res = await fetch(`/api/v1/organizations/${id}/profile`, {
// 				method: 'PATCH',
// 				headers: { 'Content-Type': 'application/json' },
// 				body: JSON.stringify(form),
// 			});

// 			const updated = await res.json();

// 			setProfile(updated);
// 			setBaseline(form);
// 		} finally {
// 			setSaving(false);
// 		}
// 	}

// 	function handleReset() {
// 		setForm(baseline);
// 	}

// 	return (
// 		<div className="flex flex-col gap-4">
// 			<div className="flex justify-end gap-2">
// 				<button onClick={handleReset} disabled={!hasChanges} className="rounded-2xl border px-4 py-2 text-sm opacity-70">
// 					Reset
// 				</button>

// 				<button onClick={handleSave} disabled={!hasChanges || saving} className="rounded-2xl border px-4 py-2 text-sm font-medium">
// 					{saving ? 'Saving...' : hasChanges ? 'Save changes' : 'Saved'}
// 				</button>
// 			</div>

// 			<input value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Organization name" className="rounded-2xl border px-4 py-3 text-sm" />

// 			<textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Description" rows={4} className="rounded-2xl border px-4 py-3 text-sm" />
// 		</div>
// 	);
// }
