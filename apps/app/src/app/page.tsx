/** @format */
'use client';

import { useEffect } from 'react';
import { useSidebar } from '@xernerx/providers';

export default function Home() {
	const { show } = useSidebar();

	useEffect(() => {
		show();
	}, []);

	return (
		<div className="">
			<a href="/portal">e</a>
		</div>
	);
}
