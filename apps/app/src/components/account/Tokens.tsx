/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, Copy, Info, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

/* ================= TYPES ================= */

type Token = {
	id: string;
	name: string;
	status: string;
};

type TokenDetails = {
	id: string;
	owners: string[];
	status: string;
	botId: string;
};

/* ================= HELPERS ================= */

function getStatusColor(status?: string) {
	switch (status) {
		case 'active':
			return 'rgb(34,197,94)';
		case 'pending':
			return 'rgb(234,179,8)';
		case 'suspended':
			return 'rgb(239,68,68)';
		default:
			return 'rgb(100,116,139)';
	}
}

/* ================= PAGE ================= */

export default function Tokens() {
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [tokens, setTokens] = useState<Token[]>([]);
	const [open, setOpen] = useState<string | null>(null);

	const [tokenDetails, setTokenDetails] = useState<Record<string, TokenDetails>>({});
	const [owners, setOwners] = useState<Record<string, any[]>>({});
	const [bots, setBots] = useState<Record<string, any>>({});
	const [copied, setCopied] = useState<string | null>(null);

	const [creating, setCreating] = useState(false);
	const [newName, setNewName] = useState('');

	const [editing, setEditing] = useState<string | null>(null);
	const [editName, setEditName] = useState('');
	const [editOwners, setEditOwners] = useState<Record<string, string[]>>({});
	const [newOwnerId, setNewOwnerId] = useState<Record<string, string>>({});

	const [deleting, setDeleting] = useState<string | null>(null);

	/* ================= DATA ================= */

	async function handleTokenData(id: string) {
		if (open === id) return setOpen(null);
		setOpen(id);

		if (tokenDetails[id]) return;

		const t: TokenDetails = await fetch(`/api/v1/tokens/api/${id}`).then((r) => r.json());
		setTokenDetails((p) => ({ ...p, [id]: t }));

		const ownerData = await Promise.all(t.owners.map((o) => fetch(`/api/v1/discord/users/${o}/profile`).then((r) => r.json())));
		setOwners((p) => ({ ...p, [id]: ownerData.map((d) => d.user) }));

		const bot = await fetch(`/api/v1/discord/users/${t.botId}/profile`).then((r) => r.json());
		setBots((p) => ({ ...p, [id]: bot.user }));
	}

	function copyToClipboard(id: string) {
		navigator.clipboard.writeText(id);
		setCopied(id);
		setTimeout(() => setCopied(null), 1000);
	}

	async function createToken() {
		if (!newName.trim()) return;

		const res = await fetch('/api/v1/tokens/api/create', {
			method: 'POST',
			body: JSON.stringify({ name: newName }),
		});

		if (!res.ok) return;

		const token = await res.json();
		setTokens((p) => [token, ...p]);

		setNewName('');
		setCreating(false);
	}

	async function saveEdit(id: string) {
		const res = await fetch(`/api/v1/tokens/api/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: editName,
				owners: editOwners[id],
			}),
		});

		if (!res.ok) return;

		const updated = await res.json();

		// update token name
		setTokens((p) => p.map((t) => (t.id === id ? { ...t, name: updated.name } : t)));

		// update token details
		setTokenDetails((p) => ({
			...p,
			[id]: updated,
		}));

		// 🔥 THIS IS WHAT YOU WERE MISSING
		// re-fetch owners so UI updates immediately
		const ownerData = await Promise.all(updated.owners.map((o: string) => fetch(`/api/v1/discord/users/${o}/profile`).then((r) => r.json())));

		setOwners((p) => ({
			...p,
			[id]: ownerData.map((d) => d.user),
		}));

		// optional: refresh bot too (if it could change)
		if (updated.botId) {
			const bot = await fetch(`/api/v1/discord/users/${updated.botId}/profile`).then((r) => r.json());
			setBots((p) => ({
				...p,
				[id]: bot.user,
			}));
		}

		setEditing(null);
	}

	async function confirmDelete(id: string) {
		await fetch(`/api/v1/tokens/api/${id}`, { method: 'DELETE' });

		setTokens((p) => p.filter((t) => t.id !== id));
		setDeleting(null);
		setOpen(null);
	}

	useEffect(() => {
		(async () => {
			const tokens = await fetch('/api/v1/tokens/api').then((r) => r.json());
			setTokens(tokens);
			setLoading(false);
		})();
	}, []);

	if (loading) {
		return (
			<div className="flex items-center justify-center h-[60vh]" style={{ color: 'var(--text-muted)' }}>
				Loading tokens...
			</div>
		);
	}

	return (
		<div className="flex flex-col w-full" style={{ gap: 'calc(var(--ui-gap) * 2)' }}>
			{/* HEADER */}
			<div
				className="flex items-center justify-between rounded-xl"
				style={{
					background: 'var(--container)',
					border: '1px solid var(--border)',
					padding: 'calc(var(--ui-gap) * 1.5)',
				}}
			>
				<div className="flex flex-col">
					<span className="text-sm font-medium">Tokens</span>
					<span className="text-xs" style={{ color: 'var(--text-muted)' }}>
						Manage API access and ownership.
					</span>
				</div>

				<button
					onClick={() => setCreating(true)}
					className="flex items-center gap-2 text-sm rounded-md"
					style={{
						padding: '8px 12px',
						background: 'var(--accent)',
						color: '#fff',
					}}
				>
					<Plus size={14} />
					New
				</button>
			</div>

			{/* SEARCH */}
			<input
				value={search}
				onChange={(e) => setSearch(e.target.value)}
				placeholder="Search tokens..."
				className="px-3 py-2 rounded-md text-sm outline-none"
				style={{
					background: 'var(--bg-main)',
					border: '1px solid var(--border)',
				}}
			/>

			{/* CREATE */}
			<AnimatePresence>
				{creating && (
					<motion.div
						initial={{ opacity: 0, y: -6 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0 }}
						className="flex gap-2 rounded-xl"
						style={{
							background: 'var(--container)',
							border: '1px solid var(--border)',
							padding: 'calc(var(--ui-gap) * 1)',
						}}
					>
						<input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Token name" className="flex-1 bg-transparent outline-none text-sm" />

						<button onClick={createToken}>
							<Check size={16} />
						</button>
						<button onClick={() => setCreating(false)}>
							<X size={16} />
						</button>
					</motion.div>
				)}
			</AnimatePresence>

			{/* LIST */}
			{tokens
				.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.id.includes(search))
				.map((t) => {
					const details = tokenDetails[t.id];
					const statusColor = getStatusColor(t.status);

					return (
						<motion.div
							key={t.id}
							layout
							className="rounded-xl flex flex-col"
							style={{
								background: 'var(--container)',
								border: '1px solid var(--border)',
								padding: 'calc(var(--ui-gap) * 1.5)',
								gap: 'calc(var(--ui-gap) * 1)',
							}}
						>
							{/* HEADER */}
							<div className="flex justify-between items-center">
								{/* LEFT */}
								<div className="flex items-center gap-2">
									<div
										style={{
											width: 8,
											height: 8,
											borderRadius: 999,
											background: statusColor,
										}}
									/>
									{editing === t.id ? (
										<input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-transparent outline-none text-sm" style={{ color: 'var(--text-main)' }} />
									) : (
										<span className="text-sm font-medium">{t.name}</span>
									)}
								</div>

								{/* RIGHT */}
								<div className="flex items-center gap-1">
									{/* ACTIONS (only when open) */}
									{open === t.id && (
										<>
											{/* EDIT */}
											{editing === t.id ? (
												<>
													<button onClick={() => saveEdit(t.id)} className="p-1 rounded hover:bg-white/5">
														<Check size={14} />
													</button>
													<button onClick={() => setEditing(null)} className="p-1 rounded hover:bg-white/5">
														<X size={14} />
													</button>
												</>
											) : (
												<button
													onClick={() => {
														setEditing(t.id);
														setEditName(t.name);
														setEditOwners((prev) => ({
															...prev,
															[t.id]: [...(tokenDetails[t.id]?.owners || [])],
														}));
													}}
													className="p-1 rounded hover:bg-white/5"
												>
													<Pencil size={14} />
												</button>
											)}

											{/* DELETE */}
											{deleting === t.id ? (
												<>
													<button onClick={() => confirmDelete(t.id)} className="p-1 rounded text-red-400 hover:bg-red-500/10">
														<Check size={14} />
													</button>
													<button onClick={() => setDeleting(null)} className="p-1 rounded hover:bg-white/5">
														<X size={14} />
													</button>
												</>
											) : (
												<button onClick={() => setDeleting(t.id)} className="p-1 rounded hover:bg-red-500/10 text-red-400">
													<Trash2 size={14} />
												</button>
											)}
										</>
									)}

									{/* TOGGLE */}
									<button onClick={() => handleTokenData(t.id)} className="p-1 rounded hover:bg-white/5">
										{open === t.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
									</button>
								</div>
							</div>

							{/* DETAILS */}
							<AnimatePresence>
								{open === t.id && (
									<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
										<div className="flex flex-col gap-3 text-sm">
											{/* TOKEN ID */}
											<div
												onClick={() => copyToClipboard(details?.id)}
												className="flex justify-between items-center px-3 py-2 rounded-md cursor-pointer"
												style={{
													background: 'var(--bg-main)',
													border: '1px solid var(--border)',
												}}
											>
												<span className="font-mono text-xs opacity-70 truncate pr-2">{details?.id}</span>

												{copied === details?.id ? <Check size={14} /> : <Copy size={14} />}
											</div>

											{/* STATUS */}
											<div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
												<span>{details?.status}</span>
												<Info size={12} />
											</div>

											{/* BOT */}
											{bots[t.id] && (
												<div className="flex flex-col gap-1">
													<span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
														Linked Bot
													</span>

													<div
														className="flex items-center gap-2 px-3 py-2 rounded-md"
														style={{
															background: 'var(--bg-main)',
															border: '1px solid var(--border)',
														}}
													>
														<img src={`https://cdn.discordapp.com/avatars/${bots[t.id].id}/${bots[t.id].avatar}.webp`} className="w-5 h-5 rounded-full" />
														<span className="text-sm">{bots[t.id].username}</span>
													</div>
												</div>
											)}

											{/* OWNERS */}
											{/* OWNERS */}
											{(owners[t.id] || editing === t.id) && (
												<div className="flex flex-col gap-1">
													<span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
														Owners
													</span>

													<div className="flex flex-col gap-2">
														{(editing === t.id ? editOwners[t.id] || [] : owners[t.id]?.map((o) => o.id))?.map((id) => {
															const user = owners[t.id]?.find((o) => o.id === id);

															return (
																<div
																	key={id}
																	className="flex items-center gap-2 px-3 py-2 rounded-md"
																	style={{
																		background: 'var(--bg-main)',
																		border: '1px solid var(--border)',
																	}}
																>
																	{user && <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp`} className="w-5 h-5 rounded-full" />}

																	<span className="text-xs flex-1">{user?.username || id}</span>

																	{/* REMOVE (edit mode only) */}
																	{editing === t.id && (
																		<button
																			onClick={() =>
																				setEditOwners((prev) => ({
																					...prev,
																					[t.id]: prev[t.id].filter((o) => o !== id),
																				}))
																			}
																			className="p-1 rounded hover:bg-red-500/10 text-red-400"
																		>
																			<X size={12} />
																		</button>
																	)}
																</div>
															);
														})}
													</div>

													{/* ADD OWNER */}
													{editing === t.id && (
														<div className="flex gap-2 mt-2">
															<input
																placeholder="User ID"
																value={newOwnerId[t.id] || ''}
																onChange={(e) =>
																	setNewOwnerId((prev) => ({
																		...prev,
																		[t.id]: e.target.value,
																	}))
																}
																className="flex-1 px-3 py-2 rounded-md text-sm outline-none"
																style={{
																	background: 'var(--bg-main)',
																	border: '1px solid var(--border)',
																}}
															/>

															<button
																onClick={async () => {
																	const id = newOwnerId[t.id]?.trim();

																	// basic validation (Discord IDs are numeric strings)
																	if (!id || !/^\d{17,20}$/.test(id)) {
																		return; // silently ignore or show error later
																	}

																	try {
																		const res = await fetch(`/api/v1/discord/users/${id}/profile`);

																		if (!res.ok) throw new Error('Invalid user');

																		const data = await res.json();

																		// update UI immediately
																		setOwners((prev) => ({
																			...prev,
																			[t.id]: [...(prev[t.id] || []), data.user],
																		}));

																		setEditOwners((prev) => ({
																			...prev,
																			[t.id]: [...(prev[t.id] || []), id],
																		}));

																		setNewOwnerId((prev) => ({ ...prev, [t.id]: '' }));
																	} catch {
																		// optional: show error UI instead of crashing
																		console.warn('Invalid user ID');
																	}
																}}
																className="px-3 rounded-md hover:bg-white/5"
															>
																<Plus size={14} />
															</button>
														</div>
													)}
												</div>
											)}
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</motion.div>
					);
				})}
		</div>
	);
}
