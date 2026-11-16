/** @format */
'use client';

import { ArrowDown, ArrowUp, Check, Plus, Trash2, X } from 'lucide-react';
import { Button, Input, Selector, Toggle } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import { useState } from 'react';
import type { QuestionType, YourAppsQuestion } from './types';

interface PositionQuestionCardProps {
	question: YourAppsQuestion;
	index: number;
	total: number;
	questionTypeOptions: { label: string; value: QuestionType }[];
	onUpdate: (patch: Partial<YourAppsQuestion>) => void;
	onMove: (direction: -1 | 1) => void;
	onDelete: () => void;
}

const isChoiceListType = (type: QuestionType): boolean => type === 'select' || type === 'radio' || type === 'multiselect';

export default function PositionQuestionCard({ question: q, index: idx, total, questionTypeOptions, onUpdate, onMove, onDelete }: PositionQuestionCardProps) {
	const { t } = useDictionary();
	const [choiceDraft, setChoiceDraft] = useState('');

	const options = Array.isArray(q.options) ? q.options : [];
	const maxChoices = q.type === 'select' ? 25 : 10;
	const minChoices = q.type === 'multiselect' ? 1 : 2;

	const commitDraftChoice = () => {
		const trimmed = choiceDraft.trim().slice(0, 100);
		if (!trimmed) {
			setChoiceDraft('');
			return;
		}
		if (options.length >= maxChoices) return;
		const exists = options.some((existing) => existing.trim().toLowerCase() === trimmed.toLowerCase());
		if (!exists) {
			onUpdate({ options: [...options, trimmed] });
		}
		setChoiceDraft('');
	};

	const removeChoiceAt = (optIdx: number) => {
		onUpdate({ options: options.filter((_, i) => i !== optIdx) });
	};

	const handleTypeChange = (nextType: QuestionType) => {
		if (nextType === q.type) return;
		if (nextType === 'boolean') {
			onUpdate({
				type: nextType,
				options: q.type === 'boolean' ? options.slice(0, 2) : [],
			});
			return;
		}
		if (isChoiceListType(nextType)) {
			const nextMax = nextType === 'select' ? 25 : 10;
			onUpdate({
				type: nextType,
				options: q.type === 'boolean' ? [] : options.slice(0, nextMax),
			});
			return;
		}
		onUpdate({ type: nextType });
	};

	const yesValue = q.type === 'boolean' ? (options[0] ?? '') : '';
	const noValue = q.type === 'boolean' ? (options[1] ?? '') : '';

	const updateBooleanChoice = (slot: 0 | 1, raw: string) => {
		const nextYes = slot === 0 ? raw.slice(0, 60) : yesValue;
		const nextNo = slot === 1 ? raw.slice(0, 60) : noValue;
		if (!nextYes.trim() && !nextNo.trim()) {
			onUpdate({ options: [] });
		} else {
			onUpdate({ options: [nextYes, nextNo] });
		}
	};

	return (
		<div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-(--background)/60 border border-(--border)/10">
			{/* Top Row: #Index + Question Prompt + Question Type Selector */}
			<div className="flex flex-col sm:flex-row sm:items-center gap-2">
				<span className="text-xs font-mono font-bold text-(--accent) shrink-0">#{idx + 1}</span>
				<div className="flex-1 min-w-0">
					<Input value={q.question} onChange={(e) => onUpdate({ question: e.target.value })} placeholder={t('app.dashboard.applications.positions.modal.questionPlaceholder')} />
				</div>
				<div className="w-full sm:w-48 shrink-0">
					<Selector items={true} value={q.type} onChange={(val: any) => handleTypeChange(val as QuestionType)} options={questionTypeOptions} />
				</div>
			</div>

			{/* Type-Specific Configuration Row */}
			{isChoiceListType(q.type) ? (
				<div className="flex flex-col gap-2 rounded-2xl bg-(--foreground)/30 border border-(--border)/10 p-3">
					<div className="flex items-center justify-between gap-2">
						<span className="text-[11px] font-bold text-(--text-muted)">
							{t('app.dashboard.applications.positions.modal.choicesCountMaxLabel', { count: options.length, max: maxChoices })}
						</span>
						{options.length < minChoices && (
							<span className="text-[11px] font-medium text-(--accent)">{t('app.dashboard.applications.positions.modal.minChoicesHint', { min: minChoices })}</span>
						)}
					</div>

					{options.length > 0 && (
						<div className="flex flex-wrap items-center gap-1.5">
							{options.map((opt, optIdx) => (
								<span
									key={`${opt}-${optIdx}`}
									className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-(--accent)/15 border border-(--accent)/30 text-(--text)"
								>
									<span className="text-[10px] font-mono text-(--accent)">{optIdx + 1}.</span>
									<span className="max-w-[260px] truncate">{opt}</span>
									<button
										type="button"
										onClick={() => removeChoiceAt(optIdx)}
										className="text-(--text-muted) hover:text-(--accent-red) transition-colors cursor-pointer"
										aria-label={opt}
									>
										<X className="w-3 h-3" />
									</button>
								</span>
							))}
						</div>
					)}

					<div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
						<div className="flex flex-1 items-center gap-2 min-w-[220px]">
							<Input
								value={choiceDraft}
								disabled={options.length >= maxChoices}
								onChange={(e) => setChoiceDraft(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										commitDraftChoice();
									}
								}}
								onBlur={() => {
									if (choiceDraft.trim()) commitDraftChoice();
								}}
								placeholder={t('app.dashboard.applications.positions.modal.choiceInputPlaceholder')}
							/>
							<Button
								type="button"
								variant="secondary"
								size="sm"
								disabled={!choiceDraft.trim() || options.length >= maxChoices}
								onMouseDown={(e) => e.preventDefault()}
								onClick={commitDraftChoice}
								className="shrink-0"
							>
								<Plus className="w-3.5 h-3.5" />
								<span>{t('app.dashboard.applications.positions.modal.addChoiceBtn')}</span>
							</Button>
						</div>

						<div className="flex items-center gap-2 ml-auto">
							<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.applications.positions.modal.requiredToggle')}</span>
							<Toggle checked={q.required} onChange={(e) => onUpdate({ required: e.target.checked })} size="sm" />
							<Button variant="ghost" size="sm" disabled={idx === 0} onClick={() => onMove(-1)}>
								<ArrowUp className="w-3.5 h-3.5" />
							</Button>
							<Button variant="ghost" size="sm" disabled={idx === total - 1} onClick={() => onMove(1)}>
								<ArrowDown className="w-3.5 h-3.5" />
							</Button>
							<Button variant="danger" size="sm" disabled={total <= 1} onClick={onDelete}>
								<Trash2 className="w-3.5 h-3.5" />
							</Button>
						</div>
					</div>
				</div>
			) : q.type === 'boolean' ? (
				<div className="flex flex-col gap-2 rounded-2xl bg-(--foreground)/30 border border-(--border)/10 p-3">
					<span className="text-[11px] font-medium text-(--text-muted)">{t('app.dashboard.applications.positions.modal.booleanHint')}</span>
					<div className="flex flex-wrap items-center justify-between gap-2">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 min-w-[220px]">
							<div className="relative flex items-center">
								<span className="pointer-events-none absolute left-3 z-10 inline-flex items-center justify-center w-4 h-4 rounded-full bg-(--accent-green)/20 text-(--accent-green)">
									<Check className="w-2.5 h-2.5" />
								</span>
								<Input
									value={yesValue}
									onChange={(e) => updateBooleanChoice(0, e.target.value)}
									placeholder={t('app.dashboard.applications.positions.modal.booleanYesPlaceholder')}
									className="pl-9"
								/>
							</div>
							<div className="relative flex items-center">
								<span className="pointer-events-none absolute left-3 z-10 inline-flex items-center justify-center w-4 h-4 rounded-full bg-(--accent-red)/20 text-(--accent-red)">
									<X className="w-2.5 h-2.5" />
								</span>
								<Input
									value={noValue}
									onChange={(e) => updateBooleanChoice(1, e.target.value)}
									placeholder={t('app.dashboard.applications.positions.modal.booleanNoPlaceholder')}
									className="pl-9"
								/>
							</div>
						</div>

						<div className="flex items-center gap-2 ml-auto">
							<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.applications.positions.modal.requiredToggle')}</span>
							<Toggle checked={q.required} onChange={(e) => onUpdate({ required: e.target.checked })} size="sm" />
							<Button variant="ghost" size="sm" disabled={idx === 0} onClick={() => onMove(-1)}>
								<ArrowUp className="w-3.5 h-3.5" />
							</Button>
							<Button variant="ghost" size="sm" disabled={idx === total - 1} onClick={() => onMove(1)}>
								<ArrowDown className="w-3.5 h-3.5" />
							</Button>
							<Button variant="danger" size="sm" disabled={total <= 1} onClick={onDelete}>
								<Trash2 className="w-3.5 h-3.5" />
							</Button>
						</div>
					</div>
				</div>
			) : (
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div className="flex-1 min-w-[200px]">
						<Input value={q.placeholder || ''} onChange={(e) => onUpdate({ placeholder: e.target.value })} placeholder={t('app.dashboard.applications.positions.modal.inputPlaceholder')} />
					</div>
					<div className="flex items-center gap-2 ml-auto">
						<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.applications.positions.modal.requiredToggle')}</span>
						<Toggle checked={q.required} onChange={(e) => onUpdate({ required: e.target.checked })} size="sm" />
						<Button variant="ghost" size="sm" disabled={idx === 0} onClick={() => onMove(-1)}>
							<ArrowUp className="w-3.5 h-3.5" />
						</Button>
						<Button variant="ghost" size="sm" disabled={idx === total - 1} onClick={() => onMove(1)}>
							<ArrowDown className="w-3.5 h-3.5" />
						</Button>
						<Button variant="danger" size="sm" disabled={total <= 1} onClick={onDelete}>
							<Trash2 className="w-3.5 h-3.5" />
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
