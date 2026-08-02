/** @format */

'use client';

import { ExternalLink, Server } from 'lucide-react';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useSidebar } from '@/providers/SidebarProvider';

export default function Page() {
	const { hide } = useSidebar();

	useEffect(() => {
		hide();
	}, []);

	const hosts = 2;

	const words = ['one', 'two'];

	const hostList = Array.from({ length: hosts }, (_, i) => `${words[i]}-dummi`);

	return (
		<div className="flex flex-col max-w-3xl mx-auto" style={{ gap: 'calc(var(--ui-gap) * 2)' }}>
			{/* HEADER */}
			<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
				<div
					className="p-2 rounded-xl border"
					style={{
						borderColor: 'var(--border)',
						background: 'var(--bg-main)',
					}}
				>
					<Server size={18} />
				</div>

				<div className="flex flex-col">
					<span className="text-lg font-semibold">Hosting</span>
					<span className="text-sm" style={{ color: 'var(--text-muted)' }}>
						Your available host instances
					</span>
				</div>
			</motion.div>

			{/* HOST LIST */}
			<div className="flex flex-col gap-3">
				{hostList.map((host, i) => (
					<motion.div
						key={host}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: i * 0.05 }}
						whileHover={{ y: -2 }}
						className="rounded-xl border group transition"
						style={{
							borderColor: 'var(--border)',
							background: 'var(--container)',
							padding: 'calc(var(--ui-gap) * 1.5)',
						}}
					>
						<Link href={`https://${host}.xernerx.com`} target="_blank" className="flex items-center justify-between">
							{/* LEFT */}
							<div className="flex items-center gap-3">
								<div
									className="p-2 rounded-lg border"
									style={{
										borderColor: 'var(--border)',
										background: 'var(--bg-main)',
									}}
								>
									<Server size={16} />
								</div>

								<div className="flex flex-col">
									<span className="text-sm font-medium">{host}</span>
									<span className="text-xs" style={{ color: 'var(--text-muted)' }}>
										https://{host}.xernerx.com
									</span>
								</div>
							</div>

							{/* RIGHT */}
							<ExternalLink size={16} className="opacity-60 group-hover:opacity-100 transition" />
						</Link>
					</motion.div>
				))}
			</div>
		</div>
	);
}
