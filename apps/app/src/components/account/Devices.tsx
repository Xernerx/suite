/** @format */

'use client';

import { Laptop, LogOut, Monitor, ShieldCheck, Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useToast } from '@/providers/ToastProvider';

type ActiveSession = {
	id: string;
	device: string;
	location: string;
	ipAddress: string;
	isCurrent: boolean;
	lastActive: string;
};

export default function Devices() {
	const { toast } = useToast();
	const [sessions, setSessions] = useState<ActiveSession[]>([]);
	const [loading, setLoading] = useState(true);

	// 1. Fetch active sessions on mount
	useEffect(() => {
		fetch('/api/v1/auth/sessions')
			.then((res) => res.json())
			.then((data) => {
				setSessions(data);
				setLoading(false);
			})
			.catch(() => {
				toast('Failed to load active sessions', 'error');
				setLoading(false);
			});
	}, [toast]);

	// 2. Handle signing out of a specific device
	const handleSignOut = async (sessionId: string) => {
		try {
			const response = await fetch(`/api/v1/auth/sessions/${sessionId}`, {
				method: 'DELETE',
			});

			if (!response.ok) throw new Error();

			// Remove the revoked session from the UI state instantly
			setSessions((prev) => prev.filter((session) => session.id !== sessionId));
			toast('Successfully signed out device', 'success');
		} catch (error) {
			toast('Failed to sign out device', 'error');
		}
	};

	// Helper to render matching platform icons
	const getDeviceIcon = (deviceName: string) => {
		const name = deviceName.toLowerCase();
		if (name.includes('iphone') || name.includes('android') || name.includes('phone')) {
			return <Smartphone className="h-5 w-5 text-neutral-400" />;
		}
		if (name.includes('mac') || name.includes('windows') || name.includes('laptop')) {
			return <Laptop className="h-5 w-5 text-neutral-400" />;
		}
		return <Monitor className="h-5 w-5 text-neutral-400" />;
	};

	if (loading) {
		return <div className="p-6 text-sm text-neutral-400 animate-pulse">Loading active devices...</div>;
	}

	return (
		<div className="w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-[#141418]">
			{/* Header Details */}
			<div className="mb-6 flex items-center gap-3 border-b border-neutral-100 pb-4 dark:border-neutral-800/60">
				<div className="rounded-xl bg-purple-500/10 p-2 text-purple-500">
					<ShieldCheck className="h-5 w-5" />
				</div>
				<div>
					<h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Device Sessions</h3>
					<p className="text-xs text-neutral-500 dark:text-neutral-400">Logs showing devices currently signed into your account. Revoke access to any unfamiliar clients.</p>
				</div>
			</div>

			{/* Sessions Iteration List */}
			<div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
				{sessions.map((session) => (
					<div key={session.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
						<div className="flex items-start gap-4 min-w-0">
							{/* Icon Wrapper */}
							<div className="mt-0.5 rounded-lg border border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-800 dark:bg-neutral-900">{getDeviceIcon(session.device)}</div>

							{/* Session Meta Description */}
							<div className="flex flex-col min-w-0">
								<div className="flex items-center gap-2">
									<span className="truncate text-sm font-medium text-neutral-900 dark:text-white">{session.device}</span>
									{session.isCurrent && (
										<span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-500">Current Device</span>
									)}
								</div>
								<p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
									{session.location} • <code className="text-[11px]">{session.ipAddress}</code>
								</p>
								<span className="mt-0.5 text-[11px] text-neutral-400 dark:text-neutral-500">{session.isCurrent ? 'Active now' : `Last active ${session.lastActive}`}</span>
							</div>
						</div>

						{/* Action Button */}
						{!session.isCurrent && (
							<button
								type="button"
								onClick={() => handleSignOut(session.id)}
								className="group flex cursor-pointer items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500 hover:text-white dark:border-red-500/30 dark:bg-red-500/10"
							>
								<LogOut className="h-3.5 w-3.5 transition group-hover:scale-95" />
								Sign out
							</button>
						)}
					</div>
				))}

				{sessions.length === 0 && <div className="py-4 text-center text-sm text-neutral-500 dark:text-neutral-400">No active sessions detected.</div>}
			</div>
		</div>
	);
}
