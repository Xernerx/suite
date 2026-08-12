/** @format */
'use client';

import React from 'react';
import { motion } from 'framer-motion';

export type TabItem = {
	id: string;
	label: string;
	icon?: React.ReactNode;
};

export interface TabsProps {
	tabs: TabItem[];
	activeTab: string;
	onChange: (id: string) => void;
	className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className = '' }: TabsProps) {
	return (
		<div className={`flex items-center gap-2 p-1.5 bg-(--foreground)/30 backdrop-blur-md rounded-2xl border border-(--border)/10 w-full overflow-x-auto ${className}`}>
			{tabs.map((tab) => {
				const isActive = activeTab === tab.id;
				return (
					<button
						key={tab.id}
						onClick={() => onChange(tab.id)}
						className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-colors duration-200 whitespace-nowrap z-10 ${
							isActive ? 'text-white' : 'text-(--text-muted) hover:text-(--text) hover:bg-(--border)/5'
						}`}
					>
						{isActive && (
							<motion.div
								layoutId="activeTabBackground"
								className="absolute inset-0 bg-(--accent) rounded-xl shadow-md"
								style={{ zIndex: -1 }}
								transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
							/>
						)}
						{tab.icon && <span className={`relative z-10 ${isActive ? 'text-white' : 'opacity-70'}`}>{tab.icon}</span>}
						<span className="relative z-10">{tab.label}</span>
					</button>
				);
			})}
		</div>
	);
}
