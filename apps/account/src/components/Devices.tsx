/** @format */
'use client';

import { useDictionary } from '@xernerx/providers';

export default function Devices() {
	const { t } = useDictionary();
	return <>{t('account.devices.title')}</>;
}
