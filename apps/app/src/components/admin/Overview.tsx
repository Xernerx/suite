/** @format */
'use client';

import { Activity, Cpu, Database, Server, Timer } from 'lucide-react';
import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';
import uptime from '@/lib/uptime';

type Status = {
	server: {
		uptime: number;
		memory: { usedMB: number; totalMB: number };
		eventLoopLag: number;
		cpu: { usage: number };
		network: { rx: number; tx: number };
	};
};

function Sparkline({ data }: { data: number[] }) {
	if (data.length < 2) return null;

	const max = Math.max(...data);
	const min = Math.min(...data);
	const range = max - min || 1;

	const points = data
		.map((v, i) => {
			const x = (i / (data.length - 1)) * 100;
			const y = 100 - ((v - min) / range) * 100;
			return `${x},${y}`;
		})
		.join(' ');

	return (
		<svg viewBox="0 0 100 100" className="w-full h-10 opacity-70">
			<polyline fill="none" stroke="var(--accent)" strokeWidth="2" points={points} />
		</svg>
	);
}

function loadHistory(key: string) {
	try {
		const raw = localStorage.getItem(key);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function saveHistory(key: string, data: number[]) {
	localStorage.setItem(key, JSON.stringify(data.slice(-60)));
}

export default function AdminOverview() {
	const [status, setStatus] = useState<Status | null>(null);

	// history buffers
	const [cpuHist, setCpuHist] = useState<number[]>(() => loadHistory('cpuHist'));
	const [memoryHist, setMemoryHist] = useState<number[]>(() => loadHistory('memoryHist'));
	const [uptimeHist, setUptimeHist] = useState<number[]>(() => loadHistory('uptimeHist'));
	const [lagHist, setLagHist] = useState<number[]>(() => loadHistory('lagHist'));
	const [networkHist, setNetworkHist] = useState<number[]>(() => loadHistory('networkHist'));

	useEffect(() => {
		let mounted = true;

		async function fetchStatus() {
			const res = await fetch('/api/v1/status').then((r) => r.json());

			const safe = {
				server: {
					uptime: res?.server?.uptime ?? 0,
					memory: res?.server?.memory ?? { usedMB: 0, totalMB: 0 },
					eventLoopLag: res?.server?.eventLoopLag ?? 0,
					cpu: res?.server?.cpu ?? { usage: 0 },
					network: res?.server?.network ?? { rx: 0, tx: 0 },
				},
			};

			setStatus(safe);

			if (!mounted) return;

			setStatus(res);

			setUptimeHist((p) => {
				const next = [...p.slice(-59), safe.server.uptime];
				saveHistory('uptimeHist', next);
				return next;
			});

			setMemoryHist((p) => {
				const next = [...p.slice(-59), safe.server.memory.usedMB];
				saveHistory('memoryHist', next);
				return next;
			});

			setLagHist((p) => {
				const next = [...p.slice(-59), safe.server.eventLoopLag];
				saveHistory('lagHist', next);
				return next;
			});

			setCpuHist((p) => {
				const next = [...p.slice(-59), safe.server.cpu.usage];
				saveHistory('cpuHist', next);
				return next;
			});

			setNetworkHist((p) => {
				const next = [...p.slice(-59), safe.server.network.rx];
				saveHistory('networkHist', next);
				return next;
			});

			setTimeout(fetchStatus, 5000);
		}

		fetchStatus();

		return () => {
			mounted = false;
		};
	}, []);

	if (!status) {
		return <div className="flex items-center justify-center h-[60vh] text-(--text-muted)">Loading system data...</div>;
	}

	const tiles = [
		{
			label: 'Uptime',
			value: uptime(status.server.uptime),
			icon: <Timer size={16} />,
			history: uptimeHist,
		},
		{
			label: 'Memory',
			value: `${status.server.memory.usedMB}/${status.server.memory.totalMB} MB`,
			icon: <Database size={16} />,
			history: memoryHist,
		},
		{
			label: 'Event Loop',
			value: `${status.server.eventLoopLag} ms`,
			icon: <Activity size={16} />,
			history: lagHist,
		},
		{
			label: 'CPU',
			value: `${status.server.cpu?.usage ?? 0}%`,
			icon: <Cpu size={16} />,
			history: cpuHist,
		},
		{
			label: 'Network',
			value: `${Math.round(status.server.network?.rx ?? 0 / 1024)} KB/s`,
			icon: <Server size={16} />,
			history: networkHist,
		},
	];

	return (
		<div className="flex flex-col w-full" style={{ gap: 'calc(var(--ui-gap) * 1.5)' }}>
			<div>
				<h1 className="text-2xl font-semibold">Admin Overview</h1>
				<p className="text-sm text-(--text-muted)">Live process & system metrics</p>
			</div>

			<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
				{tiles.map((tile, i) => (
					<motion.div
						key={i}
						initial={{ opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: i * 0.04 }}
						className="rounded-xl p-4 flex flex-col justify-between"
						style={{
							background: 'var(--container)',
							border: '1px solid var(--border)',
							minHeight: 110,
						}}
					>
						<div className="flex items-center justify-between text-(--text-muted)">
							<span className="text-xs">{tile.label}</span>
							{tile.icon}
						</div>

						<div className="text-sm font-medium mt-1">{tile.value}</div>

						{tile.history.length > 1 && (
							<div className="mt-2">
								<Sparkline data={tile.history} />
							</div>
						)}
					</motion.div>
				))}
			</div>
		</div>
	);
}
