/** @format */

import { redirect } from 'next/navigation';

export default async function BugsRedirectPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
	const resolved = await searchParams;
	const qs = new URLSearchParams();
	if (resolved) {
		for (const [key, val] of Object.entries(resolved)) {
			if (Array.isArray(val)) {
				val.forEach((v) => qs.append(key, v));
			} else if (typeof val === 'string') {
				qs.set(key, val);
			}
		}
	}
	const queryStr = qs.toString();
	redirect(queryStr ? `/issues?${queryStr}` : '/issues');
}
