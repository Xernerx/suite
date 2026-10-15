/** @format */
'use client';

import { useDictionary } from '@xernerx/providers';

export default function Connections() {
	const { t } = useDictionary();
	return <>{t('account.connections.title')}</>;
}
