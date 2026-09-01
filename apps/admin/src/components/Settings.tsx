// Force recompile
/** @format */
'use client';

import { Save, Server, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useEnvironment, useToast, useSession } from '@xernerx/providers';
import { Button, Input, MultiSelector, Selector } from '@xernerx/ui';
import { motion } from 'framer-motion';
import { useDictionary } from '@xernerx/providers';
export default function Settings() {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { data: session } = useSession();
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [adminServerId, setAdminServerId] = useState('');
	const [appWebhookUrl, setAppWebhookUrl] = useState('');
	const [joinRoles, setJoinRoles] = useState<string[]>([]);
	const [botJoinRoles, setBotJoinRoles] = useState<string[]>([]);
	const [sisterServers, setSisterServers] = useState<{ id: string }[]>([]);
	const [availableRoles, setAvailableRoles] = useState<
		{
			id: string;
			name: string;
		}[]
	>([]);
	const [userGuilds, setUserGuilds] = useState<any[]>([]);

	useEffect(() => {
		if (session && (session as any).accessToken) {
			fetch('https://discord.com/api/v10/users/@me/guilds', {
				headers: { Authorization: `Bearer ${(session as any).accessToken}` },
			})
				.then((res) => res.json())
				.then((guilds) => {
					if (Array.isArray(guilds)) {
						const filtered = guilds.filter((g) => {
							try {
								const perms = BigInt(g.permissions);
								return (perms & BigInt(0x8)) === BigInt(0x8) || (perms & BigInt(0x20)) === BigInt(0x20);
							} catch {
								return false;
							}
						});
						setUserGuilds(filtered);
					}
				})
				.catch(console.error);
		}
	}, [session]);

	const fetchSettings = async () => {
		setIsLoading(true);
		try {
			const [adminRes, webhookRes, joinRes, botJoinRes, sisterRes, rolesRes] = await Promise.all([
				fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/admin_server_id'), {
					credentials: 'include',
				}),
				fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/app_webhook_url'), {
					credentials: 'include',
				}),
				fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/join_roles'), {
					credentials: 'include',
				}),
				fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/bot_join_roles'), {
					credentials: 'include',
				}),
				fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/sister_servers'), {
					credentials: 'include',
				}),
				fetch(getEnvUrl('https://api.xernerx.com/secure/core'), {
					credentials: 'include',
				}),
			]);
			if (adminRes.ok) {
				const data = await adminRes.json();
				setAdminServerId(data.value || '');
			}
			if (webhookRes.ok) {
				const data = await webhookRes.json();
				setAppWebhookUrl(data.value || '');
			}
			if (joinRes.ok) {
				const data = await joinRes.json();
				try {
					const parsed = JSON.parse(data.value || '[]');
					setJoinRoles(Array.isArray(parsed) ? parsed : []);
				} catch {
					setJoinRoles([]);
				}
			}
			if (botJoinRes.ok) {
				const data = await botJoinRes.json();
				try {
					const parsed = JSON.parse(data.value || '[]');
					setBotJoinRoles(Array.isArray(parsed) ? parsed : []);
				} catch {
					setBotJoinRoles([]);
				}
			}
			if (sisterRes.ok) {
				const data = await sisterRes.json();
				try {
					const parsed = JSON.parse(data.value || '[]');
					setSisterServers(Array.isArray(parsed) ? parsed : []);
				} catch {
					setSisterServers([]);
				}
			}
			if (rolesRes.ok) {
				setAvailableRoles(await rolesRes.json());
			}
		} catch (err: any) {
			console.error('Failed to fetch settings:', err);
		} finally {
			setIsLoading(false);
		}
	};
	useEffect(() => {
		fetchSettings();
	}, []);
	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSaving(true);
		try {
			await Promise.all([
				fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/admin_server_id'), {
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
					body: JSON.stringify({
						value: adminServerId,
						valueType: 'string',
					}),
				}),
				fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/app_webhook_url'), {
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
					body: JSON.stringify({
						value: appWebhookUrl,
						valueType: 'string',
					}),
				}),
				fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/join_roles'), {
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
					body: JSON.stringify({
						value: JSON.stringify(joinRoles),
						valueType: 'json',
					}),
				}),
				fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/bot_join_roles'), {
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
					body: JSON.stringify({
						value: JSON.stringify(botJoinRoles),
						valueType: 'json',
					}),
				}),
				fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/sister_servers'), {
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
					body: JSON.stringify({
						value: JSON.stringify(sisterServers),
						valueType: 'json',
					}),
				}),
			]);
			toast({
				title: 'System settings saved successfully.',
				type: 'success',
			});
		} catch (err: any) {
			toast({
				title: err.message,
				type: 'error',
			});
		} finally {
			setIsSaving(false);
		}
	};
	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-(--text-muted)">
				<Loader2 size={32} className="animate-spin mb-4 opacity-50" />
				<p>{t('admin.settings.loading')}</p>
			</div>
		);
	}
	return (
		<div
			className="flex flex-col max-w-7xl mx-auto w-full relative"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
			}}
		>
			<div
				className="flex flex-col sm:flex-row sm:items-center justify-between"
				style={{
					gap: 'var(--ui-gap)',
				}}
			>
				<div
					className="flex flex-col"
					style={{
						gap: 'calc(var(--ui-gap) * 0.25)',
					}}
				>
					<h1
						className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm"
						style={{
							fontFamily: `var(--font-fredoka)`,
						}}
					>
						{t('admin.settings.title')}
					</h1>
					<p className="text-sm text-(--text-muted)">{t('admin.settings.description')}</p>
				</div>
			</div>

			<motion.form
				initial={{
					opacity: 0,
					y: 10,
				}}
				animate={{
					opacity: 1,
					y: 0,
				}}
				onSubmit={handleSave}
				className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{
					padding: 'calc(var(--ui-gap) * 1.5)',
					gap: 'var(--ui-gap)',
				}}
			>
				<h3 className="text-lg font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
					<Server size={18} className="text-(--accent)" />
					{t('admin.settings.coreConfig')}
				</h3>

				<div
					className="flex flex-col max-w-md"
					style={{
						gap: 'calc(var(--ui-gap) * 0.5)',
					}}
				>
					<label className="text-xs font-semibold text-(--text)">{t('admin.settings.adminServerId')}</label>
					<p className="text-xs text-(--text-muted) mb-1">{t('admin.settings.adminServerIdDesc')}</p>
					<Selector
						value={adminServerId}
						onChange={(val: string) => setAdminServerId(val)}
						options={[{ value: '', label: t('admin.dashboard.settings.selectServer') }, ...userGuilds.map((g) => ({ value: g.id, label: g.name }))]}
						placeholder={t('admin.settings.adminServerIdPlaceholder') || 'Select Admin Server'}
					/>
				</div>

				<div
					className="flex flex-col max-w-md"
					style={{
						gap: 'calc(var(--ui-gap) * 0.5)',
					}}
				>
					<label className="text-xs font-semibold text-(--text)">{t('admin.settings.appWebhookUrl')}</label>
					<p className="text-xs text-(--text-muted) mb-1">{t('admin.settings.appWebhookUrlDesc')}</p>
					<Input value={appWebhookUrl} onChange={(e) => setAppWebhookUrl(e.target.value)} placeholder={t('admin.settings.appWebhookUrlPlaceholder')} />
				</div>

				<div
					className="flex flex-col max-w-md"
					style={{
						gap: 'calc(var(--ui-gap) * 0.5)',
					}}
				>
					<label className="text-xs font-semibold text-(--text)">{t('admin.dashboard.settings.joinRolesHumans')}</label>
					<p className="text-xs text-(--text-muted) mb-1">{t('admin.dashboard.settings.joinRolesHumansDesc')}</p>
					<MultiSelector
						value={joinRoles}
						onChange={(val) => setJoinRoles(val)}
						options={availableRoles.map((r) => ({
							value: r.id,
							label: r.name,
						}))}
						placeholder={t('admin.dashboard.settings.selectHumanJoinRoles')}
					/>
				</div>

				<div
					className="flex flex-col max-w-md"
					style={{
						gap: 'calc(var(--ui-gap) * 0.5)',
					}}
				>
					<label className="text-xs font-semibold text-(--text)">{t('admin.dashboard.settings.joinRolesBots')}</label>
					<p className="text-xs text-(--text-muted) mb-1">{t('admin.dashboard.settings.joinRolesBotsDesc')}</p>
					<MultiSelector
						value={botJoinRoles}
						onChange={(val) => setBotJoinRoles(val)}
						options={availableRoles.map((r) => ({
							value: r.id,
							label: r.name,
						}))}
						placeholder={t('admin.dashboard.settings.selectBotJoinRoles')}
					/>
				</div>

				<div
					className="flex flex-col max-w-md"
					style={{
						gap: 'calc(var(--ui-gap) * 0.5)',
					}}
				>
					<div className="flex justify-between items-center">
						<div>
							<label className="text-xs font-semibold text-(--text)">{t('admin.dashboard.settings.sisterServers')}</label>
							<p className="text-xs text-(--text-muted) mb-1">{t('admin.dashboard.settings.sisterServersDesc')}</p>
						</div>
						<Button type="button" variant="ghost" size="sm" onClick={() => setSisterServers([...sisterServers, { id: '' }])}>
							{' '}
							{t('admin.dashboard.settings.add')}{' '}
						</Button>
					</div>
					{sisterServers.map((server, idx) => (
						<div key={idx} className="flex gap-2">
							<div className="flex-1">
								<Selector
									value={server.id}
									onChange={(val: string) => {
										const newServers = [...sisterServers];
										newServers[idx].id = val;
										setSisterServers(newServers);
									}}
									options={[{ value: '', label: t('admin.dashboard.settings.selectServer') }, ...userGuilds.map((g) => ({ value: g.id, label: g.name }))]}
									placeholder={t('admin.dashboard.settings.selectDiscordGuild')}
								/>
							</div>
							<Button
								type="button"
								variant="outline"
								size="icon"
								disabled={!server.id}
								onClick={async () => {
									toast({ title: 'Initiating Force Sync...', type: 'info' });
									try {
										const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/sister_servers/sync'), {
											method: 'POST',
											headers: { 'Content-Type': 'application/json' },
											credentials: 'include',
											body: JSON.stringify({ guildId: server.id }),
										});
										if (res.ok) {
											toast({ title: `Force sync started for ${server.id}`, type: 'success' });
										} else {
											toast({ title: 'Failed to start force sync.', type: 'error' });
										}
									} catch (err) {
										console.error(err);
									}
								}}
							>
								<RefreshCw size={16} />
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="text-(--error)"
								onClick={() => {
									const newServers = [...sisterServers];
									newServers.splice(idx, 1);
									setSisterServers(newServers);
									toast({ title: 'Sister server removed (unsaved).', type: 'info' });
								}}
							>
								<Trash2 size={16} />
							</Button>
						</div>
					))}
				</div>

				<div className="flex justify-end pt-4 border-t border-(--border)/10 mt-4">
					<Button type="submit" variant="primary" disabled={isSaving}>
						{isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
						{t('admin.settings.saveButton')}
					</Button>
				</div>
			</motion.form>
		</div>
	);
}
