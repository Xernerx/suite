/** @format */
'use client';

import { BookOpen, FileText, Mail, MessageCircle, Package, Shield } from 'lucide-react';

import { BsGithub } from 'react-icons/bs';
import Link from 'next/link';
import { motion } from 'framer-motion';

export function Footer() {
	return (
		<motion.footer
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			// Removed border-t and border-(--border)
			className='relative w-full overflow-hidden bg-(--background) backdrop-blur-md'>
			{/* Fading top border */}
			<div className='pointer-events-none absolute left-0 top-0 h-[1px] w-full bg-gradient-to-r from-transparent via-(--accent) to-transparent opacity-50' />

			<div className='mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-10 px-8 py-12 md:grid-cols-[1.6fr_1fr_1fr] md:px-12'>
				{/* ---------------------------------------------------------------- */}
				{/* Brand */}
				{/* ---------------------------------------------------------------- */}
				<div className='flex flex-col justify-between text-center md:text-left'>
					<div>
						<h2 className='text-lg font-semibold text-(--text)'>Xernerx Studios</h2>

						<p className='mt-3 max-w-md leading-7 text-(--text-muted)'>
							Building modern software, infrastructure and developer tools with a focus on performance, simplicity and long-term maintainability.
						</p>
					</div>

					<div className='mt-8 text-sm text-(--text-muted)'>© 2024 - {new Date().getFullYear()} Xernerx Studios</div>
				</div>
				{/* ---------------------------------------------------------------- */}
				{/* Resources */}
				{/* ---------------------------------------------------------------- */}
				<FooterSection title='Resources'>
					<FooterLink href='/privacy' icon={Shield} label='Privacy' external={false} />
					<FooterLink href='/terms' icon={FileText} label='Terms' external={false} />
					<FooterLink href='/contact' icon={Mail} label='Contact' external={false} />
				</FooterSection>
				{/* ---------------------------------------------------------------- */}
				{/* Developer */}
				{/* ---------------------------------------------------------------- */}
				<FooterSection title='Developer'>
					<FooterLink href='https://github.com/xernerx' icon={BsGithub} label='GitHub' />
					<FooterLink href='https://www.npmjs.com/package/xernerx' icon={Package} label='npm' />
					<FooterLink href='https://app.xernerx.com/docs' icon={BookOpen} label='Documentation' />
					<FooterLink href='https://discord.gg/teNWyb69dq' icon={MessageCircle} label='Discord' />
				</FooterSection>
			</div>
		</motion.footer>
	);
}

/* -------------------------------------------------------------------------- */
/* Sections */
/* -------------------------------------------------------------------------- */

function FooterSection({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className='flex flex-col items-center md:items-start'>
			<h3 className='mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-(--text)'>{title}</h3>

			<div className='flex flex-col gap-1.5'>{children}</div>
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* Link */
/* -------------------------------------------------------------------------- */

function FooterLink({ href, icon: Icon, label, external = true }: { href: string; icon: React.ElementType; label: string; external?: boolean }) {
	// Replaced Javascript event handlers with Tailwind hover utilities
	const className =
		'group inline-flex items-center gap-3 rounded-lg px-3 py-2 text-(--text-muted) transition-all duration-200 hover:translate-x-0.5 hover:bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] hover:text-(--text)';

	const content = (
		<>
			<Icon size={16} className='transition-colors group-hover:text-(--text)' />
			<span className='text-sm'>{label}</span>
		</>
	);

	if (external) {
		return (
			<a href={href} target='_blank' rel='noopener noreferrer' className={className}>
				{content}
			</a>
		);
	}

	return (
		<Link href={href} className={className}>
			{content}
		</Link>
	);
}
