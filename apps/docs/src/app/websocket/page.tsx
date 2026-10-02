/** @format */
'use client';

import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, CheckCircle2, Code, Database, Globe, Key, Layers, Radio, Server, Terminal, Zap } from 'lucide-react';
import { useEffect } from 'react';
import { useSidebar } from '@xernerx/providers';
import { CodeBlock } from '@xernerx/ui';

export default function WebsocketDocs() {
	const { setNavItems, show, clearNavItems } = useSidebar();

	useEffect(() => {
		show();
		setNavItems([
			{ label: 'Back to Categories', href: '/', icon: ArrowLeft, category: 'Navigation' },
			{ label: 'Overview', href: '#overview', icon: Globe, category: 'WebSocket' },
			{ label: 'Connecting', href: '#connecting', icon: Zap, category: 'WebSocket' },
			{ label: 'Authentication', href: '#authentication', icon: Key, category: 'WebSocket' },
			{ label: 'RPC Protocol', href: '#protocol', icon: Code, category: 'WebSocket' },
			{ label: 'Services & Actions', href: '#services', icon: Database, category: 'WebSocket' },
			{ label: 'Client Example', href: '#example', icon: Terminal, category: 'WebSocket' },
		]);

		return () => clearNavItems();
	}, [setNavItems, show, clearNavItems]);

	return (
		<div className="max-w-7xl mx-auto py-12 px-6 lg:px-8 w-full selection:bg-(--accent) selection:text-white">
			{/* HERO HEADER */}
			<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
				<h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-(--text) mb-4" style={{ fontFamily: 'var(--font-fredoka)' }}>
					WebSocket Gateway
				</h1>
				<p className="text-lg text-(--text-muted) leading-relaxed mb-6">
					High-performance RPC-over-WebSocket daemon mediating real-time database operations and cross-service coordination for Xernerx bots and applications.
				</p>

				<div className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-orange-400 text-sm mb-12 shadow-sm">
					<AlertCircle className="shrink-0 mt-0.5" size={18} />
					<div>
						<strong className="block mb-1 text-orange-400">WebSocket Allowance Required</strong>
						<p>
							All WebSocket connections start in an unauthenticated state and must immediately authenticate with a valid token. In addition, the token needs websocket allowance. Tokens
							without this allowance will be rejected with a <code className="bg-orange-500/20 px-1.5 py-0.5 rounded text-xs font-mono">Forbidden: Token needs websocket allowance</code>{' '}
							error.
						</p>
					</div>
				</div>
			</motion.div>

			<div className="space-y-16">
				{/* 1. OVERVIEW */}
				<motion.section id="overview" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6 scroll-mt-24">
					<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
						<Globe className="text-(--accent)" size={24} /> Overview & Architecture
					</h2>
					<div className="prose prose-invert max-w-none text-(--text-muted) space-y-4">
						<p>
							The Xernerx <strong>WebSocket Gateway</strong> operates as a private, authenticated RPC microservice daemon. Rather than exposing direct database ports or requiring
							external bot runtimes and dashboard instances to maintain direct MongoDB connection pools, client processes establish a persistent socket connection to execute structured
							queries and mutations.
						</p>
						<p>
							The gateway uses a <strong>correlated Request-Response RPC pattern</strong> over JSON payloads. Every client message provides an arbitrary request identifier (
							<code>id</code>), which the gateway mirrors in its response payload to allow multiplexed asynchronous communication over a single connection.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl p-6">
							<div className="flex items-center gap-3 mb-2 text-(--text) font-semibold">
								<Radio className="text-(--accent)" size={20} />
								<span>Persistent TCP Socket</span>
							</div>
							<p className="text-sm text-(--text-muted)">Avoids connection establishment overhead and retains persistent channel telemetry with IP logging.</p>
						</div>

						<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl p-6">
							<div className="flex items-center gap-3 mb-2 text-(--text) font-semibold">
								<Key className="text-orange-400" size={20} />
								<span>Token & JWT Auth</span>
							</div>
							<p className="text-sm text-(--text-muted)">
								Secured via signed JWT tokens or shared system secrets evaluated with the <code>jose</code> library.
							</p>
						</div>

						<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl p-6">
							<div className="flex items-center gap-3 mb-2 text-(--text) font-semibold">
								<Database className="text-emerald-400" size={20} />
								<span>Isolated Database Proxy</span>
							</div>
							<p className="text-sm text-(--text-muted)">Mediates CRUD access to Mongoose models (Guilds, Users, Members) without leaking database credentials.</p>
						</div>
					</div>
				</motion.section>

				{/* 2. CONNECTING */}
				<motion.section id="connecting" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6 scroll-mt-24">
					<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
						<Zap className="text-(--accent)" size={24} /> Connecting & Endpoints
					</h2>
					<p className="text-(--text-muted)">
						Clients connect to the gateway using any standard WebSocket implementation (e.g., native browser <code>WebSocket</code>, Node.js <code>ws</code>).
					</p>

					<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl p-6">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
							<div>
								<h3 className="font-semibold text-(--text) mb-1">Production Gateway</h3>
								<code className="text-sm text-(--accent) bg-(--accent)/10 px-2 py-1 rounded font-mono">wss://ws.xernerx.com</code>
							</div>
							<div>
								<h3 className="font-semibold text-(--text) mb-1">Development Gateway</h3>
								<code className="text-sm text-blue-400 bg-blue-500/10 px-2 py-1 rounded font-mono">wss://ws.dev.xernerx.com</code>
							</div>
							<div>
								<h3 className="font-semibold text-(--text) mb-1">Local Runtime</h3>
								<code className="text-sm text-(--text-muted) bg-(--foreground)/40 px-2 py-1 rounded font-mono">ws://localhost:5000</code>
							</div>
						</div>

						<div className="border-t border-(--border)/10 pt-6">
							<h3 className="font-semibold text-(--text) mb-2 flex items-center gap-2">
								<Server size={18} className="text-(--accent)" /> HTTP Health Checks
							</h3>
							<p className="text-sm text-(--text-muted) mb-4">The WebSocket daemon also runs an embedded HTTP server on the same port for uptime monitoring and health checks:</p>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-mono">
								<div className="p-3 bg-(--background)/50 border border-(--border)/10 rounded-xl">
									<div className="text-(--text-muted) text-xs mb-1">GET /health</div>
									<span className="text-green-400 font-semibold">200 OK &rarr; &quot;ok&quot;</span>
								</div>
								<div className="p-3 bg-(--background)/50 border border-(--border)/10 rounded-xl">
									<div className="text-(--text-muted) text-xs mb-1">GET /</div>
									<span className="text-green-400 font-semibold">200 OK &rarr; &quot;alive&quot;</span>
								</div>
							</div>
						</div>
					</div>
				</motion.section>

				{/* 3. AUTHENTICATION */}
				<motion.section id="authentication" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6 scroll-mt-24">
					<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
						<Key className="text-(--accent)" size={24} /> Authentication Handshake
					</h2>
					<p className="text-(--text-muted)">
						Immediately after establishing the connection, the client must authenticate. The server inspects the <code>auth</code> service message, validates the token against{' '}
						<code>WS_TOKEN</code>, and marks the socket session as authenticated.
					</p>

					<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl overflow-hidden">
						<div className="p-6 space-y-6">
							<div>
								<h3 className="text-lg font-semibold text-(--text) mb-2">Auth Request Payload</h3>
								<p className="text-sm text-(--text-muted) mb-4">
									Pass your token in the <code>body.token</code> field. The token is checked against the database <code>Token</code> schema. To use the WebSocket, the token must be
									in an active state and have websocket allowance enabled.
								</p>
								<div className="rounded-xl overflow-hidden border border-(--border)/10 text-sm mb-6">
									<CodeBlock
										tabs={[
											{
												label: 'Request',
												language: 'json',
												code: `{\n  "id": "auth-req-1",\n  "service": "auth",\n  "body": {\n    "token": "YOUR_CLIENT_TOKEN"\n  }\n}`,
											},
										]}
									/>
								</div>
							</div>

							<div>
								<h3 className="text-lg font-semibold text-(--text) mb-2">Auth Response Payloads</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-1.5">
											<CheckCircle2 size={16} /> Success Response
										</h4>
										<div className="rounded-xl overflow-hidden border border-(--border)/10 text-sm">
											<CodeBlock
												tabs={[
													{
														label: 'Success JSON',
														language: 'json',
														code: `{\n  "id": "auth-req-1",\n  "success": true\n}`,
													},
												]}
											/>
										</div>
									</div>

									<div>
										<h4 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-1.5">
											<AlertCircle size={16} /> Failure Response
										</h4>
										<div className="rounded-xl overflow-hidden border border-(--border)/10 text-sm">
											<CodeBlock
												tabs={[
													{
														label: 'Failure JSON',
														language: 'json',
														code: `{\n  "id": "auth-req-1",\n  "message": "Invalid token"\n}`,
													},
												]}
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</motion.section>

				{/* 4. RPC PROTOCOL */}
				<motion.section id="protocol" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6 scroll-mt-24">
					<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
						<Code className="text-(--accent)" size={24} /> RPC Protocol Specification
					</h2>
					<p className="text-(--text-muted)">All operational commands sent to the gateway must adhere to the standard RPC message schema.</p>

					<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl overflow-hidden p-6 space-y-6">
						<h3 className="text-lg font-semibold text-(--text)">Message Schema</h3>
						<div className="overflow-x-auto">
							<table className="w-full text-left text-sm border-collapse">
								<thead>
									<tr className="border-b border-(--border)/10 text-(--text-muted)">
										<th className="pb-2 font-medium">Field</th>
										<th className="pb-2 font-medium">Type</th>
										<th className="pb-2 font-medium">Required</th>
										<th className="pb-2 font-medium">Description</th>
									</tr>
								</thead>
								<tbody className="text-(--text)">
									<tr className="border-b border-(--border)/5">
										<td className="py-3 font-mono text-(--accent)">id</td>
										<td className="py-3 font-mono">String</td>
										<td className="py-3 text-red-400">Yes</td>
										<td className="py-3">Arbitrary correlation ID. Mirrored directly in the response.</td>
									</tr>
									<tr className="border-b border-(--border)/5">
										<td className="py-3 font-mono text-(--accent)">service</td>
										<td className="py-3 font-mono">String</td>
										<td className="py-3 text-red-400">Yes</td>
										<td className="py-3">
											Target service module (e.g. <code>virtue</code>, <code>auth</code>).
										</td>
									</tr>
									<tr className="border-b border-(--border)/5">
										<td className="py-3 font-mono text-(--accent)">method</td>
										<td className="py-3 font-mono">String</td>
										<td className="py-3 text-red-400">Yes</td>
										<td className="py-3">
											Action verb: <code>GET</code>, <code>POST</code>, <code>PATCH</code>, or <code>DELETE</code>.
										</td>
									</tr>
									<tr className="border-b border-(--border)/5">
										<td className="py-3 font-mono text-(--accent)">action</td>
										<td className="py-3 font-mono">String</td>
										<td className="py-3 text-(--text-muted)">Optional</td>
										<td className="py-3">
											Sub-resource or model to target (e.g. <code>guilds</code>, <code>members</code>).
										</td>
									</tr>
									<tr>
										<td className="py-3 font-mono text-(--accent)">body</td>
										<td className="py-3 font-mono">Object</td>
										<td className="py-3 text-red-400">Yes</td>
										<td className="py-3">Query criteria, document filters, or payload for mutations.</td>
									</tr>
								</tbody>
							</table>
						</div>

						<div className="border-t border-(--border)/10 pt-6">
							<h3 className="text-lg font-semibold text-(--text) mb-4">Method & Operation Mapping</h3>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
								<div className="p-4 bg-(--background)/50 border border-(--border)/10 rounded-xl">
									<span className="font-bold text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded uppercase font-mono">GET</span>
									<div className="font-semibold text-(--text) mt-2 text-sm">model.findOne(body)</div>
									<p className="text-xs text-(--text-muted) mt-1">Queries a single matching document.</p>
								</div>

								<div className="p-4 bg-(--background)/50 border border-(--border)/10 rounded-xl">
									<span className="font-bold text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded uppercase font-mono">POST</span>
									<div className="font-semibold text-(--text) mt-2 text-sm">model.create(body)</div>
									<p className="text-xs text-(--text-muted) mt-1">Creates a new document; falls back to existing if duplicate key (11000).</p>
								</div>

								<div className="p-4 bg-(--background)/50 border border-(--border)/10 rounded-xl">
									<span className="font-bold text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded uppercase font-mono">PATCH</span>
									<div className="font-semibold text-(--text) mt-2 text-sm">findOneAndUpdate(...)</div>
									<p className="text-xs text-(--text-muted) mt-1">
										Performs atomic <code>$set</code> update and returns updated document.
									</p>
								</div>

								<div className="p-4 bg-(--background)/50 border border-(--border)/10 rounded-xl">
									<span className="font-bold text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded uppercase font-mono">DELETE</span>
									<div className="font-semibold text-(--text) mt-2 text-sm">findOneAndDelete(...)</div>
									<p className="text-xs text-(--text-muted) mt-1">Deletes the matched document.</p>
								</div>
							</div>
						</div>
					</div>
				</motion.section>

				{/* 5. SERVICES & ACTIONS */}
				<motion.section id="services" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6 scroll-mt-24">
					<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
						<Database className="text-(--accent)" size={24} /> Available Services & Actions
					</h2>
					<p className="text-(--text-muted)">Services represent backend domains dynamically loaded from the server&apos;s app directory.</p>

					{/* VIRTUE SERVICE */}
					<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl overflow-hidden">
						<div className="flex items-center gap-3 p-4 bg-(--background)/50 border-b border-(--border)/10">
							<Layers className="text-(--accent)" size={20} />
							<span className="font-bold text-(--text) font-mono">service: &quot;virtue&quot;</span>
							<span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">Active</span>
						</div>

						<div className="p-6 space-y-6">
							<p className="text-sm text-(--text-muted)">
								Manages leveling configurations and user activity tracking. Self-saved Virtue leveling data is stored in the isolated <code>virtue</code> database (separating text and
								voice levels per guild), while global user identity and combined platform levels are stored in the primary <code>xernerx</code> database.
							</p>

							<div className="overflow-x-auto">
								<table className="w-full text-left text-sm border-collapse">
									<thead>
										<tr className="border-b border-(--border)/10 text-(--text-muted)">
											<th className="pb-2 font-medium">Action</th>
											<th className="pb-2 font-medium">Database</th>
											<th className="pb-2 font-medium">Filter Keys</th>
											<th className="pb-2 font-medium">Description</th>
										</tr>
									</thead>
									<tbody className="text-(--text)">
										<tr className="border-b border-(--border)/5">
											<td className="py-3 font-mono text-(--accent)">guilds</td>
											<td className="py-3 font-mono text-xs text-orange-400">virtue</td>
											<td className="py-3 font-mono text-xs">{'{ id }'}</td>
											<td className="py-3">
												Guild leveling mode (<code>easy</code>, <code>casual</code>, <code>balanced</code>, <code>hard</code>, <code>extreme</code>), cycles, level message, and
												ignored/tracked roles.
											</td>
										</tr>
										<tr className="border-b border-(--border)/5">
											<td className="py-3 font-mono text-(--accent)">text</td>
											<td className="py-3 font-mono text-xs text-orange-400">virtue</td>
											<td className="py-3 font-mono text-xs">{'{ id, guild }'}</td>
											<td className="py-3">Guild member text level, text XP, and message count per server.</td>
										</tr>
										<tr className="border-b border-(--border)/5">
											<td className="py-3 font-mono text-(--accent)">voice</td>
											<td className="py-3 font-mono text-xs text-orange-400">virtue</td>
											<td className="py-3 font-mono text-xs">{'{ id, guild }'}</td>
											<td className="py-3">Guild member voice level, voice XP, and time spent in voice per server.</td>
										</tr>
										<tr className="border-b border-(--border)/5">
											<td className="py-3 font-mono text-(--accent)">globalLevel</td>
											<td className="py-3 font-mono text-xs text-blue-400">xernerx</td>
											<td className="py-3 font-mono text-xs">{'{ ownerId }'}</td>
											<td className="py-3">Global unified platform user level and XP (combined text & voice contribution).</td>
										</tr>
										<tr>
											<td className="py-3 font-mono text-(--accent)">globalUser</td>
											<td className="py-3 font-mono text-xs text-blue-400">xernerx</td>
											<td className="py-3 font-mono text-xs">{'{ id }'}</td>
											<td className="py-3">Global Xernerx user account profile and settings.</td>
										</tr>
									</tbody>
								</table>
							</div>

							<div>
								<h4 className="text-sm font-semibold text-(--text) mb-3">Example: Update Guild Leveling Configuration</h4>
								<div className="rounded-xl overflow-hidden border border-(--border)/10 text-sm">
									<CodeBlock
										tabs={[
											{
												label: 'Request',
												language: 'json',
												code: `{\n  "id": "req-guild-update",\n  "service": "virtue",\n  "method": "PATCH",\n  "action": "guilds",\n  "body": {\n    "id": "102938475612345678",\n    "mode": "extreme",\n    "levelUp": true,\n    "levelMessage": "Congratulations [@mention]! You reached level [@level]!"\n  }\n}`,
											},
											{
												label: 'Response',
												language: 'json',
												code: `{\n  "id": "req-guild-update",\n  "_id": "64e0a7bc9e1234567890abcd",\n  "id": "102938475612345678",\n  "mode": "extreme",\n  "cycles": {\n    "daily": false,\n    "weekly": false,\n    "monthly": false\n  },\n  "roles": {\n    "ignored": [],\n    "tracked": []\n  },\n  "levelUp": true,\n  "levelMessage": "Congratulations [@mention]! You reached level [@level]!",\n  "levelChannel": null,\n  "autoDelete": 0,\n  "createdAt": "2026-08-15T12:00:00.000Z",\n  "updatedAt": "2026-09-13T09:30:00.000Z"\n}`,
											},
										]}
									/>
								</div>
							</div>
						</div>
					</div>

					{/* XERNERX SERVICE */}
					<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl overflow-hidden">
						<div className="flex items-center gap-3 p-4 bg-(--background)/50 border-b border-(--border)/10">
							<Globe className="text-blue-400" size={20} />
							<span className="font-bold text-(--text) font-mono">service: &quot;xernerx&quot;</span>
							<span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">Active</span>
						</div>

						<div className="p-6 space-y-6">
							<p className="text-sm text-(--text-muted)">
								Primary platform service mediating global accounts, combined user leveling, economy credits, and ecosystem resources stored in the main <code>xernerx</code> database.
							</p>

							<div className="overflow-x-auto">
								<table className="w-full text-left text-sm border-collapse">
									<thead>
										<tr className="border-b border-(--border)/10 text-(--text-muted)">
											<th className="pb-2 font-medium">Action</th>
											<th className="pb-2 font-medium">Database</th>
											<th className="pb-2 font-medium">Filter Keys</th>
											<th className="pb-2 font-medium">Description</th>
										</tr>
									</thead>
									<tbody className="text-(--text)">
										<tr className="border-b border-(--border)/5">
											<td className="py-3 font-mono text-(--accent)">users</td>
											<td className="py-3 font-mono text-xs text-blue-400">xernerx</td>
											<td className="py-3 font-mono text-xs">{'{ id }'}</td>
											<td className="py-3">Global user profile, appearance, preferences, and account metadata.</td>
										</tr>
										<tr className="border-b border-(--border)/5">
											<td className="py-3 font-mono text-(--accent)">levels</td>
											<td className="py-3 font-mono text-xs text-blue-400">xernerx</td>
											<td className="py-3 font-mono text-xs">
												{'{ id }'} or {'{ ownerId }'}
											</td>
											<td className="py-3">Unified platform user level and XP (aggregated across text and voice).</td>
										</tr>
										<tr className="border-b border-(--border)/5">
											<td className="py-3 font-mono text-(--accent)">credits</td>
											<td className="py-3 font-mono text-xs text-blue-400">xernerx</td>
											<td className="py-3 font-mono text-xs">
												{'{ id }'} or {'{ ownerId }'}
											</td>
											<td className="py-3">User balance, daily gift streak, and credit transaction status.</td>
										</tr>
										<tr className="border-b border-(--border)/5">
											<td className="py-3 font-mono text-(--accent)">tokens</td>
											<td className="py-3 font-mono text-xs text-blue-400">xernerx</td>
											<td className="py-3 font-mono text-xs">{'{ id }'}</td>
											<td className="py-3">API and WebSocket developer tokens and permission states.</td>
										</tr>
										<tr className="border-b border-(--border)/5">
											<td className="py-3 font-mono text-(--accent)">guilds</td>
											<td className="py-3 font-mono text-xs text-blue-400">xernerx</td>
											<td className="py-3 font-mono text-xs">{'{ id }'}</td>
											<td className="py-3">Platform-wide guild profiles and institutional registration.</td>
										</tr>
										<tr>
											<td className="py-3 font-mono text-(--accent)">bots</td>
											<td className="py-3 font-mono text-xs text-blue-400">xernerx</td>
											<td className="py-3 font-mono text-xs">{'{ id }'}</td>
											<td className="py-3">Registered bot metadata, reviews, votes, and verification state.</td>
										</tr>
									</tbody>
								</table>
							</div>

							<div>
								<h4 className="text-sm font-semibold text-(--text) mb-3">Example: Query Global User & Level</h4>
								<div className="rounded-xl overflow-hidden border border-(--border)/10 text-sm">
									<CodeBlock
										tabs={[
											{
												label: 'Request',
												language: 'json',
												code: `{\n  "id": "req-user-1",\n  "service": "xernerx",\n  "method": "GET",\n  "action": "users",\n  "body": {\n    "id": "482513687417061376"\n  }\n}`,
											},
											{
												label: 'Response',
												language: 'json',
												code: `{\n  "id": "req-user-1",\n  "_id": "69e120fbf62bd80cfa39a8e5",\n  "id": "482513687417061376",\n  "name": "Dummi",\n  "credits": {\n    "balance": 8445,\n    "streak": 5\n  },\n  "roles": ["owner"]\n}`,
											},
										]}
									/>
								</div>
							</div>
						</div>
					</div>

					{/* PLANNED SERVICES */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="bg-(--foreground)/20 border border-(--border)/10 rounded-2xl p-4">
							<div className="flex items-center justify-between mb-2">
								<span className="font-mono text-sm font-bold text-(--text)">service: &quot;metamorphosis&quot;</span>
								<span className="text-xs px-2 py-0.5 bg-(--border)/20 text-(--text-muted) rounded">Stub</span>
							</div>
							<p className="text-xs text-(--text-muted)">Metamorphosis bot profiles and integration hooks.</p>
						</div>

						<div className="bg-(--foreground)/20 border border-(--border)/10 rounded-2xl p-4">
							<div className="flex items-center justify-between mb-2">
								<span className="font-mono text-sm font-bold text-(--text)">service: &quot;zodiac&quot;</span>
								<span className="text-xs px-2 py-0.5 bg-(--border)/20 text-(--text-muted) rounded">Stub</span>
							</div>
							<p className="text-xs text-(--text-muted)">Zodiac bot configurations and star sign telemetry.</p>
						</div>
					</div>
				</motion.section>

				{/* 6. CLIENT SDK & USAGE */}
				<motion.section id="client" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6 scroll-mt-24">
					<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
						<Terminal className="text-(--accent)" size={24} /> Client SDK & Implementation
					</h2>
					<div className="prose prose-invert max-w-none text-(--text-muted) space-y-3">
						<p>
							To interact with the WebSocket Gateway, you can install the official public{' '}
							<code className="bg-(--accent)/20 text-(--accent) px-1.5 py-0.5 rounded font-mono font-semibold">@xernerx/websocket</code> npm package.
						</p>
						<p>
							The package abstracts raw socket lifecycle events, establishes and recovers connections, manages the authentication handshake, and provides{' '}
							<strong>functionified RPC methods</strong> (<code>get</code>, <code>create</code>, <code>update</code>, <code>delete</code>).
						</p>
					</div>

					<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl p-6 space-y-6">
						<div>
							<h3 className="text-sm font-semibold text-(--text) mb-2">1. Installation</h3>
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
							<h3 className="text-sm font-semibold text-(--text) mb-2">2. Functionified Connection Example</h3>
							<p className="text-xs text-(--text-muted) mb-3">Provide your token (ensuring it has WebSocket allowance enabled) and call the built-in CRUD operations:</p>
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
			</div>
		</div>
	);
}
