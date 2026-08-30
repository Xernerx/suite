/** @format */
'use client';

import { useDictionary } from '@xernerx/providers';
export default function Home() {
	const { t } = useDictionary();
	return <div className="">{t('cdn.common.description')}</div>;
}
