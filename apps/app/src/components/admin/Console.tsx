// /** @format */

// 'use client';

// import { Copy, CopyCheck } from 'lucide-react';
// import { useEffect, useRef, useState } from 'react';

// import { motion } from 'framer-motion';
// import { useSidebar } from '@/providers/SidebarProvider';
// import { useToast } from '@/providers/ToastProvider';

// type Log = {
// 	time: Date;
// 	log: string;
// 	type: 'info' | 'warning' | 'error';
// };

// export default function ConsolePanel({ permissions }: { permissions: string[] }) {
// 	const { toast } = useToast();
// 	const { setView } = useSidebar();

// 	const containerRef = useRef<HTMLDivElement | null>(null);
// 	const shouldAutoScroll = useRef(true);

// 	const [logs, setLogs] = useState<Log[]>([]);
// 	const [copied, setCopied] = useState<number | null>(null);
// 	const [search, setSearch] = useState('');
// 	const [live, setLive] = useState(false);

// 	// polling
// 	useEffect(() => {
// 		if (!live) return;

// 		const interval = setInterval(async () => {
// 			const res = await fetch('/api/console');
// 			const data = await res.json();
// 			setLogs(data.logs);
// 		}, 1000);

// 		return () => clearInterval(interval);
// 	}, [live]);

// 	useEffect(() => {
// 		async function fetchLogs() {
// 			const res = await fetch('/api/console');
// 			const data = await res.json();
// 			setLogs(data.logs);

// 			// scroll to bottom after first load
// 			requestAnimationFrame(() => {
// 				const el = containerRef.current;
// 				if (el) el.scrollTop = el.scrollHeight;
// 			});
// 		}

// 		fetchLogs();
// 	}, []);

// 	// track scroll
// 	useEffect(() => {
// 		const el = containerRef.current;
// 		if (!el) return;

// 		const handleScroll = () => {
// 			const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 10;
// 			shouldAutoScroll.current = atBottom;
// 		};

// 		el.addEventListener('scroll', handleScroll);
// 		return () => el.removeEventListener('scroll', handleScroll);
// 	}, []);

// 	// auto scroll
// 	useEffect(() => {
// 		const el = containerRef.current;
// 		if (!el) return;

// 		if (shouldAutoScroll.current) {
// 			el.scrollTop = el.scrollHeight;
// 		}
// 	}, [logs]);

// 	const getColor = (log: string, type: Log['type']) => {
// 		if (type === 'error') return '#ef4444';
// 		if (type === 'warning') return '#f59e0b';

// 		if (log.startsWith('GET')) return '#3b82f6';
// 		if (log.startsWith('POST')) return '#10b981';
// 		if (log.startsWith('PUT')) return '#6366f1';
// 		if (log.startsWith('PATCH')) return '#f59e0b';
// 		if (log.startsWith('DELETE')) return '#ef4444';

// 		return 'var(--text-main)';
// 	};

// 	if (!permissions.includes('owner')) {
// 		setView('overview');
// 		return null;
// 	}

// 	return (
// 		<div className="h-full w-full flex flex-col">
// 			<motion.div
// 				initial={{ opacity: 0, y: 10 }}
// 				animate={{ opacity: 1, y: 0 }}
// 				className="flex-1 flex flex-col rounded-xl border border-white/10 overflow-hidden"
// 				style={{ background: 'var(--bg-panel)' }}
// 			>
// 				{/* header */}
// 				<div className="flex items-center px-3 py-2 border-b border-white/10 bg-black/20">
// 					<span className="text-xs text-white/50 font-medium tracking-wide">Console</span>

// 					<input
// 						type="search"
// 						placeholder="Filter logs..."
// 						value={search}
// 						onChange={(e) => setSearch(e.target.value)}
// 						className="ml-3 flex-1 bg-transparent outline-none text-xs placeholder:text-white/30"
// 					/>

// 					<button
// 						onClick={() => setLive((v) => !v)}
// 						className={`ml-2 px-2 py-1 text-[10px] rounded border transition ${live ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : 'border-white/10 text-white/40 hover:bg-white/5'}`}
// 					>
// 						{live ? 'LIVE' : 'PAUSED'}
// 					</button>
// 				</div>

// 				{/* body */}
// 				<div ref={containerRef} className="flex-1 overflow-auto font-mono text-xs px-2 py-2">
// 					{logs
// 						.filter(({ log }) => log.toLowerCase().includes(search.toLowerCase()))
// 						.map(({ time, log, type }, i) => {
// 							const color = getColor(log, type);

// 							return (
// 								<motion.div
// 									key={i}
// 									initial={{ opacity: 0, y: 4 }}
// 									animate={{ opacity: 1, y: 0 }}
// 									transition={{ duration: 0.12 }}
// 									className="flex items-start gap-2 px-2 py-[2px] rounded hover:bg-white/5 group"
// 								>
// 									{/* left indicator */}
// 									<div className="w-[2px] h-4 mt-[2px] rounded" style={{ background: color, opacity: 0.7 }} />

// 									{/* time */}
// 									<span className="text-[10px] text-white/30 whitespace-nowrap">{new Date(time).toLocaleTimeString()}</span>

// 									{/* log */}
// 									<span className="break-all flex-1" style={{ color }}>
// 										{log}
// 									</span>

// 									{/* copy */}
// 									<button
// 										onClick={() => {
// 											navigator.clipboard.writeText(log);
// 											setCopied(i);
// 											setTimeout(() => setCopied(null), 800);
// 											toast(`Copied log`, 'info');
// 										}}
// 										className="opacity-0 group-hover:opacity-100 transition"
// 									>
// 										{copied === i ? <CopyCheck size={12} /> : <Copy size={12} />}
// 									</button>
// 								</motion.div>
// 							);
// 						})}
// 				</div>
// 			</motion.div>
// 		</div>
// 	);
// }
