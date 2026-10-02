/** @format */

'use client';

import { AlertCircle, Check, Info, Loader2, Save, Sparkles, Trophy } from 'lucide-react';
import { Button, Input, Selector, Toggle } from '@xernerx/ui';
import { useCallback, useEffect, useState } from 'react';
import { useEnvironment, useToast } from '@xernerx/providers';

interface VirtueProfile {
	id: string;
	mode: 'easy' | 'casual' | 'balanced' | 'hard' | 'extreme';
	cycles: {
		daily: boolean;
		weekly: boolean;
		monthly: boolean;
	};
	roles: {
		ignored: string[];
		tracked: string[];
	};
	levelUp: boolean;
	levelMessage: string;
	levelChannel: string | null;
	autoDelete: number;
}

export default function VirtueGeneral({ id }: { id?: string }) {
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();

	const [profile, setProfile] = useState<VirtueProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const [mode, setMode] = useState<'easy' | 'casual' | 'balanced' | 'hard' | 'extreme'>('balanced');
	const [cycles, setCycles] = useState({ daily: false, weekly: false, monthly: false });
	const [ignoredRoles, setIgnoredRoles] = useState('');
	const [trackedRoles, setTrackedRoles] = useState('');
	const [levelUp, setLevelUp] = useState(true);
	const [levelMessage, setLevelMessage] = useState('[@mention] reached level [@level] :tada:!');
	const [levelChannel, setLevelChannel] = useState('');
	const [autoDelete, setAutoDelete] = useState(0);

	const fetchProfile = useCallback(async () => {
		if (!id) return;
		setLoading(true);

		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${id}/virtue`), {
				credentials: 'include',
			});

			if (res.ok) {
				const data = await res.json();
				setProfile(data);
				setMode(data.mode || 'balanced');
				setCycles(data.cycles || { daily: false, weekly: false, monthly: false });
				setIgnoredRoles(Array.isArray(data.roles?.ignored) ? data.roles.ignored.join(', ') : '');
				setTrackedRoles(Array.isArray(data.roles?.tracked) ? data.roles.tracked.join(', ') : '');
				setLevelUp(data.levelUp ?? true);
				setLevelMessage(data.levelMessage || '[@mention] reached level [@level] :tada:!');
				setLevelChannel(data.levelChannel || '');
				setAutoDelete(data.autoDelete || 0);
			} else {
				setProfile(null);
			}
		} catch (err) {
			console.error('Failed to fetch Virtue profile:', err);
			setProfile(null);
		} finally {
			setLoading(false);
		}
	}, [id, getEnvUrl]);

	useEffect(() => {
		fetchProfile();
	}, [fetchProfile]);

	const handleSave = async () => {
		if (!id) return;
		setSaving(true);

		const payload = {
			mode,
			cycles,
			roles: {
				ignored: ignoredRoles
					.split(',')
					.map((r) => r.trim())
					.filter(Boolean),
				tracked: trackedRoles
					.split(',')
					.map((r) => r.trim())
					.filter(Boolean),
			},
			levelUp,
			levelMessage,
			levelChannel: levelChannel.trim() || null,
			autoDelete: Number(autoDelete) || 0,
		};

		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${id}/virtue`), {
				method: 'PATCH',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});

			if (res.ok) {
				const updated = await res.json();
				setProfile(updated);
				toast({
					title: 'Virtue settings saved successfully',
					type: 'success',
				});
			} else {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || 'Failed to update Virtue settings');
			}
		} catch (err: any) {
			console.error('Failed to save Virtue settings:', err);
			toast({
				title: 'Error saving Virtue settings',
				description: err.message,
				type: 'error',
			});
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-(--text-muted)">
				<Loader2 className="w-8 h-8 animate-spin text-(--accent) mb-3" />
				<span className="text-sm font-medium">Loading Virtue configuration...</span>
			</div>
		);
	}

	if (!profile) {
		return (
			<div className="flex flex-col items-center text-center justify-center bg-(--accent)/5 border border-(--accent)/20 rounded-[2rem] p-10 shadow-xl animate-in fade-in zoom-in-95 duration-300">
				<div className="w-16 h-16 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent) mb-4 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_20%,transparent)]">
					<Sparkles className="w-8 h-8" />
				</div>
				<h3 className="text-xl font-extrabold text-(--text) mb-2">Virtue is not added to this server</h3>
				<p className="text-sm text-(--text-muted) mb-6 max-w-md">
					This server requires Virtue to be added in order to configure leveling systems, custom leveling messages, cycle resets, and role tracking.
				</p>
				<a
					href={getEnvUrl('https://xernerx.com/invites/virtue')}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center justify-center gap-2 rounded-2xl bg-(--accent) text-white font-bold text-sm px-6 py-3 shadow-lg shadow-(--accent)/20 hover:opacity-90 transition-all hover:scale-[1.02]"
				>
					<Sparkles size={16} />
					<span>Invite Virtue to Server</span>
				</a>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-8">
			{/* Virtue Leveling Configuration Card */}
			<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-[2rem] p-8 shadow-xl">
				<div className="flex items-center justify-between mb-6">
					<div className="flex items-center gap-3 text-(--text) font-extrabold text-sm tracking-widest uppercase">
						<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
							<Trophy className="w-4 h-4" />
						</div>
						Virtue Leveling System
					</div>
					<Button
						onClick={handleSave}
						disabled={saving}
						className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-(--accent) text-white text-xs font-bold shadow-md hover:opacity-90 transition-all"
					>
						{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
						<span>{saving ? 'Saving...' : 'Save Changes'}</span>
					</Button>
				</div>

				<div className="flex flex-col gap-6">
					{/* Level Mode Selector */}
					<div className="flex flex-col gap-2">
						<label className="text-sm font-bold text-(--text)">Leveling Difficulty Mode</label>
						<Selector
							value={mode}
							onChange={(val: any) => setMode(val)}
							options={[
								{ label: 'Easy (Quick progression)', value: 'easy' },
								{ label: 'Casual (Relaxed rate)', value: 'casual' },
								{ label: 'Balanced (Standard progression)', value: 'balanced' },
								{ label: 'Hard (Demanding milestones)', value: 'hard' },
								{ label: 'Extreme (Maximum grinding)', value: 'extreme' },
							]}
						/>
					</div>

					{/* Reset Cycles */}
					<div className="flex flex-col gap-2">
						<label className="text-sm font-bold text-(--text)">Leaderboard Reset Cycles</label>
						<p className="text-xs text-(--text-muted)">Toggle scheduled recurring experience resets for competition seasons.</p>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
							{(['daily', 'weekly', 'monthly'] as const).map((cycleKey) => {
								const active = cycles[cycleKey];
								return (
									<button
										key={cycleKey}
										type="button"
										onClick={() => setCycles((prev) => ({ ...prev, [cycleKey]: !active }))}
										className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-all ${
											active
												? 'border-(--accent) bg-(--accent)/10 text-(--text) font-bold shadow-sm'
												: 'border-(--border)/10 bg-(--background)/50 text-(--text-muted) hover:border-(--border)/20'
										}`}
									>
										<span className="capitalize text-sm">{cycleKey} Cycle</span>
										{active && <Check size={16} className="text-(--accent)" />}
									</button>
								);
							})}
						</div>
					</div>

					{/* Level Up Announcement Toggle */}
					<div className="flex items-center justify-between p-4 rounded-2xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md">
						<div className="flex flex-col">
							<span className="text-sm font-bold text-(--text)">Announce Level Ups</span>
							<span className="text-xs text-(--text-muted)">Post an announcement message when a member reaches a new level.</span>
						</div>
						<Toggle checked={levelUp} onChange={(e) => setLevelUp(e.target.checked)} size="sm" />
					</div>

					{/* Conditional Message Settings */}
					{levelUp && (
						<div className="flex flex-col gap-4 p-5 rounded-2xl border border-(--border)/10 bg-(--background)/30">
							<div className="flex flex-col gap-2">
								<label className="text-sm font-bold text-(--text)">Level-up Message Template</label>
								<textarea
									value={levelMessage}
									onChange={(e) => setLevelMessage(e.target.value)}
									placeholder="[@mention] reached level [@level] :tada:!"
									rows={3}
									className="w-full rounded-2xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md text-sm text-(--text) focus:outline-none focus:ring-2 focus:ring-(--accent) resize-none p-3.5"
								/>
								<span className="text-[11px] text-(--text-muted)">
									Variables: <code>[@mention]</code>, <code>[@level]</code>, <code>[@username]</code>
								</span>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="flex flex-col gap-2">
									<label className="text-sm font-bold text-(--text)">Announcement Channel ID (Optional)</label>
									<Input value={levelChannel} onChange={(e) => setLevelChannel(e.target.value)} placeholder="Leave empty to send in current channel" />
								</div>

								<div className="flex flex-col gap-2">
									<div className="flex items-center justify-between">
										<label className="text-sm font-bold text-(--text)">Auto-delete Message</label>
										<span className="text-xs text-(--text-muted)">{autoDelete > 0 ? `${autoDelete}s` : 'Disabled'}</span>
									</div>
									<Input
										type="number"
										min={0}
										max={60}
										value={autoDelete.toString()}
										onChange={(e) => setAutoDelete(Number(e.target.value) || 0)}
										placeholder="0 disables auto-delete (max 60s)"
									/>
								</div>
							</div>
						</div>
					)}

					{/* Role Rules */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="flex flex-col gap-2">
							<label className="text-sm font-bold text-(--text)">Ignored Roles (IDs)</label>
							<Input value={ignoredRoles} onChange={(e) => setIgnoredRoles(e.target.value)} placeholder="Comma-separated Role IDs" />
							<span className="text-[11px] text-(--text-muted)">Members with these roles will not gain experience.</span>
						</div>

						<div className="flex flex-col gap-2">
							<label className="text-sm font-bold text-(--text)">Tracked Roles (IDs)</label>
							<Input value={trackedRoles} onChange={(e) => setTrackedRoles(e.target.value)} placeholder="Comma-separated Role IDs" />
							<span className="text-[11px] text-(--text-muted)">If specified, only members with these roles gain experience.</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
