/** @format */
'use client';

import { Error } from '@xernerx/feedback';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	return (
		<html lang="en">
			<body>
				<Error error={error} reset={reset} />
			</body>
		</html>
	);
}
