/** @format */
'use client';

import { Book, Code, Globe, Package, Rocket, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useDictionary, useSidebar } from '@xernerx/providers';

const categories = [
	{
		title: 'REST API',
		description: 'Comprehensive documentation for the Xernerx HTTP API. Learn how to authenticate, interact with databases, and utilize core microservices securely.',
		icon: Globe,
		href: '/api',
		color: 'text-blue-500',
		bg: 'bg-blue-500/10',
	},
	{
		title: 'CDN Services',
		description: 'Documentation for the Xernerx Content Delivery Network. Discover how to programmatically upload, retrieve, and manage distributed media assets.',
		icon: Rocket,
		href: '/cdn',
		color: 'text-purple-500',
		bg: 'bg-purple-500/10',
	},
	{
		title: 'NPM Packages',
		description: 'Guides and references for the open-source Xernerx Developer Software suite, including frameworks, libraries, and utilities.',
		icon: Package,
		href: '/packages',
		color: 'text-emerald-500',
		bg: 'bg-emerald-500/10',
	},
];

export default function DocsHome() {
	const { t } = useDictionary();
	const { hide } = useSidebar();
	const [searchQuery, setSearchQuery] = useState('');

	useEffect(() => {
		hide();
	}, [hide]);

	return (
		<div
			className="flex flex-col min-h-[85vh] w-full relative overflow-hidden"
			style={{
				padding: 'calc(var(--ui-gap) * 2)',
				gap: 'calc(var(--ui-gap) * 3)',
			}}
		>
			{/* Hero Section */}
			<motion.div
				initial={{
					opacity: 0,
					y: 20,
				}}
				animate={{
					opacity: 1,
					y: 0,
				}}
				transition={{
					duration: 0.5,
					ease: 'easeOut',
				}}
				className="flex flex-col items-center text-center max-w-3xl mx-auto mt-16 z-10"
				style={{
					gap: 'var(--ui-gap)',
				}}
			>
				<div className="flex items-center gap-3 px-4 py-1.5 rounded-full border border-(--accent)/20 bg-(--accent)/5 text-(--accent) text-xs font-bold uppercase tracking-wider mb-2 shadow-sm">
					<Book size={14} />
					<span>Official Documentation</span>
				</div>
				<h1
					className="text-5xl md:text-6xl font-extrabold tracking-tight text-(--text) drop-shadow-sm"
					style={{
						fontFamily: 'var(--font-fredoka)',
					}}
				>
					Xernerx <span className="text-transparent bg-clip-text bg-gradient-to-r from-(--accent) to-purple-500">Suite Docs</span>
				</h1>
				<p className="text-base text-(--text-muted) max-w-xl leading-relaxed mt-2">
					Explore guides, API references, and tutorials to help you integrate with the Xernerx Ecosystem seamlessly.
				</p>

				{/* Search Bar */}
				<div className="w-full max-w-2xl mt-8 relative group">
					<div className="absolute inset-0 bg-gradient-to-r from-(--accent) to-purple-500 rounded-3xl blur-md opacity-20 group-hover:opacity-40 transition duration-500" />
					<div className="relative flex items-center w-full rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-xl transition-all duration-300 focus-within:border-(--accent)/50 focus-within:bg-(--foreground)/50">
						<Search size={22} className="absolute left-6 text-(--text-muted) group-focus-within:text-(--accent) transition-colors" />
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search documentation, guides, and references..."
							className="w-full bg-transparent border-none text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-0 text-base"
							style={{
								padding: 'calc(var(--ui-gap) * 1.5) calc(var(--ui-gap) * 1.5) calc(var(--ui-gap) * 1.5) 4rem',
							}}
						/>
					</div>
				</div>
			</motion.div>

			{/* Categories Grid */}
			<div
				className="max-w-5xl mx-auto w-full z-10 flex flex-col mt-8"
				style={{
					gap: 'calc(var(--ui-gap) * 1.5)',
				}}
			>
				<motion.div
					initial="hidden"
					animate="visible"
					variants={{
						hidden: {
							opacity: 0,
						},
						visible: {
							opacity: 1,
							transition: {
								staggerChildren: 0.1,
								delayChildren: 0.3,
							},
						},
					}}
					className="grid grid-cols-1 md:grid-cols-3 w-full"
					style={{
						gap: 'calc(var(--ui-gap) * 1.5)',
					}}
				>
					{categories.map((category, idx) => (
						<motion.a
							href={category.href}
							key={idx}
							variants={{
								hidden: {
									opacity: 0,
									y: 20,
								},
								visible: {
									opacity: 1,
									y: 0,
								},
							}}
							className="group flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer overflow-hidden relative"
							style={{
								padding: 'calc(var(--ui-gap) * 2)',
								gap: 'var(--ui-gap)',
							}}
						>
							{/* Subtle background gradient on hover */}
							<div className="absolute inset-0 bg-gradient-to-br from-transparent to-(--border)/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

							<div className="flex flex-col gap-4 relative z-10">
								<div
									className={`flex h-16 w-16 items-center justify-center rounded-2xl ${category.bg} ${category.color} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-inner`}
								>
									<category.icon size={32} />
								</div>
								<h3
									className="text-2xl font-bold text-(--text) group-hover:text-(--accent) transition-colors mt-2"
									style={{
										fontFamily: 'var(--font-fredoka)',
									}}
								>
									{category.title}
								</h3>
							</div>
							<p className="text-base text-(--text-muted) leading-relaxed relative z-10">{category.description}</p>
						</motion.a>
					))}
				</motion.div>
			</div>
		</div>
	);
}
