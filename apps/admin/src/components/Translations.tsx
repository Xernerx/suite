/** @format */
'use client';

import { BookOpen, Languages, ListOrdered, Loader2, Send, Sparkles } from 'lucide-react';
import { Button, PreventLossConfirmation, Selector } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast, useUser } from '@xernerx/providers';
import { useEffect, useMemo, useState } from 'react';
import { CircleFlag } from 'react-circle-flags';
import { Loading } from '@xernerx/feedback';
import { flattenObject, getFlagCode, unflattenObject } from './translations/utils';
import { TranslatorAppMapping } from './translations/TranslatorAppMapping';
import { TranslationWelcomeTab } from './translations/TranslationWelcomeTab';
import { TranslationNewTab } from './translations/TranslationNewTab';
import { TranslationReviewTab } from './translations/TranslationReviewTab';

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
				title: t('admin.translations.mapping.successToast'),
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
				const sourceData = await sourceRes.json();
				const targetData = await targetRes.json();

				const sourceJson = sourceData.dictionary || sourceData;
				const targetJson = targetData.dictionary || targetData;

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
				<TranslatorAppMapping
					translatorAppConfig={translatorAppConfig}
					setTranslatorAppConfig={setTranslatorAppConfig}
					appConfigs={appConfigs}
					saveTranslatorConfig={saveTranslatorConfig}
					savingConfig={savingConfig}
				/>
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
						<TranslationWelcomeTab selectedLocale={selectedLocale} currentLocaleObj={currentLocaleObj} missingKeysCount={missingKeys.length} onSelectTab={setActiveTab} />
					)}

					{activeTab === 'new' && (
						<TranslationNewTab
							missingKeys={missingKeys}
							newIndex={newIndex}
							setNewIndex={setNewIndex}
							sourceDict={sourceDict}
							targetDict={targetDict}
							onInputChange={handleInputChange}
							selectedLocale={selectedLocale}
							currentLocaleObj={currentLocaleObj}
							onSwitchToReview={() => setActiveTab('review')}
						/>
					)}

					{activeTab === 'review' && (
						<TranslationReviewTab
							reviewSearch={reviewSearch}
							setReviewSearch={setReviewSearch}
							filteredReviewKeys={filteredReviewKeys}
							sourceDict={sourceDict}
							targetDict={targetDict}
							onInputChange={handleInputChange}
							selectedLocale={selectedLocale}
						/>
					)}
				</>
			)}
		</div>
	);
}
