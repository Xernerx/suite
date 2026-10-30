/** @format */
'use client';

import { ArrowRight, Briefcase, Code2, Globe2, Headphones, ShieldCheck, LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useEnvironment, useSidebar, useUser, useDictionary } from '@xernerx/providers';
import Link from 'next/link';
import { PageFaqSection } from '@/components/PageFaqSection';

interface ApplicationConfig {
	_id: string;
	id: string;
	name: string;
	description: string;
	requireLogin?: boolean;
	benefits?: string[];
	requirements?: string[];
	questions?: any[];
}

export default function ApplicationsPage() {
	const { hide } = useSidebar();
	const { getEnvUrl, isReady } = useEnvironment();
	const { user } = useUser();
	const { t } = useDictionary();

	const [applications, setApplications] = useState<ApplicationConfig[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		hide();
	}, [hide]);

	useEffect(() => {
		if (!isReady) return;
		async function fetchApplications() {
			try {
				const response = await fetch(getEnvUrl('https://api.xernerx.com/secure/applications/open'), {
					credentials: 'include',
				});

				if (!response.ok) throw new Error('Failed to fetch applications');

				const json = await response.json();

				if (json.success) {
					setApplications(json.data);
				} else {
					throw new Error(json.error || t('www.applications.errorLoad'));
				}
			} catch (err) {
				console.warn(err);
				setError(t('www.applications.errorLoad'));
			} finally {
				setLoading(false);
			}
		}

		fetchApplications();
	}, [getEnvUrl, isReady, t]);

	const departments = [
		{
			key: 'engineering',
			icon: Code2,
			title: t('www.applications.overview.departments.engineering.title'),
			description: t('www.applications.overview.departments.engineering.description'),
		},
		{
			key: 'moderation',
			icon: ShieldCheck,
			title: t('www.applications.overview.departments.moderation.title'),
			description: t('www.applications.overview.departments.moderation.description'),
		},
		{
			key: 'support',
			icon: Headphones,
			title: t('www.applications.overview.departments.support.title'),
			description: t('www.applications.overview.departments.support.description'),
		},
		{
			key: 'localization',
			icon: Globe2,
			title: t('www.applications.overview.departments.localization.title'),
			description: t('www.applications.overview.departments.localization.description'),
		},
	];

	const steps = [
		{
			key: 'step1',
			title: t('www.applications.overview.process.step1.title'),
			description: t('www.applications.overview.process.step1.description'),
		},
		{
			key: 'step2',
			title: t('www.applications.overview.process.step2.title'),
			description: t('www.applications.overview.process.step2.description'),
		},
		{
			key: 'step3',
			title: t('www.applications.overview.process.step3.title'),
			description: t('www.applications.overview.process.step3.description'),
		},
	];

	return (
		<div className="flex flex-col min-h-screen pt-24 pb-20 px-6 md:px-12 max-w-(--page-width) mx-auto w-full gap-16">
			<div>
				<h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('www.applications.title')}
				</h1>
				<p className="text-lg text-(--text-muted) max-w-2xl leading-relaxed">{t('www.applications.subtitle')}</p>
			</div>

			{error ? (
				<motion.div initial={false} animate={{ opacity: 1, y: 0 }} className="bg-(--accent-red)/10 border border-(--accent-red)/20 text-(--accent-red) p-6 rounded-2xl backdrop-blur-md">
					{error}
				</motion.div>
			) : !loading && applications.length === 0 ? (
				<motion.div
					initial={false}
					animate={{ opacity: 1, scale: 1 }}
					className="flex flex-col items-center justify-center py-16 px-6 text-center border border-dashed border-(--border)/20 rounded-3xl bg-(--foreground)/30 backdrop-blur-md"
				>
					<Briefcase className="w-12 h-12 text-(--accent) mb-4 opacity-80" />
					<h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('www.applications.noRoles')}
					</h2>
					<p className="text-(--text-muted) max-w-md">{t('www.applications.noRolesDesc')}</p>
				</motion.div>
			) : applications.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{applications.map((app, i) => (
						<motion.div
							initial={false}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: i * 0.1, duration: 0.4 }}
							key={app.id}
							className="flex flex-col p-6 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md hover:border-(--accent)/50 transition-all duration-300 group shadow-sm"
						>
							<div className="flex items-start justify-between mb-4">
								<div className="flex items-center justify-center w-12 h-12 rounded-full bg-(--accent)/20 text-(--accent)">
									<Briefcase className="w-6 h-6" />
								</div>
							</div>
							<h2 className="text-2xl font-bold mb-3 group-hover:text-(--accent) transition-colors">{app.name}</h2>
							<p className="text-(--text-muted) mb-6 line-clamp-2 leading-relaxed">{app.description || t('www.applications.noDesc')}</p>

							<div className="flex flex-col gap-5 mb-8 flex-grow">
								{app.requirements && app.requirements.length > 0 && (
									<div className="flex flex-col gap-2">
										<span className="text-xs font-bold uppercase tracking-wider text-(--text)">{t('www.applications.requirements')}</span>
										<ul className="text-sm text-(--text-muted) flex flex-col gap-1.5">
											{app.requirements.slice(0, 3).map((req, idx) => (
												<li key={idx} className="flex items-start gap-2">
													<span className="text-(--accent) mt-[2px] opacity-80">•</span>
													<span className="leading-snug line-clamp-2">{req}</span>
												</li>
											))}
											{app.requirements.length > 3 && (
												<li className="text-xs text-(--text-muted)/60 italic ml-4">{t('www.applications.more', { count: app.requirements.length - 3 })}</li>
											)}
										</ul>
									</div>
								)}
								{app.benefits && app.benefits.length > 0 && (
									<div className="flex flex-col gap-2">
										<span className="text-xs font-bold uppercase tracking-wider text-(--text)">{t('www.applications.benefits')}</span>
										<ul className="text-sm text-(--text-muted) flex flex-col gap-1.5">
											{app.benefits.slice(0, 3).map((ben, idx) => (
												<li key={idx} className="flex items-start gap-2">
													<span className="text-(--accent-green) mt-[2px] opacity-80">✓</span>
													<span className="leading-snug line-clamp-2">{ben}</span>
												</li>
											))}
											{app.benefits.length > 3 && (
												<li className="text-xs text-(--text-muted)/60 italic ml-4">{t('www.applications.more', { count: app.benefits.length - 3 })}</li>
											)}
										</ul>
									</div>
								)}
							</div>

							{app.requireLogin !== false && !user ? (
								<Link
									href={`${getEnvUrl('https://account.xernerx.com/login')}?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin + `/applications/${app.id}` : '')}`}
									className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-(--accent) text-(--text) font-semibold shadow-sm hover:bg-(--hover-accent) transition-all active:scale-[0.98] group"
								>
									{t('www.applications.loginApply')}
									<LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
								</Link>
							) : (
								<Link
									href={`/applications/${app.id}`}
									className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-(--accent) text-(--text) font-semibold shadow-sm hover:bg-(--hover-accent) transition-all active:scale-[0.98] group"
								>
									{t('www.applications.applyNow')}
									<ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
								</Link>
							)}
						</motion.div>
					))}
				</div>
			) : null}

			{/* Departments & Contributor Overview */}
			<section className="flex flex-col gap-8">
				<div className="flex flex-col gap-2">
					<h2 className="text-3xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('www.applications.overview.departmentsTitle')}
					</h2>
					<p className="text-(--text-muted) max-w-3xl leading-relaxed">{t('www.applications.overview.departmentsSubtitle')}</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{departments.map((dept) => (
						<div key={dept.key} className="flex flex-col p-8 rounded-3xl bg-(--foreground)/30 border border-(--border)/10 backdrop-blur-md shadow-sm gap-4">
							<div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
								<dept.icon size={22} />
							</div>
							<h3 className="text-xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{dept.title}
							</h3>
							<p className="text-sm text-(--text-muted) leading-relaxed">{dept.description}</p>
						</div>
					))}
				</div>
			</section>

			{/* Application Process Steps */}
			<section className="flex flex-col gap-6 rounded-3xl bg-(--foreground)/30 border border-(--border)/10 backdrop-blur-md p-8 md:p-10 shadow-sm">
				<h2 className="text-2xl md:text-3xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('www.applications.overview.processTitle')}
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{steps.map((step) => (
						<div key={step.key} className="flex flex-col gap-2 p-6 rounded-2xl bg-(--background)/50 border border-(--border)/10">
							<h3 className="text-lg font-bold text-(--accent)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{step.title}
							</h3>
							<p className="text-sm text-(--text-muted) leading-relaxed">{step.description}</p>
						</div>
					))}
				</div>
			</section>

			<PageFaqSection
				subtitle={t('www.careers.faq.subtitle')}
				items={[
					{ question: t('www.careers.faq.q1'), answer: t('www.careers.faq.a1') },
					{ question: t('www.careers.faq.q2'), answer: t('www.careers.faq.a2') },
					{ question: t('www.careers.faq.q3'), answer: t('www.careers.faq.a3') },
				]}
			/>
		</div>
	);
}
