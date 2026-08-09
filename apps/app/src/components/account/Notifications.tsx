// /** @format */
// 'use client';

// import { useEffect, useState } from 'react';

// import { BellDot } from 'lucide-react';
// import { motion } from 'framer-motion';
// import { useUser } from '@/providers/UserProvider';

// export default function Notifications() {
// 	const { user, updateUser } = useUser();

// 	const [notificationState, setNotificationState] = useState<any>({});

// 	const notifications = {
// 		general: {
// 			birthday: {
// 				toggles: ['discord', 'mail'],
// 				description: 'Where the bot can wish you a happy birthday!',
// 			},
// 		},

// 		virtue: {
// 			levelup: {
// 				toggles: ['discord'],
// 				description: 'Whether the bot is allowed to send you global level up messages',
// 			},
// 		},
// 	};

// 	useEffect(() => {
// 		if (user?.notifications) {
// 			setNotificationState(user.notifications);
// 		}
// 	}, [user]);

// 	const allToggleHeaders = [
// 		...new Set(
// 			Object.values(notifications)
// 				.flatMap((category) => Object.values(category))
// 				.flatMap((item) => item.toggles)
// 		),
// 	];

// 	const updateNotification = async (category: string, key: string, toggle: string, value: boolean) => {
// 		const current = notificationState || {};

// 		const updatedNotifications = {
// 			...current,

// 			[category]: {
// 				...(current[category] || {}),

// 				[key]: {
// 					...(current[category]?.[key] || {}),

// 					[toggle]: value,
// 				},
// 			},
// 		};

// 		// optimistic UI
// 		setNotificationState(updatedNotifications);

// 		await updateUser({
// 			notifications: updatedNotifications,
// 		});
// 	};

// 	return (
// 		<div className="flex flex-col mx-auto w-full max-w-9xl gap-6 px-4 py-6 sm:p-6">
// 			{/* HEADER */}
// 			<div className="flex items-center gap-3">
// 				<div
// 					className="p-2 rounded-xl"
// 					style={{
// 						background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
// 					}}
// 				>
// 					<BellDot size={18} />
// 				</div>

// 				<div className="flex flex-col">
// 					<h1 className="text-2xl font-semibold">Notifications</h1>

// 					<span
// 						className="text-sm"
// 						style={{
// 							color: 'var(--text-muted)',
// 						}}
// 					>
// 						Manage how you receive notifications
// 					</span>
// 				</div>
// 			</div>

// 			{/* SECTIONS */}
// 			{Object.entries(notifications).map(([category, data]) => (
// 				<motion.div
// 					key={category}
// 					layout
// 					whileHover={{ y: -2 }}
// 					className="rounded-xl relative overflow-hidden"
// 					style={{
// 						background: 'var(--container)',
// 						border: '1px solid var(--border)',
// 						padding: 'calc(var(--ui-gap) * 1.5)',
// 					}}
// 				>
// 					{/* glow */}
// 					<div
// 						className="absolute inset-0 opacity-0 hover:opacity-100 transition pointer-events-none"
// 						style={{
// 							background: 'radial-gradient(circle at top, color-mix(in srgb, var(--accent) 10%, transparent), transparent 70%)',
// 						}}
// 					/>

// 					{/* title */}
// 					<div className="flex items-center justify-between mb-5">
// 						<div className="flex flex-col">
// 							<h2 className="text-lg font-semibold capitalize">{category}</h2>
// 						</div>
// 					</div>

// 					{/* table */}
// 					<div
// 						className="overflow-hidden rounded-xl"
// 						style={{
// 							border: '1px solid var(--border)',
// 							background: 'var(--bg-main)',
// 						}}
// 					>
// 						<table className="w-full border-collapse table-fixed">
// 							<thead>
// 								<tr
// 									style={{
// 										borderBottom: '1px solid var(--border)',
// 									}}
// 								>
// 									<th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide">Notification</th>

// 									{allToggleHeaders.map((toggle) => (
// 										<th key={toggle} className="w-32 px-4 py-3 text-center text-xs font-medium uppercase tracking-wide">
// 											{toggle}
// 										</th>
// 									))}
// 								</tr>
// 							</thead>

// 							<tbody>
// 								{Object.entries(data).map(([key, notification]) => (
// 									<tr
// 										key={key}
// 										style={{
// 											borderBottom: '1px solid var(--border)',
// 										}}
// 										className="last:border-none"
// 									>
// 										<td className="px-4 py-4">
// 											<div className="flex flex-col">
// 												<span className="text-sm font-medium capitalize">{key}</span>

// 												<span
// 													className="text-xs"
// 													style={{
// 														color: 'var(--text-muted)',
// 													}}
// 												>
// 													{notification.description}
// 												</span>
// 											</div>
// 										</td>

// 										{allToggleHeaders.map((toggle) => {
// 											const hasToggle = notification.toggles.includes(toggle);

// 											const active = Boolean(notificationState?.[category]?.[key]?.[toggle]);

// 											return (
// 												<td key={toggle} className="w-32 px-4 py-4 text-center align-middle">
// 													{hasToggle ? (
// 														<button
// 															type="button"
// 															onClick={() => updateNotification(category, key, toggle, !active)}
// 															className="relative w-11 h-6 rounded-full transition"
// 															style={{
// 																background: active ? 'var(--accent)' : 'color-mix(in srgb, var(--border) 70%, transparent)',
// 															}}
// 														>
// 															<motion.div
// 																layout
// 																transition={{
// 																	type: 'spring',
// 																	stiffness: 500,
// 																	damping: 30,
// 																}}
// 																className="absolute top-0.5 w-5 h-5 rounded-full bg-white"
// 																style={{
// 																	left: active ? 'calc(100% - 22px)' : '2px',
// 																}}
// 															/>
// 														</button>
// 													) : (
// 														<span
// 															className="text-xs opacity-30"
// 															style={{
// 																color: 'var(--text-muted)',
// 															}}
// 														>
// 															—
// 														</span>
// 													)}
// 												</td>
// 											);
// 										})}
// 									</tr>
// 								))}
// 							</tbody>
// 						</table>
// 					</div>
// 				</motion.div>
// 			))}
// 		</div>
// 	);
// }
