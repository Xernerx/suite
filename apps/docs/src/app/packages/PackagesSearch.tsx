/** @format */
'use client';

import { useState } from 'react';
import { Search, FileCode2, Package, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export type SearchIndexItem = {
	name: string;
	kind: string; // 'Class' | 'Interface' | 'Function'
	packageName: string;
	version: string;
	href: string;
};

export function PackagesSearch({ index }: { index: SearchIndexItem[] }) {
	const [query, setQuery] = useState('');

	const results = query.length > 2 ? index.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())).slice(0, 10) : [];

	return (
		<div className="mb-12 relative z-50">
			<div className="relative">
				<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
					<Search className="h-5 w-5 text-(--text-muted)" />
				</div>
				<input
					type="text"
					className="block w-full pl-11 pr-4 py-4 bg-(--foreground)/30 border border-(--border)/20 rounded-2xl text-(--text) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--accent)/50 transition-all shadow-sm"
					placeholder="Search classes, interfaces, and functions across all latest packages..."
					value={query}
					onChange={(e) => setQuery(e.target.value)}
				/>
			</div>

			{query.length > 2 && (
				<div className="absolute w-full mt-2 bg-(--background) border border-(--border)/20 rounded-2xl shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto">
					{results.length > 0 ? (
						<div className="flex flex-col">
							{results.map((result, i) => (
								<Link
									key={i}
									href={result.href}
									className="flex items-center justify-between p-4 hover:bg-(--foreground)/30 border-b border-(--border)/5 last:border-0 transition-colors"
								>
									<div className="flex items-center gap-3">
										<FileCode2 className={result.kind === 'Class' ? 'text-blue-400' : result.kind === 'Interface' ? 'text-purple-400' : 'text-green-400'} size={20} />
										<div>
											<div className="font-bold text-(--text) font-mono">{result.name}</div>
											<div className="flex items-center gap-1 text-xs text-(--text-muted) mt-1">
												<Package size={12} />
												<span>
													{result.packageName} v{result.version}
												</span>
											</div>
										</div>
									</div>
									<ChevronRight size={16} className="text-(--text-muted)" />
								</Link>
							))}
						</div>
					) : (
						<div className="p-8 text-center text-(--text-muted)">No results found for "{query}".</div>
					)}
				</div>
			)}
		</div>
	);
}
