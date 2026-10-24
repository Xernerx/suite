/** @format */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Crop, Upload } from 'lucide-react';
import { Button, Input, Modal, Selector, Slider, Tabs } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

export type CropAspectMode = 'free' | '1:1' | '16:9';

export interface MediaUploadMeta {
	folder: string;
	tags: string[];
}

export interface MediaCropModalProps {
	file: File | null;
	open: boolean;
	onClose: () => void;
	onConfirm: (finalFile: File, meta: MediaUploadMeta) => void;
	uploading?: boolean;
	availableFolders?: string[];
}

const DEFAULT_FOLDERS = ['Uncategorized', 'Avatars', 'Banners', 'Showcases', 'Screenshots'];

export function MediaCropModal({ file, open, onClose, onConfirm, uploading = false, availableFolders = [] }: MediaCropModalProps) {
	const { t } = useDictionary();
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const imgRef = useRef<HTMLImageElement | null>(null);

	const [aspect, setAspect] = useState<CropAspectMode>('free');
	const [zoom, setZoom] = useState<number>(100);
	const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
	const [dragging, setDragging] = useState(false);
	const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
	const [imgLoaded, setImgLoaded] = useState(false);

	const [folder, setFolder] = useState('Uncategorized');
	const [tagsInput, setTagsInput] = useState('');

	useEffect(() => {
		if (!file || !open) {
			setImgLoaded(false);
			setZoom(100);
			setPan({ x: 0, y: 0 });
			setAspect('free');
			return;
		}
		const url = URL.createObjectURL(file);
		const img = new window.Image();
		img.onload = () => {
			imgRef.current = img;
			setImgLoaded(true);
		};
		img.src = url;
		return () => URL.revokeObjectURL(url);
	}, [file, open]);

	useEffect(() => {
		const canvas = canvasRef.current;
		const img = imgRef.current;
		if (!canvas || !img || !imgLoaded) return;

		const targetW = aspect === '1:1' ? 360 : 480;
		const targetH = aspect === '1:1' ? 360 : aspect === '16:9' ? 270 : Math.max(200, Math.min(360, Math.round((img.height / Math.max(1, img.width)) * 480)));
		canvas.width = targetW;
		canvas.height = targetH;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		ctx.clearRect(0, 0, targetW, targetH);
		ctx.fillStyle = '#09090b';
		ctx.fillRect(0, 0, targetW, targetH);

		const scaleBase = Math.max(targetW / img.width, targetH / img.height);
		const scale = scaleBase * (zoom / 100);
		const drawW = img.width * scale;
		const drawH = img.height * scale;
		const drawX = (targetW - drawW) / 2 + pan.x;
		const drawY = (targetH - drawH) / 2 + pan.y;

		ctx.drawImage(img, drawX, drawY, drawW, drawH);
	}, [aspect, zoom, pan, imgLoaded]);

	const buildMeta = (): MediaUploadMeta => ({
		folder: folder.trim() || 'Uncategorized',
		tags: tagsInput
			.split(',')
			.map((tag) => tag.trim())
			.filter(Boolean),
	});

	const handleCropAndUpload = () => {
		if (!file) return;
		const canvas = canvasRef.current;
		const img = imgRef.current;
		if (!canvas || !img || (aspect === 'free' && zoom === 100 && pan.x === 0 && pan.y === 0)) {
			onConfirm(file, buildMeta());
			return;
		}

		const outCanvas = document.createElement('canvas');
		const outW = aspect === '1:1' ? 512 : aspect === '16:9' ? 1280 : img.width;
		const outH = aspect === '1:1' ? 512 : aspect === '16:9' ? 720 : img.height;
		outCanvas.width = outW;
		outCanvas.height = outH;
		const outCtx = outCanvas.getContext('2d');
		if (!outCtx) {
			onConfirm(file, buildMeta());
			return;
		}

		const ratioX = outW / canvas.width;
		const ratioY = outH / canvas.height;
		const scaleBase = Math.max(canvas.width / img.width, canvas.height / img.height);
		const scale = scaleBase * (zoom / 100);
		const drawW = img.width * scale * ratioX;
		const drawH = img.height * scale * ratioY;
		const drawX = ((canvas.width - img.width * scale) / 2 + pan.x) * ratioX;
		const drawY = ((canvas.height - img.height * scale) / 2 + pan.y) * ratioY;

		outCtx.drawImage(img, drawX, drawY, drawW, drawH);
		const mimeType = file.type === 'image/jpeg' || file.type === 'image/webp' ? file.type : 'image/png';
		outCanvas.toBlob(
			(blob) => {
				if (!blob) {
					onConfirm(file, buildMeta());
					return;
				}
				const croppedFile = new File([blob], file.name, { type: mimeType });
				onConfirm(croppedFile, buildMeta());
			},
			mimeType,
			0.92
		);
	};

	const folderOptions = Array.from(new Set([...DEFAULT_FOLDERS, ...availableFolders])).map((f) => ({
		value: f,
		label: f,
	}));

	return (
		<Modal open={open && Boolean(file)} onOpenChange={(o) => !o && onClose()} title={t('account.media.crop.title')} maxWidth="max-w-xl">
			<div className="flex flex-col gap-4">
				<Tabs
					size="sm"
					activeTab={aspect}
					onChange={(id) => {
						setAspect(id as CropAspectMode);
						setPan({ x: 0, y: 0 });
						if (id === '1:1') setFolder('Avatars');
						else if (id === '16:9') setFolder('Banners');
					}}
					tabs={[
						{ id: 'free', label: t('account.media.crop.aspectFree') },
						{ id: '1:1', label: t('account.media.crop.aspectAvatar') },
						{ id: '16:9', label: t('account.media.crop.aspectBanner') },
					]}
				/>

				<div
					className="relative flex items-center justify-center rounded-2xl border border-(--border)/15 bg-(--background)/60 overflow-hidden cursor-grab active:cursor-grabbing select-none p-2"
					onPointerDown={(e) => {
						setDragging(true);
						setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
					}}
					onPointerMove={(e) => {
						if (!dragging) return;
						setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
					}}
					onPointerUp={() => setDragging(false)}
					onPointerLeave={() => setDragging(false)}
				>
					<canvas ref={canvasRef} className="max-w-full rounded-xl border border-(--border)/10 shadow-sm" />
				</div>

				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-semibold text-(--text-muted)">{t('account.media.crop.zoomLabel')}</label>
					<Slider value={zoom} onChange={setZoom} min={100} max={250} step={5} unit="%" />
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-(--text-muted)">{t('account.media.folderLabel')}</label>
						<Selector value={folder} options={folderOptions} onChange={setFolder} />
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-(--text-muted)">{t('account.media.tagsLabel')}</label>
						<Input value={tagsInput} onChange={(e: any) => setTagsInput(e.target.value)} placeholder={t('account.media.tagsPlaceholder')} />
					</div>
				</div>

				<div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-(--border)/10">
					<Button variant="secondary" type="button" onClick={onClose} disabled={uploading}>
						{t('account.media.modal.cancel')}
					</Button>
					{file && (
						<Button variant="outline" type="button" onClick={() => onConfirm(file, buildMeta())} disabled={uploading}>
							<Upload size={14} />
							{t('account.media.crop.uploadOriginal')}
						</Button>
					)}
					<Button variant="primary" type="button" onClick={handleCropAndUpload} loading={uploading}>
						<Crop size={14} />
						{t('account.media.crop.cropAndUpload')}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
