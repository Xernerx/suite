/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, Languages, ListOrdered, Loader2, Search, Send, Sparkles } from 'lucide-react';
import { Button, PreventLossConfirmation, Selector } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast, useUser } from '@xernerx/providers';
import { useEffect, useMemo, useState } from 'react';
import { CircleFlag } from 'react-circle-flags';
import { Loading } from '@xernerx/feedback';
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
function flattenObject(obj: any, prefix = ''): Record<string, string> {
	let flattened: Record<string, string> = {};
	for (const k in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, k)) {
			const pre = prefix.length ? prefix + '.' : '';
			if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
				Object.assign(flattened, flattenObject(obj[k], pre + k));
			} else {
				flattened[pre + k] = String(obj[k]);
			}
		}
	}
	return flattened;
}
function unflattenObject(data: Record<string, string>) {
	const result: any = {};
	for (const p in data) {
		if (Object.prototype.hasOwnProperty.call(data, p)) {
			const val = data[p];
			if (val === undefined || val === null || val.trim() === '') {
				continue;
			}
			let schema = result;
			const arr = p.split('.');
			for (let i = 0; i < arr.length; i++) {
				const elem = arr[i];
				if (!schema[elem]) {
					schema[elem] = i === arr.length - 1 ? val : {};
				}
				schema = schema[elem];
			}
		}
	}
	return result;
}
export default function Translations() {
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { user } = useUser();
	const { locales: localesData, t } = useDictionary() as any;
	const localesList: Array<{
		code: string;
		label: string;
		coverage: number;
	}> = Array.isArray(localesData) ? localesData : localesData && typeof localesData === 'object' ? Object.values(localesData) : [];
	const targetLocales = localesList.filter((l) => l && typeof l === 'object' && l.code && l.code !== 'en-GB');
	const [selectedLocale, setSelectedLocale] = useState<string>(() => {
		const pref = user?.preferences?.locale;
		if (pref && targetLocales.some((l) => l.code === pref)) {
			return pref;
		}
		return targetLocales.length > 0 ? targetLocales[0].code : '';
	});
	const [sourceDict, setSourceDict] = useState<Record<string, string>>({});
	const [targetDict, setTargetDict] = useState<Record<string, string>>({});
	const [initialTargetDict, setInitialTargetDict] = useState<Record<string, string>>({});
	const [missingKeys, setMissingKeys] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [activeTab, setActiveTab] = useState<'welcome' | 'new' | 'review'>('welcome');
	const [newIndex, setNewIndex] = useState(0);
	const [reviewSearch, setReviewSearch] = useState('');

	// Translator Application Config Mapping State
	const [appConfigs, setAppConfigs] = useState<any[]>([]);
	const [translatorAppConfig, setTranslatorAppConfig] = useState('');
	const [savingConfig, setSavingConfig] = useState(false);
	const [hasApplicationPermission, setHasApplicationPermission] = useState(false);
	useEffect(() => {
		const checkPermissions = async () => {
			if (!user?.roles || !Array.isArray(user.roles) || user.roles.length === 0) return;
			try {
				const rolePromises = user.roles.map(async (roleItem: any) => {
					const roleId = typeof roleItem === 'string' ? roleItem : roleItem.id;
					if (!roleId) return null;
					const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/core/${roleId}`), {
						credentials: 'include',
					});
					if (res.ok) return await res.json();
					return null;
				});
				const fetchedRoles = await Promise.all(rolePromises);
				const hasPerm = fetchedRoles.some((role) => role?.permissions?.applications_manage === true);
				setHasApplicationPermission(hasPerm);
			} catch (err) {
				console.error('Failed to verify role permissions:', err);
			}
		};
		checkPermissions();
	}, [user?.roles, getEnvUrl]);
	useEffect(() => {
		async function fetchConfig() {
			try {
				const [appsRes, settingRes] = await Promise.all([
					fetch(getEnvUrl('https://api.xernerx.com/secure/dispatch/applications'), { credentials: 'include', cache: 'no-store' }),
					fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/translator_app_config'), { credentials: 'include', cache: 'no-store' }),
				]);
				if (appsRes.ok) setAppConfigs(await appsRes.json());
				if (settingRes.ok) {
					const data = await settingRes.json();
					setTranslatorAppConfig(data?.value || '');
				}
			} catch (err) {
				console.error('Failed to load translator config mapping', err);
			}
		}
		fetchConfig();
	}, [getEnvUrl]);
	const saveTranslatorConfig = async () => {
		setSavingConfig(true);
		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/translator_app_config'), {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({
					value: translatorAppConfig,
					valueType: 'string',
				}),
			});
			if (!res.ok) throw new Error('Failed to save mapping');
			toast({
				title: 'Application mapped successfully',
				type: 'success',
			});
		} catch (err: any) {
			toast({
				title: err.message,
				type: 'error',
			});
		} finally {
			setSavingConfig(false);
		}
	};
	const isDirty = useMemo(() => {
		const allKeys = Object.keys({
			...sourceDict,
			...targetDict,
			...initialTargetDict,
		});
		for (const key of allKeys) {
			const currentVal = (targetDict[key] || '').trim();
			const initialVal = (initialTargetDict[key] || '').trim();
			if (currentVal !== initialVal) {
				return true;
			}
		}
		return false;
	}, [targetDict, initialTargetDict, sourceDict]);
	useEffect(() => {
		if (!selectedLocale && targetLocales.length > 0) {
			const pref = user?.locale;
			setSelectedLocale(pref && targetLocales.some((l) => l.code === pref) ? pref : targetLocales[0].code);
		}
	}, [selectedLocale, targetLocales, user?.locale]);
	useEffect(() => {
		if (!selectedLocale) return;
		async function fetchDictionaries() {
			setLoading(true);
			try {
				const [sourceRes, targetRes] = await Promise.all([
					fetch(getEnvUrl(`https://api.xernerx.com/secure/dictionary/en-GB`), {
						credentials: 'include',
					}),
					fetch(getEnvUrl(`https://api.xernerx.com/secure/dictionary/${selectedLocale}`), {
						credentials: 'include',
					}),
				]);
				if (!sourceRes.ok || !targetRes.ok) {
					throw new Error(t('admin.translations.errors.fetchFailed'));
				}
				const sourceJson = await sourceRes.json();
				const targetJson = await targetRes.json();
				const flatSource = flattenObject(sourceJson);
				const flatTarget = flattenObject(targetJson);
				setSourceDict(flatSource);
				setTargetDict(flatTarget);
				setInitialTargetDict(flatTarget);
				const initialMissing = Object.keys(flatSource).filter((key) => !flatTarget[key] || flatTarget[key].trim() === '');
				setMissingKeys(initialMissing);
				setNewIndex(0);
			} catch (err: any) {
				toast({
					title: err.message || t('admin.translations.errors.loadFailed'),
					type: 'error',
				});
			} finally {
				setLoading(false);
			}
		}
		fetchDictionaries();
	}, [selectedLocale, getEnvUrl, toast, t]);
	const handleInputChange = (key: string, value: string) => {
		setTargetDict((prev) => ({
			...prev,
			[key]: value,
		}));
	};
	const handleSave = async () => {
		if (!isDirty) {
			toast({
				title: t('admin.translations.errors.noChanges'),
				type: 'error',
			});
			return;
		}
		setSaving(true);
		try {
			const reconstructed = unflattenObject(targetDict);
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/dictionary/${selectedLocale}`), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify(reconstructed),
			});
			if (!res.ok) {
				const errData = await res.json();
				throw new Error(errData.error || t('admin.translations.errors.pushFailed'));
			}
			setInitialTargetDict(targetDict);
			toast({
				title: t('admin.translations.success.pushed'),
				type: 'success',
			});
		} catch (err: any) {
			toast({
				title: err.message || t('admin.translations.errors.pushError'),
				type: 'error',
			});
		} finally {
			setSaving(false);
		}
	};
	const currentLocaleObj = targetLocales.find((l) => l.code === selectedLocale);
	const languageOptions = targetLocales.map((lang) => {
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
				<span className={`text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full ${lang.coverage === 100 ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
					{lang.coverage}%
				</span>
			),
		};
	});
	const allKeys = Object.keys(sourceDict);
	const filteredReviewKeys = useMemo(() => {
		const query = reviewSearch.toLowerCase();
		return allKeys.filter((key) => {
			const sourceText = (sourceDict[key] || '').toLowerCase();
			const targetText = (targetDict[key] || '').toLowerCase();
			return key.toLowerCase().includes(query) || sourceText.includes(query) || targetText.includes(query);
		});
	}, [allKeys, sourceDict, targetDict, reviewSearch]);
	if (loading && !selectedLocale) return <Loading />;
	return (
		<div
			className="flex flex-col max-w-7xl mx-auto w-full"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
			}}
		>
			<PreventLossConfirmation
				active={isDirty}
				title={t('admin.translations.unsaved.title')}
				description={t('admin.translations.unsaved.description')}
				confirmText={t('admin.translations.unsaved.leave')}
				cancelText={t('admin.translations.unsaved.stay')}
			/>

			{/* Translator App Mapping Card */}
			{hasApplicationPermission && (
				<div
					className="relative z-30 flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
					style={{
						padding: 'var(--ui-gap)',
						gap: 'var(--ui-gap)',
					}}
				>
					<div
						className="flex flex-col max-w-xl"
						style={{
							gap: 'calc(var(--ui-gap) * 0.25)',
						}}
					>
						<h3 className="text-base font-semibold text-(--text)">{t('admin.translations.mapping.title')}</h3>
						<p className="text-xs text-(--text-muted)">{t('admin.translations.mapping.description')}</p>
					</div>
					<div className="flex items-center gap-3 w-full sm:w-auto">
						<div className="w-full sm:w-64">
							<Selector
								value={translatorAppConfig}
								options={[
									{
										value: '',
										label: 'Default (translator)',
									},
									...appConfigs.map((a) => ({
										value: a.id,
										label: a.name,
									})),
								]}
								onChange={(val) => setTranslatorAppConfig(val)}
							/>
						</div>
						<Button onClick={saveTranslatorConfig} disabled={savingConfig} className="gap-2 rounded-2xl px-5 py-2.5 shrink-0">
							{savingConfig ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
							{t('admin.translations.mapping.saveConfig')}
						</Button>
					</div>
				</div>
			)}

			<div
				className="relative z-20 flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{
					padding: 'var(--ui-gap)',
					gap: 'var(--ui-gap)',
				}}
			>
				<div
					className="flex flex-col max-w-xl"
					style={{
						gap: 'calc(var(--ui-gap) * 0.25)',
					}}
				>
					<div className="flex items-center gap-2.5">
						<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/10 text-(--accent)">
							<Languages size={22} />
						</div>
						<h3 className="text-base font-semibold text-(--text)">{t('admin.translations.title')}</h3>
					</div>
					<p className="text-xs text-(--text-muted)">{t('admin.translations.description')}</p>
				</div>

				<div className="flex items-center gap-3 w-full sm:w-auto">
					<div className="w-full sm:w-64">
						<Selector value={selectedLocale} options={languageOptions} onChange={(val) => setSelectedLocale(val)} />
					</div>

					<Button onClick={handleSave} disabled={saving || !isDirty} className="gap-2 rounded-2xl px-5 py-2.5 shrink-0">
						{saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
						{t('admin.translations.pushToReview')}
					</Button>
				</div>
			</div>

			{/* Mobile Tab Selector */}
			<div className="relative z-10 sm:hidden w-full">
				<Selector
					items={true}
					value={activeTab}
					onChange={(val) => {
						if (val === 'new' && missingKeys.length === 0) return;
						setActiveTab(val as any);
					}}
					options={[
						{
							value: 'welcome',
							label: (
								<div className="flex items-center gap-2">
									<BookOpen size={16} />
									{t('admin.translations.tabs.introduction')}
								</div>
							),
						},
						{
							value: 'new',
							label: (
								<div className={`flex items-center gap-2 ${missingKeys.length === 0 ? 'opacity-50' : ''}`}>
									<Sparkles size={16} />
									{typeof t('admin.translations.tabs.newEntries') === 'string'
										? t('admin.translations.tabs.newEntries').replace(/\s*\(\{count\}\)/g, '')
										: t('admin.translations.tabs.newEntries')}
								</div>
							),
						},
						{
							value: 'review',
							label: (
								<div className="flex items-center gap-2">
									<ListOrdered size={16} />
									{typeof t('admin.translations.tabs.reviewExisting') === 'string'
										? t('admin.translations.tabs.reviewExisting').replace(/\s*\(\{count\}\)/g, '')
										: t('admin.translations.tabs.reviewExisting')}
								</div>
							),
						},
					]}
				/>
			</div>

			{/* Desktop Tab Buttons */}
			<div
				className="hidden sm:flex items-center overflow-x-auto hide-scrollbar rounded-2xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md p-1.5 shadow-sm"
				style={{
					gap: 'calc(var(--ui-gap) * 0.5)',
				}}
			>
				<button
					type="button"
					onClick={() => setActiveTab('welcome')}
					className={`shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${activeTab === 'welcome' ? 'bg-(--accent) text-white shadow-sm' : 'text-(--text-muted) hover:text-(--text) hover:bg-(--border)/5'}`}
				>
					<BookOpen size={16} />
					{t('admin.translations.tabs.introduction')}
				</button>
				<button
					type="button"
					onClick={() => setActiveTab('new')}
					disabled={missingKeys.length === 0}
					className={`shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${missingKeys.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${activeTab === 'new' ? 'bg-(--accent) text-white shadow-sm' : 'text-(--text-muted) hover:text-(--text) hover:bg-(--border)/5'}`}
				>
					<Sparkles size={16} />
					{typeof t('admin.translations.tabs.newEntries') === 'string' ? t('admin.translations.tabs.newEntries').replace(/\s*\(\{count\}\)/g, '') : t('admin.translations.tabs.newEntries')}
				</button>
				<button
					type="button"
					onClick={() => setActiveTab('review')}
					className={`shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${activeTab === 'review' ? 'bg-(--accent) text-white shadow-sm' : 'text-(--text-muted) hover:text-(--text) hover:bg-(--border)/5'}`}
				>
					<ListOrdered size={16} />
					{typeof t('admin.translations.tabs.reviewExisting') === 'string'
						? t('admin.translations.tabs.reviewExisting').replace(/\s*\(\{count\}\)/g, '')
						: t('admin.translations.tabs.reviewExisting')}
				</button>
			</div>

			{loading ? (
				<div className="flex h-40 items-center justify-center rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm">
					<Loading />
				</div>
			) : (
				<>
					{activeTab === 'welcome' && (
						<div
							className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
							style={{
								padding: 'calc(var(--ui-gap) * 1.5)',
								gap: 'var(--ui-gap)',
							}}
						>
							<div
								className="flex flex-col"
								style={{
									gap: 'calc(var(--ui-gap) * 0.5)',
								}}
							>
								<h2 className="text-2xl font-black tracking-tight text-(--text)">{t('admin.translations.welcome.title')}</h2>
								<p className="text-sm text-(--text-muted) leading-relaxed">
									{t('admin.translations.welcome.descStart')}
									<span className="font-semibold text-(--text)">{t('admin.translations.welcome.english')}</span>
									{t('admin.translations.welcome.descMiddle')}
									<span className="font-semibold text-(--text)">{currentLocaleObj?.label || selectedLocale}</span>.
								</p>
							</div>

							{/* New Guide Section */}
							<div
								className="flex flex-col rounded-2xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md p-5"
								style={{
									gap: 'calc(var(--ui-gap) * 0.75)',
								}}
							>
								<h3 className="text-sm font-bold text-(--text)">{t('admin.translations.welcome.guide.title')}</h3>
								<ul
									className="flex flex-col text-xs text-(--text-muted) list-disc list-outside ml-4"
									style={{
										gap: 'calc(var(--ui-gap) * 0.4)',
									}}
								>
									<li>{t('admin.translations.welcome.guide.step1')}</li>
									<li>{t('admin.translations.welcome.guide.step2')}</li>
									<li>{t('admin.translations.welcome.guide.step3')}</li>
									<li>{t('admin.translations.welcome.guide.step4')}</li>
									<li>{t('admin.translations.welcome.guide.step5')}</li>
									<li className="leading-relaxed">{t('admin.translations.welcome.guide.step6')}</li>
								</ul>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div
									className="flex flex-col rounded-2xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md p-5"
									style={{
										gap: 'calc(var(--ui-gap) * 0.5)',
									}}
								>
									<div className="flex items-center gap-2 text-(--accent) font-bold text-sm">
										<Sparkles size={18} />
										{t('admin.translations.welcome.newEntriesTitle')}
									</div>
									<p className="text-xs text-(--text-muted)">{t('admin.translations.welcome.newEntriesDesc')}</p>
									<button
										type="button"
										onClick={() => setActiveTab('new')}
										className="mt-2 flex items-center justify-between rounded-xl bg-(--accent)/10 px-4 py-2.5 text-xs font-semibold text-(--accent) hover:bg-(--accent)/20 transition cursor-pointer"
									>
										<span>
											{t('admin.translations.welcome.startTranslating', {
												count: missingKeys.length,
											})}
										</span>
										<ArrowRight size={14} />
									</button>
								</div>

								<div
									className="flex flex-col rounded-2xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md p-5"
									style={{
										gap: 'calc(var(--ui-gap) * 0.5)',
									}}
								>
									<div className="flex items-center gap-2 text-(--accent) font-bold text-sm">
										<ListOrdered size={18} />
										{t('admin.translations.welcome.reviewTitle')}
									</div>
									<p className="text-xs text-(--text-muted)">{t('admin.translations.welcome.reviewDesc')}</p>
									<button
										type="button"
										onClick={() => setActiveTab('review')}
										className="mt-2 flex items-center justify-between rounded-xl border border-(--border)/20 px-4 py-2.5 text-xs font-semibold text-(--text) hover:bg-(--border)/5 transition cursor-pointer"
									>
										<span>{t('admin.translations.welcome.browseAll')}</span>
										<ArrowRight size={14} />
									</button>
								</div>
							</div>

							<div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-600 dark:text-amber-400">
								<CheckCircle2 size={20} className="shrink-0" />
								<span>
									{t('admin.translations.welcome.footerPart1')}
									<strong className="font-semibold">{t('admin.translations.welcome.footerBold')}</strong>
									{t('admin.translations.welcome.footerPart2')}
								</span>
							</div>
						</div>
					)}

					{activeTab === 'new' && (
						<div>
							{missingKeys.length === 0 ? (
								<div
									className="flex flex-col items-center justify-center rounded-3xl border border-(--border)/10 bg-(--foreground) text-center shadow-sm"
									style={{
										padding: 'calc(var(--ui-gap) * 2.5)',
										gap: 'var(--ui-gap)',
									}}
								>
									<div className="flex items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 w-16 h-16">
										<Check size={32} />
									</div>
									<div className="flex flex-col gap-1">
										<h3 className="text-xl font-bold text-(--text)">{t('admin.translations.new.allCaughtUp')}</h3>
										<p className="text-sm text-(--text-muted)">
											{t('admin.translations.new.noMissingKeys', {
												locale: currentLocaleObj?.label || selectedLocale,
											})}
										</p>
									</div>
									<Button onClick={() => setActiveTab('review')} className="rounded-xl px-5 py-2.5">
										{t('admin.translations.new.reviewExistingButton')}
									</Button>
								</div>
							) : (
								(() => {
									const currentKey = missingKeys[newIndex] || missingKeys[0];
									const sourceText = sourceDict[currentKey];
									const currentVal = targetDict[currentKey] || '';
									return (
										<div
											className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
											style={{
												padding: 'calc(var(--ui-gap) * 1.5)',
												gap: 'var(--ui-gap)',
											}}
										>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<span className="text-xs font-mono text-(--accent)">{currentKey}</span>
												</div>
												<span className="text-xs font-medium text-(--text-muted)">
													{t('admin.translations.new.cardCounter', {
														current: newIndex + 1,
														total: missingKeys.length,
													})}
												</span>
											</div>

											<div
												className="flex flex-col"
												style={{
													gap: 'calc(var(--ui-gap) * 0.5)',
												}}
											>
												<label className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">
													{t('admin.translations.new.translateInstruction', {
														locale: currentLocaleObj?.label || selectedLocale,
													})}
												</label>
												<p className="text-base font-medium text-(--text) bg-(--background)/50 backdrop-blur-md p-4 rounded-2xl border border-(--border)/10">{sourceText}</p>
											</div>

											<div
												className="flex flex-col"
												style={{
													gap: 'calc(var(--ui-gap) * 0.5)',
												}}
											>
												<label className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">{t('admin.translations.new.yourTranslation')}</label>
												<input
													type="text"
													value={currentVal}
													onChange={(e) => handleInputChange(currentKey, e.target.value)}
													onKeyDown={(e) => {
														if (e.key === 'Enter' && newIndex < missingKeys.length - 1) {
															setNewIndex((prev) => prev + 1);
														}
													}}
													autoFocus
													placeholder={t('admin.translations.new.typePlaceholder')}
													className="w-full rounded-2xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md px-4 py-3 text-sm text-(--text) outline-none transition focus:border-(--accent) focus:ring-2 focus:ring-(--accent)"
												/>
											</div>

											<div className="flex items-center justify-between pt-2">
												<Button
													onClick={() => setNewIndex((prev) => Math.max(0, prev - 1))}
													disabled={newIndex === 0}
													className="gap-2 rounded-xl px-4 py-2 border border-(--border)/20 bg-transparent text-(--text) hover:bg-(--border)/5 disabled:opacity-40"
												>
													<ArrowLeft size={16} />
													{t('admin.translations.new.previous')}
												</Button>

												<Button
													onClick={() => {
														if (newIndex < missingKeys.length - 1) {
															setNewIndex((prev) => prev + 1);
														} else {
															setActiveTab('review');
														}
													}}
													className="gap-2 rounded-xl px-5 py-2.5"
												>
													{newIndex < missingKeys.length - 1 ? t('admin.translations.new.next') : t('admin.translations.new.finish')}
													<ArrowRight size={16} />
												</Button>
											</div>
										</div>
									);
								})()
							)}
						</div>
					)}

					{activeTab === 'review' && (
						<div
							className="flex flex-col"
							style={{
								gap: 'var(--ui-gap)',
							}}
						>
							<div className="relative w-full">
								<Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-(--text-muted)" />
								<input
									type="text"
									placeholder={t('admin.translations.review.searchPlaceholder')}
									value={reviewSearch}
									onChange={(e) => setReviewSearch(e.target.value)}
									className="w-full rounded-2xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md text-sm text-(--text) focus:outline-none focus:ring-2 focus:ring-(--accent)"
									style={{
										padding: 'calc(var(--ui-gap) * 0.6) var(--ui-gap) calc(var(--ui-gap) * 0.6) calc(var(--ui-gap) * 2.5)',
									}}
								/>
							</div>

							<div
								className="flex flex-col"
								style={{
									gap: 'var(--ui-gap)',
								}}
							>
								{filteredReviewKeys.length === 0 ? (
									<div className="flex flex-col items-center justify-center rounded-3xl border border-(--border)/10 bg-(--foreground) py-16 text-center">
										<p className="text-sm text-(--text-muted)">{t('admin.translations.review.noKeysFound')}</p>
									</div>
								) : (
									filteredReviewKeys.map((key) => {
										const isMissing = !targetDict[key] || targetDict[key].trim() === '';
										const sourceText = String(sourceDict[key] || '');
										const targetText = String(targetDict[key] || '');
										return (
											<div
												key={key}
												className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
												style={{
													padding: 'var(--ui-gap)',
													gap: 'calc(var(--ui-gap) * 0.5)',
												}}
											>
												<div className="flex items-center justify-between">
													<span className="text-xs font-mono text-(--accent)">{key}</span>
													{isMissing && (
														<span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border text-amber-500 bg-amber-500/10 border-amber-500/20">
															{t('admin.translations.review.missingKey')}
														</span>
													)}
												</div>
												<p className="text-sm font-medium text-(--text) bg-(--background)/50 backdrop-blur-md p-3.5 rounded-2xl border border-(--border)/10">{sourceText}</p>
												<input
													type="text"
													value={targetText}
													onChange={(e) => handleInputChange(key, e.target.value)}
													placeholder={t('admin.translations.review.translateInto', {
														locale: selectedLocale,
													})}
													className="w-full rounded-2xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md px-4 py-2.5 text-sm text-(--text) outline-none transition focus:border-(--accent) focus:ring-2 focus:ring-(--accent)"
												/>
											</div>
										);
									})
								)}
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
}
