/** @format */
'use client';

import { Book, Code, CreditCard, Key, Rocket, Search, Shield, Webhook } from 'lucide-react';

import { motion } from 'framer-motion';
import { useState } from 'react';

const categories = [
	{
		title: 'Getting Started',
		description: 'Learn the basics, setup your environment, and make your first API request.',
		icon: Rocket,
		href: '/docs/getting-started',
		color: 'text-blue-500',
		bg: 'bg-blue-500/10',
	},
	{
		title: 'Core API',
		description: 'Comprehensive references for all Core API endpoints and data models.',
		icon: Code,
		href: '/docs/core-api',
		color: 'text-emerald-500',
		bg: 'bg-emerald-500/10',
	},
	{
		title: 'Authentication',
		description: 'Manage users, OAuth2 flows, and secure your applications.',
		icon: Key,
		href: '/docs/authentication',
		color: 'text-amber-500',
		bg: 'bg-amber-500/10',
	},
	{
		title: 'Billing & Subscriptions',
		description: 'Integrate Stripe, manage products, and handle user subscriptions.',
		icon: CreditCard,
		href: '/docs/billing',
		color: 'text-purple-500',
		bg: 'bg-purple-500/10',
	},
	{
		title: 'Admin & Roles',
		description: 'Configure RBAC, synchronize Discord roles, and manage permissions.',
		icon: Shield,
		href: '/docs/admin',
		color: 'text-rose-500',
		bg: 'bg-rose-500/10',
	},
	{
		title: 'Webhooks',
		description: 'Listen to real-time events and automate workflows across your apps.',
		icon: Webhook,
		href: '/docs/webhooks',
		color: 'text-cyan-500',
		bg: 'bg-cyan-500/10',
	},
];

export default function DocsHome() {
	const [searchQuery, setSearchQuery] = useState('');

	return (
		<div className="flex flex-col min-h-screen w-full relative overflow-hidden" style={{ padding: 'calc(var(--ui-gap) * 2)', gap: 'calc(var(--ui-gap) * 3)' }}>
			{/* Background Glows */}
			<div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-(--accent) rounded-full blur-[150px] opacity-10 pointer-events-none" />
			<div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-500 rounded-full blur-[150px] opacity-10 pointer-events-none" />

			{/* Hero Section */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, ease: 'easeOut' }}
				className="flex flex-col items-center text-center max-w-3xl mx-auto mt-10 z-10"
				style={{ gap: 'var(--ui-gap)' }}
			>
				<div className="flex items-center gap-3 px-4 py-1.5 rounded-full border border-(--accent)/20 bg-(--accent)/5 text-(--accent) text-xs font-bold uppercase tracking-wider mb-2 shadow-sm">
					<Book size={14} />
					<span>Official Documentation</span>
				</div>
				<h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
					How can we help you <span className="text-transparent bg-clip-text bg-gradient-to-r from-(--accent) to-purple-500">build</span>?
				</h1>
				<p className="text-base text-(--text-muted) max-w-xl leading-relaxed mt-2">
					Explore guides, comprehensive API references, and tutorials to help you integrate with the Xernerx Suite seamlessly.
				</p>

				{/* Search Bar */}
				<div className="w-full max-w-2xl mt-6 relative group">
					<div className="absolute inset-0 bg-gradient-to-r from-(--accent) to-purple-500 rounded-3xl blur-md opacity-20 group-hover:opacity-40 transition duration-500" />
					<div className="relative flex items-center w-full rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-xl transition-all duration-300 focus-within:border-(--accent)/50 focus-within:bg-(--foreground)/50">
						<Search size={22} className="absolute left-6 text-(--text-muted) group-focus-within:text-(--accent) transition-colors" />
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search documentation, guides, and API endpoints..."
							className="w-full bg-transparent border-none text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-0 text-base"
							style={{ padding: 'calc(var(--ui-gap) * 1.5) calc(var(--ui-gap) * 1.5) calc(var(--ui-gap) * 1.5) 4rem' }}
						/>
					</div>
				</div>
			</motion.div>

			{/* Categories Grid */}
			<div className="max-w-6xl mx-auto w-full z-10 flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 1.5)' }}>
				<motion.h2
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
					className="text-2xl font-bold text-(--text)"
					style={{ fontFamily: 'var(--font-fredoka)' }}
				>
					Explore Categories
				</motion.h2>

				<motion.div
					initial="hidden"
					animate="visible"
					variants={{
						hidden: { opacity: 0 },
						visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
					}}
					className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full"
					style={{ gap: 'var(--ui-gap)' }}
				>
					{categories.map((category, idx) => (
						<motion.a
							href={category.href}
							key={idx}
							variants={{
								hidden: { opacity: 0, y: 20 },
								visible: { opacity: 1, y: 0 },
							}}
							className="group flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer overflow-hidden relative"
							style={{ padding: 'calc(var(--ui-gap) * 1.5)', gap: 'var(--ui-gap)' }}
						>
							{/* Subtle background gradient on hover */}
							<div className="absolute inset-0 bg-gradient-to-br from-transparent to-(--border)/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

							<div className="flex items-center gap-4 relative z-10">
								<div
									className={`flex h-14 w-14 items-center justify-center rounded-2xl ${category.bg} ${category.color} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-inner`}
								>
									<category.icon size={28} />
								</div>
								<h3 className="text-xl font-bold text-(--text) group-hover:text-(--accent) transition-colors" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{category.title}
								</h3>
							</div>
							<p className="text-sm text-(--text-muted) leading-relaxed relative z-10">{category.description}</p>
						</motion.a>
					))}
				</motion.div>
			</div>
		</div>
	);
}
