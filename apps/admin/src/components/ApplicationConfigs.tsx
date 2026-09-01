// Force recompile
/** @format */
'use client';

import { Edit, Loader2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { Button, Confirm, Input, Modal, Selector, Toggle } from '@xernerx/ui';
import { motion, AnimatePresence } from 'framer-motion';
interface Question {
	id: string;
	type: string; // 'text' | 'textarea' | 'select' | 'checkbox' | 'radio'
	question: string;
	required: boolean;
	options: string[];
}
interface ApplicationConfig {
	id: string;
	name: string;
	description: string;
	rewardRole: string;
	status: string;
	public: boolean;
	requireLogin: boolean;
	createdAt: string;
	benefits: string[];
	requirements: string[];
	questions: Question[];
}
interface Role {
	id: string;
	name?: string;
	role?: string;
	sync?: boolean;
}
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
	const [formData, setFormData] = useState<{
		id: string;
		name: string;
		description: string;
		rewardRole: string;
		status: string;
		public: boolean;
		requireLogin: boolean;
		benefits: string[];
		requirements: string[];
		questions: Question[];
	}>({
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
				title: `Application config ${isEditing ? 'updated' : 'created'}.`,
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
				title: 'Application config deleted.',
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
	const roleOptions = useMemo(() => {
		return [
			{
				value: '',
				label: 'None',
			},
			...roles.map((r) => ({
				value: r.id,
				label: r.name || t('admin.roles.unnamedRole'),
			})),
		];
	}, [roles]);
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
						{configs.map((config) => {
							const matchedRole = roles.find((r) => r.id === config.rewardRole);
							return (
								<motion.div
									key={config.id}
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
												<button
													onClick={() => openEditModal(config)}
													className="p-1.5 rounded-lg hover:bg-(--border)/10 text-(--text-muted) hover:text-(--text) transition-colors"
												>
													<Edit size={14} />
												</button>
												<button
													onClick={() => {
														setDeletingId(config.id);
														setConfirmDeleteOpen(true);
													}}
													className="p-1.5 rounded-lg hover:bg-red-500/10 text-(--text-muted) hover:text-red-500 transition-colors"
												>
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
													{config.status === 'closed' ? t('admin.dashboard.applicationConfigs.closed') || 'CLOSED' : t('admin.dashboard.applicationConfigs.open') || 'OPEN'}
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
						})}
					</AnimatePresence>
				</motion.div>
			)}

			<Modal
				open={isModalOpen}
				onOpenChange={setIsModalOpen}
				maxWidth="max-w-5xl"
				title={isEditing ? 'Edit Config' : 'New Config'}
				description={isEditing ? 'Update the application configuration.' : 'Create a new application template.'}
			>
				<form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'calc(var(--ui-gap) * 1.5)' }}>
					<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
						{isEditing && (
							<div
								className="flex flex-col"
								style={{
									gap: 'calc(var(--ui-gap) * 0.4)',
								}}
							>
								<label className="block text-xs font-medium text-(--text-muted) uppercase tracking-wider">{t('admin.configs.edit.configId')}</label>
								<Input value={formData.id} disabled className="font-mono text-xs opacity-50" />
							</div>
						)}

						<div
							className="flex flex-col"
							style={{
								gap: 'calc(var(--ui-gap) * 0.4)',
							}}
						>
							<label className="block text-xs font-medium text-(--text)">{t('admin.configs.edit.displayName')}</label>
							<Input
								value={formData.name}
								onChange={(e) =>
									setFormData({
										...formData,
										name: e.target.value,
									})
								}
								placeholder={t('admin.configs.edit.displayNamePlaceholder')}
								required
							/>
						</div>

						<div
							className="flex flex-col"
							style={{
								gap: 'calc(var(--ui-gap) * 0.4)',
							}}
						>
							<label className="block text-xs font-medium text-(--text)">{t('admin.configs.edit.description')}</label>
							<Input
								value={formData.description}
								onChange={(e) =>
									setFormData({
										...formData,
										description: e.target.value,
									})
								}
								placeholder={t('admin.configs.edit.descriptionPlaceholder')}
							/>
						</div>

						<div
							className="flex flex-col"
							style={{
								gap: 'calc(var(--ui-gap) * 0.4)',
							}}
						>
							<label className="block text-xs font-medium text-(--text)">{t('admin.configs.edit.rewardRole')}</label>
							<Selector
								value={formData.rewardRole}
								options={roleOptions}
								onChange={(val: string) =>
									setFormData({
										...formData,
										rewardRole: val,
									})
								}
								placeholder={t('admin.configs.edit.rewardRolePlaceholder')}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div
								className="flex flex-col"
								style={{
									gap: 'calc(var(--ui-gap) * 0.4)',
								}}
							>
								<label className="block text-xs font-medium text-(--text)">{t('admin.configs.edit.status')}</label>
								<Selector
									value={formData.status}
									options={[
										{
											value: 'open',
											label: t('admin.dashboard.applicationConfigs.open'),
										},
										{
											value: 'closed',
											label: t('admin.dashboard.applicationConfigs.closed'),
										},
									]}
									onChange={(val: string) =>
										setFormData({
											...formData,
											status: val,
										})
									}
								/>
							</div>

							<div
								className="flex flex-col"
								style={{
									gap: 'calc(var(--ui-gap) * 0.4)',
								}}
							>
								<label className="block text-xs font-medium text-(--text)">{t('admin.configs.edit.visibility')}</label>
								<Selector
									value={String(formData.public)}
									options={[
										{
											value: 'true',
											label: t('admin.dashboard.applicationConfigs.public'),
										},
										{
											value: 'false',
											label: t('admin.dashboard.applicationConfigs.unlisted'),
										},
									]}
									onChange={(val: string) =>
										setFormData({
											...formData,
											public: val === 'true',
										})
									}
								/>
							</div>
						</div>

						<div className="flex items-center gap-2 mt-2">
							<label className="flex items-center gap-2 text-sm text-(--text-muted) cursor-pointer select-none">
								<Toggle size="md" checked={formData.requireLogin !== false} onChange={(e) => setFormData({ ...formData, requireLogin: e.target.checked })} />
								{t('admin.dashboard.applicationConfigs.requiresUserLogin')}
							</label>
						</div>
					</div>

					{/* Array Fields Column */}
					<div className="flex flex-col gap-6">
						{/* Benefits */}
						<div className="flex flex-col gap-3">
							<div className="flex items-center justify-between">
								<label className="text-xs font-bold text-(--text) uppercase tracking-wider">{t('admin.dashboard.applicationConfigs.benefits')}</label>
								<Button
									type="button"
									variant="secondary"
									onClick={() => setFormData({ ...formData, benefits: [...formData.benefits, ''] })}
									style={{ padding: '4px 8px', height: 'auto', fontSize: '12px' }}
								>
									<Plus size={12} /> {t('admin.dashboard.applicationConfigs.addBenefit')}
								</Button>
							</div>
							{formData.benefits.length === 0 ? (
								<p className="text-xs text-(--text-muted) italic">{t('admin.dashboard.applicationConfigs.noBenefits')}</p>
							) : (
								<div className="flex flex-col gap-2">
									{formData.benefits.map((b, i) => (
										<div key={i} className="flex items-center gap-2">
											<Input
												value={b}
												onChange={(e) => {
													const arr = [...formData.benefits];
													arr[i] = e.target.value;
													setFormData({ ...formData, benefits: arr });
												}}
												placeholder={t('admin.dashboard.applicationConfigs.benefitPlaceholder')}
											/>
											<button
												type="button"
												onClick={() => setFormData({ ...formData, benefits: formData.benefits.filter((_, idx) => idx !== i) })}
												className="p-2 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
											>
												<Trash2 size={16} />
											</button>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Requirements */}
						<div className="flex flex-col gap-3">
							<div className="flex items-center justify-between">
								<label className="text-xs font-bold text-(--text) uppercase tracking-wider">{t('admin.dashboard.applicationConfigs.requirements')}</label>
								<Button
									type="button"
									variant="secondary"
									onClick={() => setFormData({ ...formData, requirements: [...formData.requirements, ''] })}
									style={{ padding: '4px 8px', height: 'auto', fontSize: '12px' }}
								>
									<Plus size={12} /> {t('admin.dashboard.applicationConfigs.addRequirement')}
								</Button>
							</div>
							{formData.requirements.length === 0 ? (
								<p className="text-xs text-(--text-muted) italic">{t('admin.dashboard.applicationConfigs.noRequirements')}</p>
							) : (
								<div className="flex flex-col gap-2">
									{formData.requirements.map((r, i) => (
										<div key={i} className="flex items-center gap-2">
											<Input
												value={r}
												onChange={(e) => {
													const arr = [...formData.requirements];
													arr[i] = e.target.value;
													setFormData({ ...formData, requirements: arr });
												}}
												placeholder={t('admin.dashboard.applicationConfigs.requirementPlaceholder')}
											/>
											<button
												type="button"
												onClick={() => setFormData({ ...formData, requirements: formData.requirements.filter((_, idx) => idx !== i) })}
												className="p-2 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
											>
												<Trash2 size={16} />
											</button>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Questions Form Builder */}
						<div className="flex flex-col gap-3">
							<div className="flex items-center justify-between">
								<label className="text-xs font-bold text-(--text) uppercase tracking-wider">{t('admin.dashboard.applicationConfigs.applicationQuestions')}</label>
								<Button
									type="button"
									variant="secondary"
									onClick={() =>
										setFormData({
											...formData,
											questions: [...formData.questions, { id: crypto.randomUUID().split('-')[0], type: 'text', question: '', required: true, options: [] }],
										})
									}
									style={{ padding: '4px 8px', height: 'auto', fontSize: '12px' }}
								>
									<Plus size={12} /> {t('admin.dashboard.applicationConfigs.addQuestion')}
								</Button>
							</div>
							{formData.questions.length === 0 ? (
								<p className="text-xs text-(--text-muted) italic">{t('admin.dashboard.applicationConfigs.noQuestionsAdded')}</p>
							) : (
								<div className="flex flex-col gap-4">
									{formData.questions.map((q, i) => (
										<div key={i} className="flex flex-col gap-3 p-4 border border-(--border)/10 bg-(--background-secondary)/30 rounded-xl relative group">
											<button
												type="button"
												onClick={() => setFormData({ ...formData, questions: formData.questions.filter((_, idx) => idx !== i) })}
												className="absolute top-2 right-2 p-1.5 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
											>
												<Trash2 size={14} />
											</button>

											<div className="grid grid-cols-[1fr_120px] gap-3 pr-8">
												<Input
													value={q.question}
													onChange={(e) => {
														const arr = [...formData.questions];
														arr[i].question = e.target.value;
														setFormData({ ...formData, questions: arr });
													}}
													placeholder={t('admin.dashboard.applicationConfigs.questionPlaceholder')}
												/>
												<Selector
													value={q.type}
													options={[
														{ value: 'text', label: t('admin.dashboard.applicationConfigs.shortText') },
														{ value: 'textarea', label: t('admin.dashboard.applicationConfigs.longText') },
														{ value: 'select', label: t('admin.dashboard.applicationConfigs.dropdown') },
														{ value: 'radio', label: t('admin.dashboard.applicationConfigs.radio') },
														{ value: 'checkbox', label: t('admin.dashboard.applicationConfigs.checkboxes') },
													]}
													onChange={(val: string) => {
														const arr = [...formData.questions];
														arr[i].type = val;
														setFormData({ ...formData, questions: arr });
													}}
												/>
											</div>

											<div className="flex items-center gap-2 mt-1">
												<label className="flex items-center gap-2 text-xs text-(--text-muted) cursor-pointer select-none">
													<Toggle
														size="sm"
														checked={q.required}
														onChange={(e) => {
															const arr = [...formData.questions];
															arr[i].required = e.target.checked;
															setFormData({ ...formData, questions: arr });
														}}
													/>
													{t('admin.dashboard.applicationConfigs.requiredField')}
												</label>
											</div>

											{(q.type === 'select' || q.type === 'radio' || q.type === 'checkbox') && (
												<div className="flex flex-col gap-2 pt-2 border-t border-(--border)/5">
													<div className="flex items-center justify-between">
														<span className="text-[10px] text-(--text-muted) uppercase">{t('admin.dashboard.applicationConfigs.options')}</span>
														<button
															type="button"
															onClick={() => {
																const arr = [...formData.questions];
																arr[i].options = [...(arr[i].options || []), ''];
																setFormData({ ...formData, questions: arr });
															}}
															className="text-[10px] text-(--accent) hover:underline"
														>
															{' '}
															{t('admin.dashboard.applicationConfigs.addOption')}
														</button>
													</div>
													{q.options?.map((opt, optIdx) => (
														<div key={optIdx} className="flex items-center gap-2 pl-4">
															<div className="w-1.5 h-1.5 rounded-full bg-(--border)" />
															<Input
																value={opt}
																onChange={(e) => {
																	const arr = [...formData.questions];
																	arr[i].options[optIdx] = e.target.value;
																	setFormData({ ...formData, questions: arr });
																}}
																placeholder={t('admin.dashboard.applicationConfigs.optionText')}
																className="h-7 text-xs"
															/>
															<button
																type="button"
																onClick={() => {
																	const arr = [...formData.questions];
																	arr[i].options = arr[i].options.filter((_, oIdx) => oIdx !== optIdx);
																	setFormData({ ...formData, questions: arr });
																}}
																className="text-red-500/50 hover:text-red-500"
															>
																<Trash2 size={12} />
															</button>
														</div>
													))}
												</div>
											)}
										</div>
									))}
								</div>
							)}
						</div>
					</div>

					<div className="flex justify-end pt-4 col-span-1 md:col-span-2 border-t border-(--border)/10" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
						<Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
							{t('admin.configs.edit.cancel')}
						</Button>
						<Button type="submit" variant="primary" disabled={isProcessing}>
							{isProcessing ? t('admin.dashboard.applicationConfigs.saving') : t('admin.dashboard.applicationConfigs.saveConfig')}
						</Button>
					</div>
				</form>
			</Modal>

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
