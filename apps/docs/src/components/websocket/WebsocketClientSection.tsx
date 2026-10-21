/** @format */
'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Radio, Terminal } from 'lucide-react';
import Link from 'next/link';
import { CodeBlock } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

export function WebsocketClientSection() {
	const { t } = useDictionary();

	return (
		<motion.section
			id="client"
			initial={{ opacity: 1, y: 0 }}
			animate={{ opacity: 1, y: 0 }}
			className="rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden scroll-mt-28 relative"
			style={{ padding: 'var(--ui-gap)' }}
		>
			{/* Anchor alias for #example if navigated to */}
			<div id="example" className="absolute -top-24 pointer-events-none" />

			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-(--border)/10">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
						<Terminal size={20} />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<h2 className="text-xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('docs.websocket.client.title')}
							</h2>
							<span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-(--accent)/15 text-(--accent) border border-(--accent)/30">@xernerx/websocket</span>
						</div>
						<p className="text-xs text-(--text-muted) mt-0.5">
							{t('docs.websocket.client.p1Prefix')} <code className="text-(--accent) font-mono font-semibold">@xernerx/websocket</code> {t('docs.websocket.client.p1Suffix')}
						</p>
					</div>
				</div>

				<Link
					href="/packages"
					className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold bg-(--accent)/15 hover:bg-(--accent) text-(--accent) hover:text-white border border-(--accent)/30 transition-colors shrink-0 self-start sm:self-auto"
				>
					<span>{t('docs.home.categories.npm.title')}</span>
					<ArrowRight size={13} />
				</Link>
			</div>

			<div className="space-y-6">
				<p className="text-xs sm:text-sm text-(--text-muted) leading-relaxed" dangerouslySetInnerHTML={{ __html: t('docs.websocket.client.p2') }} />

				<div className="p-4 rounded-2xl bg-(--background)/50 border border-(--border)/10 space-y-3">
					<h3 className="text-sm font-bold text-(--text)">{t('docs.websocket.client.step1Title')}</h3>
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

				<div className="p-4 rounded-2xl bg-(--background)/50 border border-(--border)/10 space-y-3">
					<div>
						<h3 className="text-sm font-bold text-(--text)">{t('docs.websocket.client.step2Title')}</h3>
						<p className="text-xs text-(--text-muted) mt-0.5">{t('docs.websocket.client.step2Desc')}</p>
					</div>
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
