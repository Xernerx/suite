/** @format */
'use client';

import Image from 'next/image';
import { useDictionary } from '@xernerx/providers';
import { Badge, Button, Check } from '@xernerx/ui';
import { Check as CheckIcon, Copy, ExternalLink, Eye, FileText, Film, Folder, Settings, Trash, Users } from 'lucide-react';

interface MediaGridCardProps {
	item: any;
	rawUrl: string;
	viewUrl: string;
	isSelected: boolean;
	copiedId: string | null;
	onToggleSelect: (id: string) => void;
	onPreview: (item: any) => void;
	onCopyUrl: (id: string) => void;
	onEdit: (item: any) => void;
	onDelete: (id: string) => void;
	onSelectTag: (tag: string) => void;
}

export function MediaGridCard({ item, rawUrl, viewUrl, isSelected, copiedId, onToggleSelect, onPreview, onCopyUrl, onEdit, onDelete, onSelectTag }: MediaGridCardProps) {
	const { t } = useDictionary();
	const isImage = item.mimeType?.startsWith('image/');
	const isVideo = item.mimeType?.startsWith('video/');

	return (
		<div
			className={`relative group bg-(--foreground)/30 backdrop-blur-md border rounded-3xl overflow-hidden shadow-sm transition-all flex flex-col ${
				isSelected ? 'border-(--accent) ring-2 ring-(--accent)/30' : 'border-(--border)/10 hover:border-(--accent)/30'
			}`}
		>
			<div className={`absolute top-3 left-3 z-20 transition-opacity duration-150 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} onClick={(e) => e.stopPropagation()}>
				<Check checked={isSelected} onChange={() => onToggleSelect(item._id)} />
			</div>
			<div onClick={() => onPreview(item)} className="aspect-square relative bg-(--background)/50 w-full overflow-hidden flex items-center justify-center cursor-pointer">
				{isImage ? (
					<Image src={rawUrl} alt={item.filename} width={300} height={300} unoptimized className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
				) : isVideo ? (
					<div className="flex flex-col items-center gap-2 text-(--accent)">
						<Film size={32} />
						<span className="text-[11px] font-mono text-(--text-muted)">{item.mimeType}</span>
					</div>
				) : (
					<div className="flex flex-col items-center gap-2 text-(--accent)">
						<FileText size={32} />
						<span className="text-[11px] font-mono text-(--text-muted)">{item.mimeType}</span>
					</div>
				)}

				<div
					onClick={(e) => e.stopPropagation()}
					className="absolute inset-0 bg-(--background)/80 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
				>
					<Button variant="secondary" size="icon" title={t('app.widgets.previewTitle')} onClick={() => onPreview(item)}>
						<Eye size={16} />
					</Button>
					<Button variant="secondary" size="icon" title={t('account.media.copyUrl')} onClick={() => onCopyUrl(item._id)}>
						{copiedId === item._id ? <CheckIcon size={16} className="text-(--accent-green)" /> : <Copy size={16} />}
					</Button>
					<a href={viewUrl} target="_blank" rel="noopener noreferrer">
						<Button variant="secondary" size="icon">
							<ExternalLink size={16} />
						</Button>
					</a>
					<Button variant="primary" size="icon" onClick={() => onEdit({ ...item, shared: Array.isArray(item.shared) ? item.shared : [] })}>
						<Settings size={16} />
					</Button>
					<Button variant="danger" size="icon" onClick={() => onDelete(item._id)}>
						<Trash size={16} />
					</Button>
				</div>
			</div>
			<div className="p-3.5 flex flex-col gap-1.5">
				<div className="font-semibold text-sm text-(--text) truncate" title={item.filename}>
					{item.filename}
				</div>
				<div className="text-xs text-(--text-muted) flex items-center justify-between">
					<span>{(item.size / 1024).toFixed(1)} KB</span>
					<div className="flex items-center gap-1.5">
						{item.folder && item.folder !== 'Uncategorized' && (
							<Badge variant="muted" size="sm" icon={<Folder size={10} />}>
								{item.folder}
							</Badge>
						)}
						{item.shared?.length > 0 && (
							<Badge variant="accent" size="sm" icon={<Users size={10} />}>
								{t('account.media.shared')}
							</Badge>
						)}
						<Badge variant={item.privacy === 'public' ? 'success' : item.privacy === 'limited' ? 'warning' : 'muted'} size="sm">
							{item.privacy}
						</Badge>
					</div>
				</div>
				{Array.isArray(item.tags) && item.tags.length > 0 && (
					<div className="flex flex-wrap items-center gap-1 pt-1">
						{item.tags.slice(0, 4).map((tg: string) => (
							<button
								key={tg}
								type="button"
								onClick={() => onSelectTag(tg)}
								className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-(--accent)/10 text-(--accent) hover:bg-(--accent)/20 transition-colors cursor-pointer"
							>
								#{tg}
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
