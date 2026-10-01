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

export default function SuggestionsPage() {
	const { getEnvUrl } = useEnvironment();
	const { user } = useUser();
	const { toast } = useToast();
	const [suggestions, setSuggestions] = useState([]);
	const [products, setProducts] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [product, setProduct] = useState('');
	const [search, setSearch] = useState('');
	const [showForm, setShowForm] = useState(false);

	const fetchSuggestions = () => {
		fetch(getEnvUrl('https://api.xernerx.com/core/suggestions'))
			.then((res) => res.json())
			.then((d) => setSuggestions(d.data || []))
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
		fetchSuggestions();
	}, [getEnvUrl]);

	const submitSuggestion = async (e: any) => {
		e.preventDefault();
		if (!user) return toast({ type: 'error', title: 'Not Authenticated', description: 'You must be logged in to post.' });
		if (!title || !description || !product) return;

		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/core/suggestions'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ title, description, productId: product }),
			});
			if (res.status === 409) return toast({ type: 'error', title: 'Duplicate', description: 'A suggestion with this exact title already exists!' });
			if (!res.ok) throw new Error('Failed');
			toast({ type: 'success', title: 'Success', description: 'Suggestion submitted!' });
			setTitle('');
			setDescription('');
			setProduct('');
			setSearch('');
			fetchSuggestions();
		} catch (err) {
			toast({ type: 'error', title: 'Error', description: 'Failed to post' });
		}
	};

	const vote = async (id: string, action: 'upvote' | 'downvote') => {
		if (!user) return toast({ type: 'error', title: 'Not Authenticated', description: 'You must be logged in to vote.' });
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/core/suggestions/${id}/vote`), {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ action }),
			});
			if (!res.ok) throw new Error('Failed to vote');
			fetchSuggestions();
		} catch (err) {
			toast({ type: 'error', title: 'Error', description: 'Failed to vote' });
		}
	};

	const filteredSuggestions = useMemo(() => {
		if (!search) return suggestions;
		return suggestions.filter((s: any) => fuzzySearch(search, s.title) || fuzzySearch(search, s.description));
	}, [search, suggestions]);

	if (loading) return <Loading />;

	return (
		<div className="flex flex-col max-w-[1600px] mx-auto w-full p-8 md:p-12 gap-12">
			<div className="text-center">
				<h1 className="text-4xl font-bold mb-4">Feature Sandbox</h1>
				<p className="text-gray-500">Vote on ideas or submit your own. Popular suggestions are reviewed by our team and moved to the roadmap.</p>
			</div>

			<div className={`grid grid-cols-1 ${user && showForm ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-8`}>
				{/* Form (Only show to logged-in users) */}
				{user && showForm && (
					<div className="col-span-1 bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm p-6 rounded-xl flex flex-col gap-4 h-fit">
						<h2 className="text-xl font-bold">New Suggestion</h2>
						<form onSubmit={submitSuggestion} className="flex flex-col gap-4">
							<Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
							<Input variant="textarea" rows={4} placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
							<Selector value={product} options={products.map((p) => ({ value: p, label: p }))} onChange={setProduct} placeholder="Select Product" />
							<div className="flex gap-2 w-full">
								<Button type="submit" className="flex-1">
									Submit
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
					<Input variant="search" placeholder="Search suggestions (e.g. 'discord bot')..." value={search} onChange={(e) => setSearch(e.target.value)} />

					{filteredSuggestions.map((s: any) => {
						const hasUpvoted = user && s.upvotes?.includes(user.id);
						const hasDownvoted = user && s.downvotes?.includes(user.id);
						const netVotes = (s.upvotes?.length || 0) - (s.downvotes?.length || 0);
						return (
							<motion.div key={s.id} layout className="flex gap-4 p-4 rounded-xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm">
								<div className="flex flex-col items-center gap-1 justify-center shrink-0">
									<button
										onClick={() => vote(s.id, 'upvote')}
										className={`p-2 rounded ${hasUpvoted ? 'bg-(--accent) text-white' : 'bg-(--foreground)/50 border border-(--border)/10 hover:border-(--accent)/50 transition-colors'}`}
									>
										▲
									</button>
									<span className="font-bold">{netVotes}</span>
									<button
										onClick={() => vote(s.id, 'downvote')}
										className={`p-2 rounded ${hasDownvoted ? 'bg-red-500 text-white' : 'bg-(--foreground)/50 border border-(--border)/10 hover:border-(--accent)/50 transition-colors'}`}
									>
										▼
									</button>
								</div>
								<div className="flex flex-col justify-center w-full min-w-0">
									<div className="flex justify-between items-start gap-4">
										<div className="font-bold text-lg">{s.title}</div>
										{s.author && (
											<div className="flex items-center gap-2 shrink-0 bg-(--foreground)/50 border border-(--border)/10 rounded-full pr-3 pl-1 py-1">
												{s.author.icon ? (
													<img src={s.author.icon} alt={s.author.name} className="w-6 h-6 rounded-full" />
												) : (
													<div className="w-6 h-6 rounded-full bg-(--accent) flex items-center justify-center text-[10px] text-white font-bold">
														{s.author.name?.charAt(0) || '?'}
													</div>
												)}
												<span className="text-xs text-(--text-muted) font-medium truncate max-w-[100px]">{s.author.name}</span>
											</div>
										)}
									</div>
									<div className="text-gray-500 text-sm mb-2 mt-1">{s.description}</div>
									<span className="text-xs font-mono bg-(--accent)/10 text-(--accent) px-2 py-1 rounded border border-(--accent)/20 w-fit">{s.productId}</span>
								</div>
							</motion.div>
						);
					})}

					{filteredSuggestions.length === 0 && search.trim() && (
						<div className="p-8 text-center border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm rounded-xl flex flex-col items-center justify-center gap-4 text-gray-500">
							<div>No suggestions match "{search}".</div>
							{user ? (
								<Button
									onClick={() => {
										setTitle(search);
										setSearch('');
										setShowForm(true);
										// Optionally focus description here
									}}
								>
									Add as a New Suggestion
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
