'use client';
import { useEffect } from 'react';
import { useDictionary, useSidebar } from '@xernerx/providers';
import { motion } from 'framer-motion';
import { Bug, Compass, Map, MessageSquare, LifeBuoy } from 'lucide-react';
import Link from 'next/link';

export default function InfoHomePage() {
	const { t } = useDictionary();
	const { hide } = useSidebar();

	useEffect(() => {
		hide();
	}, [hide]);

	const portals = [
		{
			title: t('info.home.portals.roadmap.title'),
			description: t('info.home.portals.roadmap.description'),
			icon: <Map className="w-8 h-8 text-(--accent)" />,
			href: '/roadmap',
			color: 'bg-blue-500/10 border-blue-500/20',
		},
		{
			title: t('info.home.portals.suggestions.title'),
			description: t('info.home.portals.suggestions.description'),
			icon: <MessageSquare className="w-8 h-8 text-purple-500" />,
			href: '/suggestions',
			color: 'bg-purple-500/10 border-purple-500/20',
		},
		{
			title: t('info.home.portals.bugs.title'),
			description: t('info.home.portals.bugs.description'),
			icon: <Bug className="w-8 h-8 text-red-500" />,
			href: '/bugs',
			color: 'bg-red-500/10 border-red-500/20',
		},
		{
			title: t('info.home.portals.faq.title'),
			description: t('info.home.portals.faq.description'),
			icon: <LifeBuoy className="w-8 h-8 text-green-500" />,
			href: '/faq',
			color: 'bg-green-500/10 border-green-500/20',
		},
	];

	return (
		<div className="flex flex-col max-w-[1600px] mx-auto w-full p-8 md:p-12 gap-16 min-h-[80vh] justify-center relative">
			{/* Decorative background glow */}
			<div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-(--accent)/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, ease: 'easeOut' }}
				className="flex flex-col items-center text-center gap-6 max-w-3xl mx-auto"
			>
				<motion.div
					initial={{ scale: 0.8, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ duration: 0.4, delay: 0.1 }}
					className="flex items-center justify-center w-16 h-16 rounded-2xl bg-(--accent)/20 border border-(--accent)/30 mb-2"
				>
					<Compass className="w-8 h-8 text-(--accent)" />
				</motion.div>
				<h1 className="text-5xl md:text-6xl font-black tracking-tight text-(--text)">{t('info.home.title')}</h1>
				<p className="text-xl text-(--text-muted) leading-relaxed">{t('info.home.description')}</p>
			</motion.div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto w-full">
				{portals.map((portal, i) => (
					<Link href={portal.href} key={i}>
						<motion.div
							initial={{ opacity: 0, y: 25 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.45, delay: 0.15 + i * 0.08, ease: 'easeOut' }}
							whileHover={{ y: -6, scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							className={`flex flex-col items-center text-center p-8 rounded-3xl border ${portal.color} bg-(--foreground)/30 backdrop-blur-md shadow-lg h-full transition-colors hover:bg-(--foreground)/50 hover:shadow-xl cursor-pointer gap-4`}
						>
							<div className="p-4 rounded-2xl bg-(--background)/50 border border-(--border)/10 shadow-sm">{portal.icon}</div>
							<h3 className="text-xl font-bold text-(--text)">{portal.title}</h3>
							<p className="text-sm text-(--text-muted) leading-relaxed">{portal.description}</p>
						</motion.div>
					</Link>
				))}
			</div>
		</div>
	);
}
