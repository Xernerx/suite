'use client';

import React, { useState, useEffect } from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { SiJavascript, SiTypescript, SiPython } from 'react-icons/si';
import { BsFileText, BsCodeSlash } from 'react-icons/bs';

SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('python', python);

const IconMap: Record<string, React.ElementType> = {
	javascript: SiJavascript,
	js: SiJavascript,
	typescript: SiTypescript,
	ts: SiTypescript,
	python: SiPython,
	py: SiPython,
	json: BsCodeSlash,
	txt: BsFileText,
	text: BsFileText,
};

export interface CodeTab {
	label: string;
	language: string;
	code: string;
}

export interface CodeBlockProps {
	tabs: CodeTab[];
}

export function CodeBlock({ tabs }: CodeBlockProps) {
	const [activeLanguage, setActiveLanguage] = useState(tabs[0]?.language);

	useEffect(() => {
		const handleStorage = () => {
			const stored = localStorage.getItem('xernerx-pref-lang');
			if (stored && tabs.some((t) => t.language === stored)) {
				setActiveLanguage(stored);
			}
		};
		handleStorage(); // Check on mount

		const listener = (e: Event) => {
			const ce = e as CustomEvent;
			if (tabs.some((t) => t.language === ce.detail)) {
				setActiveLanguage(ce.detail);
			}
		};
		window.addEventListener('xernerx-lang-change', listener);
		return () => window.removeEventListener('xernerx-lang-change', listener);
	}, [tabs]);

	const handleTabClick = (lang: string) => {
		setActiveLanguage(lang);
		localStorage.setItem('xernerx-pref-lang', lang);
		window.dispatchEvent(new CustomEvent('xernerx-lang-change', { detail: lang }));
	};

	if (!tabs || tabs.length === 0) return null;

	const activeTab = tabs.find((t) => t.language === activeLanguage) || tabs[0];

	return (
		<div className="rounded-xl overflow-hidden border border-(--border)/10 bg-[#0d1117]">
			{tabs.length > 1 && (
				<div className="flex bg-[#0a0d12] border-b border-(--border)/10">
					{tabs.map((tab, idx) => {
						const Icon = IconMap[tab.language] || BsFileText;
						const isActive = tab.language === activeTab.language;
						const btnClasses = [
							'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors outline-none cursor-pointer border-r border-(--border)/5 whitespace-nowrap border-b-2',
							isActive ? 'bg-[#0d1117] text-white border-b-(--accent)' : 'text-gray-500 hover:text-gray-300 hover:bg-[#0d1117]/50 border-transparent',
						].join(' ');

						return (
							<button key={idx} onClick={() => handleTabClick(tab.language)} className={btnClasses}>
								<Icon size={14} className={isActive ? 'text-(--accent)' : 'opacity-70'} />
								<span>{tab.label}</span>
							</button>
						);
					})}
				</div>
			)}

			<SyntaxHighlighter language={activeTab.language} style={vscDarkPlus} customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}>
				{activeTab.code}
			</SyntaxHighlighter>
		</div>
	);
}
