/** @format */
'use client';

import { ArrowLeft, ArrowRight, Check, ClipboardCheck, FileText, HelpCircle, Plus, ShieldCheck } from 'lucide-react';
import { Badge, Button, Input, Modal, MultiSelector, Selector } from '@xernerx/ui';
import { useDictionary, useToast } from '@xernerx/providers';
import { useEffect, useState } from 'react';
import PositionQuestionCard from './PositionQuestionCard';
import { QUESTION_TYPES, type DiscordRoleItem, type QuestionType, type YourAppsPosition, type YourAppsQuestion } from './types';

export const createEmptyQuestion = (): YourAppsQuestion => ({
	id: `q_${Math.random().toString(36).slice(2, 8)}`,
	question: '',
	type: 'paragraph',
	placeholder: '',
	required: true,
	options: [],
	minLength: 1,
	maxLength: 1000,
});

interface PositionWizardModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialPosition: YourAppsPosition | null;
	discordRoles: DiscordRoleItem[];
	saving: boolean;
	onSave: (payload: {
		name: string;
		description: string;
		category: 'staff' | 'appeal' | 'feedback' | 'event' | 'custom';
		state: 'open' | 'closed';
		questions: YourAppsQuestion[];
		rewardRoles: string[];
		removeRoles: string[];
		requiredRoles: string[];
		restrictedRoles: string[];
		cooldown: number;
		minimumJoinTime: number;
		acceptMessage: string;
		denyMessage: string;
	}) => Promise<void>;
}

export default function PositionWizardModal({ open, onOpenChange, initialPosition, discordRoles, saving, onSave }: PositionWizardModalProps) {
	const { t } = useDictionary();
	const { toast } = useToast();

	const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [category, setCategory] = useState<'staff' | 'appeal' | 'feedback' | 'event' | 'custom'>('staff');
	const [state, setState] = useState<'open' | 'closed'>('open');
	const [questions, setQuestions] = useState<YourAppsQuestion[]>([createEmptyQuestion()]);
	const [rewardRoles, setRewardRoles] = useState<string[]>([]);
	const [removeRoles, setRemoveRoles] = useState<string[]>([]);
	const [requiredRoles, setRequiredRoles] = useState<string[]>([]);
	const [restrictedRoles, setRestrictedRoles] = useState<string[]>([]);
	const [cooldown, setCooldown] = useState(0);
	const [minimumJoinTime, setMinimumJoinTime] = useState(0);
	const [acceptMessage, setAcceptMessage] = useState('');
	const [denyMessage, setDenyMessage] = useState('');

	useEffect(() => {
		if (!open) return;
		setStep(0);
		if (initialPosition) {
			setName(initialPosition.name || '');
			setDescription(initialPosition.description || '');
			setCategory(initialPosition.category || 'staff');
			setState(initialPosition.state || 'open');
			setQuestions(initialPosition.questions?.length > 0 ? initialPosition.questions.map((q) => ({ ...q, options: Array.isArray(q.options) ? [...q.options] : [] })) : [createEmptyQuestion()]);
			setRewardRoles([...(initialPosition.rewardRoles || [])]);
			setRemoveRoles([...(initialPosition.removeRoles || [])]);
			setRequiredRoles([...(initialPosition.requiredRoles || [])]);
			setRestrictedRoles([...(initialPosition.restrictedRoles || [])]);
			setCooldown(Number(initialPosition.cooldown) || 0);
			setMinimumJoinTime(Number(initialPosition.minimumJoinTime) || 0);
			setAcceptMessage(initialPosition.acceptMessage || '');
			setDenyMessage(initialPosition.denyMessage || '');
		} else {
			setName('');
			setDescription('');
			setCategory('staff');
			setState('open');
			setQuestions([createEmptyQuestion()]);
			setRewardRoles([]);
			setRemoveRoles([]);
			setRequiredRoles([]);
			setRestrictedRoles([]);
			setCooldown(0);
			setMinimumJoinTime(0);
			setAcceptMessage('');
			setDenyMessage('');
		}
	}, [open, initialPosition]);

	const multiRoleOptions = discordRoles.map((r) => ({
		label: `@${r.name}`,
		value: r.id,
		color: r.color > 0 ? `#${r.color.toString(16).padStart(6, '0')}` : undefined,
	}));

	const roleNameById = (roleId: string) => {
		const found = discordRoles.find((r) => r.id === roleId);
		return found ? `@${found.name}` : roleId;
	};

	const categoryOptions = (['staff', 'appeal', 'feedback', 'event', 'custom'] as const).map((cat) => ({
		label: t(`app.dashboard.applications.positions.categories.${cat}`),
		value: cat,
	}));

	const stateOptions = [
		{ label: t('app.dashboard.applications.positions.openBadge'), value: 'open' },
		{ label: t('app.dashboard.applications.positions.closedBadge'), value: 'closed' },
	];

	const questionTypeOptions: { label: string; value: QuestionType }[] = QUESTION_TYPES.map((qt) => ({
		label: t(`app.dashboard.applications.positions.modal.types.${qt}`),
		value: qt,
	}));

	const steps = [
		{ idx: 0 as const, label: t('app.dashboard.applications.positions.wizard.stepInfo'), icon: FileText },
		{ idx: 1 as const, label: t('app.dashboard.applications.positions.wizard.stepQuestions'), icon: HelpCircle },
		{ idx: 2 as const, label: t('app.dashboard.applications.positions.wizard.stepEligibility'), icon: ShieldCheck },
		{ idx: 3 as const, label: t('app.dashboard.applications.positions.wizard.stepReview'), icon: ClipboardCheck },
	];

	const validQuestions = questions.filter((q) => q.question.trim().length > 0);

	const canAdvanceFrom = (targetStep: number): boolean => {
		if (targetStep >= 1 && !name.trim()) {
			toast({ title: t('app.dashboard.applications.positions.wizard.nameRequired'), type: 'error' });
			return false;
		}
		if (targetStep >= 2) {
			if (validQuestions.length === 0) {
				toast({ title: t('app.dashboard.applications.positions.wizard.questionRequired'), type: 'error' });
				return false;
			}
			for (let i = 0; i < questions.length; i++) {
				const q = questions[i];
				if (!q.question.trim()) continue;
				const cleanCount = Array.isArray(q.options) ? q.options.filter((o) => o.trim().length > 0).length : 0;
				if ((q.type === 'select' || q.type === 'radio') && cleanCount < 2) {
					toast({
						title:
							q.type === 'radio'
								? t('app.dashboard.applications.positions.wizard.radioOptionsRequired')
								: t('app.dashboard.applications.positions.wizard.selectMinChoicesRequired', { num: i + 1 }),
						type: 'error',
					});
					return false;
				}
				if (q.type === 'multiselect' && cleanCount < 1) {
					toast({ title: t('app.dashboard.applications.positions.wizard.optionsRequired'), type: 'error' });
					return false;
				}
			}
		}
		return true;
	};

	const goToStep = (next: 0 | 1 | 2 | 3) => {
		if (next > step && !canAdvanceFrom(next)) return;
		setStep(next);
	};

	const updateQuestion = (index: number, patch: Partial<YourAppsQuestion>) => {
		setQuestions((prev) => prev.map((q, idx) => (idx === index ? { ...q, ...patch } : q)));
	};

	const moveQuestion = (index: number, direction: -1 | 1) => {
		const target = index + direction;
		if (target < 0 || target >= questions.length) return;
		setQuestions((prev) => {
			const next = [...prev];
			const [item] = next.splice(index, 1);
			next.splice(target, 0, item);
			return next;
		});
	};

	const handleFinalSubmit = async () => {
		if (!canAdvanceFrom(3)) return;
		await onSave({
			name: name.trim(),
			description: description.trim(),
			category,
			state,
			questions: validQuestions,
			rewardRoles,
			removeRoles,
			requiredRoles,
			restrictedRoles,
			cooldown,
			minimumJoinTime,
			acceptMessage,
			denyMessage,
		});
	};

	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			size="3xl"
			title={initialPosition ? t('app.dashboard.applications.positions.modal.editTitle') : t('app.dashboard.applications.positions.modal.createTitle')}
		>
			<div className="flex flex-col gap-5">
				{/* Step Progress Bar */}
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
					{steps.map((s) => {
						const Icon = s.icon;
						const isActive = step === s.idx;
						const isDone = step > s.idx;
						return (
							<button
								key={s.idx}
								type="button"
								onClick={() => goToStep(s.idx)}
								className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
									isActive
										? 'bg-(--accent)/15 border-(--accent)/40 text-(--accent) shadow-sm'
										: isDone
											? 'bg-(--background)/60 border-(--accent)/25 text-(--text)'
											: 'bg-(--background)/40 border-(--border)/10 text-(--text-muted) hover:text-(--text) hover:border-(--border)/20'
								}`}
							>
								<span
									className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
										isActive || isDone ? 'bg-(--accent) text-(--accent-contrast)' : 'bg-(--foreground)/40 text-(--text-muted)'
									}`}
								>
									{isDone ? <Check className="w-3 h-3" /> : s.idx + 1}
								</span>
								<Icon className="w-3.5 h-3.5 shrink-0 hidden md:block" />
								<span className="truncate">{s.label}</span>
							</button>
						);
					})}
				</div>

				{/* Step 1: Form Info */}
				{step === 0 && (
					<div className="flex flex-col gap-4">
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.nameLabel')}</label>
								<Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('app.dashboard.applications.positions.modal.namePlaceholder')} />
							</div>
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.categoryLabel')}</label>
								<Selector items={true} value={category} onChange={(v: any) => setCategory(v)} options={categoryOptions} />
							</div>
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.stateLabel')}</label>
								<Selector items={true} value={state} onChange={(v: any) => setState(v)} options={stateOptions} />
							</div>
						</div>

						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.descriptionLabel')}</label>
							<Input
								variant="textarea"
								rows={4}
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder={t('app.dashboard.applications.positions.modal.descriptionPlaceholder')}
							/>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-(--border)/10">
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.acceptMsgLabel')}</label>
								<Input value={acceptMessage} onChange={(e) => setAcceptMessage(e.target.value)} />
							</div>
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.denyMsgLabel')}</label>
								<Input value={denyMessage} onChange={(e) => setDenyMessage(e.target.value)} />
							</div>
						</div>
					</div>
				)}

				{/* Step 2: Form Questions */}
				{step === 1 && (
					<div className="flex flex-col gap-3">
						<div className="flex items-center justify-between">
							<span className="text-xs font-extrabold uppercase tracking-wider text-(--text)">
								{t('app.dashboard.applications.positions.modal.questionsTitle')} ({questions.length}/25)
							</span>
							<Button variant="secondary" size="sm" disabled={questions.length >= 25} onClick={() => setQuestions((prev) => [...prev, createEmptyQuestion()])}>
								<Plus className="w-3.5 h-3.5" />
								<span>{t('app.dashboard.applications.positions.modal.addQuestionBtn')}</span>
							</Button>
						</div>

						<div className="flex flex-col gap-2.5 max-h-[52vh] overflow-y-auto overflow-x-hidden pr-1">
							{questions.map((q, idx) => (
								<PositionQuestionCard
									key={q.id}
									question={q}
									index={idx}
									total={questions.length}
									questionTypeOptions={questionTypeOptions}
									onUpdate={(patch) => updateQuestion(idx, patch)}
									onMove={(dir) => moveQuestion(idx, dir)}
									onDelete={() => setQuestions((prev) => prev.filter((_, i) => i !== idx))}
								/>
							))}
						</div>
					</div>
				)}

				{/* Step 3: Eligibility & Role Rewards */}
				{step === 2 && (
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.rewardRoles')}</label>
							<MultiSelector value={rewardRoles} onChange={setRewardRoles} options={multiRoleOptions} placeholder={t('app.dashboard.applications.roles.placeholder')} />
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.removeRoles')}</label>
							<MultiSelector value={removeRoles} onChange={setRemoveRoles} options={multiRoleOptions} placeholder={t('app.dashboard.applications.roles.placeholder')} />
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.requiredRoles')}</label>
							<MultiSelector value={requiredRoles} onChange={setRequiredRoles} options={multiRoleOptions} placeholder={t('app.dashboard.applications.roles.placeholder')} />
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.restrictedRoles')}</label>
							<MultiSelector value={restrictedRoles} onChange={setRestrictedRoles} options={multiRoleOptions} placeholder={t('app.dashboard.applications.roles.placeholder')} />
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.cooldownLabel')}</label>
							<Input type="number" min={0} value={String(cooldown)} onChange={(e) => setCooldown(Math.max(0, Number(e.target.value) || 0))} />
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.minJoinLabel')}</label>
							<Input type="number" min={0} value={String(minimumJoinTime)} onChange={(e) => setMinimumJoinTime(Math.max(0, Number(e.target.value) || 0))} />
						</div>
					</div>
				)}

				{/* Step 4: Final Review */}
				{step === 3 && (
					<div className="flex flex-col gap-3 max-h-[54vh] overflow-y-auto overflow-x-hidden pr-1">
						<p className="text-xs text-(--text-muted)">{t('app.dashboard.applications.positions.wizard.reviewSubtitle')}</p>

						<div className="flex flex-col gap-2 p-4 rounded-2xl bg-(--background)/60 border border-(--border)/10">
							<div className="flex items-center justify-between gap-2">
								<div className="flex flex-wrap items-center gap-2">
									<span className="text-base font-bold text-(--text)">{name}</span>
									<Badge variant={state === 'open' ? 'success' : 'muted'} dot>
										{state === 'open' ? t('app.dashboard.applications.positions.openBadge') : t('app.dashboard.applications.positions.closedBadge')}
									</Badge>
									<Badge variant="accent">{t(`app.dashboard.applications.positions.categories.${category}`)}</Badge>
								</div>
								<Button variant="ghost" size="sm" onClick={() => setStep(0)}>
									{t('app.dashboard.applications.positions.wizard.editStepBtn')}
								</Button>
							</div>
							<p className="text-xs text-(--text-muted)">{description.trim() || t('app.dashboard.applications.positions.wizard.noDescription')}</p>
						</div>

						<div className="flex flex-col gap-2 p-4 rounded-2xl bg-(--background)/60 border border-(--border)/10">
							<div className="flex items-center justify-between gap-2">
								<span className="text-xs font-extrabold uppercase tracking-wider text-(--text)">
									{t('app.dashboard.applications.positions.wizard.stepQuestions')} ({validQuestions.length})
								</span>
								<Button variant="ghost" size="sm" onClick={() => setStep(1)}>
									{t('app.dashboard.applications.positions.wizard.editStepBtn')}
								</Button>
							</div>
							<div className="flex flex-col gap-2">
								{validQuestions.map((q, idx) => {
									const choiceSummary =
										(q.type === 'select' || q.type === 'radio' || q.type === 'multiselect') && q.options?.length > 0
											? q.options.join(' • ')
											: q.type === 'boolean'
												? `${q.options?.[0]?.trim() || 'Yes'} / ${q.options?.[1]?.trim() || 'No'}`
												: '';
									return (
										<div key={q.id} className="flex flex-col gap-0.5">
											<div className="flex items-center justify-between gap-2 text-xs text-(--text)">
												<span className="truncate">
													<strong className="text-(--accent)">#{idx + 1}</strong> {q.question}
												</span>
												<Badge variant="outline">{t(`app.dashboard.applications.positions.modal.types.${q.type}`)}</Badge>
											</div>
											{choiceSummary && <span className="text-[11px] text-(--text-muted) pl-4 truncate">{choiceSummary}</span>}
										</div>
									);
								})}
							</div>
						</div>

						<div className="flex flex-col gap-2 p-4 rounded-2xl bg-(--background)/60 border border-(--border)/10">
							<div className="flex items-center justify-between gap-2">
								<span className="text-xs font-extrabold uppercase tracking-wider text-(--text)">{t('app.dashboard.applications.positions.wizard.stepEligibility')}</span>
								<Button variant="ghost" size="sm" onClick={() => setStep(2)}>
									{t('app.dashboard.applications.positions.wizard.editStepBtn')}
								</Button>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-(--text-muted)">
								<div>
									<strong className="text-(--text)">{t('app.dashboard.applications.positions.modal.rewardRoles')}:</strong>{' '}
									{rewardRoles.length > 0 ? rewardRoles.map(roleNameById).join(', ') : t('app.dashboard.applications.positions.wizard.noneConfigured')}
								</div>
								<div>
									<strong className="text-(--text)">{t('app.dashboard.applications.positions.modal.removeRoles')}:</strong>{' '}
									{removeRoles.length > 0 ? removeRoles.map(roleNameById).join(', ') : t('app.dashboard.applications.positions.wizard.noneConfigured')}
								</div>
								<div>
									<strong className="text-(--text)">{t('app.dashboard.applications.positions.modal.requiredRoles')}:</strong>{' '}
									{requiredRoles.length > 0 ? requiredRoles.map(roleNameById).join(', ') : t('app.dashboard.applications.positions.wizard.noneConfigured')}
								</div>
								<div>
									<strong className="text-(--text)">{t('app.dashboard.applications.positions.modal.restrictedRoles')}:</strong>{' '}
									{restrictedRoles.length > 0 ? restrictedRoles.map(roleNameById).join(', ') : t('app.dashboard.applications.positions.wizard.noneConfigured')}
								</div>
								<div>
									<strong className="text-(--text)">{t('app.dashboard.applications.positions.modal.cooldownLabel')}:</strong>{' '}
									{cooldown > 0 ? t('app.dashboard.applications.positions.wizard.secondsUnit', { count: cooldown }) : t('app.dashboard.applications.positions.wizard.noneConfigured')}
								</div>
								<div>
									<strong className="text-(--text)">{t('app.dashboard.applications.positions.modal.minJoinLabel')}:</strong>{' '}
									{minimumJoinTime > 0
										? t('app.dashboard.applications.positions.wizard.secondsUnit', { count: minimumJoinTime })
										: t('app.dashboard.applications.positions.wizard.noneConfigured')}
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Wizard Footer */}
				<div className="flex items-center justify-between gap-2 pt-3 border-t border-(--border)/10">
					<Button variant="secondary" onClick={() => onOpenChange(false)}>
						{t('app.dashboard.applications.positions.modal.cancelBtn')}
					</Button>

					<div className="flex items-center gap-2">
						{step > 0 && (
							<Button variant="secondary" onClick={() => setStep((step - 1) as 0 | 1 | 2 | 3)}>
								<ArrowLeft className="w-3.5 h-3.5" />
								<span>{t('app.dashboard.applications.positions.wizard.backBtn')}</span>
							</Button>
						)}

						{step < 3 ? (
							<Button variant="primary" onClick={() => goToStep((step + 1) as 0 | 1 | 2 | 3)}>
								<span>{t('app.dashboard.applications.positions.wizard.nextBtn')}</span>
								<ArrowRight className="w-3.5 h-3.5" />
							</Button>
						) : (
							<Button variant="primary" loading={saving} onClick={handleFinalSubmit}>
								<Check className="w-4 h-4" />
								<span>{t('app.dashboard.applications.positions.modal.saveBtn')}</span>
							</Button>
						)}
					</div>
				</div>
			</div>
		</Modal>
	);
}
