/** @format */
'use client';

import { Eye, FileText, Trash2, Upload } from 'lucide-react';
import { CodeBlock } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import { EndpointSection } from '@/components/api/EndpointSection';

interface CdnEndpointsProps {
	searchQuery?: string;
	methodFilter?: string;
	activeGroup?: string;
}

export function CdnEndpoints({ searchQuery = '', methodFilter = 'ALL', activeGroup = 'all' }: CdnEndpointsProps) {
	const { t } = useDictionary();

	const showUpload = activeGroup === 'all' || activeGroup === 'upload';
	const showList = activeGroup === 'all' || activeGroup === 'list';
	const showManage = activeGroup === 'all' || activeGroup === 'manage';
	const showProxy = activeGroup === 'all' || activeGroup === 'proxy';

	return (
		<div className="space-y-8">
			{showUpload && (
				<EndpointSection
					id="upload"
					title={t('docs.cdn.upload.title')}
					icon={Upload}
					description={t('docs.cdn.upload.description')}
					baseUrl="https://cdn.xernerx.com"
					searchQuery={searchQuery}
					methodFilter={methodFilter}
					routes={[
						{ method: 'POST', path: '/upload', auth: 'token', summary: t('docs.cdn.upload.summaryNew') },
						{ method: 'POST', path: '/upload/[id]', auth: 'token', summary: t('docs.cdn.upload.summaryScoped') },
					]}
					extra={
						<div className="p-6 border-t border-(--border)/10 space-y-6">
							<div>
								<h4 className="text-sm font-semibold text-(--text) mb-3">{t('docs.cdn.upload.formFields')} (multipart/form-data)</h4>
								<div className="overflow-x-auto rounded-2xl border border-(--border)/10 bg-(--background)/50 p-4">
									<table className="w-full text-left text-sm border-collapse">
										<thead>
											<tr className="border-b border-(--border)/10 text-(--text-muted)">
												<th className="pb-2 font-medium">{t('docs.cdn.table.field')}</th>
												<th className="pb-2 font-medium">{t('docs.cdn.table.type')}</th>
												<th className="pb-2 font-medium">{t('docs.cdn.table.required')}</th>
												<th className="pb-2 font-medium">{t('docs.cdn.table.description')}</th>
											</tr>
										</thead>
										<tbody className="text-(--text)">
											<tr className="border-b border-(--border)/5">
												<td className="py-3 font-mono text-(--accent)">file</td>
												<td className="py-3 font-mono">File / Blob</td>
												<td className="py-3 text-(--accent-red)">{t('docs.cdn.table.yes')}</td>
												<td className="py-3 text-(--text-muted)">{t('docs.cdn.upload.fields.fileDesc')}</td>
											</tr>
											<tr className="border-b border-(--border)/5">
												<td className="py-3 font-mono text-(--accent)">privacy</td>
												<td className="py-3 font-mono">String</td>
												<td className="py-3 text-(--text-muted)">{t('docs.cdn.table.no')}</td>
												<td className="py-3 text-(--text-muted)">
													{t('docs.cdn.upload.fields.privacyDesc1')}
													<code>public</code>
													{t('docs.cdn.upload.fields.privacyDesc2')}
													<code>limited</code>
													{t('docs.cdn.upload.fields.privacyDesc3')}
													<code>private</code>
													{t('docs.cdn.upload.fields.privacyDesc4')}
												</td>
											</tr>
											<tr>
												<td className="py-3 font-mono text-(--accent)">shared</td>
												<td className="py-3 font-mono">JSON String</td>
												<td className="py-3 text-(--text-muted)">{t('docs.cdn.table.no')}</td>
												<td className="py-3 text-(--text-muted)">{t('docs.cdn.upload.fields.sharedDesc')}</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>

							<div className="rounded-2xl overflow-hidden border border-(--border)/10 text-sm">
								<CodeBlock
									tabs={[
										{
											label: 'JavaScript (fetch)',
											language: 'javascript',
											code: `const formData = new FormData();\nformData.append('file', fileInput.files[0]);\nformData.append('privacy', 'public');\nformData.append('shared', JSON.stringify([]));\n\nconst response = await fetch('https://cdn.xernerx.com/upload', {\n  method: 'POST',\n  credentials: 'include',\n  body: formData,\n});\nconst data = await response.json();`,
										},
										{
											label: 'Response (200 OK)',
											language: 'json',
											code: `{\n  "success": true,\n  "url": "https://cdn.xernerx.com/raw/1775645526466",\n  "data": {\n    "_id": "69d62e5641da700a5ab521cb",\n    "id": "1775645526466",\n    "ownerId": "482513687417061376",\n    "name": "banner.png",\n    "type": "image/png",\n    "size": 245819,\n    "privacy": "public",\n    "shared": [],\n    "createdAt": 1775645526466\n  }\n}`,
										},
									]}
								/>
							</div>
						</div>
					}
				/>
			)}

			{showList && (
				<EndpointSection
					id="list"
					title={t('docs.cdn.list.title')}
					icon={FileText}
					description={t('docs.cdn.list.description')}
					baseUrl="https://cdn.xernerx.com"
					searchQuery={searchQuery}
					methodFilter={methodFilter}
					routes={[
						{ method: 'GET', path: '/media', auth: 'token', summary: t('docs.cdn.list.summaryOwned') },
						{ method: 'GET', path: '/media?admin=true', auth: 'secure', summary: t('docs.cdn.list.summaryAdmin') },
					]}
					extra={
						<div className="p-6 border-t border-(--border)/10 space-y-6">
							<div>
								<h4 className="text-sm font-semibold text-(--text) mb-3">{t('docs.cdn.list.queryParams')}</h4>
								<div className="overflow-x-auto rounded-2xl border border-(--border)/10 bg-(--background)/50 p-4">
									<table className="w-full text-left text-sm border-collapse">
										<thead>
											<tr className="border-b border-(--border)/10 text-(--text-muted)">
												<th className="pb-2 font-medium">{t('docs.cdn.table.parameter')}</th>
												<th className="pb-2 font-medium">{t('docs.cdn.table.type')}</th>
												<th className="pb-2 font-medium">{t('docs.cdn.table.description')}</th>
											</tr>
										</thead>
										<tbody className="text-(--text)">
											<tr>
												<td className="py-3 font-mono text-(--accent)">admin</td>
												<td className="py-3 font-mono">Boolean</td>
												<td className="py-3 text-(--text-muted)">
													{t('docs.cdn.list.params.adminDesc1')}
													<code>true</code>
													{t('docs.cdn.list.params.adminDesc2')}
													<code>manageMedia</code>
													{t('docs.cdn.list.params.adminDesc3')}
												</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>

							<div className="rounded-2xl overflow-hidden border border-(--border)/10 text-sm">
								<CodeBlock
									tabs={[
										{
											label: 'JavaScript (fetch)',
											language: 'javascript',
											code: `const response = await fetch('https://cdn.xernerx.com/media', {\n  method: 'GET',\n  credentials: 'include',\n});\nconst { data } = await response.json();`,
										},
										{
											label: 'Response (200 OK)',
											language: 'json',
											code: `{\n  "data": [\n    {\n      "_id": "69d62e5641da700a5ab521cb",\n      "id": "1775645526466",\n      "ownerId": "482513687417061376",\n      "name": "banner.png",\n      "type": "image/png",\n      "size": 245819,\n      "privacy": "public",\n      "shared": [],\n      "createdAt": 1775645526466\n    }\n  ]\n}`,
										},
									]}
								/>
							</div>
						</div>
					}
				/>
			)}

			{showManage && (
				<EndpointSection
					id="manage"
					title={t('docs.cdn.manage.title')}
					icon={Trash2}
					description={t('docs.cdn.manage.description')}
					baseUrl="https://cdn.xernerx.com"
					searchQuery={searchQuery}
					methodFilter={methodFilter}
					routes={[
						{ method: 'PATCH', path: '/media/[id]', auth: 'token', summary: t('docs.cdn.manage.summaryPatch') },
						{ method: 'DELETE', path: '/media/[id]', auth: 'token', summary: t('docs.cdn.manage.summaryDelete') },
					]}
					extra={
						<div className="p-6 border-t border-(--border)/10 space-y-6">
							<div>
								<h4 className="text-sm font-semibold text-(--text) mb-3">{t('docs.cdn.manage.jsonBodyParams')} (PATCH)</h4>
								<div className="overflow-x-auto rounded-2xl border border-(--border)/10 bg-(--background)/50 p-4">
									<table className="w-full text-left text-sm border-collapse">
										<thead>
											<tr className="border-b border-(--border)/10 text-(--text-muted)">
												<th className="pb-2 font-medium">{t('docs.cdn.table.field')}</th>
												<th className="pb-2 font-medium">{t('docs.cdn.table.type')}</th>
												<th className="pb-2 font-medium">{t('docs.cdn.table.description')}</th>
											</tr>
										</thead>
										<tbody className="text-(--text)">
											<tr className="border-b border-(--border)/5">
												<td className="py-3 font-mono text-(--accent)">privacy</td>
												<td className="py-3 font-mono">String</td>
												<td className="py-3 text-(--text-muted)">
													{t('docs.cdn.manage.fields.privacyDesc1')}
													<code>public</code>
													{t('docs.cdn.manage.fields.privacyDesc2')}
													<code>limited</code>
													{t('docs.cdn.manage.fields.privacyDesc3')}
													<code>private</code>
													{t('docs.cdn.manage.fields.privacyDesc4')}
												</td>
											</tr>
											<tr>
												<td className="py-3 font-mono text-(--accent)">shared</td>
												<td className="py-3 font-mono">Array&lt;String&gt;</td>
												<td className="py-3 text-(--text-muted)">{t('docs.cdn.manage.fields.sharedDesc')}</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>

							<p className="text-xs text-(--text-muted) leading-relaxed">
								{t('docs.cdn.manage.deleteDesc1')}
								<code className="text-(--accent) font-mono">manageMedia</code>
								{t('docs.cdn.manage.deleteDesc2')}
							</p>

							<div className="rounded-2xl overflow-hidden border border-(--border)/10 text-sm">
								<CodeBlock
									tabs={[
										{
											label: 'PATCH /media/[id]',
											language: 'javascript',
											code: `await fetch('https://cdn.xernerx.com/media/1775645526466', {\n  method: 'PATCH',\n  credentials: 'include',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({\n    privacy: 'limited',\n    shared: ['482513687417061376'],\n  }),\n});`,
										},
										{
											label: 'DELETE /media/[id]',
											language: 'javascript',
											code: `await fetch('https://cdn.xernerx.com/media/1775645526466', {\n  method: 'DELETE',\n  credentials: 'include',\n});`,
										},
									]}
								/>
							</div>
						</div>
					}
				/>
			)}

			{showProxy && (
				<EndpointSection
					id="proxy"
					title={t('docs.cdn.proxy.title')}
					icon={Eye}
					description={t('docs.cdn.proxy.description')}
					baseUrl="https://cdn.xernerx.com"
					searchQuery={searchQuery}
					methodFilter={methodFilter}
					routes={[
						{ method: 'GET', path: '/raw/[id]', auth: 'public', summary: t('docs.cdn.proxy.summaryRaw') },
						{ method: 'GET', path: '/view/[id]', auth: 'public', summary: t('docs.cdn.proxy.summaryView') },
					]}
					extra={
						<div className="p-6 border-t border-(--border)/10 space-y-6">
							<p className="text-sm text-(--text-muted) leading-relaxed">
								{t('docs.cdn.proxy.details1')}
								<code className="px-1.5 py-0.5 rounded-lg bg-(--background)/80 text-(--accent) font-mono">Content-Type</code>
								{t('docs.cdn.proxy.details2')}
								<code className="px-1.5 py-0.5 rounded-lg bg-(--background)/80 text-(--accent) font-mono">ownerId</code>
								{t('docs.cdn.proxy.details3')}
								<code className="px-1.5 py-0.5 rounded-lg bg-(--background)/80 text-(--accent) font-mono">shared</code>
								{t('docs.cdn.proxy.details4')}
								<code className="px-1.5 py-0.5 rounded-lg bg-(--background)/80 text-(--accent) font-mono">manageMedia</code>
								{t('docs.cdn.proxy.details5')}
							</p>

							<div className="rounded-2xl overflow-hidden border border-(--border)/10 text-sm">
								<CodeBlock
									tabs={[
										{
											label: 'HTML / Image Tag',
											language: 'html',
											code: `<img src="https://cdn.xernerx.com/raw/1775645526466" alt="Media Asset" />`,
										},
										{
											label: 'Markdown',
											language: 'markdown',
											code: `![Media Asset](https://cdn.xernerx.com/raw/1775645526466)`,
										},
									]}
								/>
							</div>
						</div>
					}
				/>
			)}
		</div>
	);
}
