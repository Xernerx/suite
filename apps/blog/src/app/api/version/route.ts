/** @format */

import { NextResponse } from 'next/server';
import packageJson from '../../../../package.json';

export async function GET() {
	return NextResponse.json(
		{ version: packageJson.version },
		{
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, OPTIONS',
				'Cache-Control': 'no-store, max-age=0',
			},
		}
	);
}
