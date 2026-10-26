/** @format */

import { verifyWebsocketToken } from '../../lib/auth';

export default async function Server(msg: any, ws: any) {
	if (msg.method === 'create') {
		const res = await verifyWebsocketToken(msg.body?.token);

		if (res.valid && res.tokenId) {
			ws.authed = true;
			ws.authError = undefined;
			ws.tokenId = res.tokenId;
			ws.userId = res.userId;
			ws.tokenDoc = res.tokenDoc;
			return { success: true };
		}

		ws.authed = false;
		ws.tokenId = undefined;
		ws.userId = undefined;
		ws.tokenDoc = undefined;
		throw new Error(res.message || 'Forbidden: Token does not have websocket permission');
	}

	throw new Error('unsupported method');
}
