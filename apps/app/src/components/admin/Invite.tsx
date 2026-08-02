/** @format */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, Copy, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { PermissionFlagsBits } from 'discord-api-types/v10';

type Invite = {
	id: string;
	name: string;
	shortName?: string;
	permissions: string;
};

const ALL_PERMISSIONS = Object.entries(PermissionFlagsBits);

export default function Invites() {
	const [invites, setInvites] = useState<Invite[]>([]);
	const [open, setOpen] = useState<string | null>(null);
	const [search, setSearch] = useState('');

	const [editing, setEditing] = useState<string | null>(null);
	const [edit, setEdit] = useState<Record<string, Invite>>({});
	const [selectedPerms, setSelectedPerms] = useState<Record<string, bigint[]>>({});

	const [creating, setCreating] = useState(false);
	const [newInvite, setNewInvite] = useState<Invite>({
		id: '',
		name: '',
		shortName: '',
		permissions: '0',
	});

	useEffect(() => {
		load();
	}, []);

	async function load() {
		const res = await fetch('/api/v1/invite');
		const data = await res.json();
		setInvites(data.invites);
	}

	function toggleOpen(id: string) {
		setOpen((prev) => (prev === id ? null : id));
	}

	function startEdit(invite: Invite) {
		setEditing(invite.id);
		setEdit((prev) => ({ ...prev, [invite.id]: invite }));

		const perms = BigInt(invite.permissions);
		const selected = ALL_PERMISSIONS.filter(([_, value]) => (perms & value) === value).map(([_, value]) => value);

		setSelectedPerms((prev) => ({ ...prev, [invite.id]: selected }));
	}

	function togglePerm(id: string, value: bigint) {
		setSelectedPerms((prev) => {
			const list = prev[id] || [];
			return {
				...prev,
				[id]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
			};
		});
	}

	function computePerms(id: string) {
		return (selectedPerms[id] || []).reduce((a, b) => a | b, 0n).toString();
	}

	async function save(id: string) {
		const data = edit[id];

		await fetch(`/api/v1/invite/${id}`, {
			method: 'PATCH',
			body: JSON.stringify({
				name: data.name,
				shortName: data.shortName,
				permissions: computePerms(id),
			}),
		});

		setEditing(null);
		load();
	}

	async function create() {
		await fetch('/api/v1/invite', {
			method: 'POST',
			body: JSON.stringify(newInvite),
		});

		setCreating(false);
		setNewInvite({ id: '', name: '', shortName: '', permissions: '0' });
		load();
	}

	async function remove(id: string) {
		await fetch(`/api/v1/invite/${id}`, { method: 'DELETE' });
		setOpen(null);
		load();
	}

	return (
		<div className="flex flex-col mx-auto w-full max-w-9xl gap-6 px-4 py-6 sm:p-6">
			{/* HEADER */}
			<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
				<h1 className="text-2xl font-semibold">Invites</h1>

				<button onClick={() => setCreating(true)} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm" style={{ background: 'var(--accent)', color: '#fff' }}>
					<Plus size={16} /> New
				</button>
			</div>

			{/* SEARCH */}
			<input
				value={search}
				onChange={(e) => setSearch(e.target.value)}
				placeholder="Search..."
				className="px-3 py-2 rounded-md text-sm outline-none w-full"
				style={{
					background: 'var(--bg-main)',
					border: '1px solid var(--border)',
				}}
			/>

			{/* CREATE */}
			<AnimatePresence>
				{creating && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="p-4 rounded-xl flex gap-2 flex-col sm:flex-row"
						style={{ background: 'var(--container)' }}
					>
						<input
							className="px-3 py-2 rounded-md text-sm outline-none w-full"
							style={{
								background: 'var(--bg-main)',
								border: '1px solid var(--border)',
							}}
							placeholder="Bot ID"
							value={newInvite.id}
							onChange={(e) => setNewInvite({ ...newInvite, id: e.target.value })}
						/>
						<input
							className="px-3 py-2 rounded-md text-sm outline-none w-full"
							style={{
								background: 'var(--bg-main)',
								border: '1px solid var(--border)',
							}}
							placeholder="Name"
							value={newInvite.name}
							onChange={(e) => setNewInvite({ ...newInvite, name: e.target.value })}
						/>
						<input
							className="px-3 py-2 rounded-md text-sm outline-none w-full"
							style={{
								background: 'var(--bg-main)',
								border: '1px solid var(--border)',
							}}
							placeholder="Short name"
							value={newInvite.shortName}
							onChange={(e) => setNewInvite({ ...newInvite, shortName: e.target.value })}
						/>
						<div className="flex flex-row gap-3">
							<button onClick={create}>
								<Check size={16} />
							</button>
							<button onClick={() => setCreating(false)}>
								<X size={16} />
							</button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* LIST */}
			{invites
				.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
				.map((invite) => {
					const isOpen = open === invite.id;
					const isEditing = editing === invite.id;
					const data = isEditing ? edit[invite.id] : invite;

					return (
						<motion.div
							key={invite.id}
							layout
							whileHover={{ y: -2 }}
							className="rounded-xl relative overflow-hidden"
							style={{
								background: 'var(--container)',
								border: '1px solid var(--border)',
								padding: 'calc(var(--ui-gap) * 1.5)',
							}}
						>
							{/* subtle hover glow */}
							<div
								className="absolute inset-0 opacity-0 hover:opacity-100 transition pointer-events-none"
								style={{
									background: 'radial-gradient(circle at top, color-mix(in srgb, var(--accent) 10%, transparent), transparent 70%)',
								}}
							/>

							{/* HEADER */}
							<div className={`flex ${isOpen ? 'flex-col' : 'flex-row'} sm:flex-row justify-between gap-3`}>
								{isEditing ? (
									<input
										value={data.name}
										onChange={(e) =>
											setEdit((p) => ({
												...p,
												[invite.id]: { ...data, name: e.target.value },
											}))
										}
										className="bg-transparent outline-none font-medium text-sm"
									/>
								) : (
									<div className="flex flex-col">
										<span className="font-medium">{invite.name}</span>
										{invite.shortName && <span className="text-xs text-(--text-muted)">{invite.shortName}</span>}
									</div>
								)}

								<div className="flex items-center gap-2">
									{isOpen && (
										<>
											{isEditing ? (
												<>
													<button onClick={() => save(invite.id)} className="p-1 rounded-md hover:bg-white/10">
														<Check size={16} />
													</button>
													<button onClick={() => setEditing(null)} className="p-1 rounded-md hover:bg-white/10">
														<X size={16} />
													</button>
												</>
											) : (
												<button onClick={() => startEdit(invite)} className="p-1 rounded-md hover:bg-white/10">
													<Pencil size={16} />
												</button>
											)}

											<button onClick={() => remove(invite.id)} className="p-1 rounded-md hover:bg-red-500/20">
												<Trash2 size={16} />
											</button>
										</>
									)}

									<button onClick={() => toggleOpen(invite.id)} className="p-1 rounded-md hover:bg-white/10">
										{isOpen ? <ChevronUp /> : <ChevronDown />}
									</button>
								</div>
							</div>

							{/* DETAILS */}
							<AnimatePresence>
								{isOpen && (
									<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
										<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.8)', marginTop: '1rem' }}>
											{/* ID COPY BOX */}
											<div
												className="flex  justify-between items-center gap-3 px-3 py-2 rounded-md text-xs font-mono"
												style={{
													background: 'var(--bg-main)',
													border: '1px solid var(--border)',
												}}
											>
												<span className="opacity-70 truncate break-all">{invite.id}</span>

												<button onClick={() => navigator.clipboard.writeText(invite.id)} className="p-1 rounded hover:bg-white/10">
													<Copy size={14} />
												</button>
											</div>

											{/* SHORT NAME EDIT */}
											{isEditing && (
												<input
													value={data.shortName || ''}
													onChange={(e) =>
														setEdit((p) => ({
															...p,
															[invite.id]: {
																...data,
																shortName: e.target.value,
															},
														}))
													}
													placeholder="Short name"
													className="px-3 py-2 rounded-md text-xs outline-none"
													style={{
														background: 'var(--bg-main)',
														border: '1px solid var(--border)',
													}}
												/>
											)}

											{/* PERMISSIONS */}
											<div
												className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 text-xs rounded-md p-3 overflow-auto"
												style={{
													background: 'var(--bg-main)',
													border: '1px solid var(--border)',
												}}
											>
												{ALL_PERMISSIONS.map(([key, value]) => {
													const active = (selectedPerms[invite.id] || []).includes(value);

													return (
														<label
															key={key}
															className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-md transition"
															style={{
																background: active ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent',
															}}
														>
															<span
																className="text-xs transition truncate"
																style={{
																	color: active ? 'var(--text-main)' : 'var(--text-muted)',
																}}
															>
																{key}
															</span>

															{/* toggle */}
															<button
																type="button"
																onClick={() => isEditing && togglePerm(invite.id, value)}
																disabled={!isEditing}
																className="relative w-9 h-5 rounded-full transition"
																style={{
																	background: active ? 'var(--accent)' : 'color-mix(in srgb, var(--border) 70%, transparent)',
																	opacity: isEditing ? 1 : 0.5,
																}}
															>
																<motion.div
																	layout
																	transition={{ type: 'spring', stiffness: 500, damping: 30 }}
																	className="absolute top-0.5 w-4 h-4 rounded-full bg-white"
																	style={{
																		left: active ? 'calc(100% - 18px)' : '2px',
																	}}
																/>
															</button>
														</label>
													);
												})}
											</div>

											{/* INVITE URL */}
											<div
												className="text-xs break-all px-2 py-1 rounded-md"
												style={{
													background: 'var(--bg-main)',
													border: '1px solid var(--border)',
													color: 'var(--text-muted)',
												}}
											>
												https://discord.com/oauth2/authorize?client_id=
												{invite.id}&permissions={computePerms(invite.id)}&scope=bot+applications.commands
											</div>
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
