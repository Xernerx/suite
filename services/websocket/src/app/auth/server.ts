/** @format */

export default async function Server(msg: any, ws: any) {
	if (msg.method === 'create') {
		if (msg.body.token === process.env.WS_TOKEN) {
			ws.authed = true;
			return { success: true };
		}

		throw new Error('invalid token');
	}

	throw new Error('unsupported method');
}
