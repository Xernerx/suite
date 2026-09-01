// Force recompile
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, CalendarClock, Send, Megaphone, Trash } from 'lucide-react';
import { useDictionary, useEnvironment, useToast, useUser } from '@xernerx/providers';
import { Button, Input, Modal, Selector } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';

export default function Announcements() {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { user } = useUser();

	const [announcements, setAnnouncements] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [channels, setChannels] = useState<{ label: string; value: string }[]>([]);

	const [isOpen, setIsOpen] = useState(false);
	const [saving, setSaving] = useState(false);

	const [editingId, setEditingId] = useState<string | null>(null);
	const [title, setTitle] = useState('');
	const [channelId, setChannelId] = useState('');
	const [webhookUrl, setWebhookUrl] = useState('');
	const [content, setContent] = useState('');
	const [scheduledFor, setScheduledFor] = useState('');

	// VISUAL BUILDER STATES
	const [embeds, setEmbeds] = useState<any[]>([]);
	const [components, setComponents] = useState<any[]>([]);

	useEffect(() => {
		fetchAnnouncements();
		fetchChannels();
	}, []);

	const fetchChannels = async () => {
		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/admin_server_id'), { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				if (data.value) {
					const guildRes = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${data.value}`), { credentials: 'include' });
					if (guildRes.ok) {
						const guildData = await guildRes.json();
						if (guildData.channels) {
							setChannels(guildData.channels.map((c: any) => ({ label: '#' + c.name, value: c.id })));
						}
					}
				}
			}
		} catch (e) {
			console.error('Failed to fetch channels', e);
		}
	};

	const fetchAnnouncements = async () => {
		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/announcements'), { credentials: 'include' });
			if (res.ok) setAnnouncements(await res.json());
		} catch (err) {
			console.error('Failed to fetch announcements:', err);
		} finally {
			setLoading(false);
		}
	};

	const generateWebhook = async (passedChannelId?: string) => {
		const targetChannel = passedChannelId || channelId;
		if (!targetChannel) return;
		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/announcements/create-webhook'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ channelId: targetChannel, name: 'Xernerx Announcements' }),
			});
			const data = await res.json();
			if (res.ok) {
				setWebhookUrl(data.url);
				toast({ type: 'success', title: t('admin.dashboard.announcements.toasts.webhookLinked') });
			} else {
				throw new Error(data.error || 'Failed');
			}
		} catch (e: any) {
			toast({ type: 'error', title: 'Failed to create webhook', description: e.message });
		}
	};

	const fillBoilerplate = (type: 'tos' | 'privacy') => {
		const avatarUrl = user?.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : undefined;

		setTitle(type === 'tos' ? 'TOS Update' : 'Privacy Update');
		setContent('');
		setEmbeds([
			{
				title: type === 'tos' ? 'Terms of Service Updated' : 'Privacy Policy Updated',
				description: `We've recently updated our ${type === 'tos' ? 'Terms of Service' : 'Privacy Policy'} to better serve our community and comply with the latest regulations. Please take a moment to review the changes.`,
				color: '#8b7cf6',
				fields: [],
				author: { name: '', url: '', icon_url: '' },
				footer: {
					text: user?.username || user?.global_name || '',
					icon_url: avatarUrl,
				},
				timestamp: new Date().toISOString(),
			},
		]);
		setComponents([
			{
				type: 1,
				components: [
					{
						type: 2,
						style: 5,
						label: `Read ${type === 'tos' ? 'Terms of Service' : 'Privacy Policy'}`,
						url: `https://xernerx.com/${type === 'tos' ? 'terms' : 'privacy'}`,
					},
				],
			},
		]);
	};

	const saveAnnouncement = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);

		try {
			// Clean up embeds (remove empty authors/footers)
			const cleanEmbeds = embeds.map((e) => {
				const cleaned = { ...e };
				if (cleaned.author && !cleaned.author.name) delete cleaned.author;
				if (cleaned.footer && !cleaned.footer.text) delete cleaned.footer;
				if (cleaned.color && typeof cleaned.color === 'string') {
					cleaned.color = parseInt(cleaned.color.replace('#', ''), 16);
				}
				return cleaned;
			});

			const cleanComponents = components.map((row) => ({
				...row,
				components: row.components.map((btn: any) => {
					const cleanedBtn = { ...btn };
					if (cleanedBtn.style === 5) {
						delete cleanedBtn.custom_id;
					} else {
						delete cleanedBtn.url;
						if (!cleanedBtn.custom_id) cleanedBtn.custom_id = `btn_${Date.now()}`;
					}
					return cleanedBtn;
				}),
			}));

			const payload = {
				title,
				channelId,
				webhookUrl,
				message: {
					content,
					embeds: cleanEmbeds,
					components: cleanComponents,
				},
				scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : null,
			};

			const url = editingId ? getEnvUrl(`https://api.xernerx.com/secure/announcements/${editingId}`) : getEnvUrl('https://api.xernerx.com/secure/announcements');

			const res = await fetch(url, {
				method: editingId ? 'PATCH' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(payload),
			});

			if (res.ok) {
				toast({ type: 'success', title: editingId ? t('admin.dashboard.announcements.toasts.updateSuccess') : t('admin.dashboard.announcements.toasts.createSuccess') });
				setIsOpen(false);
				fetchAnnouncements();
			} else {
				throw new Error(await res.text());
			}
		} catch (e: any) {
			toast({ type: 'error', title: 'Failed to save', description: e.message });
		} finally {
			setSaving(false);
		}
	};

	const deleteAnnouncement = async (id: string) => {
		if (!confirm(t('admin.dashboard.announcements.deleteConfirm'))) return;
		try {
			await fetch(getEnvUrl(`https://api.xernerx.com/secure/announcements/${id}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			fetchAnnouncements();
		} catch (e) {
			console.error(e);
		}
	};

	// --- Visual Builders Handlers ---
	const addEmbed = () => {
		const avatarUrl = user?.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : undefined;
		setEmbeds([
			...embeds,
			{
				title: '',
				description: '',
				color: '#8b7cf6',
				fields: [],
				author: { name: '' },
				footer: {
					text: user?.username || user?.global_name || '',
					icon_url: avatarUrl,
				},
				timestamp: new Date().toISOString(),
			},
		]);
	};
	const updateEmbed = (index: number, key: string, val: any) => {
		const arr = [...embeds];
		arr[index][key] = val;
		setEmbeds(arr);
	};
	const removeEmbed = (index: number) => setEmbeds(embeds.filter((_, i) => i !== index));

	const addField = (embedIndex: number) => {
		const arr = [...embeds];
		if (!arr[embedIndex].fields) arr[embedIndex].fields = [];
		arr[embedIndex].fields.push({ name: '', value: '', inline: false });
		setEmbeds(arr);
	};
	const updateField = (embedIndex: number, fieldIndex: number, key: string, val: any) => {
		const arr = [...embeds];
		arr[embedIndex].fields[fieldIndex][key] = val;
		setEmbeds(arr);
	};
	const removeField = (embedIndex: number, fieldIndex: number) => {
		const arr = [...embeds];
		arr[embedIndex].fields = arr[embedIndex].fields.filter((_: any, i: number) => i !== fieldIndex);
		setEmbeds(arr);
	};

	const addActionRow = () => setComponents([...components, { type: 1, components: [] }]);
	const removeActionRow = (index: number) => setComponents(components.filter((_, i) => i !== index));
	const addButtonToRow = (rowIndex: number) => {
		const arr = [...components];
		arr[rowIndex].components.push({ type: 2, style: 1, label: 'New Button', custom_id: `btn_${Date.now()}` });
		setComponents(arr);
	};
	const updateButton = (rowIndex: number, btnIndex: number, key: string, val: any) => {
		const arr = [...components];
		arr[rowIndex].components[btnIndex][key] = val;
		setComponents(arr);
	};
	const removeButton = (rowIndex: number, btnIndex: number) => {
		const arr = [...components];
		arr[rowIndex].components = arr[rowIndex].components.filter((_: any, i: number) => i !== btnIndex);
		setComponents(arr);
	};

	if (loading) return <Loading />;

	return (
		<div className="flex flex-col max-w-7xl mx-auto w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<div className="flex flex-col sm:flex-row items-center justify-between">
				<div className="flex flex-col">
					<h1 className="text-4xl font-extrabold tracking-tight text-(--text)">{t('admin.dashboard.announcements.title')}</h1>
					<p className="text-sm text-(--text-muted)">{t('admin.dashboard.announcements.subtitle')}</p>
				</div>
				<Button
					variant="primary"
					onClick={() => {
						setEditingId(null);
						setTitle('');
						setChannelId('');
						setWebhookUrl('');
						setContent('');
						setEmbeds([]);
						setComponents([]);
						setScheduledFor('');
						setIsOpen(true);
					}}
				>
					<Plus size={16} /> Create Announcement
				</Button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{announcements.map((a) => (
					<div key={a.id} className="relative overflow-hidden rounded-[2rem] border border-(--border)/10 bg-(--foreground)/30 p-6 flex flex-col gap-3">
						<div className="flex justify-between items-start">
							<h3 className="font-semibold text-(--text)">{a.title}</h3>
							<div className="flex gap-2">
								<Button
									variant="ghost"
									size="icon"
									onClick={() => {
										setEditingId(a.id);
										setTitle(a.title);
										setChannelId(a.channelId || '');
										setWebhookUrl(a.webhookUrl);
										setContent(a.message?.content || '');

										// Restore colors properly for inputs (int -> hex)
										const restoredEmbeds = (a.message?.embeds || []).map((e: any) => {
											const colorStr = typeof e.color === 'number' ? `#${e.color.toString(16).padStart(6, '0')}` : e.color;
											return { ...e, color: colorStr };
										});

										setEmbeds(restoredEmbeds);
										setComponents(a.message?.components || []);
										setScheduledFor(a.scheduledFor ? new Date(a.scheduledFor).toISOString().slice(0, 16) : '');
										setIsOpen(true);
									}}
								>
									<Edit2 size={16} />
								</Button>
								<Button variant="danger" size="icon" onClick={() => deleteAnnouncement(a.id)}>
									<Trash2 size={16} />
								</Button>
							</div>
						</div>

						<div className="flex flex-col gap-1 text-sm text-(--text-muted)">
							{a.sentAt ? (
								<div className="flex items-center gap-2 text-green-500">
									<Send size={14} /> {t('admin.dashboard.announcements.sentOn')}
									{new Date(a.sentAt).toLocaleDateString()}
								</div>
							) : (
								<div className="flex items-center gap-2 text-orange-500">
									<CalendarClock size={14} />{' '}
									{a.scheduledFor ? `{t('admin.dashboard.announcements.scheduled')}${new Date(a.scheduledFor).toLocaleString()}` : t('admin.dashboard.announcements.draft')}
								</div>
							)}
							{a.channelId && (
								<div className="text-xs">
									{t('admin.dashboard.announcements.channel')}
									{a.channelId}
								</div>
							)}
						</div>
					</div>
				))}
			</div>

			<Modal
				open={isOpen}
				onOpenChange={setIsOpen}
				title={editingId ? t('admin.dashboard.announcements.editModalTitle') : t('admin.dashboard.announcements.createModalTitle')}
				description={t('admin.dashboard.announcements.modalDesc')}
				maxWidth="max-w-4xl"
			>
				<form onSubmit={saveAnnouncement} className="flex flex-col gap-6 max-h-[75vh] overflow-y-auto pr-2">
					<div className="flex gap-2">
						<Button type="button" variant="ghost" onClick={() => fillBoilerplate('tos')}>
							{t('admin.dashboard.announcements.loadTos')}
						</Button>
						<Button type="button" variant="ghost" onClick={() => fillBoilerplate('privacy')}>
							{t('admin.dashboard.announcements.loadPrivacy')}
						</Button>
					</div>

					<div className="grid grid-cols-2 gap-4 border-b border-(--border)/10 pb-4">
						<div className="flex flex-col gap-1 w-full">
							<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.announcements.internalTitle')}</label>
							<Input value={title} onChange={(e) => setTitle(e.target.value)} required />
						</div>
						<div className="flex flex-col gap-1 w-full">
							<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.announcements.scheduledFor')}</label>
							<Input type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} />
						</div>
						<div className="flex flex-col gap-1 w-full col-span-2">
							<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.announcements.discordChannel')}</label>
							<Selector
								value={channelId}
								options={[{ label: t('admin.dashboard.announcements.selectChannel'), value: '' }, ...channels]}
								onChange={(val: string) => {
									setChannelId(val);
									if (val) generateWebhook(val);
								}}
							/>
						</div>
						<div className="col-span-2 flex flex-col gap-1 w-full">
							<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.announcements.webhookUrl')}</label>
							<Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} required />
						</div>
					</div>

					<div className="flex flex-col gap-1 w-full">
						<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.announcements.messageContent')}</label>
						<Input value={content} onChange={(e) => setContent(e.target.value)} />
					</div>

					{/* WYSIWYG DISCORD BUILDER */}
					<div className="flex flex-col gap-2 mt-4">
						<h3 className="font-semibold text-(--text) text-sm mb-2">{t('admin.dashboard.announcements.builderTitle')}</h3>

						{embeds.map((emb, eIdx) => (
							<div key={eIdx} className="relative flex group max-w-xl">
								{/* The left color pillar */}
								<div
									className="w-1.5 rounded-l-md relative shrink-0 cursor-pointer transition-transform hover:scale-x-150 origin-left"
									style={{ backgroundColor: emb.color || '#202225' }}
								>
									<input
										type="color"
										className="absolute inset-0 opacity-0 cursor-pointer w-[200%] h-full -ml-2"
										value={emb.color || '#000000'}
										onChange={(e) => updateEmbed(eIdx, 'color', e.target.value)}
										title={t('admin.dashboard.announcements.changeColor')}
									/>
								</div>

								{/* The embed body */}
								<div className="bg-(--background) border border-(--border)/10 rounded-r-md p-4 flex flex-col gap-1 flex-1 relative min-w-0">
									<button type="button" onClick={() => removeEmbed(eIdx)} className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
										<Trash size={14} />
									</button>

									{/* Author */}
									<div className="flex items-center gap-2 text-xs font-semibold mb-1">
										<input
											placeholder={t('admin.dashboard.announcements.authorName')}
											value={emb.author?.name || ''}
											onChange={(e) => updateEmbed(eIdx, 'author', { ...emb.author, name: e.target.value })}
											className="bg-transparent outline-none w-full placeholder:text-(--text-muted) text-(--text) font-bold"
										/>
									</div>
									<input
										placeholder={t('admin.dashboard.announcements.embedTitle')}
										value={emb.title || ''}
										onChange={(e) => updateEmbed(eIdx, 'title', e.target.value)}
										className="text-base font-bold text-blue-400 bg-transparent outline-none w-full mb-1 placeholder:text-(--text-muted)"
									/>
									<textarea
										placeholder={t('admin.dashboard.announcements.embedDesc')}
										value={emb.description || ''}
										onChange={(e) => updateEmbed(eIdx, 'description', e.target.value)}
										className="bg-transparent outline-none w-full text-sm text-(--text-muted) placeholder:text-(--text-muted)/50 resize-none min-h-[40px]"
									/>

									{/* Fields */}
									{emb.fields && emb.fields.length > 0 && (
										<div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
											{emb.fields.map((f: any, fIdx: number) => (
												<div key={fIdx} className={`flex flex-col relative group/field ${f.inline ? 'w-[30%]' : 'w-full'}`}>
													<input
														placeholder={t('admin.dashboard.announcements.fieldName')}
														value={f.name}
														onChange={(e) => updateField(eIdx, fIdx, 'name', e.target.value)}
														className="bg-transparent outline-none font-semibold text-sm text-(--text) placeholder:text-(--text-muted)"
													/>
													<textarea
														placeholder={t('admin.dashboard.announcements.fieldValue')}
														value={f.value}
														onChange={(e) => updateField(eIdx, fIdx, 'value', e.target.value)}
														className="bg-transparent outline-none text-sm text-(--text-muted) placeholder:text-(--text-muted)/50 resize-none min-h-[30px]"
													/>

													<div className="absolute -top-6 -right-2 opacity-0 group-hover/field:opacity-100 flex gap-2 bg-(--foreground) border border-(--border)/10 rounded p-1.5 shadow-lg z-10">
														<button
															type="button"
															onClick={() => updateField(eIdx, fIdx, 'inline', !f.inline)}
															className={`text-[10px] font-bold ${f.inline ? 'text-green-400' : 'text-(--text-muted)'}`}
														>
															INLINE
														</button>
														<button type="button" onClick={() => removeField(eIdx, fIdx)} className="text-red-400 text-[10px]">
															<Trash size={12} />
														</button>
													</div>
												</div>
											))}
										</div>
									)}
									<button type="button" onClick={() => addField(eIdx)} className="text-xs font-medium text-blue-400 hover:text-blue-300 text-left w-fit mt-1">
										+ Add Field
									</button>

									{/* Footer */}
									<div className="mt-3 pt-2 flex items-center gap-2 text-xs">
										{emb.footer?.icon_url && <img src={emb.footer.icon_url} alt="Footer Icon" className="w-5 h-5 rounded-full object-cover" />}
										<div className="flex flex-1 items-center gap-1.5 min-w-0 justify-start">
											<input
												placeholder={t('admin.dashboard.announcements.footerText')}
												value={emb.footer?.text || ''}
												onChange={(e) => updateEmbed(eIdx, 'footer', { ...emb.footer, text: e.target.value })}
												className="bg-transparent outline-none text-(--text-muted) placeholder:text-(--text-muted)/50 text-[11px]"
												size={Math.max(14, emb.footer?.text?.length || 0)}
											/>
											{emb.timestamp && (
												<>
													<span className="text-(--text-muted) text-[11px] shrink-0 font-bold">•</span>
													<span className="text-(--text-muted) text-[11px] shrink-0 whitespace-nowrap">{new Date(emb.timestamp).toLocaleDateString()}</span>
												</>
											)}
										</div>
									</div>
								</div>
							</div>
						))}

						{embeds.length < 10 && (
							<Button type="button" variant="ghost" onClick={addEmbed} style={{ alignSelf: 'flex-start' }} className="text-xs mt-1">
								<Plus size={14} className="mr-1" /> Add Embed
							</Button>
						)}

						{/* COMPONENTS */}
						<div className="flex flex-col gap-2 mt-4">
							{components.map((row, rIdx) => (
								<div key={rIdx} className="flex gap-2 flex-wrap items-center relative group max-w-xl">
									{row.components.map((btn: any, bIdx: number) => {
										const styleColors = {
											1: 'bg-[#5865F2] hover:bg-[#4752C4]',
											2: 'bg-[#4F545C] hover:bg-[#40444B]',
											3: 'bg-[#2D7D46] hover:bg-[#236337]',
											4: 'bg-[#D83C3E] hover:bg-[#A12D2F]',
											5: 'bg-[#4F545C] hover:bg-[#40444B]',
										} as any;

										return (
											<div
												key={bIdx}
												className={`relative flex items-center ${styleColors[btn.style] || styleColors[2]} text-white px-3 py-1.5 rounded font-medium text-sm transition-colors group/btn`}
											>
												<input
													placeholder={t('admin.dashboard.announcements.label')}
													value={btn.label || ''}
													onChange={(e) => updateButton(rIdx, bIdx, 'label', e.target.value)}
													className="bg-transparent outline-none w-full text-center placeholder:text-white/50 w-20"
												/>

												{/* Editor Popout */}
												<div className="absolute bottom-10 left-0 bg-(--foreground) border border-(--border)/10 p-3 rounded-lg hidden group-hover/btn:flex flex-col gap-2 z-20 w-48 shadow-xl">
													<label className="text-[10px] uppercase font-bold text-(--text-muted)">{t('admin.dashboard.announcements.buttonStyle')}</label>
													<select
														value={btn.style}
														onChange={(e) => updateButton(rIdx, bIdx, 'style', parseInt(e.target.value))}
														className="bg-(--background) text-xs outline-none p-1 rounded text-(--text)"
													>
														<option value={1}>{t('admin.dashboard.announcements.stylePrimary')}</option>
														<option value={2}>{t('admin.dashboard.announcements.styleSecondary')}</option>
														<option value={3}>{t('admin.dashboard.announcements.styleSuccess')}</option>
														<option value={4}>{t('admin.dashboard.announcements.styleDanger')}</option>
														<option value={5}>{t('admin.dashboard.announcements.styleLink')}</option>
													</select>
													<label className="text-[10px] uppercase font-bold text-(--text-muted) mt-1">
														{btn.style === 5 ? t('admin.dashboard.announcements.url') : t('admin.dashboard.announcements.customId')}
													</label>
													{btn.style === 5 ? (
														<input
															placeholder="https://..."
															value={btn.url || ''}
															onChange={(e) => updateButton(rIdx, bIdx, 'url', e.target.value)}
															className="bg-(--background) p-1 rounded text-xs outline-none placeholder:text-(--text-muted) text-(--text)"
														/>
													) : (
														<input
															placeholder="custom_id"
															value={btn.custom_id || ''}
															onChange={(e) => updateButton(rIdx, bIdx, 'custom_id', e.target.value)}
															className="bg-(--background) p-1 rounded text-xs outline-none placeholder:text-(--text-muted) text-(--text)"
														/>
													)}
													<button type="button" onClick={() => removeButton(rIdx, bIdx)} className="text-red-400 text-xs text-left mt-1 hover:text-red-300">
														<Trash size={12} className="inline mr-1 -mt-0.5" /> Remove Button
													</button>
												</div>
											</div>
										);
									})}

									{row.components.length < 5 && (
										<button
											type="button"
											onClick={() => addButtonToRow(rIdx)}
											className="text-[#4F545C] hover:text-(--text) flex items-center justify-center w-8 h-8 rounded border border-dashed border-[#4F545C] transition-colors"
										>
											<Plus size={16} />
										</button>
									)}

									<button type="button" onClick={() => removeActionRow(rIdx)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
										<Trash size={14} />
									</button>
								</div>
							))}

							{components.length < 5 && (
								<Button type="button" variant="ghost" onClick={addActionRow} style={{ alignSelf: 'flex-start' }} className="text-xs mt-1">
									<Plus size={14} className="mr-1" /> Add Action Row
								</Button>
							)}
						</div>
					</div>

					<div className="flex justify-end gap-3 sticky bottom-0 bg-(--foreground)/80 backdrop-blur-md pt-4 pb-2 border-t border-(--border)/10 mt-4">
						<Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
							Cancel
						</Button>
						<Button type="submit" variant="primary" disabled={saving}>
							{saving ? t('admin.dashboard.announcements.saving') : t('admin.dashboard.announcements.savePublish')}
						</Button>
					</div>
				</form>
			</Modal>
		</div>
	);
}
