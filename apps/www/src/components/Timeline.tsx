/** @format */

'use client';

import { ArrowUpRight, Bot, Building2, Calendar, Globe, LogOut, RefreshCw, ShieldCheck, Star, UserPlus } from 'lucide-react';
import { motion, useScroll, useSpring } from 'framer-motion';

import { useEffect, useRef, useState } from 'react';
import { useEnvironment } from '@xernerx/providers';

type Milestone = {
	date: string;
	title: string;
	description: string;
	icon: React.ReactNode;
	link?: string;
};

const milestones: Milestone[] = [
	{
		date: 'March 2020',
		title: 'Amethyst Development Founded',
		description: 'Thomas, Johannes, and Asher established Amethyst Development with a focus on scalable Discord tooling.',
		icon: <Building2 />,
	},
	{
		date: 'June 2020',
		title: 'Rebranded to Portal Development',
		description: 'Following structural changes, the company was reintroduced under the name Portal Development.',
		icon: <RefreshCw />,
	},
	{
		date: 'June 2020',
		title: 'First Bot Acquisition',
		description: 'Roblox Utilities joined the portfolio, expanding into multi-server utility tooling.',
		icon: <Bot />,
	},
	{
		date: 'November 2020',
		title: 'To-Do List Bot Launched',
		description: 'Clari began development of To-Do List Bot, introducing structured productivity features.',
		icon: <UserPlus />,
		link: 'https://app.xernerx.com/bots/782105629572464652',
	},
	{
		date: 'August 2021',
		title: 'Discord-Translate Begins',
		description: 'Thomas initiated development of Discord-Translate, focused on multilingual communities.',
		icon: <Globe />,
	},
	{
		date: 'December 2021',
		title: 'Acquired DragDev Studios',
		description: 'DragDev Studios and YourApps joined the company, along with three new developers.',
		icon: <ArrowUpRight />,
	},
	{
		date: 'January 2022',
		title: 'Metamorphosis Rewrite',
		description: 'Discord-Translate was rebuilt and relaunched as Metamorphosis with improved infrastructure.',
		icon: <Star />,
		link: 'https://app.xernerx.com/bots/881678826906730547',
	},
	{
		date: 'February 2022',
		title: 'Leadership Transition',
		description: 'Johannes stepped down. Infrastructure responsibilities were restructured internally.',
		icon: <LogOut />,
	},
	{
		date: 'March 2022',
		title: 'Zodiac Development',
		description: 'Max began development of Zodiac, expanding into astrology and personality tooling.',
		icon: <ShieldCheck />,
		link: 'https://app.xernerx.com/bots/950251264095162418',
	},
	{
		date: 'February 2026',
		title: 'Xernerx Studios Rebrand',
		description: 'The company rebranded to Xernerx Studios, reflecting a shift in focus and identity.',
		icon: <RefreshCw />,
	},
	{
		date: `${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][new Date().getMonth()]} ${new Date().getFullYear()}`,
		title: 'Today',
		description: "You're all caught up!",
		icon: <Calendar />,
	},
];

export default function Timeline() {
	return (
		<section className="relative py-32 mb-32 max-w-7xl mx-auto px-6">
			<div className="grid lg:grid-cols-12 gap-16 lg:gap-24">
				{/* STICKY LEFT (Editorial Hero) */}
				<div className="lg:col-span-5 relative">
					<div className="lg:sticky lg:top-40 flex flex-col gap-8 relative z-10">
						<div>
							<h2 className="text-6xl lg:text-[5.5rem] font-black text-(--text) leading-[0.9] tracking-tighter mb-6" style={{ fontFamily: 'var(--font-fredoka)' }}>
								The
								<br />
								<span className="text-transparent bg-clip-text bg-gradient-to-br from-(--accent) to-purple-500">Journey</span>
								<br />
								So Far.
							</h2>
							<p className="text-lg text-(--text-muted) leading-relaxed max-w-md font-medium">
								From early experimentation with bots to stable infrastructure engineering, see how Xernerx evolved over the years.
							</p>
						</div>
						<div className="hidden lg:block w-32 h-1.5 bg-gradient-to-r from-(--accent) to-transparent rounded-full shadow-[0_0_20px_var(--accent)]" />
					</div>
				</div>

				{/* SCROLLING RIGHT (Timeline Cards) */}
				<div className="lg:col-span-7 relative">
					{/* Ambient Glowing Wire */}
					<div className="absolute left-8 lg:left-12 top-12 bottom-12 w-[2px] bg-gradient-to-b from-transparent via-(--accent) to-transparent opacity-40" />

					<div className="flex flex-col gap-12 lg:gap-20">
						{milestones.map((m, i) => (
							<TimelineCard key={i} milestone={m} />
						))}
					</div>
				</div>
			</div>
		</section>
	);
}

function TimelineCard({ milestone }: { milestone: Milestone }) {
	const { getEnvUrl } = useEnvironment();
	const finalLink = milestone.link ? getEnvUrl(milestone.link) : undefined;

	const Component = finalLink ? motion.a : motion.div;
	const componentProps = finalLink ? { href: finalLink } : {};

	return (
		<div className="relative flex items-center gap-6 lg:gap-12 pl-4 lg:pl-6 group/item">
			{/* GLOWING NODE */}
			<div className="absolute left-4 lg:left-6 w-8 h-8 -translate-x-1/2 flex items-center justify-center z-10 transition-transform duration-500 group-hover/item:scale-125">
				<div className="absolute inset-0 bg-(--accent) rounded-full opacity-20 blur-md group-hover/item:opacity-60 transition-opacity" />
				<div className="w-3 h-3 bg-(--accent) rounded-full shadow-[0_0_15px_var(--accent)]" />
			</div>

			{/* CARD */}
			<Component
				{...componentProps}
				initial={{ opacity: 0, x: 50, scale: 0.95 }}
				whileInView={{ opacity: 1, x: 0, scale: 1 }}
				viewport={{ once: true, margin: '-100px' }}
				transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
				className={`block w-full rounded-[2rem] transition-all duration-500 bg-(--foreground)/30 backdrop-blur-xl border border-(--border)/10 p-8 lg:p-10 shadow-2xl relative overflow-hidden group ${finalLink ? 'hover:border-(--accent)/50 hover:shadow-[0_20px_60px_-15px_color-mix(in_srgb,var(--accent)_40%,transparent)] hover:-translate-y-2' : ''}`}
			>
				{/* Frosted glow on hover */}
				{finalLink && <div className="absolute -top-20 -right-20 w-64 h-64 bg-(--accent)/20 rounded-full blur-[80px] group-hover:bg-(--accent)/30 transition-colors duration-700" />}

				{/* HEADER */}
				<div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6 mb-6 relative z-10">
					<div
						className="flex items-center justify-center rounded-2xl shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
						style={{
							width: 56,
							height: 56,
							background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
							color: 'var(--accent)',
						}}
					>
						{milestone.icon}
					</div>

					<div className="flex flex-col flex-1 min-w-0">
						<span className="text-xs uppercase tracking-widest text-(--accent) font-black mb-1">{milestone.date}</span>

						<span className="text-2xl font-black flex items-center justify-between text-(--text) leading-tight">
							{milestone.title}
							{finalLink && (
								<ArrowUpRight size={24} className="text-(--text-muted) shrink-0 group-hover:text-(--accent) group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
							)}
						</span>
					</div>
				</div>

				{/* DESCRIPTION */}
				<p className="text-base leading-relaxed text-(--text-muted) relative z-10 font-medium">{milestone.description}</p>
			</Component>
		</div>
	);
}
