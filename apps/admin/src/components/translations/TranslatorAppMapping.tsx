/** @format */
'use client';

import React from 'react';
import { Loader2, Send } from 'lucide-react';
import { Button, Selector } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

interface TranslatorAppMappingProps {
	translatorAppConfig: string;
	setTranslatorAppConfig: (val: string) => void;
	appConfigs: any[];
	saveTranslatorConfig: () => void;
	savingConfig: boolean;
}

export function TranslatorAppMapping({ translatorAppConfig, setTranslatorAppConfig, appConfigs, saveTranslatorConfig, savingConfig }: TranslatorAppMappingProps) {
	const { t } = useDictionary();

	return (
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
								label: t('admin.dashboard.translations.defaultTranslator'),
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
	);
}
