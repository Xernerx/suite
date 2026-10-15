/** @format */
'use client';

import { Loader2, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { Button, Confirm } from '@xernerx/ui';
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
	const [isProcessing, setIsProcessing] = useState(false);

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

	const fetchConfigsAndRoles = async () => {
		setIsLoading(true);
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
			setConfigs(await configsRes.json());
			if (rolesRes.ok) setRoles(await rolesRes.json());
		} catch (err: any) {
			toast({
				title: err.message,
				type: 'error',
			});
		} finally {
			setIsLoading(false);
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
				throw new Error(errData.error || 'Failed to save config');
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

			{/* List */}
			{isLoading ? (
				<div className="flex flex-col items-center justify-center py-20 text-(--text-muted)">
					<Loader2 size={32} className="animate-spin mb-4 opacity-50" />
					<p>{t('admin.configs.loading')}</p>
				</div>
			) : configs.length === 0 ? (
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
						{configs.map((config) => (
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
				confirmText={t('admin.dashboard.applicationConfigs.delete')}
				cancelText={t('admin.configs.edit.cancel')}
				onConfirm={handleDelete}
				loading={isProcessing}
			/>
		</div>
	);
}
