/** @format */

import { verifyWebsocketToken } from '../../lib/auth';

export default async function Server(msg: any, ws: any) {
	if (msg.method === 'create') {
		const res = await verifyWebsocketToken(msg.body?.token);

		if (res.valid) {
			ws.authed = true;
			ws.tokenId = res.tokenId;
			ws.userId = res.userId;
			ws.tokenDoc = res.tokenDoc;
			return { success: true };
		}

		throw new Error(res.message || 'invalid token');
	}

	throw new Error('unsupported method');
}
