/** @format */
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2 } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';
import type { ApplicationConfig, Role } from './types';

interface ApplicationConfigCardProps {
	config: ApplicationConfig;
	roles: Role[];
	onEdit: (config: ApplicationConfig) => void;
	onDelete: (id: string) => void;
}

export function ApplicationConfigCard({ config, roles, onEdit, onDelete }: ApplicationConfigCardProps) {
	const { t } = useDictionary();
	const matchedRole = roles.find((r) => r.id === config.rewardRole);

	return (
		<motion.div
			layout
			initial={{
				opacity: 0,
				y: 10,
			}}
			animate={{
				opacity: 1,
				y: 0,
			}}
			exit={{
				opacity: 0,
				scale: 0.95,
			}}
			className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-(--accent)/30 group relative"
			style={{
				padding: 'calc(var(--ui-gap) * 0.75)',
			}}
		>
			<div className="absolute inset-0 bg-gradient-to-br from-transparent to-(--border)/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

			<div
				className="flex flex-col relative z-10"
				style={{
					gap: 'calc(var(--ui-gap) * 0.5)',
				}}
			>
				<div className="flex items-start justify-between">
					<div className="flex flex-col">
						<h2 className="font-bold text-base text-(--text) truncate group-hover:text-(--accent) transition-colors">{config.name}</h2>
						{config.description && <span className="text-xs text-(--text-muted) line-clamp-2 mt-0.5">{config.description}</span>}
					</div>
					<div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
						<button onClick={() => onEdit(config)} className="p-1.5 rounded-lg hover:bg-(--border)/10 text-(--text-muted) hover:text-(--text) transition-colors">
							<Edit size={14} />
						</button>
						<button onClick={() => onDelete(config.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-(--text-muted) hover:text-red-500 transition-colors">
							<Trash2 size={14} />
						</button>
					</div>
				</div>

				<div
					className="flex flex-col mt-2"
					style={{
						gap: 'calc(var(--ui-gap) * 0.25)',
					}}
				>
					<div className="flex items-center flex-wrap gap-2 mb-1">
						<span
							className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${config.status === 'open' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}
						>
							{config.status === 'closed' ? t('admin.dashboard.applicationConfigs.closed') : t('admin.dashboard.applicationConfigs.open')}
						</span>
						<span
							className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${config.public !== false ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}
						>
							{config.public !== false ? t('admin.dashboard.applicationConfigs.public') : t('admin.dashboard.applicationConfigs.unlisted')}
						</span>
						{config.questions && config.questions.length > 0 && (
							<span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400">
								{t('admin.dashboard.applicationConfigs.dynamicForm')}
							</span>
						)}
					</div>
					{matchedRole ? (
						<div className="flex items-center gap-1.5 mt-1">
							<div className="w-2 h-2 rounded-full bg-blue-400/80 shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
							<span className="text-xs font-semibold text-(--text-muted)">{matchedRole.name}</span>
						</div>
					) : config.rewardRole ? (
						<div className="flex items-center gap-1.5 mt-1">
							<div className="w-2 h-2 rounded-full bg-(--border)" />
							<span className="text-xs font-semibold text-(--text-muted) opacity-50">{config.rewardRole}</span>
						</div>
					) : null}
				</div>
			</div>
		</motion.div>
	);
}
