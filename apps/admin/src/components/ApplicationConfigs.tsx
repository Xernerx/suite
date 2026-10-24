/** @format */
'use client';

import { Download, Loader2, Plus, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Button, Confirm, Input, Selector } from '@xernerx/ui';
import { motion, AnimatePresence } from 'framer-motion';
import type { ApplicationConfig, ApplicationFormData, Role } from './applications/types';
import { ApplicationConfigCard } from './applications/ApplicationConfigCard';
import { ApplicationConfigModal } from './applications/ApplicationConfigModal';

export default function ApplicationConfigs() {
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { t } = useDictionary();
	const [configs, setConfigs] = useState<ApplicationConfig[]>([]);
	const [roles, setRoles] = useState<Role[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');

	// Form State
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [formData, setFormData] = useState<ApplicationFormData>({
		id: '',
		name: '',
		description: '',
		rewardRole: '',
		status: 'open',
		public: true,
		requireLogin: true,
		benefits: [],
		requirements: [],
		questions: [],
	});
	const [isEditing, setIsEditing] = useState(false);

	// Delete State
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const fetchConfigsAndRoles = async (isManual = false) => {
		if (isManual) setRefreshing(true);
		else setIsLoading(true);
		try {
			const [configsRes, rolesRes] = await Promise.all([
				fetch(getEnvUrl('https://api.xernerx.com/secure/dispatch/applications'), {
					credentials: 'include',
				}),
				fetch(getEnvUrl('https://api.xernerx.com/secure/core'), {
					credentials: 'include',
				}),
			]);
			if (!configsRes.ok) throw new Error('Failed to fetch configs');
			const configsData = await configsRes.json();
			setConfigs(Array.isArray(configsData) ? configsData : []);
			if (rolesRes.ok) {
				const rolesData = await rolesRes.json();
				setRoles(Array.isArray(rolesData) ? rolesData : []);
			}
		} catch (err: any) {
			toast({
				title: err.message,
				type: 'error',
			});
		} finally {
			setIsLoading(false);
			setRefreshing(false);
		}
	};

	useEffect(() => {
		fetchConfigsAndRoles();
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsProcessing(true);
		try {
			const targetId = isEditing ? formData.id : crypto.randomUUID();
			const url = isEditing ? getEnvUrl(`https://api.xernerx.com/secure/dispatch/applications/${targetId}`) : getEnvUrl(`https://api.xernerx.com/secure/dispatch/applications`);
			const method = isEditing ? 'PATCH' : 'POST';
			const payload = {
				...formData,
				id: targetId,
			};
			const res = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify(payload),
			});
			if (!res.ok) {
				const errData = await res.json();
				throw new Error(errData.error || t('common.toast.error'));
			}
			toast({
				title: isEditing ? t('admin.configs.toasts.configUpdated') : t('admin.configs.toasts.configCreated'),
				type: 'success',
			});
			setIsModalOpen(false);
			fetchConfigsAndRoles();
		} catch (err: any) {
			toast({
				title: err.message,
				type: 'error',
			});
		} finally {
			setIsProcessing(false);
		}
	};

	const handleDelete = async () => {
		if (!deletingId) return;
		setIsProcessing(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/dispatch/applications/${deletingId}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (!res.ok) throw new Error('Failed to delete config');
			toast({
				title: t('admin.configs.toasts.configDeleted'),
				type: 'success',
			});
			fetchConfigsAndRoles();
		} catch (err: any) {
			toast({
				title: err.message,
				type: 'error',
			});
		} finally {
			setIsProcessing(false);
			setConfirmDeleteOpen(false);
			setDeletingId(null);
		}
	};

	const openCreateModal = () => {
		setFormData({
			id: '',
			name: '',
			description: '',
			rewardRole: '',
			status: 'open',
			public: true,
			requireLogin: true,
			benefits: [],
			requirements: [],
			questions: [],
		});
		setIsEditing(false);
		setIsModalOpen(true);
	};

	const openEditModal = (config: ApplicationConfig) => {
		setFormData({
			id: config.id,
			name: config.name,
			description: config.description || '',
			rewardRole: config.rewardRole || '',
			status: config.status || 'open',
			public: config.public !== false, // default true if undefined
			requireLogin: config.requireLogin !== false,
			benefits: config.benefits || [],
			requirements: config.requirements || [],
			questions: config.questions || [],
		});
		setIsEditing(true);
		setIsModalOpen(true);
	};

	const requestDelete = (id: string) => {
		setDeletingId(id);
		setConfirmDeleteOpen(true);
	};

	const filteredConfigs = useMemo(() => {
		const q = search.trim().toLowerCase();
		return configs.filter((c) => {
			const cStatus = c.status || 'open';
			if (statusFilter !== 'all' && cStatus !== statusFilter) return false;
			if (!q) return true;
			return (
				String(c.name || '')
					.toLowerCase()
					.includes(q) ||
				String(c.id || '')
					.toLowerCase()
					.includes(q) ||
				String(c.description || '')
					.toLowerCase()
					.includes(q)
			);
		});
	}, [configs, search, statusFilter]);

	const exportConfigs = (format: 'csv' | 'json') => {
		if (filteredConfigs.length === 0) return;
		if (format === 'json') {
			const blob = new Blob([JSON.stringify(filteredConfigs, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `xernerx-application-configs-${new Date().toISOString().slice(0, 10)}.json`;
			a.click();
			URL.revokeObjectURL(url);
			return;
		}
		const headers = ['id', 'name', 'status', 'public', 'requireLogin', 'rewardRole', 'questionsCount'];
		const rows = filteredConfigs.map((cfg) =>
			[
				cfg.id,
				(cfg.name || '').replace(/"/g, '""'),
				cfg.status || 'open',
				String(cfg.public !== false),
				String(cfg.requireLogin !== false),
				cfg.rewardRole || '',
				String((cfg.questions || []).length),
			]
				.map((cell) => `"${cell}"`)
				.join(',')
		);
		const csvContent = [headers.join(','), ...rows].join('\n');
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `xernerx-application-configs-${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	if (isLoading) return <Loading />;

	return (
		<div
			className="flex flex-col max-w-7xl mx-auto w-full relative"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
			}}
		>
			<div
				className="flex flex-col sm:flex-row sm:items-center justify-between"
				style={{
					gap: 'var(--ui-gap)',
				}}
			>
				<div
					className="flex flex-col"
					style={{
						gap: 'calc(var(--ui-gap) * 0.25)',
					}}
				>
					<h1
						className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm"
						style={{
							fontFamily: `var(--font-fredoka)`,
						}}
					>
						{t('admin.configs.title')}
					</h1>
					<p className="text-sm text-(--text-muted)">{t('admin.configs.description')}</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button variant="secondary" size="sm" onClick={() => exportConfigs('csv')} disabled={filteredConfigs.length === 0} className="flex items-center gap-1.5">
						<Download size={14} />
						{t('admin.configs.exportCsv')}
					</Button>
					<Button variant="secondary" size="sm" onClick={() => exportConfigs('json')} disabled={filteredConfigs.length === 0} className="flex items-center gap-1.5">
						<Download size={14} />
						{t('admin.configs.exportJson')}
					</Button>
					<Button variant="secondary" size="sm" onClick={() => fetchConfigsAndRoles(true)} disabled={refreshing} className="flex items-center gap-1.5">
						<RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
						{t('admin.configs.refresh')}
					</Button>
					<Button
						variant="primary"
						onClick={openCreateModal}
						style={{
							gap: 'calc(var(--ui-gap) * 0.5)',
						}}
					>
						<Plus size={16} />
						{t('admin.configs.newConfig')}
					</Button>
				</div>
			</div>

			<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
				<div className="relative flex-1">
					<Input variant="search" shortcut={true} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('admin.configs.searchPlaceholder')} />
				</div>
				<div className="w-full sm:w-44">
					<Selector
						value={statusFilter}
						onChange={(val) => setStatusFilter(val as any)}
						options={[
							{ value: 'all', label: t('admin.configs.filterAll') },
							{ value: 'open', label: t('admin.configs.filterOpen') },
							{ value: 'closed', label: t('admin.configs.filterClosed') },
						]}
					/>
				</div>
			</div>

			{/* List */}
			{filteredConfigs.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-3xl border border-(--border)/10 bg-(--foreground) py-16 text-center">
					<p className="text-sm text-(--text-muted)">{t('admin.configs.empty')}</p>
				</div>
			) : (
				<motion.div
					layout
					className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
					style={{
						gap: 'var(--ui-gap)',
					}}
				>
					<AnimatePresence>
						{filteredConfigs.map((config) => (
							<ApplicationConfigCard key={config.id} config={config} roles={roles} onEdit={openEditModal} onDelete={requestDelete} />
						))}
					</AnimatePresence>
				</motion.div>
			)}

			<ApplicationConfigModal
				open={isModalOpen}
				onOpenChange={setIsModalOpen}
				isEditing={isEditing}
				formData={formData}
				setFormData={setFormData}
				roles={roles}
				onSubmit={handleSubmit}
				isProcessing={isProcessing}
			/>

			<Confirm
				open={confirmDeleteOpen}
				onOpenChange={setConfirmDeleteOpen}
				title={t('admin.configs.edit.deleteTooltip')}
				description={t('admin.dashboard.applicationConfigs.deleteConfirmDesc')}
				confirmKeyword={configs.find((c) => c.id === deletingId)?.name || deletingId || undefined}
				confirmText={t('admin.dashboard.applicationConfigs.delete')}
				cancelText={t('admin.configs.edit.cancel')}
				onConfirm={handleDelete}
				loading={isProcessing}
			/>
		</div>
	);
}
