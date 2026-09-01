/** @format */

import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { sendMail, BasicTemplate } from '@xernerx/lib/server';

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { to, subject, templateId, data } = body;

		if (!to || !subject || !templateId) {
			return NextResponse.json({ error: 'Missing required fields (to, subject, templateId)' }, { status: 400 });
		}

		let template: React.ReactElement;

		switch (templateId) {
			case 'basic':
				template = React.createElement(BasicTemplate, data);
				break;
			default:
				return NextResponse.json({ error: `Unknown templateId: ${templateId}` }, { status: 400 });
		}

		await sendMail({ to, subject, template });

		return NextResponse.json({ success: true });
	} catch (error: any) {
		console.error('Email dispatch error:', error);
		return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
	}
}
