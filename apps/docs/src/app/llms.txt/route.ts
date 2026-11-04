/** @format */

import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET() {
	const body = `# Xernerx Developer Documentation (docs.xernerx.com/llms.txt)

> Official technical documentation for the Xernerx Suite v1 REST API, WebSocket RPC Gateway, Media CDN, and open-source TypeScript NPM packages.

## REST API & Gateway Specifications

- [Interactive v1 REST API Reference](https://docs.xernerx.com/api/v1): Bearer token authentication (\`xrx_...\`), bot telemetry (\`POST /v1/bots/[id]/stats\`), command syncing (\`PUT /v1/bots/[id]/commands\`), release notes (\`POST /v1/bots/[id]/releases\`), votes, reviews, leaderboards, and SVG badges.
- [WebSocket RPC Gateway Reference](https://docs.xernerx.com/websocket): Real-time bidirectional event router and microservice RPC specification.
- [Media CDN & Blob Streaming Docs](https://docs.xernerx.com/cdn): Upload, 3-tier privacy enforcement (\`public\`, \`limited\`, \`private\`), \`/view/[id]\`, and \`/raw/[id]\` binary streaming.

## Open-Source TypeScript Packages

- [xernerx](https://docs.xernerx.com/packages/xernerx): All-in-one SDK, CLI (\`create-xernerx-app\`), and framework bundle.
- [@xernerx/framework](https://docs.xernerx.com/packages/@xernerx/framework): Modular Discord.js v14 application framework.
- [@xernerx/stats](https://docs.xernerx.com/packages/@xernerx/stats): Automated Discord bot statistics collector and v1 API telemetry publisher.
- [@xernerx/commands](https://docs.xernerx.com/packages/@xernerx/commands): Developer debug suite and slash command synchronization extension.
- [@xernerx/hooks](https://docs.xernerx.com/packages/@xernerx/hooks): HMAC-SHA256 webhook receiver and voter/reviewer cache.
- [@xernerx/websocket](https://docs.xernerx.com/packages/@xernerx/websocket): Universal WebSocket RPC client.
- [@xernerx/terminal](https://docs.xernerx.com/packages/@xernerx/terminal): Structured ANSI terminal logger and CLI spinners.
- [@xernerx/extension-builder](https://docs.xernerx.com/packages/@xernerx/extension-builder): Extension lifecycle architecture for \`@xernerx/framework\`.
`;

	return new NextResponse(body, {
		status: 200,
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=3600, s-maxage=3600',
		},
	});
}
