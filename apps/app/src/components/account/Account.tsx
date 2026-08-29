// /** @format */
// 'use client';

// import { LogOut, Trash2, User } from 'lucide-react';

// import { motion } from 'framer-motion';
// import { signOut } from 'next-auth/react';
// import { useToast } from '@/providers/ToastProvider';
// import { useUser } from '@/providers/UserProvider';

// export default function Account() {
// 	const { user } = useUser();
// 	const { toast } = useToast();

// 	const handleDeleteData = () => {
// 		if (!user?.id) return;

// 		fetch(`/api/v1/users/${user.id}/profile`, { method: 'DELETE' })
// 			.then(() => {
// 				toast('Successfully deleted user data', 'success');
// 				signOut();
// 			})
// 			.catch(() => toast('Unable to delete user data at this time.', 'error'));
// 	};

// 	const handleSignOut = () => {
// 		toast('Signed out!', 'success');
// 		signOut();
// 	};

// 	return (
// 		<div className="flex flex-col w-full" style={{ gap: 'calc(var(--ui-gap) * 2)' }}>
// 			{/* USER INFO */}
// 			<motion.div
// 				initial={{ opacity: 0, y: 6 }}
// 				animate={{ opacity: 1, y: 0 }}
// 				transition={{ duration: 0.15 }}
// 				className="rounded-xl flex flex-col"
// 				style={{
// 					background: 'var(--container)',
// 					border: '1px solid var(--border)',
// 					padding: 'calc(var(--ui-gap) * 1.5)',
// 					gap: 'calc(var(--ui-gap) * 1.2)',
// 				}}
// 			>
// 				<div className="flex items-center gap-3">
// 					<div
// 						className="p-2 rounded-md"
// 						style={{
// 							background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
// 							color: 'rgb(var(--accent))',
// 						}}
// 					>
// 						<User size={16} />
// 					</div>

// 					<div className="flex flex-col">
// 						<span className="text-sm font-medium">User Information</span>
// 						<span className="text-xs" style={{ color: 'var(--text-muted)' }}>
// 							Account details for your Xernerx profile.
// 						</span>
// 					</div>
// 				</div>

// 				<div className="flex flex-col text-sm" style={{ gap: 2 }}>
// 					<p>
// 						Signed in as <span className="font-medium">@{user?.username}</span>
// 					</p>
// 					<p>
// 						Using <span className="font-medium">{user?.email}</span>
// 					</p>
// 				</div>
// 			</motion.div>

// 			{/* LOG OUT */}
// 			<motion.div
// 				initial={{ opacity: 0, y: 6 }}
// 				animate={{ opacity: 1, y: 0 }}
// 				transition={{ duration: 0.15, delay: 0.05 }}
// 				className="rounded-xl flex flex-col"
// 				style={{
// 					background: 'var(--container)',
// 					border: '1px solid var(--border)',
// 					padding: 'calc(var(--ui-gap) * 1.5)',
// 					gap: 'calc(var(--ui-gap) * 1.2)',
// 				}}
// 			>
// 				<div className="flex items-center gap-3">
// 					<div
// 						className="p-2 rounded-md"
// 						style={{
// 							background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
// 							color: 'rgb(var(--accent))',
// 						}}
// 					>
// 						<LogOut size={16} />
// 					</div>

// 					<div className="flex flex-col">
// 						<span className="text-sm font-medium">Log Out</span>
// 						<span className="text-xs" style={{ color: 'var(--text-muted)' }}>
// 							End your current session.
// 						</span>
// 					</div>
// 				</div>

// 				<button
// 					onClick={handleSignOut}
// 					className="flex items-center justify-center gap-2 text-sm rounded-md transition"
// 					style={{
// 						padding: '8px 12px',
// 						background: 'var(--accent)',
// 						color: '#fff',
// 					}}
// 				>
// 					<LogOut size={14} />
// 					Log Out
// 				</button>
// 			</motion.div>

// 			{/* DELETE DATA */}
// 			<motion.div
// 				initial={{ opacity: 0, y: 6 }}
// 				animate={{ opacity: 1, y: 0 }}
// 				transition={{ duration: 0.15, delay: 0.1 }}
// 				className="rounded-xl flex flex-col"
// 				style={{
// 					background: 'var(--container)',
// 					border: '1px solid color-mix(in srgb, red 30%, var(--border))',
// 					padding: 'calc(var(--ui-gap) * 1.5)',
// 					gap: 'calc(var(--ui-gap) * 1.2)',
// 				}}
// 			>
// 				<div className="flex items-center gap-3">
// 					<div
// 						className="p-2 rounded-md"
// 						style={{
// 							background: 'color-mix(in srgb, red 12%, transparent)',
// 							color: '#f87171',
// 						}}
// 					>
// 						<Trash2 size={16} />
// 					</div>

// 					<div className="flex flex-col">
// 						<span className="text-sm font-medium">User Data</span>
// 						<span className="text-xs" style={{ color: 'var(--text-muted)' }}>
// 							Permanently delete your stored user data.
// 						</span>
// 					</div>
// 				</div>

// 				<button
// 					onClick={handleDeleteData}
// 					className="flex items-center justify-center gap-2 text-sm rounded-md transition"
// 					style={{
// 						padding: '8px 12px',
// 						color: '#f87171',
// 						border: '1px solid color-mix(in srgb, red 40%, transparent)',
// 						background: 'transparent',
// 					}}
// 					onMouseEnter={(e) => {
// 						e.currentTarget.style.background = 'color-mix(in srgb, red 10%, transparent)';
// 					}}
// 					onMouseLeave={(e) => {
// 						e.currentTarget.style.background = 'transparent';
// 					}}
// 				>
// 					<Trash2 size={14} />
// 					Delete User Data
// 				</button>
// 			</motion.div>
// 		</div>
// 	);
// }
