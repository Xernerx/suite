/** @format */

import { use } from 'react';
import ServerApplicationsIndex from '@/components/servers/applications/ServerApplicationsIndex';

export default function ServerApplicationsPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = use(params);
	return <ServerApplicationsIndex guildId={id} />;
}
