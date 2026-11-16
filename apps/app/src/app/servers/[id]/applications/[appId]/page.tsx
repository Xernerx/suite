/** @format */

import { use } from 'react';
import ServerApplicationForm from '@/components/servers/applications/ServerApplicationForm';

export default function ServerApplicationPositionPage({ params }: { params: Promise<{ id: string; appId: string }> }) {
	const { id, appId } = use(params);
	return <ServerApplicationForm guildId={id} appId={appId} />;
}
