/** @format */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { SiJavascript, SiTypescript, SiPython, SiPnpm, SiNpm, SiYarn, SiBun, SiHtml5, SiMarkdown } from 'react-icons/si';
import { BsFileText, BsCodeSlash, BsTerminal, BsLink45Deg, BsImage } from 'react-icons/bs';
import { Copy, Check } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';

SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('sh', bash);
SyntaxHighlighter.registerLanguage('shell', bash);
SyntaxHighlighter.registerLanguage('html', markup);
SyntaxHighlighter.registerLanguage('markup', markup);
SyntaxHighlighter.registerLanguage('svg', markup);
SyntaxHighlighter.registerLanguage('markdown', markdown);
SyntaxHighlighter.registerLanguage('md', markdown);

const IconMap: Record<string, React.ElementType> = {
	javascript: SiJavascript,
	js: SiJavascript,
	typescript: SiTypescript,
	ts: SiTypescript,
	python: SiPython,
	py: SiPython,
	json: BsCodeSlash,
	bash: BsTerminal,
	sh: BsTerminal,
	shell: BsTerminal,
	terminal: BsTerminal,
	pnpm: SiPnpm,
	npm: SiNpm,
	yarn: SiYarn,
	bun: SiBun,
	html: SiHtml5,
	iframe: SiHtml5,
	markup: SiHtml5,
	markdown: SiMarkdown,
	md: SiMarkdown,
	svg: BsImage,
	link: BsLink45Deg,
	url: BsLink45Deg,
	txt: BsFileText,
	text: BsFileText,
};

export interface CodeTab {
	id?: string;
	label: string;
	language: string;
	code: string;
	icon?: React.ElementType;
}

export interface CodeBlockProps {
	tabs: CodeTab[];
	defaultIndex?: number;
}

function getTabIcon(tab: CodeTab): React.ElementType {
	if (tab.icon) return tab.icon;
	const labelKey = tab.label.toLowerCase().trim();
	if (IconMap[labelKey]) return IconMap[labelKey];
	const langKey = tab.language.toLowerCase().trim();
	if (IconMap[langKey]) return IconMap[langKey];
	return BsCodeSlash;
}

export function CodeBlock({ tabs, defaultIndex = 0 }: CodeBlockProps) {
	const { t } = useDictionary();
	const [activeIndex, setActiveIndex] = useState<number>(() => {
		if (defaultIndex >= 0 && defaultIndex < tabs.length) return defaultIndex;
		return 0;
	});
	const [copied, setCopied] = useState(false);

	// A block is considered a language-preference selector only if every tab has a unique, distinct language
	const isMultiLanguageBlock = useMemo(() => {
		if (!tabs || tabs.length <= 1) return false;
		const langs = tabs.map((t) => t.language.toLowerCase().trim()).filter(Boolean);
		return langs.length === tabs.length && new Set(langs).size === tabs.length;
	}, [tabs]);

	useEffect(() => {
		if (!isMultiLanguageBlock) return;

		const handleStorage = () => {
			const stored = localStorage.getItem('xernerx-pref-lang');
			if (stored) {
				const matchIndex = tabs.findIndex((t) => t.language.toLowerCase() === stored.toLowerCase());
				if (matchIndex !== -1) {
					setActiveIndex(matchIndex);
				}
			}
		};
		handleStorage();

		const listener = (e: Event) => {
			const ce = e as CustomEvent;
			if (ce.detail) {
				const matchIndex = tabs.findIndex((t) => t.language.toLowerCase() === ce.detail.toLowerCase());
				if (matchIndex !== -1) {
					setActiveIndex(matchIndex);
				}
			}
		};

		window.addEventListener('xernerx-lang-change', listener);
		return () => window.removeEventListener('xernerx-lang-change', listener);
	}, [tabs, isMultiLanguageBlock]);

	const handleTabClick = (index: number) => {
		setActiveIndex(index);
		setCopied(false);
		const tab = tabs[index];
		if (tab && isMultiLanguageBlock) {
			localStorage.setItem('xernerx-pref-lang', tab.language);
			window.dispatchEvent(new CustomEvent('xernerx-lang-change', { detail: tab.language }));
		}
	};

	if (!tabs || tabs.length === 0) return null;

	const activeTab = tabs[activeIndex] || tabs[0];

	const handleCopy = () => {
		navigator.clipboard.writeText(activeTab.code);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="relative rounded-xl overflow-hidden border border-(--border)/10 bg-[#0d1117]">
			<div className="flex items-center justify-between bg-[#0a0d12] border-b border-(--border)/10">
				<div className="flex items-center overflow-x-auto">
					{tabs.map((tab, idx) => {
						const Icon = getTabIcon(tab);
						const isActive = idx === activeIndex;
						const btnClasses = [
							'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors outline-none cursor-pointer border-r border-(--border)/5 whitespace-nowrap border-b-2',
							isActive ? 'bg-[#0d1117] text-white border-b-(--accent)' : 'text-gray-500 hover:text-gray-300 hover:bg-[#0d1117]/50 border-transparent',
						].join(' ');

						return (
							<button key={tab.id || idx} type="button" onClick={() => handleTabClick(idx)} className={btnClasses}>
								<Icon size={14} className={isActive ? 'text-(--accent)' : 'opacity-70'} />
								<span>{tab.label}</span>
							</button>
						);
					})}
				</div>

				<button
					type="button"
					onClick={handleCopy}
					className="flex items-center gap-1.5 px-3 py-1.5 mr-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors shrink-0 cursor-pointer"
				>
					{copied ? <Check size={13} className="text-(--accent)" /> : <Copy size={13} />}
					<span>{copied ? t('app.widgets.copied') : t('app.widgets.copy')}</span>
				</button>
			</div>

			<SyntaxHighlighter language={activeTab.language} style={vscDarkPlus} customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}>
				{activeTab.code}
			</SyntaxHighlighter>
		</div>
	);
}
