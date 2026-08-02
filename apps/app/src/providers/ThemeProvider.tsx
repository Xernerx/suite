/** @format */

'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

import { useToast } from './ToastProvider';
import { useUser } from '@/providers/UserProvider';

type ThemeMode = 'light' | 'dark' | 'system';

type BackgroundStyle =
	'nebula' | 'none' | 'gradient-v' | 'gradient-h' | 'gradient-diag-l' | 'gradient-diag-r' | 'aurora' | 'spotlight' | 'halo' | 'edge-glow' | 'top-fade' | 'corners' | 'mesh' | 'ring';

type UISettings = {
	uiSpacing: 'compact' | 'default' | 'spacious';
	zoom: number;
};

type ThemeState = {
	mode: ThemeMode;
	accentColor: string;
	syncAcrossClients: boolean;
	background: BackgroundStyle;
	ui: UISettings;
};

type ThemeContextType = ThemeState & {
	setMode: (mode: ThemeMode) => void;
	setAccentColor: (color: string) => void;
	setSyncAcrossClients: (sync: boolean) => void;
	setBackground: (background: BackgroundStyle) => void;
	setUISpacing: (spacing: UISettings['uiSpacing']) => void;
	setZoom: (zoom: UISettings['zoom']) => void;
};

const STORAGE_KEY = 'xernerx-theme';
const CHANNEL = 'xernerx-theme-sync';

const ThemeContext = createContext<ThemeContextType | null>(null);

function darkenColor(hex: string, amount: number) {
	const num = parseInt(hex.replace('#', ''), 16);

	let r = (num >> 16) & 255;
	let g = (num >> 8) & 255;
	let b = num & 255;

	r = Math.max(0, Math.floor(r * (1 - amount)));
	g = Math.max(0, Math.floor(g * (1 - amount)));
	b = Math.max(0, Math.floor(b * (1 - amount)));

	return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function applyTheme(state: ThemeState) {
	const root = document.documentElement;

	let resolved = state.mode;

	if (state.mode === 'system') {
		resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}

	root.dataset.theme = resolved;
	root.style.setProperty('--accent', state.accentColor);

	// generate hover color (slightly darker)
	const accentHover = darkenColor(state.accentColor, 0.2);
	root.style.setProperty('--accent-hover', accentHover);

	const map: Record<BackgroundStyle, string> = {
		nebula: 'var(--bg-nebula)',
		none: '',
		'gradient-v': 'var(--bg-gradient-v)',
		'gradient-h': 'var(--bg-gradient-h)',
		'gradient-diag-l': 'var(--bg-gradient-diag-l)',
		'gradient-diag-r': 'var(--bg-gradient-diag-r)',
		aurora: 'var(--bg-aurora)',
		spotlight: 'var(--bg-spotlight)',
		halo: 'var(--bg-halo)',
		'edge-glow': 'var(--bg-edge-glow)',
		'top-fade': 'var(--bg-edge-glow)',
		corners: 'var(--bg-edge-glow)',
		mesh: 'var(--bg-edge-glow)',
		ring: 'var(--bg-edge-glow)',
	};

	root.style.setProperty('--bg-effect', map[state.background]);

	/* zoom */
	root.style.setProperty('--ui-zoom-scale', `${state.ui.zoom / 100}`);

	/* spacing */
	root.dataset.spacing = state.ui.uiSpacing;
}

function setCookie(name: string, value: string) {
	document.cookie = `${name}=${encodeURIComponent(value)}; path=/; domain=.xernerx.com; max-age=31536000`;
}

function getCookie(name: string) {
	return document.cookie
		.split('; ')
		.find((c) => c.startsWith(name + '='))
		?.split('=')[1];
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const channelRef = useRef<BroadcastChannel | null>(null);

	const { toast } = useToast();
	const { user } = useUser();

	const [hydrated, setHydrated] = useState(false);

	const [state, setState] = useState<ThemeState>({
		mode: 'system',
		accentColor: '#8b7cf6',
		syncAcrossClients: true,
		background: 'nebula',
		ui: {
			uiSpacing: 'default',
			zoom: 100,
		},
	});

	useEffect(() => {
		// 1. try cookie (cross-domain)
		const cookie = getCookie(STORAGE_KEY);

		if (cookie) {
			try {
				setState(JSON.parse(decodeURIComponent(cookie)));
				return;
			} catch {}
		}

		// 2. fallback localStorage
		const stored = localStorage.getItem(STORAGE_KEY);

		if (stored) {
			try {
				setState(JSON.parse(stored));
			} catch {}
		}
	}, []);

	useEffect(() => {
		channelRef.current = new BroadcastChannel(CHANNEL);

		channelRef.current.onmessage = (event) => {
			setState((prev) => {
				if (JSON.stringify(prev) === JSON.stringify(event.data)) return prev;
				return event.data;
			});
		};

		return () => channelRef.current?.close();
	}, []);

	useEffect(() => {
		applyTheme(state);

		const serialized = JSON.stringify(state);

		// local
		localStorage.setItem(STORAGE_KEY, serialized);

		// cross-domain (THE IMPORTANT PART)
		setCookie(STORAGE_KEY, serialized);

		if (state.syncAcrossClients) {
			channelRef.current?.postMessage(state);
		}
	}, [state]);

	useEffect(() => {
		const media = window.matchMedia('(prefers-color-scheme: dark)');

		const listener = () => {
			if (state.mode === 'system') applyTheme(state);
		};

		media.addEventListener('change', listener);
		return () => media.removeEventListener('change', listener);
	}, [state]);

	useEffect(() => {
		if (!user) return;

		if (user.appearance) {
			try {
				const a = user.appearance;

				setState((currentLocalState) => {
					if (!currentLocalState.syncAcrossClients || !a.syncAcrossClients) {
						return currentLocalState;
					}

					return {
						mode: a.mode ?? 'system',
						accentColor: a.accentColor ?? '#8b7cf6',
						syncAcrossClients: a.syncAcrossClients ?? true,
						background: a.background ?? 'nebula',
						ui: {
							uiSpacing: a.ui?.uiSpacing ?? 'default',
							zoom: a.ui?.zoom ?? 100,
						},
					};
				});
			} catch {}
		}

		setHydrated(true);
	}, [user]);

	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	const lastSyncStateRef = useRef<boolean>(state.syncAcrossClients);

	useEffect(() => {
		if (!hydrated || !user?.id) return;

		// Check if the user just toggled sync from TRUE to FALSE
		const turnedOffSync = lastSyncStateRef.current && !state.syncAcrossClients;
		lastSyncStateRef.current = state.syncAcrossClients;

		// If sync is off, AND they didn't just turn it off right now, exit early.
		// This ensures "false" gets saved to the cloud once, but stops all future updates.
		if (!state.syncAcrossClients && !turnedOffSync) {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			return;
		}

		if (timeoutRef.current) clearTimeout(timeoutRef.current);

		timeoutRef.current = setTimeout(() => {
			fetch(`/api/v1/users/${user.id}/profile`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					appearance: state,
				}),
			})
				.then(() => toast('Updated theme preference', 'success'))
				.catch(() => toast('Failed to update theme preference', 'error'));
		}, 1000);

		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, [state, hydrated, user?.id]);

	const value: ThemeContextType = {
		...state,

		setMode: (mode) => setState((s) => ({ ...s, mode })),

		setAccentColor: (color) => setState((s) => ({ ...s, accentColor: color })),

		setSyncAcrossClients: (sync) => setState((s) => ({ ...s, syncAcrossClients: sync })),

		setBackground: (background) => setState((s) => ({ ...s, background })),

		setUISpacing: (spacing) => setState((s) => ({ ...s, ui: { ...s.ui, uiSpacing: spacing } })),

		setZoom: (zoom) => setState((s) => ({ ...s, ui: { ...s.ui, zoom } })),
	};

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
	const ctx = useContext(ThemeContext);
	if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
	return ctx;
}
