/** @format */
'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import React from 'react';

export interface RouteDefinition {
	method: string;
	path: string;
	color: string;
}

export interface EndpointSectionProps {
	id: string;
	title: string;
	icon: LucideIcon;
	description: string;
	routes: RouteDefinition[];
	extra?: React.ReactNode;
}

export function EndpointSection({ id, title, icon: Icon, description, routes, extra }: EndpointSectionProps) {
	return (
		<motion.section id={id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6 scroll-mt-24">
			<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
				<Icon className="text-(--accent)" size={24} /> {title}
			</h2>
			<p className="text-(--text-muted)">{description}</p>

			<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl overflow-hidden mb-6">
				{routes.map((route, i) => (
					<div key={i} className={`flex items-center gap-3 p-4 bg-(--background)/50 ${i !== routes.length - 1 || extra ? 'border-b border-(--border)/5' : ''}`}>
						<span className={`font-bold text-xs px-2 py-1 bg-${route.color}-500/20 text-${route.color}-500 rounded uppercase tracking-wider`}>{route.method}</span>
						<code className="text-(--text) font-mono">{route.path}</code>
					</div>
				))}
				{extra}
			</div>
		</motion.section>
	);
}
