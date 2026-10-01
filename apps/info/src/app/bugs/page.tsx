'use client';
import { useState, useEffect, useMemo } from 'react';
import { useEnvironment, useUser, useToast } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Button, Selector, Input } from '@xernerx/ui';
import { motion } from 'framer-motion';

function fuzzySearch(query: string, text: string) {
	if (!query) return true;
	const q = query.toLowerCase().replace(/\s+/g, '');
	const t = text.toLowerCase();
	let i = 0,
		j = 0;
	while (i < q.length && j < t.length) {
		if (q[i] === t[j]) i++;
		j++;
	}
	return i === q.length;
}

export default function BugsPage() {
	const { getEnvUrl } = useEnvironment();
	const { user } = useUser();
	const { toast } = useToast();
	const [bugs, setBugs] = useState([]);
	const [products, setProducts] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [product, setProduct] = useState('');
	const [search, setSearch] = useState('');
	const [showForm, setShowForm] = useState(false);
	const [attachment, setAttachment] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);

	const fetchBugs = () => {
		fetch(getEnvUrl('https://api.xernerx.com/core/issues'))
			.then((res) => res.json())
			.then((d) => setBugs(d.data || []))
			.catch((err) => toast({ type: 'error', title: 'Error', description: err.message }));

		fetch(getEnvUrl('https://api.xernerx.com/core/roadmap/products'))
			.then((res) => res.json())
			.then((d) => {
				setProducts(d.data || []);
				setLoading(false);
			})
			.catch((err) => setLoading(false));
	};

	useEffect(() => {
		fetchBugs();
	}, [getEnvUrl]);

	const submitBug = async (e: any) => {
		e.preventDefault();
		if (!user) return toast({ type: 'error', title: 'Not Authenticated', description: 'You must be logged in to post.' });
		if (!title || !description || !product) return;

		setUploading(true);
		let finalDescription = description;

		try {
			if (attachment) {
				const formData = new FormData();
				formData.append('file', attachment);

				const cdnRes = await fetch(getEnvUrl('https://cdn.xernerx.com/upload'), {
					method: 'POST',
					credentials: 'include',
					body: formData,
				});

				if (!cdnRes.ok) {
					const errText = await cdnRes.text();
					throw new Error(errText || 'Failed to upload attachment');
				}

				const cdnData = await cdnRes.json();
				if (cdnData.url) {
					finalDescription += `\n\n**Attachment:** [${attachment.name}](${cdnData.url})`;
				}
			}
		} catch (err: any) {
			setUploading(false);
			return toast({ type: 'error', title: 'Upload Failed', description: err.message });
		}

		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/core/issues'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ title, description: finalDescription, productId: product }),
			});
			if (res.status === 409) return toast({ type: 'error', title: 'Duplicate', description: 'A bug with this exact title already exists!' });
			if (!res.ok) throw new Error('Failed');
			toast({ type: 'success', title: 'Success', description: 'Bug submitted!' });
			setTitle('');
			setDescription('');
			setProduct('');
			setSearch('');
			setAttachment(null);
			setUploading(false);
			fetchBugs();
		} catch (err) {
			setUploading(false);
			toast({ type: 'error', title: 'Error', description: 'Failed to post' });
		}
	};

	const filteredBugs = useMemo(() => {
		if (!search) return bugs;
		return bugs.filter((s: any) => fuzzySearch(search, s.title) || fuzzySearch(search, s.description));
	}, [search, bugs]);

	if (loading) return <Loading />;

	return (
		<div className="flex flex-col max-w-[1600px] mx-auto w-full p-8 md:p-12 gap-12">
			<div className="text-center">
				<h1 className="text-4xl font-bold mb-4">Bug Tracker</h1>
				<p className="text-gray-500">Report bugs or issues you encounter. Bugs are reviewed by our team and moved to the known issues list once verified.</p>
			</div>

			<div className={`grid grid-cols-1 ${user && showForm ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-8`}>
				{/* Form (Only show to logged-in users) */}
				{user && showForm && (
					<div className="col-span-1 bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm p-6 rounded-xl flex flex-col gap-4 h-fit">
						<h2 className="text-xl font-bold">New Bug</h2>
						<form onSubmit={submitBug} className="flex flex-col gap-4">
							<Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
							<Input variant="textarea" rows={4} placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
							<Selector value={product} options={products.map((p) => ({ value: p, label: p }))} onChange={setProduct} placeholder="Select Product" />
							<div className="flex flex-col gap-2">
								<label className="text-xs font-bold text-(--text-muted) uppercase">Attach Screenshot/Log (Optional)</label>
								<input
									type="file"
									onChange={(e) => setAttachment(e.target.files?.[0] || null)}
									className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-(--accent) file:text-white hover:file:bg-(--accent)/80"
									accept="image/*,.txt,.log,.json"
								/>
							</div>
							<div className="flex gap-2 w-full">
								<Button type="submit" className="flex-1" disabled={uploading}>
									{uploading ? 'Uploading...' : 'Submit'}
								</Button>
								<Button variant="danger" type="button" onClick={() => setShowForm(false)}>
									Cancel
								</Button>
							</div>
						</form>
					</div>
				)}

				{/* List & Search */}
				<div className={`flex flex-col gap-4 ${user && showForm ? 'col-span-2' : 'col-span-1 max-w-3xl mx-auto w-full'}`}>
					<Input variant="search" placeholder="Search bugs (e.g. 'login error')..." value={search} onChange={(e) => setSearch(e.target.value)} />

					{filteredBugs.map((s: any) => {
						return (
							<motion.div key={s.id} layout className="flex gap-4 p-4 rounded-xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm">
								<div className="flex flex-col justify-center w-full min-w-0">
									<div className="flex justify-between items-start gap-4">
										<div className="font-bold text-lg">{s.title}</div>
									</div>
									<div className="text-gray-500 text-sm mb-2 mt-1 whitespace-pre-wrap">{s.description}</div>
									<div className="flex items-center gap-2 mt-2 bg-(--background)/50 w-fit px-2 py-1 rounded-md border border-(--border)/10">
										<span className={`w-2 h-2 rounded-full ${s.status === 'resolved' ? 'bg-green-500' : s.acknowledged ? 'bg-blue-500' : 'bg-red-500'}`}></span>
										<span className="text-xs uppercase font-bold text-(--text-muted)">{s.status === 'resolved' ? 'Resolved' : s.acknowledged ? 'Verified' : 'Pending Review'}</span>
									</div>

									<span className="text-xs font-mono bg-(--accent)/10 text-(--accent) px-2 py-1 rounded border border-(--accent)/20 w-fit">{s.productId}</span>
								</div>
							</motion.div>
						);
					})}

					{filteredBugs.length === 0 && search.trim() && (
						<div className="p-8 text-center border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm rounded-xl flex flex-col items-center justify-center gap-4 text-gray-500">
							<div>No bugs match "{search}".</div>
							{user ? (
								<Button
									onClick={() => {
										setTitle(search);
										setSearch('');
										setShowForm(true);
										// Optionally focus description here
									}}
								>
									Report as a New Bug
								</Button>
							) : (
								<div>Log in to submit this as a new idea!</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
