/** @format */
'use client';

import { AsyncUserMultiSelector as SharedAsyncUserMultiSelector, type AsyncUserMultiSelectorProps } from '@xernerx/components';

export function AsyncUserMultiSelector(props: AsyncUserMultiSelectorProps) {
	return <SharedAsyncUserMultiSelector preloadUsers={true} {...props} />;
}

export default AsyncUserMultiSelector;
