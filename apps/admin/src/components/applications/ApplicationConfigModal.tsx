/** @format */
'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Input, Modal, Selector, Toggle } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import { QuestionBuilder } from './QuestionBuilder';
import type { ApplicationFormData, Role } from './types';

interface ApplicationConfigModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	isEditing: boolean;
	formData: ApplicationFormData;
	setFormData: React.Dispatch<React.SetStateAction<ApplicationFormData>>;
	roles: Role[];
	onSubmit: (e: React.FormEvent) => void;
	isProcessing: boolean;
}

export function ApplicationConfigModal({ open, onOpenChange, isEditing, formData, setFormData, roles, onSubmit, isProcessing }: ApplicationConfigModalProps) {
	const { t } = useDictionary();

	const roleOptions = [
		{
			value: '',
			label: t('admin.dashboard.applicationConfigs.none'),
		},
		...roles.map((r) => ({
			value: r.id,
			label: r.name || t('admin.roles.unnamedRole'),
		})),
	];

	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			maxWidth="max-w-5xl"
			title={isEditing ? t('admin.configs.edit.editTitle') : t('admin.configs.edit.createTitle')}
			description={isEditing ? t('admin.configs.edit.editDesc') : t('admin.configs.edit.createDesc')}
		>
			<form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'calc(var(--ui-gap) * 1.5)' }}>
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
					<QuestionBuilder questions={formData.questions} onChange={(questions) => setFormData({ ...formData, questions })} />
				</div>

				<div className="flex justify-end pt-4 col-span-1 md:col-span-2 border-t border-(--border)/10" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
						{t('admin.configs.edit.cancel')}
					</Button>
					<Button type="submit" variant="primary" disabled={isProcessing}>
						{isProcessing ? t('admin.dashboard.applicationConfigs.saving') : t('admin.dashboard.applicationConfigs.saveConfig')}
					</Button>
				</div>
			</form>
		</Modal>
	);
}
