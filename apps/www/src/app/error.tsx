/** @format */
'use client';

import { Error } from '@xernerx/feedback';

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	return <Error error={error} reset={reset} />;
}
