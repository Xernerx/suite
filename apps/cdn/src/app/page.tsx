/** @format */
'use client';

import { useDictionary, useEnvironment, useLoading, usePermissions, useSidebar, useToast } from '@xernerx/providers';
import { Button } from '@xernerx/ui';
import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, Upload } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
	const { hide } = useSidebar();
	const { getEnvUrl } = useEnvironment();
	const { t } = useDictionary();
	const { setBackgroundMode, setDotVariant } = useLoading();
	const { permissions } = usePermissions();
	const { toast } = useToast();
	const [uploading, setUploading] = useState(false);
	const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [copied, setCopied] = useState(false);

	const canManage = permissions.manageMedia;

	useEffect(() => {
		hide();
		setBackgroundMode('sticky-ripple');
		setDotVariant('full');

		return () => {
			setBackgroundMode(null);
			setDotVariant(null);
		};
	}, [hide, setBackgroundMode, setDotVariant]);

	const uploadFile = useCallback(
		async (file: File) => {
			setUploading(true);
			try {
				const formData = new FormData();
				formData.append('file', file);

				const res = await fetch('/upload', {
					method: 'POST',
					body: formData,
				});

				if (res.ok) {
					const data = await res.json();
					setUploadedUrl(data.url);
					toast({ type: 'success', title: t('cdn.home.uploadedSuccess'), description: data.url });
					navigator.clipboard?.writeText?.(data.url).catch(() => {});
				} else {
					toast({ type: 'error', title: t('cdn.home.errors.uploadFailed') });
				}
			} catch (err) {
				console.error(err);
				toast({ type: 'error', title: t('cdn.home.errors.generic') });
			} finally {
				setUploading(false);
			}
		},
		[toast, t]
	);

	const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files || e.target.files.length === 0) return;
		const file = e.target.files[0];
		e.target.value = '';
		await uploadFile(file);
	};

	useEffect(() => {
		if (!canManage) return;
		const handlePaste = (e: ClipboardEvent) => {
			if (uploading) return;
			const files = e.clipboardData?.files;
			if (files && files.length > 0) {
				e.preventDefault();
				uploadFile(files[0]);
			}
		};
		window.addEventListener('paste', handlePaste);
		return () => window.removeEventListener('paste', handlePaste);
	}, [canManage, uploading, uploadFile]);

	return (
		<div className="flex flex-col selection:bg-(--accent) selection:text-white">
			<section className="min-h-[90vh] flex items-center justify-center px-6 py-16 relative">
				<div className="w-full max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-8 items-center relative z-10">
					{/* LEFT: TEXT */}
					<motion.div initial={{ opacity: 1, x: 0 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col text-left">
						<h1
							className="text-6xl lg:text-7xl xl:text-[5.5rem] font-extrabold tracking-tight mb-8 leading-[1.05] text-transparent bg-clip-text bg-gradient-to-br from-(--text) via-(--text) to-(--text-muted)"
							style={{ fontFamily: 'var(--font-fredoka)' }}
						>
							Xernerx CDN
						</h1>

						<p className="max-w-xl text-lg text-(--text-muted) leading-relaxed mb-10 border-l-2 border-(--border)/20 pl-6">
							{t('cdn.common.description')}
							<br />
							<br />
							{t('cdn.home.description2')}
						</p>

						<div className="flex flex-wrap items-center gap-4 mb-8">
							<a
								suppressHydrationWarning
								href={`${getEnvUrl('https://account.xernerx.com')}/?view=media`}
								className="px-8 py-4 rounded-2xl bg-(--accent) text-white font-bold text-sm hover:opacity-90 transition-all shadow-[0_0_40px_-10px_var(--accent)] hover:shadow-[0_0_60px_-15px_var(--accent)] hover:-translate-y-1"
							>
								{t('cdn.home.manage')}
							</a>
							<a
								suppressHydrationWarning
								href={getEnvUrl('https://docs.xernerx.com/cdn')}
								className="px-8 py-4 rounded-2xl bg-(--foreground)/30 text-(--text) font-bold text-sm hover:bg-(--foreground)/60 transition-all border border-(--border)/10 backdrop-blur-md hover:-translate-y-1"
							>
								{t('cdn.home.docs')}
							</a>
						</div>

						{canManage && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.5 }}
								onDragOver={(e) => {
									e.preventDefault();
									setIsDragging(true);
								}}
								onDragLeave={() => setIsDragging(false)}
								onDrop={(e) => {
									e.preventDefault();
									setIsDragging(false);
									if (!uploading && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
										uploadFile(e.dataTransfer.files[0]);
									}
								}}
								className={`max-w-md bg-(--foreground)/30 backdrop-blur-md border p-6 rounded-2xl transition-all ${
									isDragging ? 'border-(--accent) bg-(--accent)/10 scale-[1.01]' : 'border-(--border)/10'
								}`}
							>
								<h2 className="font-bold text-sm text-(--text) uppercase tracking-wider mb-2">{t('cdn.home.directUpload')}</h2>
								<p className="text-xs text-(--text-muted) mb-4">{t('cdn.home.dropzoneHint')}</p>
								<div className="flex flex-col items-start gap-4">
									<input type="file" id="cdn-upload" className="hidden" onChange={handleUpload} disabled={uploading} />
									<label htmlFor="cdn-upload" className="cursor-pointer">
										<Button variant="primary" loading={uploading} style={{ pointerEvents: 'none' }}>
											<Upload size={16} /> {t('cdn.home.uploadMedia')}
										</Button>
									</label>

									{uploadedUrl && (
										<div className="mt-2 p-3 bg-(--accent)/10 border border-(--accent)/20 text-(--accent) rounded-xl w-full text-xs flex items-center justify-between gap-2">
											<a href={uploadedUrl} target="_blank" rel="noopener noreferrer" className="hover:underline font-medium truncate flex items-center gap-1.5">
												<ExternalLink size={14} className="shrink-0" />
												<span className="truncate">{uploadedUrl}</span>
											</a>
											<button
												type="button"
												onClick={() => {
													navigator.clipboard.writeText(uploadedUrl).then(() => {
														setCopied(true);
														toast({ type: 'success', title: t('cdn.home.urlCopied'), description: uploadedUrl });
														setTimeout(() => setCopied(false), 2000);
													});
												}}
												className="p-1.5 rounded-lg bg-(--background)/60 hover:bg-(--background) text-(--text) transition-colors shrink-0 cursor-pointer"
												title={t('cdn.view.actions.copyDirectLink')}
												aria-label={t('cdn.view.actions.copyDirectLink')}
											>
												{copied ? <Check size={14} className="text-(--accent-green)" /> : <Copy size={14} />}
											</button>
										</div>
									)}
								</div>
							</motion.div>
						)}
					</motion.div>

					{/* RIGHT: OPEN STAGE FOR APPLAYOUT STICKY REACTIVE DOT-MATRIX LOGO */}
					<div className="hidden lg:block min-h-[320px] w-full pointer-events-none" />
				</div>
			</section>
		</div>
	);
}
