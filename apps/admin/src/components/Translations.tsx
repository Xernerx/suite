/** @format */
'use client';

import { Download, Languages, Loader2, Lock, Send } from 'lucide-react';
import { Button, PreventLossConfirmation, Selector } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast, useUser } from '@xernerx/providers';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CircleFlag } from 'react-circle-flags';
import { Loading } from '@xernerx/feedback';
import { flattenObject, getFlagCode, unflattenObject } from './translations/utils';
import { TranslatorAppMapping } from './translations/TranslatorAppMapping';
import { TranslationWelcomeTab } from './translations/TranslationWelcomeTab';
import { TranslationNewTab } from './translations/TranslationNewTab';
import { TranslationReviewTab } from './translations/TranslationReviewTab';
import { TranslationSubmissionBanner, type TranslationSubmissionStatus } from './translations/TranslationSubmissionBanner';
import { TranslationTabs } from './translations/TranslationTabs';

export default function Translations({ initialLocale = '' }: { initialLocale?: string }) {
	const { getEnvUrl } = useEnvironment();
	const { toast, remind } = useToast();
	const { user } = useUser();
	const { locales: localesData, t } = useDictionary() as any;

	const localesList: Array<{
		code: string;
		label: string;
		coverage: number;
	}> = Array.isArray(localesData) ? localesData : localesData && typeof localesData === 'object' ? Object.values(localesData) : [];

	const targetLocales = localesList.filter((l) => l && typeof l === 'object' && l.code && l.code !== 'en-GB');

	const [selectedLocale, setSelectedLocale] = useState<string>(() => {
		if (initialLocale && targetLocales.some((l) => l.code === initialLocale)) {
			return initialLocale;
		}
		const pref = user?.preferences?.locale;
		if (pref && targetLocales.some((l) => l.code === pref)) {
			return pref;
		}
		return targetLocales.length > 0 ? targetLocales[0].code : '';
	});

	useEffect(() => {
		if (initialLocale && targetLocales.some((l) => l.code === initialLocale)) {
			setSelectedLocale(initialLocale);
		}
	}, [initialLocale]);

	const [sourceDict, setSourceDict] = useState<Record<string, string>>({});
	const [targetDict, setTargetDict] = useState<Record<string, string>>({});
	const [initialTargetDict, setInitialTargetDict] = useState<Record<string, string>>({});
	const [missingKeys, setMissingKeys] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [activeTab, setActiveTab] = useState<'welcome' | 'new' | 'review'>('welcome');
	const [newIndex, setNewIndex] = useState(0);
	const [reviewSearch, setReviewSearch] = useState('');

	// Submission version tracking & Canary build lock state
	const [submissionStatus, setSubmissionStatus] = useState<TranslationSubmissionStatus | null>(null);
	const [refreshingStatus, setRefreshingStatus] = useState(false);

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
				if (appsRes.ok) {
					const appsData = await appsRes.json();
					setAppConfigs(Array.isArray(appsData) ? appsData : []);
				}
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

	const refreshSubmissionStatus = useCallback(
		async (silent = false) => {
			if (!selectedLocale) return;
			if (!silent) setRefreshingStatus(true);
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/dictionary/${selectedLocale}`), {
					credentials: 'include',
					cache: 'no-store',
				});
				if (res.ok) {
					const data = await res.json();
					setSubmissionStatus(data.submissionStatus || null);
				}
			} catch {
				// Ignore transient network errors during background poll
			} finally {
				if (!silent) setRefreshingStatus(false);
			}
		},
		[selectedLocale, getEnvUrl]
	);

	useEffect(() => {
		if (!selectedLocale) return;
		async function fetchDictionaries() {
			setLoading(true);
			try {
				const [sourceRes, targetRes] = await Promise.all([
					fetch(getEnvUrl(`https://api.xernerx.com/secure/dictionary/en-GB`), {
						credentials: 'include',
						cache: 'no-store',
					}),
					fetch(getEnvUrl(`https://api.xernerx.com/secure/dictionary/${selectedLocale}`), {
						credentials: 'include',
						cache: 'no-store',
					}),
				]);
				if (!sourceRes.ok || !targetRes.ok) {
					throw new Error(t('admin.translations.errors.fetchFailed'));
				}
				const sourceData = await sourceRes.json();
				const targetData = await targetRes.json();

				const sourceJson = sourceData.dictionary || sourceData;
				const targetJson = targetData.dictionary || targetData;

				setSubmissionStatus(targetData.submissionStatus || null);

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

	useEffect(() => {
		if (!submissionStatus?.isLocked || !selectedLocale) return;
		const timer = setInterval(() => {
			refreshSubmissionStatus(true);
		}, 20000);
		return () => clearInterval(timer);
	}, [submissionStatus?.isLocked, selectedLocale, refreshSubmissionStatus]);

	const handleInputChange = (key: string, value: string) => {
		setTargetDict((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	const isLocked = Boolean(submissionStatus?.isLocked);

	const handleSave = useCallback(async () => {
		if (isLocked) {
			toast({
				title: t('admin.translations.submissionLock.lockedTitle'),
				description: t('admin.translations.submissionLock.phaseWaitingVersion', {
					canaryVersion: submissionStatus?.canaryVersionAtSubmit || '',
				}),
				type: 'error',
			});
			return;
		}
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
				body: JSON.stringify({
					dictionary: reconstructed,
				}),
			});
			const resData = await res.json().catch(() => ({}));
			if (resData?.submissionStatus) {
				setSubmissionStatus(resData.submissionStatus);
			}
			if (!res.ok) {
				throw new Error(resData.error || t('admin.translations.errors.pushFailed'));
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
	}, [isLocked, isDirty, targetDict, selectedLocale, getEnvUrl, toast, t, submissionStatus?.canaryVersionAtSubmit]);

	const handleReset = useCallback(() => {
		setTargetDict(initialTargetDict);
	}, [initialTargetDict]);

	useEffect(() => {
		if (isDirty) {
			remind(true, handleSave, handleReset, saving || isLocked);
		} else {
			remind(false);
		}
		return () => remind(false);
	}, [isDirty, handleSave, handleReset, saving, isLocked, remind]);

	const handleExportJson = () => {
		if (!selectedLocale) return;
		const reconstructed = unflattenObject(targetDict);
		const blob = new Blob([JSON.stringify(reconstructed, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${selectedLocale}.json`;
		a.click();
		URL.revokeObjectURL(url);
		toast({ type: 'success', title: t('admin.translations.exportSuccess') });
	};

	const liveSelectedCoverage = useMemo(() => {
		const sourceKeys = Object.keys(sourceDict);
		if (sourceKeys.length === 0) return null;
		const translatedCount = sourceKeys.filter((k) => Boolean(targetDict[k] && targetDict[k].trim() !== '')).length;
		return Math.round((translatedCount / sourceKeys.length) * 100);
	}, [sourceDict, targetDict]);

	const currentLocaleObj = targetLocales.find((l) => l.code === selectedLocale);
	const languageOptions = targetLocales.map((lang) => {
		const countryCode = getFlagCode(lang.code);
		const coverageVal = lang.code === selectedLocale && liveSelectedCoverage !== null ? liveSelectedCoverage : lang.coverage;
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
						coverageVal === 100 ? 'bg-(--accent-green)/10 text-(--accent-green)' : 'bg-(--accent-orange)/10 text-(--accent-orange)'
					}`}
				>
					{coverageVal}%
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

				<div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
					<div className="w-full sm:w-64">
						<Selector value={selectedLocale} options={languageOptions} onChange={(val) => setSelectedLocale(val)} />
					</div>

					<Button variant="secondary" onClick={handleExportJson} disabled={!selectedLocale || loading} className="gap-2 rounded-2xl px-4 py-2.5 shrink-0">
						<Download size={16} />
						{t('admin.translations.exportJson')}
					</Button>

					<Button onClick={handleSave} disabled={saving || !isDirty || isLocked} className="gap-2 rounded-2xl px-5 py-2.5 shrink-0">
						{saving ? <Loader2 size={16} className="animate-spin" /> : isLocked ? <Lock size={16} /> : <Send size={16} />}
						{isLocked ? t('admin.translations.submissionLock.buttonLocked') : t('admin.translations.pushToReview')}
					</Button>
				</div>
			</div>

			<TranslationSubmissionBanner submissionStatus={submissionStatus} refreshingStatus={refreshingStatus} onRefresh={() => refreshSubmissionStatus(false)} />

			<TranslationTabs activeTab={activeTab} setActiveTab={setActiveTab} missingKeysCount={missingKeys.length} />

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
