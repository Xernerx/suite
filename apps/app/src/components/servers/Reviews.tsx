/** @format */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { UserProfilePopover } from '@xernerx/components';
import { useDictionary, useEnvironment, useToast, useUser } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Button, Confirm, Input } from '@xernerx/ui';
import { MessageSquareReply, ShieldCheck, Star, ThumbsDown, ThumbsUp, Trash2, X } from 'lucide-react';
import Image from 'next/image';

export interface ServerReviewsProps {
	server: any;
	id: string;
	canManageServer?: boolean;
}

export function ServerReviews({ server, id, canManageServer = false }: ServerReviewsProps) {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { user } = useUser();
	const { toast } = useToast();

	const [reviews, setReviews] = useState<any[]>([]);
	const [reviewRating, setReviewRating] = useState(5);
	const [reviewContent, setReviewContent] = useState('');
	const [submittingReview, setSubmittingReview] = useState(false);
	const [replyingToReview, setReplyingToReview] = useState<string | null>(null);
	const [devResponseContent, setDevResponseContent] = useState('');
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [deletingReview, setDeletingReview] = useState(false);
	const [showReviewForm, setShowReviewForm] = useState(false);
	const [reviewsLoading, setReviewsLoading] = useState(true);
	const [selectedStarFilter, setSelectedStarFilter] = useState<number | null>(null);
	const [sortBy, setSortBy] = useState<'helpful' | 'newest' | 'highest' | 'lowest'>('helpful');

	const fetchReviews = async () => {
		if (!isReady) {
			setReviewsLoading(false);
			return;
		}
		setReviewsLoading(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${id}/reviews`), { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				setReviews(Array.isArray(data) ? data : Array.isArray(data?.reviews) ? data.reviews : []);
			}
		} catch (error) {
			console.error('Failed to fetch server reviews', error);
		} finally {
			setReviewsLoading(false);
		}
	};

	useEffect(() => {
		fetchReviews();
	}, [id, getEnvUrl, isReady, user]);

	useEffect(() => {
		if (user) {
			const userReview = reviews.find((r) => r.userId === user.id);
			if (userReview && reviewContent === '' && reviewRating === 5) {
				setReviewRating(userReview.rating);
				setReviewContent(userReview.content || '');
			}
		}
	}, [reviews, user]);

	const displayedReviews = useMemo(() => {
		const filtered = selectedStarFilter ? reviews.filter((r) => r.rating === selectedStarFilter) : [...reviews];
		return filtered.sort((a, b) => {
			if (sortBy === 'helpful') {
				const scoreA = (a.upvotes?.length || 0) - (a.downvotes?.length || 0);
				const scoreB = (b.upvotes?.length || 0) - (b.downvotes?.length || 0);
				if (scoreB !== scoreA) return scoreB - scoreA;
			} else if (sortBy === 'highest') {
				if (b.rating !== a.rating) return b.rating - a.rating;
			} else if (sortBy === 'lowest') {
				if (a.rating !== b.rating) return a.rating - b.rating;
			}
			return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
		});
	}, [reviews, selectedStarFilter, sortBy]);

	const submitReview = async () => {
		if (!user) return;
		setSubmittingReview(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${id}/reviews`), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ rating: reviewRating, content: reviewContent }),
			});
			if (res.ok) {
				toast({ type: 'success', title: t('app.servers.reviews.toast.submitted') });
				setShowReviewForm(false);
				fetchReviews();
			} else {
				const data = await res.json().catch(() => ({}));
				toast({ type: 'error', title: data.error || t('app.servers.reviews.toast.submitFailed') });
			}
		} catch (error) {
			console.error('Failed to submit server review', error);
			toast({ type: 'error', title: t('app.bots.reviews.toast.networkError') });
		} finally {
			setSubmittingReview(false);
		}
	};

	const deleteReview = async () => {
		if (!user) return;
		setDeletingReview(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${id}/reviews`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (res.ok) {
				toast({ type: 'success', title: t('app.servers.reviews.toast.deleted') });
				setReviewContent('');
				setReviewRating(5);
				setDeleteConfirmOpen(false);
				setShowReviewForm(false);
				fetchReviews();
			} else {
				toast({ type: 'error', title: t('app.bots.reviews.toast.deleteFailed') });
			}
		} catch (error) {
			toast({ type: 'error', title: t('app.bots.reviews.toast.networkError') });
		} finally {
			setDeletingReview(false);
		}
	};

	const voteReview = async (reviewId: string, action: 'upvote' | 'downvote') => {
		if (!user) return toast({ type: 'error', title: t('app.bots.reviews.toast.loginRequired') });
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${id}/reviews/${reviewId}`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ action }),
			});
			if (res.ok) fetchReviews();
		} catch (error) {
			console.error('Failed to vote on server review', error);
		}
	};

	const submitOwnerResponse = async (reviewId: string) => {
		if (!user) return;
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${id}/reviews/${reviewId}`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ action: 'devResponse', devResponse: devResponseContent, reply: devResponseContent }),
			});
			if (res.ok) {
				toast({ type: 'success', title: t('app.servers.reviews.toast.responseAdded') });
				setReplyingToReview(null);
				setDevResponseContent('');
				fetchReviews();
			} else {
				toast({ type: 'error', title: t('app.bots.reviews.toast.responseFailed') });
			}
		} catch (error) {
			toast({ type: 'error', title: t('app.bots.reviews.toast.networkError') });
		}
	};

	if (reviewsLoading) {
		return (
			<div className="flex justify-center p-12 bg-(--foreground)/50 border border-(--border)/10 rounded-3xl">
				<Loading variant="small" />
			</div>
		);
	}

	const averageRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : 0;
	const userReview = user ? reviews.find((r) => r.userId === user.id) : null;
	const isOwner = Boolean(canManageServer || (user && server && (server.owner === user.id || server.ownerId === user.id || (Array.isArray(server.owners) && server.owners.includes(user.id)))));

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 bg-(--foreground)/50 border border-(--border)/10 rounded-3xl backdrop-blur-md">
				<div className="flex items-center gap-6 flex-1">
					<div className="flex flex-col items-center justify-center">
						<div className="text-5xl font-extrabold text-(--accent)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{averageRating}
						</div>
						<div className="text-sm font-semibold text-(--text-muted) uppercase tracking-wider mt-1">
							{reviews.length} {reviews.length === 1 ? t('app.bots.reviews.review') : t('app.bots.reviews.reviews')}
						</div>
					</div>
					<div className="flex flex-col gap-1.5 flex-1 max-w-xs">
						{[5, 4, 3, 2, 1].map((star) => {
							const count = reviews.filter((r) => r.rating === star).length;
							const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
							const isSelected = selectedStarFilter === star;
							return (
								<button
									key={star}
									type="button"
									onClick={() => setSelectedStarFilter((prev) => (prev === star ? null : star))}
									className={`flex items-center gap-3 text-sm px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
										isSelected ? 'bg-(--accent)/15 ring-1 ring-(--accent)/40' : 'hover:bg-(--background)/60'
									}`}
								>
									<div className={`flex items-center gap-1 w-8 font-semibold ${isSelected ? 'text-(--accent)' : 'text-(--text-muted)'}`}>
										{star} <Star className="w-3 h-3 fill-current" />
									</div>
									<div className="flex-1 h-2 bg-(--background) rounded-full overflow-hidden">
										<div className="h-full bg-(--accent) transition-all duration-300" style={{ width: `${percentage}%` }} />
									</div>
									<div className={`w-8 text-right text-xs font-mono ${isSelected ? 'text-(--accent) font-bold' : 'text-(--text-muted)'}`}>{count}</div>
								</button>
							);
						})}
					</div>
				</div>

				<div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between gap-3">
					{user && !showReviewForm && (
						<Button variant="primary" onClick={() => setShowReviewForm(true)}>
							{userReview ? t('app.bots.reviews.editReview') : t('app.bots.reviews.writeReview')}
						</Button>
					)}
					{reviews.length > 0 && (
						<div className="flex flex-wrap items-center gap-1.5 bg-(--background)/60 p-1.5 rounded-xl border border-(--border)/10">
							{(
								[
									{ key: 'helpful', label: t('app.bots.reviews.sortMostHelpful') },
									{ key: 'newest', label: t('app.bots.reviews.sortNewest') },
									{ key: 'highest', label: t('app.bots.reviews.sortHighest') },
									{ key: 'lowest', label: t('app.bots.reviews.sortLowest') },
								] as const
							).map((s) => (
								<button
									key={s.key}
									type="button"
									onClick={() => setSortBy(s.key)}
									className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
										sortBy === s.key ? 'bg-(--accent) text-white' : 'text-(--text-muted) hover:text-(--text)'
									}`}
								>
									{s.label}
								</button>
							))}
						</div>
					)}
				</div>
			</div>

			{selectedStarFilter !== null && (
				<div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-(--accent)/10 border border-(--accent)/20 text-xs font-semibold text-(--accent)">
					<span className="flex items-center gap-1.5">
						<Star className="w-3.5 h-3.5 fill-current" />
						{t('app.bots.reviews.showingStarFilter', { star: selectedStarFilter })} ({displayedReviews.length})
					</span>
					<button type="button" onClick={() => setSelectedStarFilter(null)} className="inline-flex items-center gap-1 hover:underline cursor-pointer">
						<X className="w-3.5 h-3.5" />
						{t('app.bots.reviews.clearFilter')}
					</button>
				</div>
			)}

			{user && showReviewForm && (
				<div className="p-6 bg-(--foreground)/30 border border-(--border)/10 rounded-3xl flex flex-col gap-4">
					<div className="flex items-center justify-between">
						<h2 className="text-xl font-bold font-fredoka">{userReview ? t('app.bots.reviews.updateYourReview') : t('app.bots.reviews.writeReview')}</h2>
						<div className="flex items-center gap-2">
							{userReview && (
								<button
									type="button"
									onClick={() => setDeleteConfirmOpen(true)}
									className="text-(--accent-red)/70 hover:text-(--accent-red) transition-colors p-1"
									title={t('app.bots.reviews.deleteReview')}
									aria-label={t('app.bots.reviews.deleteReview')}
								>
									<Trash2 className="w-5 h-5" />
								</button>
							)}
							<button
								type="button"
								onClick={() => setShowReviewForm(false)}
								className="text-(--text-muted) hover:text-(--foreground) transition-colors p-1"
								title={t('common.buttons.cancel')}
								aria-label={t('common.buttons.cancel')}
							>
								&times;
							</button>
						</div>
					</div>
					<Confirm
						open={deleteConfirmOpen}
						onOpenChange={setDeleteConfirmOpen}
						title={t('app.bots.reviews.deleteReview')}
						description={t('app.bots.reviews.deleteConfirmDesc')}
						confirmText={t('common.buttons.delete')}
						cancelText={t('common.buttons.cancel')}
						onConfirm={deleteReview}
						loading={deletingReview}
						variant="danger"
					/>
					<div className="flex items-center gap-2">
						{[1, 2, 3, 4, 5].map((star) => (
							<button
								key={star}
								type="button"
								onClick={() => setReviewRating(star)}
								className={`p-1 transition-colors ${reviewRating >= star ? 'text-(--accent)' : 'text-(--border)/30 hover:text-(--accent)/50'}`}
							>
								<Star className="w-8 h-8 fill-current" />
							</button>
						))}
					</div>
					<Input
						variant="textarea"
						value={reviewContent}
						onChange={(e) => setReviewContent(e.target.value)}
						placeholder={t('app.servers.reviews.placeholder')}
						className="resize-none h-32"
						maxLength={2000}
					/>
					<div className="flex justify-between items-center">
						<span className="text-xs text-(--text-muted)">
							{reviewContent.length}/2000 {t('app.bots.reviews.characters')}
						</span>
						<div className="flex gap-2">
							<Button variant="outline" onClick={() => setShowReviewForm(false)}>
								{t('common.buttons.cancel')}
							</Button>
							<Button variant="primary" onClick={submitReview} loading={submittingReview}>
								{userReview ? t('app.bots.reviews.updateReview') : t('app.bots.reviews.submitReview')}
							</Button>
						</div>
					</div>
				</div>
			)}

			<div className="flex flex-col gap-4">
				{displayedReviews.map((review) => {
					const ownerReply = review.devResponse || review.reply;
					const reviewKey = review._id || review.id || review.userId;
					return (
						<div key={reviewKey} className="p-6 bg-(--foreground)/50 border border-(--border)/10 rounded-3xl flex flex-col gap-3">
							<div className="flex items-center justify-between">
								<UserProfilePopover userId={review.userId} initialUser={review.user}>
									<div className="flex items-center gap-3 group">
										<Image
											src={
												review.user?.avatar
													? `https://cdn.discordapp.com/avatars/${review.userId}/${review.user.avatar}.png?size=64`
													: `https://cdn.discordapp.com/embed/avatars/${review.user?.discriminator ? Number(review.user.discriminator) % 5 : 0}.png`
											}
											alt="Avatar"
											width={32}
											height={32}
											className="rounded-full object-cover group-hover:ring-2 group-hover:ring-(--accent)/50 transition-all"
										/>
										<div className="flex flex-col text-left">
											<span className="font-bold text-sm group-hover:text-(--accent) transition-colors">
												{review.user?.global_name || review.user?.username || t('common.unknownUser')}
											</span>
											<span className="text-xs text-(--text-muted)">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}</span>
										</div>
									</div>
								</UserProfilePopover>
								<div className="flex items-center text-(--accent)">
									{[...Array(5)].map((_, i) => (
										<Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-(--border)/30'}`} />
									))}
								</div>
							</div>
							{review.content && <p className="text-sm text-(--text-muted) whitespace-pre-wrap mt-2">{review.content}</p>}

							{ownerReply && (
								<div className="mt-2 ml-4 p-4 bg-(--background)/50 border-l-2 border-(--accent) rounded-r-xl">
									<div className="flex items-center gap-2 mb-1">
										<ShieldCheck className="w-4 h-4 text-(--accent)" />
										<span className="text-xs font-bold text-(--accent)">{t('app.servers.reviews.ownerResponse')}</span>
									</div>
									<p className="text-sm text-(--text-muted) whitespace-pre-wrap">{ownerReply}</p>
								</div>
							)}

							<div className="flex items-center gap-4 mt-2 pt-3 border-t border-(--border)/10">
								<div className="flex items-center gap-2">
									<button
										type="button"
										onClick={() => voteReview(review._id || review.id, 'upvote')}
										className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-xl transition-colors ${
											review.upvotes?.includes(user?.id) ? 'bg-(--accent-green)/20 text-(--accent-green)' : 'text-(--text-muted) hover:bg-(--foreground)'
										}`}
									>
										<ThumbsUp className="w-3.5 h-3.5" />
										{review.upvotes?.length || 0}
									</button>
									<button
										type="button"
										onClick={() => voteReview(review._id || review.id, 'downvote')}
										className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-xl transition-colors ${
											review.downvotes?.includes(user?.id) ? 'bg-(--accent-red)/20 text-(--accent-red)' : 'text-(--text-muted) hover:bg-(--foreground)'
										}`}
									>
										<ThumbsDown className="w-3.5 h-3.5" />
										{review.downvotes?.length || 0}
									</button>
								</div>

								{isOwner && !ownerReply && (
									<button
										type="button"
										onClick={() => setReplyingToReview(replyingToReview === (review._id || review.id) ? null : review._id || review.id)}
										className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-xl text-(--text-muted) hover:bg-(--foreground) transition-colors ml-auto"
									>
										<MessageSquareReply className="w-3.5 h-3.5" />
										{t('app.bots.reviews.reply')}
									</button>
								)}
							</div>

							{replyingToReview === (review._id || review.id) && (
								<div className="mt-2 flex flex-col gap-2">
									<Input
										variant="textarea"
										value={devResponseContent}
										onChange={(e) => setDevResponseContent(e.target.value)}
										placeholder={t('app.servers.reviews.replyPlaceholder')}
										className="resize-none h-24"
										maxLength={2000}
									/>
									<div className="flex justify-end gap-2">
										<Button variant="outline" onClick={() => setReplyingToReview(null)}>
											{t('common.buttons.cancel')}
										</Button>
										<Button variant="primary" onClick={() => submitOwnerResponse(review._id || review.id)}>
											{t('app.bots.reviews.submitResponse')}
										</Button>
									</div>
								</div>
							)}
						</div>
					);
				})}
				{reviews.length === 0 ? (
					<div className="text-center text-(--text-muted) py-12 border border-dashed border-(--border)/10 rounded-3xl bg-(--foreground)/30">{t('app.servers.reviews.noReviews')}</div>
				) : displayedReviews.length === 0 && selectedStarFilter !== null ? (
					<div className="text-center text-(--text-muted) py-12 border border-dashed border-(--border)/10 rounded-3xl bg-(--foreground)/30">
						{t('app.bots.reviews.noFilteredReviews', { star: selectedStarFilter })}
					</div>
				) : null}
			</div>
		</div>
	);
}

export default ServerReviews;
