/** @format */
'use client';

import { V1ProfileEndpoints } from './V1ProfileEndpoints';
import { V1StatsEndpoints } from './V1StatsEndpoints';
import { V1CommandsEndpoints } from './V1CommandsEndpoints';

export function V1Endpoints() {
	return (
		<>
			<V1ProfileEndpoints />
			<V1StatsEndpoints />
			<V1CommandsEndpoints />
		</>
	);
}
