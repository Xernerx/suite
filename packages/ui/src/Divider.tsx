/** @format */
'use client';

export function Divider() {
	return (
		<div
			className="relative h-[1px] w-full before:absolute before:inset-x-0 before:bottom-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-(--accent) before:to-transparent"
			style={{ marginBottom: 'var(--ui-gap)' }}
		/>
	);
}
