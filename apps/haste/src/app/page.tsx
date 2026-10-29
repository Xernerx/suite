/** @format */

import React, { Suspense } from 'react';
import { HasteStudioClient } from '@/components/HasteStudioClient';

export default function HasteHomePage() {
	return (
		<Suspense fallback={null}>
			<HasteStudioClient />
		</Suspense>
	);
}
