/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';

export interface PolicySubsectionProps {
	code: string;
	id?: string;
	title?: React.ReactNode;
	tocLabel?: string;
	children: React.ReactNode;
}

function deriveShortLabel(title: React.ReactNode, children: React.ReactNode, explicitTocLabel?: string): string {
	if (explicitTocLabel) return explicitTocLabel.replace(/:\s*$/, '').trim();
	if (typeof title === 'string' && title.trim()) {
		return title.replace(/:\s*$/, '').trim();
	}
	if (typeof children === 'string' && children.trim()) {
		const raw = children.trim();
		const colonIdx = raw.indexOf(':');
		if (colonIdx > 0 && colonIdx <= 48) {
			return raw.slice(0, colonIdx).trim();
		}
		const words = raw.replace(/[.,;]+$/, '').split(/\s+/);
		if (words.length <= 5) return words.join(' ');
		return `${words.slice(0, 5).join(' ')}…`;
	}
	return '';
}

export function PolicySubsection({ code, id, title, tocLabel, children }: PolicySubsectionProps) {
	const cleanedTitle = typeof title === 'string' ? title.replace(/:\s*$/, '') : title;
	const resolvedId = id || `subsection-${code.replace(/\./g, '-')}`;
	const shortLabel = deriveShortLabel(title, children, tocLabel);
	const isFirstLevelSub = code.split('.').length === 2;

	if (!cleanedTitle) {
		return (
			<div
				id={resolvedId}
				data-policy-subsection={isFirstLevelSub ? 'true' : undefined}
				data-subsection-code={code}
				data-subsection-label={shortLabel}
				className="scroll-mt-32 text-(--text-muted) leading-relaxed"
			>
				<strong className="text-(--text) font-bold mr-2" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{code}
				</strong>
				<span>{children}</span>
			</div>
		);
	}

	return (
		<div id={resolvedId} data-policy-subsection={isFirstLevelSub ? 'true' : undefined} data-subsection-code={code} data-subsection-label={shortLabel} className="scroll-mt-32 space-y-1">
			<h3 className="text-lg font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
				{code} {cleanedTitle}
			</h3>
			<div className="text-(--text-muted) leading-relaxed">{children}</div>
		</div>
	);
}

export interface PolicyTocSectionItem {
	id: string;
	title: string;
}

interface DiscoveredSubsection {
	id: string;
	code: string;
	label: string;
}

export function PolicyTocSidebar({ tocTitle, sections }: { tocTitle: string; sections: PolicyTocSectionItem[]; activeSectionId?: string | null; onSelectSection?: (id: string) => void }) {
	const [subsectionsBySection, setSubsectionsBySection] = useState<Record<string, DiscoveredSubsection[]>>({});
	const [trackedSectionId, setTrackedSectionId] = useState<string | null>(() => sections[0]?.id || null);
	const [activeSubsectionId, setActiveSubsectionId] = useState<string | null>(null);
	const manualLockUntilRef = useRef<number>(0);
	const sectionsRef = useRef<PolicyTocSectionItem[]>(sections);
	sectionsRef.current = sections;

	const sectionIdsKey = sections.map((s) => s.id).join(',');

	// 1. Discover [data-policy-subsection="true"] nodes inside each section
	useEffect(() => {
		if (typeof document === 'undefined') return;

		const scan = () => {
			const nextMap: Record<string, DiscoveredSubsection[]> = {};
			sectionsRef.current.forEach((sec) => {
				const secEl = document.getElementById(sec.id);
				if (!secEl) return;
				const nodes = secEl.querySelectorAll<HTMLElement>('[data-policy-subsection="true"]');
				const list: DiscoveredSubsection[] = [];
				nodes.forEach((node) => {
					const subId = node.id;
					const code = node.getAttribute('data-subsection-code') || '';
					const label = node.getAttribute('data-subsection-label') || '';
					if (subId && code) {
						list.push({ id: subId, code, label });
					}
				});
				if (list.length > 0) {
					nextMap[sec.id] = list;
				}
			});
			setSubsectionsBySection(nextMap);
		};

		scan();
		const t1 = setTimeout(scan, 120);
		const t2 = setTimeout(scan, 400);
		return () => {
			clearTimeout(t1);
			clearTimeout(t2);
		};
	}, [sectionIdsKey]);

	// 2. Deterministic scroll spy on #main-scroll-container (and window fallback)
	useEffect(() => {
		if (typeof window === 'undefined' || typeof document === 'undefined' || sectionsRef.current.length === 0) return;

		const scroller = document.getElementById('main-scroll-container');
		let rafId: number | null = null;

		const computeActiveOnScroll = () => {
			if (Date.now() < manualLockUntilRef.current) return;
			const curSections = sectionsRef.current;
			if (curSections.length === 0) return;

			const scrollerRect = scroller ? scroller.getBoundingClientRect() : { top: 0, height: window.innerHeight };
			const triggerY = scrollerRect.top + Math.min(240, scrollerRect.height * 0.34);

			let chosenSectionId = curSections[0].id;

			// If scrolled to the very bottom, activate the last section that is visible
			const atBottom = scroller
				? scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <= 24 && scroller.scrollTop > 40
				: window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 24 && window.scrollY > 40;

			if (atBottom) {
				chosenSectionId = curSections[curSections.length - 1].id;
			} else {
				for (let i = 0; i < curSections.length; i++) {
					const sec = curSections[i];
					const el = document.getElementById(sec.id);
					if (!el) continue;
					const r = el.getBoundingClientRect();
					if (r.top <= triggerY) {
						chosenSectionId = sec.id;
					} else {
						break;
					}
				}
			}

			setTrackedSectionId(chosenSectionId);

			const subsForChosen = subsectionsBySection[chosenSectionId] || [];
			if (subsForChosen.length === 0) {
				setActiveSubsectionId(null);
				return;
			}

			let chosenSubId = subsForChosen[0].id;
			for (let i = 0; i < subsForChosen.length; i++) {
				const sub = subsForChosen[i];
				const subEl = document.getElementById(sub.id);
				if (!subEl) continue;
				const sr = subEl.getBoundingClientRect();
				if (sr.top <= triggerY + 24) {
					chosenSubId = sub.id;
				} else {
					break;
				}
			}
			setActiveSubsectionId(chosenSubId);
		};

		const onScroll = () => {
			if (rafId !== null) cancelAnimationFrame(rafId);
			rafId = requestAnimationFrame(computeActiveOnScroll);
		};

		computeActiveOnScroll();
		const initTimer = setTimeout(computeActiveOnScroll, 180);

		scroller?.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('scroll', onScroll, { passive: true, capture: true });
		window.addEventListener('resize', onScroll, { passive: true });

		return () => {
			clearTimeout(initTimer);
			if (rafId !== null) cancelAnimationFrame(rafId);
			scroller?.removeEventListener('scroll', onScroll);
			window.removeEventListener('scroll', onScroll, { capture: true } as EventListenerOptions);
			window.removeEventListener('resize', onScroll);
		};
	}, [sectionIdsKey, subsectionsBySection]);

	const effectiveActiveSectionId = trackedSectionId || sections[0]?.id || null;

	const scrollToElement = (targetId: string) => {
		if (typeof document === 'undefined') return;
		const target = document.getElementById(targetId);
		if (!target) return;
		const scroller = document.getElementById('main-scroll-container');
		if (scroller) {
			const scrollerRect = scroller.getBoundingClientRect();
			const targetRect = target.getBoundingClientRect();
			const scale = scroller.offsetHeight > 0 ? scrollerRect.height / scroller.offsetHeight : 1;
			const deltaTop = (targetRect.top - scrollerRect.top) / (scale || 1);
			const desiredTop = Math.max(0, scroller.scrollTop + deltaTop - 96);
			scroller.scrollTo({ top: desiredTop, behavior: 'smooth' });
		} else {
			target.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	};

	return (
		<aside className="hidden lg:block sticky top-32 self-start max-h-[calc(100dvh-9rem)] overflow-y-auto pr-2">
			<div className="text-sm uppercase tracking-wide text-(--text-muted) mb-6">{tocTitle}</div>
			<nav className="space-y-3.5 text-sm">
				{sections.map((section) => {
					const isSectionOpen = effectiveActiveSectionId === section.id;
					const subs = subsectionsBySection[section.id] || [];

					return (
						<div key={section.id} className="space-y-1.5">
							<a
								href={`#${section.id}`}
								onClick={(e) => {
									e.preventDefault();
									manualLockUntilRef.current = Date.now() + 550;
									setTrackedSectionId(section.id);
									const firstSub = (subsectionsBySection[section.id] || [])[0];
									setActiveSubsectionId(firstSub ? firstSub.id : null);
									scrollToElement(section.id);
									if (typeof window !== 'undefined') {
										window.history.replaceState(null, '', `#${section.id}`);
									}
								}}
								className={`block transition ${isSectionOpen ? 'text-(--accent) font-semibold' : 'text-(--text-muted) hover:text-(--text)'}`}
							>
								{section.title}
							</a>

							<AnimatePresence initial={false}>
								{isSectionOpen && subs.length > 0 && (
									<motion.div
										key={`toc-subs-${section.id}`}
										initial={{ height: 0, opacity: 0 }}
										animate={{ height: 'auto', opacity: 1 }}
										exit={{ height: 0, opacity: 0 }}
										transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
										className="overflow-hidden"
									>
										<div className="pl-3.5 ml-1.5 border-l border-(--accent)/35 space-y-1.5 py-1">
											{subs.map((sub) => {
												const isSubActive = activeSubsectionId === sub.id;
												return (
													<a
														key={sub.id}
														href={`#${sub.id}`}
														onClick={(e) => {
															e.preventDefault();
															manualLockUntilRef.current = Date.now() + 550;
															setTrackedSectionId(section.id);
															setActiveSubsectionId(sub.id);
															scrollToElement(sub.id);
															if (typeof window !== 'undefined') {
																window.history.replaceState(null, '', `#${sub.id}`);
															}
														}}
														className={`block text-xs leading-snug transition truncate ${
															isSubActive ? 'text-(--accent) font-semibold' : 'text-(--text-muted)/85 hover:text-(--text)'
														}`}
														title={`${sub.code} ${sub.label}`}
													>
														<span className="font-mono font-bold mr-1.5">{sub.code}</span>
														<span>{sub.label}</span>
													</a>
												);
											})}
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					);
				})}
			</nav>
		</aside>
	);
}
