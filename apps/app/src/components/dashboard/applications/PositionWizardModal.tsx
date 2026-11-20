/** @format */
'use client';

import { ArrowLeft, ArrowRight, Check, ClipboardCheck, FileText, HelpCircle, Plus, ShieldCheck, Sparkles } from 'lucide-react';
import { Button, Input, Modal, Selector, Toggle } from '@xernerx/ui';
import { useDictionary, useToast } from '@xernerx/providers';
import { useEffect, useState } from 'react';
import PositionQuestionCard from './PositionQuestionCard';
import { PositionReviewStep, PositionRulesStep, type PositionRulesDraftState } from './PositionRulesAndReviewSteps';
import { POSITION_STARTER_TEMPLATES, type PositionStarterTemplate } from './templates';
import { QUESTION_TYPES, type DiscordChannelItem, type DiscordRoleItem, type PositionCategory, type QuestionType, type YourAppsPosition, type YourAppsQuestion } from './types';

export const createEmptyQuestion = (): YourAppsQuestion => ({
	id: `q_${Math.random().toString(36).slice(2, 8)}`,
	question: '',
	type: 'paragraph',
	placeholder: '',
	required: true,
	options: [],
	minLength: 1,
	maxLength: 1000,
	minValue: null,
	maxValue: null,
	validationPattern: 'none',
	validationRegex: '',
	condition: null,
});

function toDatetimeLocalValue(iso?: string | null): string {
	if (!iso) return '';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	const offsetMs = d.getTimezoneOffset() * 60000;
	return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
}

function fromDatetimeLocalValue(raw: string): string | null {
	if (!raw || !raw.trim()) return null;
	const d = new Date(raw);
	return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const DEFAULT_RULES_STATE: PositionRulesDraftState = {
	pendingRoles: [],
	rewardRoles: [],
	removeRoles: [],
	denyAddRoles: [],
	denyRemoveRoles: [],
	requiredRoles: [],
	restrictedRoles: [],
	cooldown: 0,
	minimumJoinTime: 0,
	minimumAccountAge: 0,
	opensAtLocal: '',
	closesAtLocal: '',
	maxSubmissions: 0,
	maxApprovals: 0,
	minVotesToApprove: 0,
	autoApproveVotes: 0,
	autoDenyVotes: 0,
	logChannelOverride: '',
	archiveChannelOverride: '',
	reviewRolesOverride: [],
	submissionPingsOverride: [],
	threadOverride: 'default',
	pollOverride: 'default',
};

interface PositionWizardModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialPosition: YourAppsPosition | null;
	discordRoles: DiscordRoleItem[];
	discordChannels: DiscordChannelItem[];
	saving: boolean;
	onSave: (payload: Record<string, any>) => Promise<void>;
}

export default function PositionWizardModal({ open, onOpenChange, initialPosition, discordRoles, discordChannels, saving, onSave }: PositionWizardModalProps) {
	const { t } = useDictionary();
	const { toast } = useToast();

	const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [category, setCategory] = useState<PositionCategory>('staff');
	const [state, setState] = useState<'open' | 'closed'>('open');
	const [anonymousResponses, setAnonymousResponses] = useState(false);
	const [questions, setQuestions] = useState<YourAppsQuestion[]>([createEmptyQuestion()]);
	const [rules, setRules] = useState<PositionRulesDraftState>(DEFAULT_RULES_STATE);
	const [acceptMessage, setAcceptMessage] = useState('');
	const [denyMessage, setDenyMessage] = useState('');

	const patchRules = (patch: Partial<PositionRulesDraftState>) => {
		setRules((prev) => ({ ...prev, ...patch }));
	};

	useEffect(() => {
		if (!open) return;
		setStep(0);
		if (initialPosition) {
			setName(initialPosition.name || '');
			setDescription(initialPosition.description || '');
			setCategory(initialPosition.category || 'staff');
			setState(initialPosition.state || 'open');
			setAnonymousResponses(Boolean(initialPosition.anonymousResponses));
			setQuestions(
				initialPosition.questions?.length > 0
					? initialPosition.questions.map((q) => ({
							...q,
							options: Array.isArray(q.options) ? [...q.options] : [],
							condition: q.condition ? { ...q.condition } : null,
						}))
					: [createEmptyQuestion()]
			);
			setRules({
				pendingRoles: [...(initialPosition.pendingRoles || [])],
				rewardRoles: [...(initialPosition.rewardRoles || [])],
				removeRoles: [...(initialPosition.removeRoles || [])],
				denyAddRoles: [...(initialPosition.denyAddRoles || [])],
				denyRemoveRoles: [...(initialPosition.denyRemoveRoles || [])],
				requiredRoles: [...(initialPosition.requiredRoles || [])],
				restrictedRoles: [...(initialPosition.restrictedRoles || [])],
				cooldown: Number(initialPosition.cooldown) || 0,
				minimumJoinTime: Number(initialPosition.minimumJoinTime) || 0,
				minimumAccountAge: Number(initialPosition.minimumAccountAge) || 0,
				opensAtLocal: toDatetimeLocalValue(initialPosition.opensAt),
				closesAtLocal: toDatetimeLocalValue(initialPosition.closesAt),
				maxSubmissions: Number(initialPosition.maxSubmissions) || 0,
				maxApprovals: Number(initialPosition.maxApprovals) || 0,
				minVotesToApprove: Number(initialPosition.minVotesToApprove) || 0,
				autoApproveVotes: Number(initialPosition.autoApproveVotes) || 0,
				autoDenyVotes: Number(initialPosition.autoDenyVotes) || 0,
				logChannelOverride: initialPosition.logChannelOverride || '',
				archiveChannelOverride: initialPosition.archiveChannelOverride || '',
				reviewRolesOverride: [...(initialPosition.reviewRolesOverride || [])],
				submissionPingsOverride: [...(initialPosition.submissionPingsOverride || [])],
				threadOverride: initialPosition.threadPerSubmissionOverride === true ? 'true' : initialPosition.threadPerSubmissionOverride === false ? 'false' : 'default',
				pollOverride: initialPosition.pollOnSubmissionOverride === true ? 'true' : initialPosition.pollOnSubmissionOverride === false ? 'false' : 'default',
			});
			setAcceptMessage(initialPosition.acceptMessage || '');
			setDenyMessage(initialPosition.denyMessage || '');
		} else {
			setName('');
			setDescription('');
			setCategory('staff');
			setState('open');
			setAnonymousResponses(false);
			setQuestions([createEmptyQuestion()]);
			setRules(DEFAULT_RULES_STATE);
			setAcceptMessage('');
			setDenyMessage('');
		}
	}, [open, initialPosition]);

	const applyStarterTemplate = (tpl: PositionStarterTemplate) => {
		setName(tpl.name);
		setDescription(tpl.description);
		setCategory(tpl.category);
		setAnonymousResponses(Boolean(tpl.anonymousResponses));
		setQuestions(tpl.buildQuestions());
		patchRules({
			...(tpl.cooldown !== undefined ? { cooldown: tpl.cooldown } : {}),
			...(tpl.minimumJoinTime !== undefined ? { minimumJoinTime: tpl.minimumJoinTime } : {}),
			...(tpl.minimumAccountAge !== undefined ? { minimumAccountAge: tpl.minimumAccountAge } : {}),
		});
	};

	const categoryOptions = (['staff', 'appeal', 'feedback', 'event', 'poll', 'custom'] as const).map((cat) => ({
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
			const seen = new Set<string>();
			return next.map((q) => {
				const cleanCond = q.condition?.questionId && seen.has(q.condition.questionId) ? q.condition : null;
				seen.add(q.id);
				return { ...q, condition: cleanCond };
			});
		});
	};

	const handleFinalSubmit = async () => {
		if (!canAdvanceFrom(3)) return;
		await onSave({
			name: name.trim(),
			description: description.trim(),
			category,
			state,
			anonymousResponses,
			questions: validQuestions,
			pendingRoles: rules.pendingRoles,
			rewardRoles: rules.rewardRoles,
			removeRoles: rules.removeRoles,
			denyAddRoles: rules.denyAddRoles,
			denyRemoveRoles: rules.denyRemoveRoles,
			requiredRoles: rules.requiredRoles,
			restrictedRoles: rules.restrictedRoles,
			cooldown: rules.cooldown,
			minimumJoinTime: rules.minimumJoinTime,
			minimumAccountAge: rules.minimumAccountAge,
			opensAt: fromDatetimeLocalValue(rules.opensAtLocal),
			closesAt: fromDatetimeLocalValue(rules.closesAtLocal),
			maxSubmissions: rules.maxSubmissions,
			maxApprovals: rules.maxApprovals,
			minVotesToApprove: rules.minVotesToApprove,
			autoApproveVotes: rules.autoApproveVotes,
			autoDenyVotes: rules.autoDenyVotes,
			logChannelOverride: rules.logChannelOverride || null,
			archiveChannelOverride: rules.archiveChannelOverride || null,
			reviewRolesOverride: rules.reviewRolesOverride,
			submissionPingsOverride: rules.submissionPingsOverride,
			threadPerSubmissionOverride: rules.threadOverride === 'true' ? true : rules.threadOverride === 'false' ? false : null,
			pollOnSubmissionOverride: rules.pollOverride === 'true' ? true : rules.pollOverride === 'false' ? false : null,
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
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
					{steps.map((s) => {
						const Icon = s.icon;
						const isActive = step === s.idx;
						const isDone = step > s.idx;
						return (
							<button
								key={s.idx}
								type="button"
								aria-current={isActive ? 'step' : undefined}
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

				{step === 0 && (
					<div className="flex flex-col gap-4 max-h-[56vh] overflow-y-auto pr-1">
						{!initialPosition && (
							<div className="flex flex-col gap-2 p-3 rounded-2xl bg-(--background)/50 border border-(--border)/10">
								<div className="flex items-center gap-1.5 text-xs font-bold text-(--text)">
									<Sparkles className="w-3.5 h-3.5 text-(--accent)" />
									<span>{t('app.dashboard.applications.positions.templates.title')}</span>
								</div>
								<div className="flex flex-wrap gap-1.5">
									{POSITION_STARTER_TEMPLATES.map((tpl) => (
										<Button key={tpl.key} type="button" variant="secondary" size="sm" onClick={() => applyStarterTemplate(tpl)}>
											{t(`app.dashboard.applications.positions.templates.${tpl.key}`)}
										</Button>
									))}
								</div>
							</div>
						)}

						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.nameLabel')}</label>
								<Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('app.dashboard.applications.positions.modal.namePlaceholder')} />
							</div>
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.categoryLabel')}</label>
								<Selector
									items={true}
									value={category}
									onChange={(v: any) => {
										setCategory(v);
										if (v === 'poll') setAnonymousResponses(true);
									}}
									options={categoryOptions}
								/>
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
								rows={3}
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder={t('app.dashboard.applications.positions.modal.descriptionPlaceholder')}
							/>
						</div>

						<div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-(--background)/50 border border-(--border)/10">
							<div className="flex flex-col">
								<span className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.anonymousToggle')}</span>
								<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.applications.positions.modal.anonymousHint')}</span>
							</div>
							<Toggle checked={anonymousResponses} onChange={(e) => setAnonymousResponses(e.target.checked)} size="sm" />
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
									priorQuestions={questions.slice(0, idx)}
									questionTypeOptions={questionTypeOptions}
									onUpdate={(patch) => updateQuestion(idx, patch)}
									onMove={(dir) => moveQuestion(idx, dir)}
									onDelete={() =>
										setQuestions((prev) => {
											const removedId = prev[idx]?.id;
											return prev.filter((_, i) => i !== idx).map((item) => (item.condition?.questionId === removedId ? { ...item, condition: null } : item));
										})
									}
								/>
							))}
						</div>
					</div>
				)}

				{step === 2 && <PositionRulesStep rules={rules} discordRoles={discordRoles} discordChannels={discordChannels} onPatch={patchRules} />}

				{step === 3 && (
					<PositionReviewStep
						name={name}
						description={description}
						category={category}
						state={state}
						anonymousResponses={anonymousResponses}
						validQuestions={validQuestions}
						rules={rules}
						discordRoles={discordRoles}
						onJumpStep={(s) => setStep(s)}
					/>
				)}

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
