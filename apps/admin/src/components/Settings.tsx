/** @format */
'use client';

import { Save, Server, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useEnvironment, useToast, useSession, useDictionary } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Button, MultiSelector, Selector } from '@xernerx/ui';
import { motion } from 'framer-motion';
import { SisterServersSection } from './settings/SisterServersSection';
import { WebhooksSection } from './settings/WebhooksSection';

export default function Settings() {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast, remind } = useToast();
	const { data: session } = useSession();
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [adminServerId, setAdminServerId] = useState('');
	const [mainOrgId, setMainOrgId] = useState('');
	const [organizations, setOrganizations] = useState<{ _id: string; name: string }[]>([]);
	const [issuesWebhookUrl, setIssuesWebhookUrl] = useState('');
	const [suggestionsWebhookUrl, setSuggestionsWebhookUrl] = useState('');
	const [appWebhookUrl, setAppWebhookUrl] = useState('');
	const [auditWebhookUrl, setAuditWebhookUrl] = useState('');
	const [joinRoles, setJoinRoles] = useState<string[]>([]);
	const [botJoinRoles, setBotJoinRoles] = useState<string[]>([]);
	const [sisterServers, setSisterServers] = useState<{ id: string }[]>([]);
	const [roadmapProducts, setRoadmapProducts] = useState<string[]>(['Dashboard', 'API', 'CDN', 'Bots']);
	const [initialSnapshot, setInitialSnapshot] = useState<string>('');
	const [availableRoles, setAvailableRoles] = useState<{ id: string; name: string }[]>([]);
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
			const [adminRes, mainOrgRes, orgsRes, issuesWebhookRes, suggestionsWebhookRes, webhookRes, auditWebhookRes, joinRes, botJoinRes, roadmapRes, sisterRes, rolesRes] = await Promise.all([
				fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/admin_server_id'), { credentials: 'include' }),
				fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/main_org_id'), { credentials: 'include' }),
				fetch(getEnvUrl('https://api.xernerx.com/secure/organizations'), { credentials: 'include' }),
				fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/issues_webhook_url'), { credentials: 'include' }),
				fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/suggestions_webhook_url'), { credentials: 'include' }),
				fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/app_webhook_url'), { credentials: 'include' }),
				fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/admin_audit_webhook_url'), { credentials: 'include' }),
				fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/join_roles'), { credentials: 'include' }),
				fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/bot_join_roles'), { credentials: 'include' }),
				fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/roadmap_products'), { credentials: 'include' }),
				fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/sister_servers'), { credentials: 'include' }),
				fetch(getEnvUrl('https://api.xernerx.com/secure/core'), { credentials: 'include' }),
			]);
			let loadedAdminServerId = '';
			let loadedMainOrgId = '';
			let loadedIssuesWebhook = '';
			let loadedSuggestionsWebhook = '';
			let loadedAppWebhook = '';
			let loadedAuditWebhook = '';
			let loadedJoinRoles: string[] = [];
			let loadedBotJoinRoles: string[] = [];
			let loadedRoadmapProducts: string[] = ['Dashboard', 'API', 'CDN', 'Bots'];
			let loadedSisterServers: { id: string }[] = [];

			if (adminRes.ok) {
				const data = await adminRes.json();
				loadedAdminServerId = data.value || '';
				setAdminServerId(loadedAdminServerId);
			}
			if (mainOrgRes.ok) {
				const data = await mainOrgRes.json();
				loadedMainOrgId = data.value || '';
				setMainOrgId(loadedMainOrgId);
			}
			if (orgsRes.ok) {
				const orgsData = await orgsRes.json();
				setOrganizations(Array.isArray(orgsData) ? orgsData : []);
			}
			if (issuesWebhookRes.ok) {
				const data = await issuesWebhookRes.json();
				loadedIssuesWebhook = data.value || '';
				setIssuesWebhookUrl(loadedIssuesWebhook);
			}
			if (suggestionsWebhookRes.ok) {
				const data = await suggestionsWebhookRes.json();
				loadedSuggestionsWebhook = data.value || '';
				setSuggestionsWebhookUrl(loadedSuggestionsWebhook);
			}
			if (webhookRes.ok) {
				const data = await webhookRes.json();
				loadedAppWebhook = data.value || '';
				setAppWebhookUrl(loadedAppWebhook);
			}
			if (auditWebhookRes.ok) {
				const data = await auditWebhookRes.json();
				loadedAuditWebhook = data.value || '';
				setAuditWebhookUrl(loadedAuditWebhook);
			}
			if (joinRes.ok) {
				const data = await joinRes.json();
				try {
					const parsed = JSON.parse(data.value || '[]');
					loadedJoinRoles = Array.isArray(parsed) ? parsed : [];
				} catch {
					loadedJoinRoles = [];
				}
				setJoinRoles(loadedJoinRoles);
			}
			if (roadmapRes.ok) {
				const data = await roadmapRes.json();
				try {
					const parsed = JSON.parse(data.value || '[]');
					loadedRoadmapProducts = Array.isArray(parsed) && parsed.length ? parsed : ['Dashboard', 'API', 'CDN', 'Bots'];
				} catch {
					loadedRoadmapProducts = ['Dashboard', 'API', 'CDN', 'Bots'];
				}
				setRoadmapProducts(loadedRoadmapProducts);
			}
			if (botJoinRes.ok) {
				const data = await botJoinRes.json();
				try {
					const parsed = JSON.parse(data.value || '[]');
					loadedBotJoinRoles = Array.isArray(parsed) ? parsed : [];
				} catch {
					loadedBotJoinRoles = [];
				}
				setBotJoinRoles(loadedBotJoinRoles);
			}
			if (sisterRes.ok) {
				const data = await sisterRes.json();
				try {
					const parsed = JSON.parse(data.value || '[]');
					loadedSisterServers = Array.isArray(parsed) ? parsed : [];
				} catch {
					loadedSisterServers = [];
				}
				setSisterServers(loadedSisterServers);
			}
			if (rolesRes.ok) {
				const rolesData = await rolesRes.json();
				setAvailableRoles(Array.isArray(rolesData) ? rolesData : []);
			}
			setInitialSnapshot(
				JSON.stringify({
					adminServerId: loadedAdminServerId,
					mainOrgId: loadedMainOrgId,
					issuesWebhookUrl: loadedIssuesWebhook,
					suggestionsWebhookUrl: loadedSuggestionsWebhook,
					appWebhookUrl: loadedAppWebhook,
					auditWebhookUrl: loadedAuditWebhook,
					joinRoles: loadedJoinRoles,
					botJoinRoles: loadedBotJoinRoles,
					roadmapProducts: loadedRoadmapProducts,
					sisterServers: loadedSisterServers,
				})
			);
		} catch (err: any) {
			console.error('Failed to fetch settings:', err);
		} finally {
			setIsLoading(false);
		}
	};
	useEffect(() => {
		fetchSettings();
	}, []);

	const currentSnapshot = useMemo(
		() =>
			JSON.stringify({
				adminServerId,
				mainOrgId,
				issuesWebhookUrl,
				suggestionsWebhookUrl,
				appWebhookUrl,
				auditWebhookUrl,
				joinRoles,
				botJoinRoles,
				roadmapProducts,
				sisterServers,
			}),
		[adminServerId, mainOrgId, issuesWebhookUrl, suggestionsWebhookUrl, appWebhookUrl, auditWebhookUrl, joinRoles, botJoinRoles, roadmapProducts, sisterServers]
	);

	const isDirty = Boolean(initialSnapshot) && currentSnapshot !== initialSnapshot;

	const handleSave = useCallback(
		async (e?: React.FormEvent) => {
			if (e) e.preventDefault();
			setIsSaving(true);
			try {
				await Promise.all([
					fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/admin_server_id'), {
						method: 'PATCH',
						headers: { 'Content-Type': 'application/json' },
						credentials: 'include',
						body: JSON.stringify({ value: adminServerId, valueType: 'string' }),
					}),
					fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/main_org_id'), {
						method: 'PATCH',
						headers: { 'Content-Type': 'application/json' },
						credentials: 'include',
						body: JSON.stringify({ value: mainOrgId, valueType: 'string' }),
					}),
					fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/issues_webhook_url'), {
						method: 'PATCH',
						headers: { 'Content-Type': 'application/json' },
						credentials: 'include',
						body: JSON.stringify({ value: issuesWebhookUrl, valueType: 'string' }),
					}),
					fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/suggestions_webhook_url'), {
						method: 'PATCH',
						headers: { 'Content-Type': 'application/json' },
						credentials: 'include',
						body: JSON.stringify({ value: suggestionsWebhookUrl, valueType: 'string' }),
					}),
					fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/app_webhook_url'), {
						method: 'PATCH',
						headers: { 'Content-Type': 'application/json' },
						credentials: 'include',
						body: JSON.stringify({ value: appWebhookUrl, valueType: 'string' }),
					}),
					fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/admin_audit_webhook_url'), {
						method: 'PATCH',
						headers: { 'Content-Type': 'application/json' },
						credentials: 'include',
						body: JSON.stringify({ value: auditWebhookUrl, valueType: 'string' }),
					}),
					fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/join_roles'), {
						method: 'PATCH',
						headers: { 'Content-Type': 'application/json' },
						credentials: 'include',
						body: JSON.stringify({ value: JSON.stringify(joinRoles), valueType: 'json' }),
					}),
					fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/bot_join_roles'), {
						method: 'PATCH',
						headers: { 'Content-Type': 'application/json' },
						credentials: 'include',
						body: JSON.stringify({ value: JSON.stringify(botJoinRoles), valueType: 'json' }),
					}),
					fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/roadmap_products'), {
						method: 'PATCH',
						headers: { 'Content-Type': 'application/json' },
						credentials: 'include',
						body: JSON.stringify({ value: JSON.stringify(roadmapProducts.filter(Boolean)), valueType: 'json' }),
					}),
					fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/sister_servers'), {
						method: 'PATCH',
						headers: { 'Content-Type': 'application/json' },
						credentials: 'include',
						body: JSON.stringify({ value: JSON.stringify(sisterServers), valueType: 'json' }),
					}),
				]);
				setInitialSnapshot(currentSnapshot);
				toast({
					title: t('admin.settings.toasts.saveSuccess'),
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
		},
		[
			adminServerId,
			mainOrgId,
			issuesWebhookUrl,
			suggestionsWebhookUrl,
			appWebhookUrl,
			auditWebhookUrl,
			joinRoles,
			botJoinRoles,
			roadmapProducts,
			sisterServers,
			currentSnapshot,
			getEnvUrl,
			toast,
			t,
		]
	);

	const handleReset = useCallback(() => {
		if (!initialSnapshot) return;
		try {
			const parsed = JSON.parse(initialSnapshot);
			setAdminServerId(parsed.adminServerId || '');
			setMainOrgId(parsed.mainOrgId || '');
			setIssuesWebhookUrl(parsed.issuesWebhookUrl || '');
			setSuggestionsWebhookUrl(parsed.suggestionsWebhookUrl || '');
			setAppWebhookUrl(parsed.appWebhookUrl || '');
			setAuditWebhookUrl(parsed.auditWebhookUrl || '');
			setJoinRoles(parsed.joinRoles || []);
			setBotJoinRoles(parsed.botJoinRoles || []);
			setRoadmapProducts(parsed.roadmapProducts || ['Dashboard', 'API', 'CDN', 'Bots']);
			setSisterServers(parsed.sisterServers || []);
		} catch {}
	}, [initialSnapshot]);

	useEffect(() => {
		if (isDirty) {
			remind(true, () => handleSave(), handleReset, isSaving);
		} else {
			remind(false);
		}
		return () => remind(false);
	}, [isDirty, isSaving, remind, handleSave, handleReset]);
	if (isLoading) return <Loading />;
	return (
		<div
			className="flex flex-col max-w-(--page-width) mx-auto w-full relative"
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
						placeholder={t('admin.settings.adminServerIdPlaceholder')}
					/>
				</div>

				<div
					className="flex flex-col max-w-md"
					style={{
						gap: 'calc(var(--ui-gap) * 0.5)',
					}}
				>
					<label className="text-xs font-semibold text-(--text)">{t('admin.settings.mainOrg')}</label>
					<p className="text-xs text-(--text-muted) mb-1">{t('admin.settings.mainOrgDesc')}</p>
					<Selector
						value={mainOrgId}
						onChange={(val: string) => setMainOrgId(val)}
						options={[{ value: '', label: t('admin.settings.selectMainOrg') }, ...organizations.map((org) => ({ value: org._id, label: org.name }))]}
						placeholder={t('admin.settings.selectMainOrg')}
					/>
				</div>

				<WebhooksSection
					adminServerId={adminServerId}
					issuesWebhookUrl={issuesWebhookUrl}
					setIssuesWebhookUrl={setIssuesWebhookUrl}
					suggestionsWebhookUrl={suggestionsWebhookUrl}
					setSuggestionsWebhookUrl={setSuggestionsWebhookUrl}
					appWebhookUrl={appWebhookUrl}
					setAppWebhookUrl={setAppWebhookUrl}
					auditWebhookUrl={auditWebhookUrl}
					setAuditWebhookUrl={setAuditWebhookUrl}
				/>

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

				<SisterServersSection sisterServers={sisterServers} setSisterServers={setSisterServers} userGuilds={userGuilds} />

				<div className="flex justify-end pt-4 border-t border-(--border)/10 mt-4">
					<Button type="submit" variant="primary" disabled={isSaving || !isDirty}>
						{isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
						{t('admin.settings.saveButton')}
					</Button>
				</div>
			</motion.form>
		</div>
	);
}
