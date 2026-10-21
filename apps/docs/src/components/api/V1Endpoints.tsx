/** @format */
'use client';

import { V1ProfileEndpoints } from './V1ProfileEndpoints';
import { V1StatsEndpoints } from './V1StatsEndpoints';
import { V1CommandsEndpoints } from './V1CommandsEndpoints';
import { V1PlatformEndpoints } from './V1PlatformEndpoints';

export interface V1EndpointsProps {
	activeGroup?: string;
	searchQuery?: string;
	methodFilter?: string;
	defaultExpanded?: boolean;
	onTryRoute?: (method: string, path: string) => void;
}

export function V1Endpoints({ activeGroup = 'all', searchQuery = '', methodFilter = 'ALL', defaultExpanded = true, onTryRoute }: V1EndpointsProps) {
	return (
		<>
			<V1ProfileEndpoints activeGroup={activeGroup} searchQuery={searchQuery} methodFilter={methodFilter} defaultExpanded={defaultExpanded} onTryRoute={onTryRoute} />
			<V1StatsEndpoints activeGroup={activeGroup} searchQuery={searchQuery} methodFilter={methodFilter} defaultExpanded={defaultExpanded} onTryRoute={onTryRoute} />
			<V1CommandsEndpoints activeGroup={activeGroup} searchQuery={searchQuery} methodFilter={methodFilter} defaultExpanded={defaultExpanded} onTryRoute={onTryRoute} />
			<V1PlatformEndpoints activeGroup={activeGroup} searchQuery={searchQuery} methodFilter={methodFilter} defaultExpanded={defaultExpanded} onTryRoute={onTryRoute} />
		</>
	);
}
