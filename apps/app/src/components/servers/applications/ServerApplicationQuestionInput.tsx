/** @format */
'use client';

import { Paperclip, Upload, X } from 'lucide-react';
import { Button, Check, Input, MultiSelector, Selector } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import type { YourAppsQuestion } from '@/components/dashboard/applications/types';

export function parseAttachmentLines(raw: string): Array<{ label: string; url: string; rawLine: string }> {
	return String(raw || '')
		.split('\n')
		.map((l) => l.trim())
		.filter(Boolean)
		.map((line) => {
			const mdMatch = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/i.exec(line);
			if (mdMatch) {
				return { label: mdMatch[1], url: mdMatch[2], rawLine: line };
			}
			return { label: line, url: line, rawLine: line };
		});
}

interface SelectOption {
	label: string;
	value: string;
}

interface ServerApplicationQuestionInputProps {
	question: YourAppsQuestion;
	value: string;
	disabled: boolean;
	isUploadingThis: boolean;
	roleOptions: SelectOption[];
	channelOptions: SelectOption[];
	memberOptions: SelectOption[];
	mentionableOptions: SelectOption[];
	onChange: (value: string) => void;
	onUploadFiles: (files: FileList | null) => void;
}

export default function ServerApplicationQuestionInput({
	question: q,
	value: val,
	disabled,
	isUploadingThis,
	roleOptions,
	channelOptions,
	memberOptions,
	mentionableOptions,
	onChange,
	onUploadFiles,
}: ServerApplicationQuestionInputProps) {
	const { t } = useDictionary();
	const opts = Array.isArray(q.options) ? q.options.filter(Boolean) : [];

	switch (q.type) {
		case 'short':
			return <Input disabled={disabled} maxLength={q.maxLength || 256} value={val} onChange={(e) => onChange(e.target.value)} placeholder={q.placeholder || ''} />;

		case 'number':
			return (
				<Input
					type="number"
					disabled={disabled}
					min={q.minValue ?? undefined}
					max={q.maxValue ?? undefined}
					value={val}
					onChange={(e) => onChange(e.target.value)}
					placeholder={q.placeholder || '0'}
				/>
			);

		case 'select': {
			const selectOpts = opts.map((o) => ({ label: o, value: o }));
			return (
				<Selector
					disabled={disabled}
					value={val}
					onChange={(v: string) => onChange(v)}
					options={selectOpts}
					placeholder={q.placeholder || t('app.servers.applications.selectOptionPlaceholder')}
				/>
			);
		}

		case 'radio': {
			return (
				<div className="flex flex-col gap-2">
					{opts.map((opt) => (
						<Check key={opt} variant="circle" checked={val === opt} disabled={disabled} onCheckedChange={() => onChange(opt)} label={opt} />
					))}
				</div>
			);
		}

		case 'multiselect': {
			const multiOpts = opts.map((o) => ({ label: o, value: o }));
			const selectedValues = val
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean);
			return (
				<MultiSelector
					value={selectedValues}
					onChange={(vals: string[]) => onChange(vals.join(', '))}
					options={multiOpts}
					placeholder={t('app.servers.applications.selectMultiplePlaceholder')}
				/>
			);
		}

		case 'boolean': {
			const defaultYes = t('app.dashboard.applications.positions.modal.booleanYesPlaceholder');
			const defaultNo = t('app.dashboard.applications.positions.modal.booleanNoPlaceholder');
			const yesLabel = opts[0]?.trim() || defaultYes;
			const noLabel = opts[1]?.trim() && opts[1]?.trim() !== yesLabel ? opts[1].trim() : defaultNo;
			return (
				<div className="flex flex-wrap gap-2">
					<Button type="button" size="sm" variant={val === yesLabel ? 'primary' : 'secondary'} disabled={disabled} onClick={() => onChange(yesLabel)}>
						{yesLabel}
					</Button>
					<Button type="button" size="sm" variant={val === noLabel ? 'primary' : 'secondary'} disabled={disabled} onClick={() => onChange(noLabel)}>
						{noLabel}
					</Button>
				</div>
			);
		}

		case 'checkbox':
			return (
				<Check
					checked={val === 'Yes'}
					disabled={disabled}
					onCheckedChange={(checked) => onChange(checked ? 'Yes' : '')}
					label={q.placeholder || t('app.servers.applications.checkboxAgreeLabel')}
				/>
			);

		case 'role':
			return roleOptions.length > 0 ? (
				<Selector
					disabled={disabled}
					value={val}
					onChange={(v: string) => onChange(v)}
					options={roleOptions}
					placeholder={q.placeholder || t('app.servers.applications.selectRolePlaceholder')}
				/>
			) : (
				<Input disabled={disabled} value={val} onChange={(e) => onChange(e.target.value)} placeholder={q.placeholder || t('app.servers.applications.selectRolePlaceholder')} />
			);

		case 'channel':
			return channelOptions.length > 0 ? (
				<Selector
					disabled={disabled}
					value={val}
					onChange={(v: string) => onChange(v)}
					options={channelOptions}
					placeholder={q.placeholder || t('app.servers.applications.selectChannelPlaceholder')}
				/>
			) : (
				<Input disabled={disabled} value={val} onChange={(e) => onChange(e.target.value)} placeholder={q.placeholder || t('app.servers.applications.selectChannelPlaceholder')} />
			);

		case 'user':
			return memberOptions.length > 0 ? (
				<Selector
					disabled={disabled}
					value={val}
					onChange={(v: string) => onChange(v)}
					options={memberOptions}
					placeholder={q.placeholder || t('app.servers.applications.selectMemberPlaceholder')}
				/>
			) : (
				<Input disabled={disabled} value={val} onChange={(e) => onChange(e.target.value)} placeholder={q.placeholder || t('app.servers.applications.userInputPlaceholder')} />
			);

		case 'mentionable':
			return mentionableOptions.length > 0 ? (
				<Selector
					disabled={disabled}
					value={val}
					onChange={(v: string) => onChange(v)}
					options={mentionableOptions}
					placeholder={q.placeholder || t('app.servers.applications.selectMemberPlaceholder')}
				/>
			) : (
				<Input disabled={disabled} value={val} onChange={(e) => onChange(e.target.value)} placeholder={q.placeholder || t('app.servers.applications.userInputPlaceholder')} />
			);

		case 'file': {
			const parsedFiles = parseAttachmentLines(val);
			return (
				<div className="flex flex-col gap-2">
					{parsedFiles.length > 0 && (
						<div className="flex flex-wrap gap-1.5">
							{parsedFiles.map((item, idx) => (
								<span
									key={`${item.rawLine}-${idx}`}
									className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-(--accent)/15 border border-(--accent)/30 text-(--text)"
								>
									<Paperclip className="w-3 h-3 text-(--accent)" />
									<a href={item.url} target="_blank" rel="noopener noreferrer" className="max-w-[220px] truncate hover:underline">
										{item.label}
									</a>
									{!disabled && (
										<button
											type="button"
											onClick={() => {
												const next = parsedFiles
													.filter((_, i) => i !== idx)
													.map((f) => f.rawLine)
													.join('\n');
												onChange(next);
											}}
											className="text-(--text-muted) hover:text-(--accent-red) cursor-pointer"
										>
											<X className="w-3 h-3" />
										</button>
									)}
								</span>
							))}
						</div>
					)}

					<div className="flex flex-wrap items-center gap-2">
						<label
							className={`relative inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold border border-(--border)/15 bg-(--foreground)/40 text-(--text) transition-colors focus-within:ring-2 focus-within:ring-(--accent) ${
								disabled || isUploadingThis || parsedFiles.length >= 5 ? 'opacity-50 pointer-events-none' : 'hover:border-(--accent)/40 cursor-pointer'
							}`}
						>
							<Upload className="w-3.5 h-3.5 text-(--accent)" />
							<span>{isUploadingThis ? t('app.servers.applications.uploadingFile') : t('app.servers.applications.uploadFileBtn')}</span>
							<input
								type="file"
								multiple
								accept="image/*,.pdf,.txt,.doc,.docx,.zip"
								disabled={disabled || isUploadingThis || parsedFiles.length >= 5}
								onChange={(e) => {
									onUploadFiles(e.target.files);
									e.target.value = '';
								}}
								className="sr-only"
							/>
						</label>
						<span className="text-[11px] text-(--text-muted)">{t('app.servers.applications.uploadHint')}</span>
					</div>

					{parsedFiles.length === 0 && (
						<Input disabled={disabled} value={val} onChange={(e) => onChange(e.target.value)} placeholder={q.placeholder || t('app.servers.applications.fileInputPlaceholder')} />
					)}
				</div>
			);
		}

		case 'paragraph':
		default:
			return <Input variant="textarea" rows={4} maxLength={q.maxLength || 1000} disabled={disabled} value={val} onChange={(e) => onChange(e.target.value)} placeholder={q.placeholder || ''} />;
	}
}
