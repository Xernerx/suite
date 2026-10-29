/** @format */

import React from 'react';
import { HasteDocumentViewer } from '@/components/HasteDocumentViewer';

export default async function HasteDocumentPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	return <HasteDocumentViewer id={id} />;
}
