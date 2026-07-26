/** @format */
'use client';

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useEffect, useMemo, useState } from 'react';

type Stat = {
	timestamp: number;
	guildCount: number;
	userCount: number;
	shardCount: number;
	voteCount: number;
};

type Props = {
	id: string;
};

export default function Statistics({ id }: Props) {
	const [data, setData] = useState<Stat[]>([]);
	const [range, setRange] = useState<'24h' | '7d' | '30d' | '1y'>('24h');

	const [visible, setVisible] = useState({
		guilds: true,
		users: true,
		votes: false,
		shards: false,
	});

	/* ================= FETCH ================= */

	useEffect(() => {
		(async () => {
			try {
				const res = await fetch(`/api/v1/bots/${id}/stats`);
				if (!res.ok) return;

				const stats = await res.json();
				setData(stats.reverse());
			} catch {}
		})();
	}, [id]);

	/* ================= FILTER ================= */

	const filtered = useMemo(() => {
		const now = Date.now();

		const ranges = {
			'24h': 1000 * 60 * 60 * 24,
			'7d': 1000 * 60 * 60 * 24 * 7,
			'30d': 1000 * 60 * 60 * 24 * 30,
			'1y': 1000 * 60 * 60 * 24 * 365,
		};

		return data.filter((d) => now - d.timestamp <= ranges[range]);
	}, [data, range]);

	/* ================= SUMMARY ================= */

	const summary = useMemo(() => {
		if (!filtered.length) return null;

		const first = filtered[0];
		const last = filtered[filtered.length - 1];

		return {
			guilds: last.guildCount - first.guildCount,
			users: last.userCount - first.userCount,
			votes: last.voteCount - first.voteCount,
		};
	}, [filtered]);

	/* ================= CHART DATA ================= */

	const chartData = filtered.map((d) => ({
		timestamp: d.timestamp,
		guilds: d.guildCount,
		users: d.userCount,
		votes: d.voteCount,
		shards: d.shardCount,
	}));

	/* ================= Y DOMAIN ================= */

	const yDomain = useMemo(() => {
		if (!filtered.length) return [0, 1];

		const values: number[] = [];

		if (visible.guilds) values.push(...filtered.map((d) => d.guildCount));
		if (visible.users) values.push(...filtered.map((d) => d.userCount));
		if (visible.votes) values.push(...filtered.map((d) => d.voteCount));
		if (visible.shards) values.push(...filtered.map((d) => d.shardCount));

		const min = Math.min(...values);
		const max = Math.max(...values);

		const padding = Math.max(1, (max - min) * 0.05);

		return [min - padding, max + padding];
	}, [filtered, visible]);

	/* ================= UI ================= */

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
			{/* RANGE */}
			<div style={{ display: 'flex', gap: '0.5rem' }}>
				{(['24h', '7d', '30d', '1y'] as const).map((r) => (
					<button
						key={r}
						onClick={() => setRange(r)}
						style={{
							padding: '0.4rem 0.8rem',
							borderRadius: '0.5rem',
							border: '1px solid var(--border)',
							background: range === r ? 'var(--accent)' : 'var(--container)',
							fontSize: '0.75rem',
							cursor: 'pointer',
						}}>
						{r}
					</button>
				))}
			</div>

			{/* TOGGLES */}
			<div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
				{Object.entries(visible).map(([key, val]) => (
					<button
						key={key}
						onClick={() =>
							setVisible((prev) => ({
								...prev,
								[key]: !prev[key as keyof typeof prev],
							}))
						}
						style={{
							padding: '0.3rem 0.6rem',
							borderRadius: '0.5rem',
							border: '1px solid var(--border)',
							background: val ? 'var(--accent)' : 'var(--container)',
							fontSize: '0.7rem',
							cursor: 'pointer',
							opacity: val ? 1 : 0.6,
						}}>
						{key}
					</button>
				))}
			</div>

			{/* SUMMARY */}
			{summary && (
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
						gap: '0.75rem',
					}}>
					<Card label='Guilds Δ' value={summary.guilds} />
					<Card label='Users Δ' value={summary.users} />
					<Card label='Votes Δ' value={summary.votes} />
				</div>
			)}

			{/* GRAPH */}
			<div
				style={{
					height: '320px',
					border: '1px solid var(--border)',
					borderRadius: '0.75rem',
					padding: '1rem',
					background: 'var(--container)',
				}}>
				<ResponsiveContainer width='100%' height='100%'>
					<LineChart data={chartData}>
						<CartesianGrid strokeDasharray='3 3' opacity={0.2} />

						<XAxis
							dataKey='timestamp'
							tickFormatter={(value) =>
								range === '24h'
									? new Date(value).toLocaleTimeString([], {
											hour: '2-digit',
											minute: '2-digit',
										})
									: new Date(value).toLocaleDateString()
							}
						/>

						<YAxis domain={yDomain} />

						<Tooltip labelFormatter={(value) => new Date(Number(value)).toLocaleString()} />

						{visible.guilds && <Line type='monotone' dataKey='guilds' stroke='#8884d8' strokeWidth={2} dot={false} />}

						{visible.users && <Line type='monotone' dataKey='users' stroke='#82ca9d' strokeWidth={2} dot={false} />}

						{visible.votes && <Line type='monotone' dataKey='votes' stroke='#facc15' strokeWidth={2} dot={false} />}

						{visible.shards && <Line type='monotone' dataKey='shards' stroke='#60a5fa' strokeWidth={2} dot={false} />}
					</LineChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}

/* ================= CARD ================= */

function Card({ label, value }: { label: string; value: number }) {
	return (
		<div
			style={{
				padding: '0.75rem',
				borderRadius: '0.5rem',
				border: '1px solid var(--border)',
				background: 'var(--container)',
			}}>
			<div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{label}</div>
			<div style={{ fontWeight: 600, fontSize: '1rem' }}>{value.toLocaleString()}</div>
		</div>
	);
}
