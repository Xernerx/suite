/** @format */

'use client';

import { LayoutGrid, Monitor, Palette, RefreshCw, Sparkles, ZoomIn } from 'lucide-react';

import { Switch } from '@/components/modules/Switch';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import { useUser } from '@/providers/UserProvider';

const LIGHT_COLORS = [
	'#ef4444',
	'#f97316',
	'#f59e0b',
	'#eab308',
	'#84cc16',
	'#22c55e',
	'#10b981',
	'#14b8a6',
	'#06b6d4',
	'#0ea5e9',
	'#3b82f6',
	'#6366f1',
	'#8b7cf6',
	'#8b5cf6',
	'#a855f7',
	'#ec4899',
	'#f43f5e',
];

const DARK_COLORS = [
	'#dc2626',
	'#c2410c',
	'#b45309',
	'#a16207',
	'#4d7c0f',
	'#065f46',
	'#15803d',
	'#0f766e',
	'#0e7490',
	'#0369a1',
	'#1d4ed8',
	'#4338ca',
	'#7a6be6',
	'#6d28d9',
	'#7e22ce',
	'#be185d',
	'#9f1239',
];

const BACKGROUNDS = ['none', 'nebula', 'gradient-v', 'gradient-h', 'gradient-diag-l', 'gradient-diag-r', 'aurora', 'spotlight', 'halo', 'edge-glow', 'top-fade', 'corners', 'mesh', 'ring'];

export default function Appearance() {
	const {
		setAccentColor,
		setSyncAcrossClients,
		setMode,
		syncAcrossClients,
		mode,
		accentColor,
		background,
		setBackground,
		setUISpacing,
		setZoom,
		ui: { uiSpacing, zoom },
	} = useTheme();

	const [zoomPreview, setZoomPreview] = useState(zoom);

	const primary = mode === 'dark' ? LIGHT_COLORS : DARK_COLORS;
	const secondary = mode === 'dark' ? DARK_COLORS : LIGHT_COLORS;

	function button(active: boolean) {
		return `
			px-4 py-2 rounded-md text-sm transition border
			${active ? 'text-white border-transparent' : 'bg-(--container) border-white/10 hover:border-white/30'}
		`;
	}

	return (
		<div className="flex flex-col w-full" style={{ gap: 'var(--ui-gap)' }}>
			{/* THEME */}
			<SettingsCard icon={<Monitor size={18} />} title="Theme" desc="Choose how Xernerx looks.">
				<div className="flex gap-3">
					{['light', 'dark', 'system'].map((m) => (
						<button key={m} onClick={() => setMode(m as any)} className={button(mode === m)} style={mode === m ? { background: 'rgb(var(--accent))' } : {}}>
							{m.charAt(0).toUpperCase() + m.slice(1)}
						</button>
					))}
				</div>
			</SettingsCard>

			{/* ACCENT */}
			<SettingsCard icon={<Palette size={18} />} title="Accent Color" desc="Choose your interface accent.">
				<div className="flex flex-col gap-3">
					{/* PRIMARY (recommended) */}
					<div className="flex flex-wrap gap-3">
						{primary.map((c) => (
							<ColorDot key={c} color={c} active={accentColor === c} onClick={() => setAccentColor(c)} />
						))}
					</div>

					{/* SECONDARY */}
					<div className="flex flex-wrap gap-3 opacity-70" style={{ filter: 'saturate(0.9)' }}>
						{secondary.map((c) => (
							<ColorDot key={c} color={c} active={accentColor === c} onClick={() => setAccentColor(c)} />
						))}
					</div>
				</div>
			</SettingsCard>

			{/* BACKGROUND */}
			<SettingsCard icon={<Sparkles size={18} />} title="Background" desc="Visual effect behind the UI.">
				<div className="flex flex-wrap gap-3">
					{BACKGROUNDS.map((b) => (
						<button key={b} onClick={() => setBackground(b as any)} className={`w-8 h-8 rounded border transition ${background === b ? 'border-white scale-110' : 'border-white/20'}`}>
							<div
								className="w-full h-full"
								style={{
									background: b === 'none' ? 'var(--bg-panel)' : `var(--bg-${b}), var(--bg-panel)`,
								}}
							/>
						</button>
					))}
				</div>
			</SettingsCard>

			{/* SPACING */}
			<SettingsCard icon={<LayoutGrid size={18} />} title="Spacing" desc="Distance between elements.">
				<div className="flex gap-3">
					{['compact', 'default', 'spacious'].map((s) => (
						<button key={s} onClick={() => setUISpacing(s as any)} className={button(uiSpacing === s)} style={uiSpacing === s ? { background: 'rgb(var(--accent))' } : {}}>
							{s}
						</button>
					))}
				</div>
			</SettingsCard>

			{/* ZOOM */}
			<SettingsCard icon={<ZoomIn size={18} />} title="Zoom" desc="Scale the interface.">
				<input
					type="range"
					min={75}
					max={150}
					step={5}
					value={zoomPreview}
					onChange={(e) => {
						const val = Number(e.target.value);
						setZoomPreview(val);
						setZoom(val);
					}}
					className="slider w-full"
				/>

				<div className="flex justify-between text-xs text-(--text-muted)">
					<span>75%</span>
					<span style={{ color: 'rgb(var(--accent))' }}>{zoomPreview}%</span>
					<span>150%</span>
				</div>
			</SettingsCard>

			{/* SYNC */}
			<SettingsCard
				icon={<RefreshCw size={18} />}
				title="Sync"
				desc="Share theme across clients."
				isRow={true} // Render side-by-side layout for switches
			>
				<Switch checked={syncAcrossClients} onChange={setSyncAcrossClients} />
			</SettingsCard>
		</div>
	);
}

/* ================= SMALL COMPONENTS ================= */

function ColorDot({ color, active, onClick }: any) {
	return <button onClick={onClick} className={`w-8 h-8 rounded-full border-2 transition ${active ? 'border-white scale-110' : 'border-white/20'}`} style={{ background: color }} />;
}

function SettingsCard({ icon, title, desc, children, isRow = false }: any) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 6 }}
			animate={{ opacity: 1, y: 0 }}
			className="rounded-xl border"
			style={{
				background: 'var(--container)',
				borderColor: 'var(--border)',
				padding: 'calc(var(--ui-gap) * 1.5)',
				display: 'flex',
				flexDirection: isRow ? 'row' : 'column',
				justifyContent: isRow ? 'space-between' : 'flex-start',
				alignItems: isRow ? 'center' : 'stretch',
				gap: 'calc(var(--ui-gap) * 1)',
			}}
		>
			<div className="flex items-center gap-3">
				<div style={{ color: 'rgb(var(--accent))' }}>{icon}</div>
				<div>
					<div className="text-sm font-medium">{title}</div>
					<div className="text-xs" style={{ color: 'var(--text-muted)' }}>
						{desc}
					</div>
				</div>
			</div>

			{children}
		</motion.div>
	);
}
