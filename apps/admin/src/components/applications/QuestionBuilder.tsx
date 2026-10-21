/** @format */
'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Input, Selector, Toggle } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import type { Question } from './types';

interface QuestionBuilderProps {
	questions: Question[];
	onChange: (questions: Question[]) => void;
}

export function QuestionBuilder({ questions, onChange }: QuestionBuilderProps) {
	const { t } = useDictionary();

	const addQuestion = () => {
		onChange([
			...questions,
			{
				id: crypto.randomUUID().split('-')[0],
				type: 'text',
				question: '',
				required: true,
				options: [],
			},
		]);
	};

	const removeQuestion = (idx: number) => {
		onChange(questions.filter((_, i) => i !== idx));
	};

	const updateQuestion = (idx: number, key: keyof Question, value: any) => {
		const updated = [...questions];
		(updated[idx] as any)[key] = value;
		onChange(updated);
	};

	const addOption = (questionIdx: number) => {
		const updated = [...questions];
		updated[questionIdx].options = [...(updated[questionIdx].options || []), ''];
		onChange(updated);
	};

	const updateOption = (questionIdx: number, optionIdx: number, value: string) => {
		const updated = [...questions];
		const opts = [...updated[questionIdx].options];
		opts[optionIdx] = value;
		updated[questionIdx].options = opts;
		onChange(updated);
	};

	const removeOption = (questionIdx: number, optionIdx: number) => {
		const updated = [...questions];
		updated[questionIdx].options = updated[questionIdx].options.filter((_, idx) => idx !== optionIdx);
		onChange(updated);
	};

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center justify-between">
				<label className="text-xs font-bold text-(--text) uppercase tracking-wider">{t('admin.dashboard.applicationConfigs.applicationQuestions')}</label>
				<Button type="button" variant="secondary" onClick={addQuestion} style={{ padding: '4px 8px', height: 'auto', fontSize: '12px' }}>
					<Plus size={12} /> {t('admin.dashboard.applicationConfigs.addQuestion')}
				</Button>
			</div>

			{questions.length === 0 ? (
				<p className="text-xs text-(--text-muted) italic">{t('admin.dashboard.applicationConfigs.noQuestionsAdded')}</p>
			) : (
				<div className="flex flex-col gap-4">
					{questions.map((q, i) => (
						<div key={i} className="flex flex-col gap-3 p-4 border border-(--border)/10 bg-(--background)/50 rounded-2xl relative group">
							<button
								type="button"
								onClick={() => removeQuestion(i)}
								className="absolute top-2 right-2 p-1.5 text-(--accent-red)/70 hover:text-(--accent-red) hover:bg-(--accent-red)/10 rounded-lg transition-colors"
							>
								<Trash2 size={14} />
							</button>

							<div className="grid grid-cols-[1fr_120px] gap-3 pr-8">
								<Input value={q.question} onChange={(e) => updateQuestion(i, 'question', e.target.value)} placeholder={t('admin.dashboard.applicationConfigs.questionPlaceholder')} />
								<Selector
									value={q.type}
									options={[
										{ value: 'text', label: t('admin.dashboard.applicationConfigs.shortText') },
										{ value: 'textarea', label: t('admin.dashboard.applicationConfigs.longText') },
										{ value: 'select', label: t('admin.dashboard.applicationConfigs.dropdown') },
										{ value: 'radio', label: t('admin.dashboard.applicationConfigs.radio') },
										{ value: 'checkbox', label: t('admin.dashboard.applicationConfigs.checkboxes') },
									]}
									onChange={(val: string) => updateQuestion(i, 'type', val)}
								/>
							</div>

							<div className="flex items-center gap-2 mt-1">
								<label className="flex items-center gap-2 text-xs text-(--text-muted) cursor-pointer select-none">
									<Toggle size="sm" checked={q.required} onChange={(e) => updateQuestion(i, 'required', e.target.checked)} />
									{t('admin.dashboard.applicationConfigs.requiredField')}
								</label>
							</div>

							{(q.type === 'select' || q.type === 'radio' || q.type === 'checkbox') && (
								<div className="flex flex-col gap-2 pt-2 border-t border-(--border)/5">
									<div className="flex items-center justify-between">
										<span className="text-[10px] text-(--text-muted) uppercase">{t('admin.dashboard.applicationConfigs.options')}</span>
										<button type="button" onClick={() => addOption(i)} className="text-[10px] text-(--accent) hover:underline">
											{t('admin.dashboard.applicationConfigs.addOption')}
										</button>
									</div>
									{q.options?.map((opt, optIdx) => (
										<div key={optIdx} className="flex items-center gap-2 pl-4">
											<div className="w-1.5 h-1.5 rounded-full bg-(--border)" />
											<Input
												value={opt}
												onChange={(e) => updateOption(i, optIdx, e.target.value)}
												placeholder={t('admin.dashboard.applicationConfigs.optionText')}
												className="h-7 text-xs"
											/>
											<button type="button" onClick={() => removeOption(i, optIdx)} className="text-(--accent-red)/50 hover:text-(--accent-red)">
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
	);
}
