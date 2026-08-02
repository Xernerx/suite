/** @format */

'use client';

import { ArrowUpRight, Briefcase, FileText, Headphones, Mail, Shield } from 'lucide-react';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSidebar, useEnvironment } from '@xernerx/providers';
import { useEffect } from 'react';

const contacts = [
	{
		title: 'General',
		description: 'General enquiries, partnerships and anything that does not fit elsewhere.',
		email: 'info@xernerx.com',
		icon: Mail,
	},
	{
		title: 'Support',
		description: 'Technical support, bug reports and product assistance.',
		email: 'support@xernerx.com',
		icon: Headphones,
	},
	{
		title: 'Invoices',
		description: 'Supplier invoices, accounting and payment related enquiries.',
		email: 'invoice@xernerx.com',
		icon: FileText,
	},
	{
		title: 'Security',
		description: 'Security reports, responsible disclosure and vulnerability reports.',
		email: 'security@xernerx.com',
		icon: Shield,
	},
	{
		title: 'Legal',
		description: 'Contracts, legal requests and official correspondence.',
		email: 'legal@xernerx.com',
		icon: Briefcase,
	},
];

export default function ContactPage() {
	const { hide } = useSidebar();
	const { getEnvUrl } = useEnvironment();

	useEffect(() => {
		hide();
	}, [hide]);

	return (
		<div className="mx-auto w-full max-w-7xl px-6 py-20">
			<motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl text-center">
				<h1
					className="font-bold tracking-tight text-(--text)"
					style={{
						fontSize: 'clamp(2.5rem, 5vw, 4rem)',
					}}
				>
					Contact Us
				</h1>

				<p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-(--text-muted)">
					Whether you have a technical question, found a bug, want to discuss a partnership or simply need to get in touch, we{"'"}re happy to help. Using the correct contact address helps
					your message reach the right person faster.
				</p>
			</motion.div>

			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.3 }}
				className="mx-auto mt-24 max-w-4xl rounded-2xl p-10 text-center bg-(--foreground) border border-(--border)/10"
			>
				<h2 className="text-2xl font-semibold text-(--text)">Looking for documentation?</h2>

				<p className="mx-auto mt-4 max-w-2xl leading-7 text-(--text-muted)">
					Most technical questions are already covered in our documentation. You may find your answer immediately without waiting for a reply.
				</p>

				<div className="mt-8 flex flex-wrap justify-center gap-4">
					<Link href={getEnvUrl('https://app.xernerx.com/docs')} className="rounded-xl px-5 py-3 font-medium transition-all duration-200 bg-(--accent) text-(--background) hover:opacity-90">
						Documentation
					</Link>

					<Link
						href="https://github.com/xernerx"
						target="_blank"
						rel="noopener noreferrer"
						className="rounded-xl px-5 py-3 font-medium transition-all duration-200 border border-(--border)/10 bg-(--foreground) text-(--text) hover:border-(--accent)"
					>
						GitHub
					</Link>
				</div>
			</motion.div>

			<div className="mt-20 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
				{contacts.map((contact, index) => (
					<motion.div
						key={contact.email}
						initial={{ opacity: 0, y: 15 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.05 }}
						className="group relative overflow-hidden rounded-2xl bg-(--foreground) border border-(--border)/10"
					>
						<div
							className="absolute inset-x-0 top-0 h-px"
							style={{
								background: 'linear-gradient(to right, transparent, color-mix(in srgb, var(--accent) 35%, transparent), transparent)',
							}}
						/>

						<div className="flex h-full flex-col p-8">
							<div
								className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl transition-all"
								style={{
									background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
									color: 'var(--accent)',
								}}
							>
								<contact.icon size={24} />
							</div>

							<h2 className="text-xl font-semibold text-(--text)">{contact.title}</h2>

							<p className="mt-3 flex-1 leading-7 text-(--text-muted)">{contact.description}</p>

							<Link
								href={`mailto:${contact.email}`}
								className="mt-8 inline-flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-200 hover:-translate-y-0.5"
								style={{
									background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
									border: '1px solid color-mix(in srgb, var(--accent) 18%, transparent)',
								}}
							>
								<span className="font-medium text-(--text)">{contact.email}</span>

								<ArrowUpRight size={18} className="text-(--accent)" />
							</Link>
						</div>
					</motion.div>
				))}
			</div>
		</div>
	);
}
