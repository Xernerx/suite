'use client';
import { useDictionary } from '@xernerx/providers';
import { motion } from 'framer-motion';
import { Bug, Compass, Map, MessageSquare, LifeBuoy } from 'lucide-react';
import Link from 'next/link';

export default function InfoHomePage() {
	const { t } = useDictionary();

	const portals = [
		{
			title: 'Roadmap',
			description: 'See what we are building right now, what is coming next, and track our progress on long-term goals.',
			icon: <Map className="w-8 h-8 text-(--accent)" />,
			href: '/roadmap',
			color: 'bg-blue-500/10 border-blue-500/20',
		},
		{
			title: 'Suggestions',
			description: 'Have a great idea? Submit it to our community sandbox where others can vote it up to our roadmap!',
			icon: <MessageSquare className="w-8 h-8 text-purple-500" />,
			href: '/suggestions',
			color: 'bg-purple-500/10 border-purple-500/20',
		},
		{
			title: 'Bug Tracker',
			description: 'Found a glitch? Report it here so our engineers can squash it and move it to the known issues list.',
			icon: <Bug className="w-8 h-8 text-red-500" />,
			href: '/bugs',
			color: 'bg-red-500/10 border-red-500/20',
		},
		{
			title: 'FAQ',
			description: 'Frequently asked questions, billing inquiries, and general help with your Xernerx account.',
			icon: <LifeBuoy className="w-8 h-8 text-green-500" />,
			href: '/faq',
			color: 'bg-green-500/10 border-green-500/20',
		},
	];

	return (
		<div className="flex flex-col max-w-[1600px] mx-auto w-full p-8 md:p-12 gap-16 min-h-[80vh] justify-center relative">
			{/* Decorative background glow */}
			<div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-(--accent)/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>

			<div className="flex flex-col items-center text-center gap-6 max-w-3xl mx-auto">
				<div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-(--accent)/20 border border-(--accent)/30 mb-2">
					<Compass className="w-8 h-8 text-(--accent)" />
				</div>
				<h1 className="text-5xl md:text-6xl font-black tracking-tight">
					Feedback & <span className="text-(--accent)">Support</span>
				</h1>
				<p className="text-xl text-(--text-muted) leading-relaxed">
					Welcome to the knowledgebank. Explore our transparent roadmap, submit new feature ideas, report issues, and find answers to all your questions.
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto w-full">
				{portals.map((portal, i) => (
					<Link href={portal.href} key={i}>
						<motion.div
							whileHover={{ y: -5 }}
							className={`flex flex-col items-center text-center p-8 rounded-3xl border ${portal.color} bg-(--foreground)/30 backdrop-blur-md shadow-lg h-full transition-all hover:bg-(--foreground)/50 hover:shadow-xl cursor-pointer gap-4`}
						>
							<div className="p-4 rounded-2xl bg-(--background)/50 border border-(--border)/10 shadow-sm">{portal.icon}</div>
							<h3 className="text-xl font-bold">{portal.title}</h3>
							<p className="text-sm text-(--text-muted) leading-relaxed">{portal.description}</p>
						</motion.div>
					</Link>
				))}
			</div>
		</div>
	);
}
