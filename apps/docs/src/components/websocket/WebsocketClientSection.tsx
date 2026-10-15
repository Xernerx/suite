/** @format */
'use client';

import { motion } from 'framer-motion';
import { Radio, Terminal } from 'lucide-react';
import { CodeBlock } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

export function WebsocketClientSection() {
	const { t } = useDictionary();

	return (
		<motion.section id="client" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6 scroll-mt-24 relative">
			{/* Anchor alias for #example if navigated to */}
			<div id="example" className="absolute -top-24 pointer-events-none" />

			<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
				<Terminal className="text-(--accent)" size={24} /> {t('docs.websocket.client.title')}
			</h2>
			<div className="prose prose-invert max-w-none text-(--text-muted) space-y-3">
				<p>
					{t('docs.websocket.client.p1Prefix')} <code className="bg-(--accent)/20 text-(--accent) px-1.5 py-0.5 rounded font-mono font-semibold">@xernerx/websocket</code>{' '}
					{t('docs.websocket.client.p1Suffix')}
				</p>
				<p dangerouslySetInnerHTML={{ __html: t('docs.websocket.client.p2') }} />
			</div>

			<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl p-6 space-y-6">
				<div>
					<h3 className="text-sm font-semibold text-(--text) mb-2">{t('docs.websocket.client.step1Title')}</h3>
					<div className="rounded-xl overflow-hidden border border-(--border)/10 text-sm">
						<CodeBlock
							tabs={[
								{
									label: 'pnpm',
									language: 'bash',
									code: 'pnpm add @xernerx/websocket',
								},
								{
									label: 'npm',
									language: 'bash',
									code: 'npm install @xernerx/websocket',
								},
							]}
						/>
					</div>
				</div>

				<div>
					<h3 className="text-sm font-semibold text-(--text) mb-2">{t('docs.websocket.client.step2Title')}</h3>
					<p className="text-xs text-(--text-muted) mb-3">{t('docs.websocket.client.step2Desc')}</p>
					<div className="rounded-xl overflow-hidden border border-(--border)/10 text-sm">
						<CodeBlock
							tabs={[
								{
									label: 'XernerxWebsocket',
									language: 'typescript',
									code: `import { XernerxWebsocket } from '@xernerx/websocket';\n\n// 1. Initialize client with your token (needs websocket allowance)\nconst client = new XernerxWebsocket({\n  token: process.env.XERNERX_TOKEN!,\n  dev: true, // connects to wss://ws.dev.xernerx.com (omit for production)\n});\n\n// 2. Automatically establish connection and authenticate\nawait client.connect();\n\n// 3. Functionified RPC calls\n// Query guild leveling rules (Virtue DB)\nconst guild = await client.get('virtue', 'guilds', {\n  id: '102938475612345678',\n});\nconsole.log('Guild settings:', guild);\n\n// Update guild leveling configuration (Virtue DB)\nawait client.update('virtue', 'guilds', {\n  id: '102938475612345678',\n  mode: 'extreme',\n  levelUp: true,\n});\n\n// Record text chat activity (Virtue DB)\nawait client.update('virtue', 'text', {\n  id: 'user_123456789',\n  guild: '102938475612345678',\n  xp: 150,\n  messages: 42,\n});\n\n// Record voice chat activity (Virtue DB)\nawait client.update('virtue', 'voice', {\n  id: 'user_123456789',\n  guild: '102938475612345678',\n  xp: 320,\n  timeSpent: 1800,\n});\n\n// Query combined global platform level (Xernerx DB)\nconst globalLevel = await client.get('virtue', 'globalLevel', {\n  id: 'user_123456789',\n});\nconsole.log('Global level:', globalLevel);\n\n// 4. Gracefully close connection\nclient.disconnect();`,
								},
								{
									label: 'Raw WebSocket (Manual)',
									language: 'typescript',
									icon: Radio,
									code: `import { WebSocket } from 'ws';\nimport crypto from 'crypto';\n\n// For non-Node environments or custom client implementations:\nconst ws = new WebSocket('wss://ws.xernerx.com');\n\nws.on('open', () => {\n  // Must authenticate immediately\n  ws.send(JSON.stringify({\n    id: crypto.randomUUID(),\n    service: 'auth',\n    body: { token: process.env.XERNERX_TOKEN }\n  }));\n});\n\nws.on('message', (raw) => {\n  const res = JSON.parse(raw.toString());\n  console.log('Response:', res);\n});`,
								},
							]}
						/>
					</div>
				</div>
			</div>
		</motion.section>
	);
}
