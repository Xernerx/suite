/** @format */
'use client';

import React, { useId } from 'react';
import { motion } from 'framer-motion';

export type TabItem = {
	id: string;
	label: string;
	icon?: React.ReactNode;
	count?: number;
};

export interface TabsProps {
	tabs: TabItem[];
	activeTab: string;
	onChange: (id: string) => void;
	size?: 'sm' | 'md';
	fullWidth?: boolean;
	className?: string;
}

export function Tabs({ tabs, activeTab, onChange, size = 'md', fullWidth = true, className = '' }: TabsProps) {
	const layoutGroupId = useId();

	return (
		<div className={`flex items-center gap-1.5 p-1.5 bg-(--foreground)/30 backdrop-blur-md rounded-2xl border border-(--border)/10 overflow-x-auto ${fullWidth ? 'w-full' : 'w-fit'} ${className}`}>
			{tabs.map((tab) => {
				const isActive = activeTab === tab.id;
				return (
					<button
						key={tab.id}
						type="button"
						onClick={() => onChange(tab.id)}
						className={`relative ${fullWidth ? 'flex-1' : ''} flex items-center justify-center gap-2 ${
							size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
						} font-bold rounded-xl transition-colors duration-200 whitespace-nowrap z-10 cursor-pointer ${
							isActive ? 'text-white' : 'text-(--text-muted) hover:text-(--text) hover:bg-(--border)/5'
						}`}
					>
						{isActive && (
							<motion.div
								layoutId={`activeTabBg-${layoutGroupId}`}
								className="absolute inset-0 bg-(--accent) rounded-xl shadow-[0_0_15px_color-mix(in_srgb,var(--accent)_30%,transparent)]"
								style={{ zIndex: -1 }}
								transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
							/>
						)}
						{tab.icon && <span className={`relative z-10 flex items-center ${isActive ? 'text-white' : 'opacity-70'}`}>{tab.icon}</span>}
						<span className="relative z-10">{tab.label}</span>
						{typeof tab.count === 'number' && (
							<span
								className={`relative z-10 px-1.5 py-0.5 text-[10px] font-extrabold rounded-full leading-none ${
									isActive ? 'bg-(--background)/25 text-white' : 'bg-(--background)/60 text-(--text-muted)'
								}`}
							>
								{tab.count}
							</span>
						)}
					</button>
				);
			})}
		</div>
	);
}
