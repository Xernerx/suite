/** @format */
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, ArrowLeft, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEnvironment, useUser, useToast, useSidebar } from '@xernerx/providers';
import { Button, Input, Selector, Toggle } from '@xernerx/ui';
import Link from 'next/link';

interface Question {
	id: string;
	type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio';
	question: string;
	required: boolean;
	options?: string[];
}

interface ApplicationConfig {
	id: string;
	name: string;
	description: string;
	requireLogin?: boolean;
	benefits?: string[];
	requirements?: string[];
	questions?: Question[];
}

export default function ApplicationFormPage() {
	const params = useParams();
	const router = useRouter();
	const { id } = params as { id: string };

	const { hide } = useSidebar();
	const { getEnvUrl, isReady } = useEnvironment();
	const { user } = useUser();
	const { toast } = useToast();

	const [config, setConfig] = useState<ApplicationConfig | null>(null);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Answers state: Maps questionId -> value
	const [answers, setAnswers] = useState<Record<string, any>>({});
	const [submitted, setSubmitted] = useState(false);

	useEffect(() => {
		hide();
	}, [hide]);

	useEffect(() => {
		if (!isReady || !id) return;

		async function fetchConfig() {
			try {
				const response = await fetch(getEnvUrl(`https://api.xernerx.com/secure/applications/open/${id}`), {
					credentials: 'include',
				});
				const json = await response.json();

				if (!response.ok || !json.success) throw new Error(json.error || 'Failed to load application');
				setConfig(json.data);

				// Initialize answers state with empty strings/arrays based on type
				const initialAnswers: Record<string, any> = {};
				json.data.questions?.forEach((q: Question) => {
					if (q.type === 'checkbox') initialAnswers[q.id] = [];
					else initialAnswers[q.id] = '';
				});
				setAnswers(initialAnswers);
			} catch (err: any) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		}

		fetchConfig();
	}, [getEnvUrl, isReady, id]);

	const handleAnswerChange = (questionId: string, value: any) => {
		setAnswers((prev) => ({ ...prev, [questionId]: value }));
	};

	const handleCheckboxToggle = (questionId: string, option: string, checked: boolean) => {
		setAnswers((prev) => {
			const current = Array.isArray(prev[questionId]) ? prev[questionId] : [];
			if (checked) {
				return { ...prev, [questionId]: [...current, option] };
			} else {
				return { ...prev, [questionId]: current.filter((opt: string) => opt !== option) };
			}
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (config?.requireLogin !== false && !user) {
			toast({ title: 'You must be logged in to apply.', type: 'error' });
			return;
		}

		setSubmitting(true);
		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/applications/submit'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					configId: id,
					answers,
				}),
			});

			const json = await res.json();
			if (!res.ok || !json.success) {
				throw new Error(json.error || 'Submission failed');
			}

			toast({ title: 'Application submitted successfully!', type: 'success' });
			setSubmitted(true);
		} catch (err: any) {
			toast({ title: err.message, type: 'error' });
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen">
				<Loader2 className="w-10 h-10 animate-spin text-(--accent)" />
			</div>
		);
	}

	if (error || !config) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
				<div className="bg-red-500/10 border border-red-500/20 text-red-400 p-8 rounded-3xl backdrop-blur-md max-w-lg">
					<h2 className="text-xl font-bold mb-2">Error Loading Application</h2>
					<p>{error || 'Application not found'}</p>
					<Link href="/applications" className="inline-block mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
						Go Back
					</Link>
				</div>
			</div>
		);
	}

	if (submitted) {
		return (
			<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center min-h-screen text-center px-4">
				<div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-12 rounded-[2.5rem] backdrop-blur-md max-w-xl w-full shadow-2xl shadow-emerald-500/5">
					<div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
						<Send className="w-10 h-10" />
					</div>
					<h2 className="text-4xl font-extrabold mb-4" style={{ fontFamily: 'var(--font-fredoka)' }}>
						Application Sent!
					</h2>
					<p className="text-emerald-400/80 mb-8">
						Your application for <strong>{config.name}</strong> has been successfully submitted. We will review it shortly!
					</p>
					<Link href="/applications" className="inline-block px-8 py-3 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:opacity-90 transition-opacity">
						Return to Applications
					</Link>
				</div>
			</motion.div>
		);
	}

	return (
		<div className="flex flex-col min-h-screen pt-24 px-6 md:px-12 max-w-4xl mx-auto w-full pb-24">
			<Link href="/applications" className="flex items-center gap-2 text-(--text-muted) hover:text-(--text) mb-8 transition-colors w-fit group">
				<ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to applications
			</Link>

			<div className="mb-12">
				<h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{config.name}
				</h1>
				{config.description && <p className="text-lg text-(--text-muted) max-w-2xl">{config.description}</p>}
			</div>

			<form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
				<div className="flex flex-col gap-8 p-6 sm:p-10 rounded-[2.5rem] border border-neutral-500/10 bg-neutral-500/5 backdrop-blur-2xl shadow-xl shadow-black/5">
					{!config.questions || config.questions.length === 0 ? (
						<div className="text-center py-12 text-(--text-muted)">
							<p className="mb-2">This application doesn't have any specific questions.</p>
							<p>Just hit submit to apply directly!</p>
						</div>
					) : (
						config.questions.map((q, idx) => (
							<div key={q.id} className="flex flex-col gap-3">
								<label className="text-base font-semibold text-(--text) flex items-center gap-2">
									<span className="bg-(--accent)/10 text-(--accent) w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0">{idx + 1}</span>
									{q.question}
									{q.required && <span className="text-red-400 text-lg">*</span>}
								</label>

								<div className="pl-8">
									{q.type === 'text' && (
										<Input value={answers[q.id] || ''} onChange={(e) => handleAnswerChange(q.id, e.target.value)} required={q.required} placeholder="Your answer..." />
									)}

									{q.type === 'textarea' && (
										<textarea value={answers[q.id] || ''} onChange={(e) => handleAnswerChange(q.id, e.target.value)} required={q.required} placeholder="Your answer..." />
									)}

									{q.type === 'select' && (
										<Selector
											value={answers[q.id] || ''}
											onChange={(val: string) => handleAnswerChange(q.id, val)}
											options={[{ value: '', label: 'Select an option' }, ...(q.options || []).map((o) => ({ value: o, label: o }))]}
										/>
									)}

									{q.type === 'radio' && (
										<div className="flex flex-col gap-2">
											{q.options?.map((opt, oIdx) => (
												<label key={oIdx} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-(--border)/10 hover:bg-(--border)/5 transition-colors">
													<input
														type="radio"
														name={`radio-${q.id}`}
														value={opt}
														checked={answers[q.id] === opt}
														onChange={(e) => handleAnswerChange(q.id, e.target.value)}
														required={q.required}
													/>
													<span className="text-sm">{opt}</span>
												</label>
											))}
										</div>
									)}

									{q.type === 'checkbox' && (
										<div className="flex flex-col gap-2">
											{q.options?.map((opt, oIdx) => (
												<label key={oIdx} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-(--border)/10 hover:bg-(--border)/5 transition-colors">
													<Toggle size="sm" checked={(answers[q.id] || []).includes(opt)} onChange={(e) => handleCheckboxToggle(q.id, opt, e.target.checked)} />
													<span className="text-sm">{opt}</span>
												</label>
											))}
										</div>
									)}
								</div>
							</div>
						))
					)}
				</div>

				<div className="flex justify-end pt-4">
					<button
						type="submit"
						disabled={submitting}
						className="flex items-center justify-center gap-2 px-10 py-4 rounded-2xl bg-(--accent) text-white font-bold text-lg shadow-lg shadow-(--accent)/30 hover:shadow-xl hover:shadow-(--accent)/40 hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
					>
						{submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Submit Application'}
						{!submitting && <Send className="w-5 h-5" />}
					</button>
				</div>
			</form>
		</div>
	);
}
