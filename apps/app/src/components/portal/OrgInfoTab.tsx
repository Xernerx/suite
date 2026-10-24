/** @format */
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Building2, Upload } from 'lucide-react';
import { Input, Markdown, Selector } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { CircleFlag } from 'react-circle-flags';

const getFlagCode = (localeCode: string) => {
	switch (localeCode) {
		case 'en-GB':
			return 'uk';
		case 'en-US':
			return 'us';
		default:
			return localeCode;
	}
};

interface OrgInfoTabProps {
	orgConfig: any;
	setOrgConfig: (config: any) => void;
	pendingUploads: Record<string, File>;
	handleUpload: (e: React.ChangeEvent<HTMLInputElement>, field: 'iconUrl' | 'bannerUrl') => void;
	uploadingMedia: string | null;
}

export default function OrgInfoTab({ orgConfig, setOrgConfig, pendingUploads, handleUpload, uploadingMedia }: OrgInfoTabProps) {
	const { t, locales } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const [markdownPreview, setMarkdownPreview] = useState(false);

	return (
		<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-[2rem] p-8 shadow-xl">
			<div className="flex items-center gap-3 mb-6 text-(--text) font-extrabold text-sm tracking-widest uppercase">
				<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
					<Building2 className="w-4 h-4" />
				</div>
				{t('app.portal.orgProfile')}
			</div>
			<div className="flex flex-col gap-5">
				<div className="relative mb-14">
					<div className="relative h-48 w-full rounded-[2rem] overflow-hidden border border-(--border)/10 shadow-sm bg-(--background)/50 group/banner">
						{pendingUploads.bannerUrl || orgConfig.bannerUrl ? (
							<Image
								src={pendingUploads.bannerUrl ? URL.createObjectURL(pendingUploads.bannerUrl) : getEnvUrl(orgConfig.bannerUrl as string)}
								alt="Banner"
								fill
								unoptimized
								className="w-full h-full object-cover"
							/>
						) : (
							<div className="w-full h-full bg-(--foreground)/30" />
						)}
						<label className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 opacity-0 group-hover/banner:opacity-100 transition-opacity cursor-pointer">
							{uploadingMedia === 'bannerUrl' ? <Loading variant="small" /> : <Upload className="w-6 h-6 text-white" />}
							<span className="text-white font-medium text-sm">
								{pendingUploads.bannerUrl || orgConfig.bannerUrl ? t('app.portal.info.changeBanner') : t('app.portal.info.uploadBanner')}
							</span>
							<input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, 'bannerUrl')} disabled={uploadingMedia !== null} />
						</label>
					</div>

					<div className="absolute left-8 -bottom-10 rounded-full border-4 border-(--background) shadow-lg bg-(--background) group/avatar z-10">
						<div className="relative w-24 h-24 rounded-full overflow-hidden bg-(--background)">
							{pendingUploads.iconUrl || orgConfig.iconUrl ? (
								<Image
									src={pendingUploads.iconUrl ? URL.createObjectURL(pendingUploads.iconUrl) : getEnvUrl(orgConfig.iconUrl as string)}
									alt="Avatar"
									fill
									unoptimized
									className="w-full h-full object-cover"
								/>
							) : (
								<div className="w-full h-full bg-(--foreground)/50 flex items-center justify-center">
									<Building2 className="w-10 h-10 text-(--text-muted)" />
								</div>
							)}
							<label className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
								{uploadingMedia === 'iconUrl' ? <Loading variant="small" /> : <Upload className="w-5 h-5 text-white" />}
								<span className="text-white font-medium text-[10px]">{t('app.portal.info.editAvatar')}</span>
								<input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, 'iconUrl')} disabled={uploadingMedia !== null} />
							</label>
						</div>
					</div>
				</div>
				<div className="flex flex-col gap-2">
					<label className="text-sm font-bold text-(--text)">{t('app.portal.labels.name')}</label>
					<Input value={orgConfig.name || ''} onChange={(e) => setOrgConfig({ ...orgConfig, name: e.target.value })} placeholder={t('app.portal.placeholders.orgName')} />
				</div>
				<div className="flex flex-col gap-2">
					<label className="text-sm font-bold text-(--text)">{t('app.portal.labels.description')}</label>
					<Input value={orgConfig.description || ''} onChange={(e) => setOrgConfig({ ...orgConfig, description: e.target.value })} placeholder={t('app.portal.placeholders.shortDesc')} />
				</div>
				<Markdown
					editable
					preview={markdownPreview}
					onPreviewChange={setMarkdownPreview}
					label={t('app.portal.labels.extendedInfo')}
					value={orgConfig.info || ''}
					onChange={(val) => setOrgConfig({ ...orgConfig, info: val })}
					placeholder={t('app.portal.placeholders.extendedInfo')}
					emptyText={t('app.portal.info.nothingToPreview')}
					rows={4}
				/>
				<div className="flex flex-col gap-2">
					<label className="text-sm font-bold text-(--text)">{t('app.portal.labels.locale')}</label>
					<Selector
						value={orgConfig.locale || ''}
						onChange={(val) => setOrgConfig({ ...orgConfig, locale: val })}
						options={[
							{ label: t('app.portal.options.default'), value: '' },
							...(locales?.map((lang: any) => {
								const countryCode = getFlagCode(lang.code);
								return {
									value: lang.code,
									label: (
										<div className="flex items-center gap-2.5">
											<CircleFlag countryCode={countryCode} className="h-4 w-4 shrink-0" />
											<span className="font-medium">{lang.label}</span>
										</div>
									),
									badge: (
										<span
											className={`text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full ${
												lang.coverage === 100 ? 'bg-(--accent-green)/10 text-(--accent-green)' : 'bg-(--accent-orange)/10 text-(--accent-orange)'
											}`}
										>
											{lang.coverage}%
										</span>
									),
								};
							}) || []),
						]}
					/>
				</div>
			</div>
		</div>
	);
}
