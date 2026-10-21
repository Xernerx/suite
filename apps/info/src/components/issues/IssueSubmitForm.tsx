/** @format */
'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FileText, Upload, X } from 'lucide-react';
import { Button, Input, Selector } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

interface IssueSubmitFormProps {
	title: string;
	setTitle: (val: string) => void;
	description: string;
	setDescription: (val: string) => void;
	product: string;
	setProduct: (val: string) => void;
	products: string[];
	resolveBot: (itemOrProd: any) => { id: string; name: string; avatarUrl: string | null } | null;
	attachment: File | null;
	setAttachment: (file: File | null) => void;
	attachmentPreview: string | null;
	uploading: boolean;
	submitIssue: (e: any) => void;
	handlePaste: (e: React.ClipboardEvent) => void;
	onCancel: () => void;
}

export function IssueSubmitForm({
	title,
	setTitle,
	description,
	setDescription,
	product,
	setProduct,
	products,
	resolveBot,
	attachment,
	setAttachment,
	attachmentPreview,
	uploading,
	submitIssue,
	handlePaste,
	onCancel,
}: IssueSubmitFormProps) {
	const { t } = useDictionary();
	const [isDragging, setIsDragging] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	return (
		<motion.div
			key="create-form"
			initial={{ opacity: 0, scale: 0.96, y: 10 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.96, y: -10 }}
			transition={{ duration: 0.25, ease: 'easeOut' }}
			className="bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm p-6 rounded-xl flex flex-col gap-4 w-full"
		>
			<h2 className="text-xl font-bold text-(--text)">{t('info.bugs.newBug')}</h2>
			<form onSubmit={submitIssue} onPaste={handlePaste} className="flex flex-col gap-4">
				<Input placeholder={t('info.bugs.titlePlaceholder')} value={title} onChange={(e) => setTitle(e.target.value)} required />
				<Input variant="textarea" rows={4} placeholder={t('info.bugs.descriptionPlaceholder')} value={description} onChange={(e) => setDescription(e.target.value)} required />
				<Selector
					value={product}
					options={products.map((p) => {
						const botInfo = resolveBot(p);
						return {
							value: p,
							label: botInfo ? (
								<span className="inline-flex items-center gap-2">
									{botInfo.avatarUrl && <Image src={botInfo.avatarUrl} alt={botInfo.name} width={16} height={16} unoptimized className="w-4 h-4 rounded-full object-cover" />}
									<span>{botInfo.name}</span>
								</span>
							) : (
								p
							),
						};
					})}
					onChange={setProduct}
					placeholder={t('info.bugs.selectProduct')}
					required
				/>
				<div className="flex flex-col gap-2">
					<label className="text-xs font-bold text-(--text-muted) uppercase">{t('info.bugs.attachFile')}</label>
					<input ref={fileInputRef} type="file" onChange={(e) => setAttachment(e.target.files?.[0] || null)} className="hidden" accept="image/*,.txt,.log,.json" />
					{attachment ? (
						<div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-(--accent)/30 bg-(--background)/50">
							<div className="flex items-center gap-3 min-w-0">
								{attachmentPreview ? (
									<Image
										src={attachmentPreview}
										alt={attachment.name}
										width={48}
										height={48}
										unoptimized
										className="w-12 h-12 rounded-lg object-cover border border-(--border)/10 shrink-0"
									/>
								) : (
									<div className="w-12 h-12 rounded-lg bg-(--accent)/10 text-(--accent) flex items-center justify-center shrink-0">
										<FileText size={20} />
									</div>
								)}
								<div className="flex flex-col min-w-0">
									<span className="text-sm font-semibold text-(--text) truncate">{attachment.name}</span>
									<span className="text-xs text-(--text-muted)">{(attachment.size / 1024).toFixed(1)} KB</span>
								</div>
							</div>
							<button
								type="button"
								title={t('info.bugs.dropzone.remove')}
								aria-label={t('info.bugs.dropzone.remove')}
								onClick={() => {
									setAttachment(null);
									if (fileInputRef.current) fileInputRef.current.value = '';
								}}
								className="p-2 rounded-lg text-(--text-muted) hover:text-(--accent-red) hover:bg-(--accent-red)/10 transition-colors cursor-pointer shrink-0"
							>
								<X size={16} />
							</button>
						</div>
					) : (
						<div
							onClick={() => fileInputRef.current?.click()}
							onDragOver={(e) => {
								e.preventDefault();
								setIsDragging(true);
							}}
							onDragLeave={() => setIsDragging(false)}
							onDrop={(e) => {
								e.preventDefault();
								setIsDragging(false);
								const dropped = e.dataTransfer.files?.[0];
								if (dropped) setAttachment(dropped);
							}}
							className={`flex flex-col items-center justify-center gap-1.5 p-5 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center ${
								isDragging ? 'border-(--accent) bg-(--accent)/10' : 'border-(--border)/15 bg-(--background)/30 hover:border-(--accent)/40 hover:bg-(--background)/50'
							}`}
						>
							<Upload size={20} className="text-(--accent)" />
							<span className="text-xs font-semibold text-(--text)">{t('info.bugs.dropzone.prompt')}</span>
							<span className="text-[11px] text-(--text-muted)">{t('info.bugs.dropzone.formats')}</span>
						</div>
					)}
				</div>
				<div className="flex gap-2 w-full">
					<Button type="submit" className="flex-1" disabled={uploading}>
						{uploading ? t('info.bugs.uploading') : t('info.bugs.submit')}
					</Button>
					<Button variant="danger" type="button" onClick={onCancel}>
						{t('info.bugs.cancel')}
					</Button>
				</div>
			</form>
		</motion.div>
	);
}
