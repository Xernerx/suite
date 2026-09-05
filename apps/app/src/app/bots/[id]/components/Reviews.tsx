'use client';

import { useEffect, useState } from 'react';
import { useDictionary, useEnvironment, useUser, useToast } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Button, Confirm } from '@xernerx/ui';
import { Star, Trash2, ShieldCheck, ThumbsUp, ThumbsDown, MessageSquareReply } from 'lucide-react';
import Image from 'next/image';

export default function Reviews({ bot, id }: { bot: any; id: string }) {
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

	const fetchReviews = async () => {
		if (!isReady || !user) {
			setReviewsLoading(false);
			return;
		}
		setReviewsLoading(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${id}/reviews`), { credentials: 'include' });
			if (res.ok) {
				setReviews(await res.json());
			}
		} catch (error) {
			console.error('Failed to fetch reviews', error);
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

	const submitReview = async () => {
		if (!user) return;
		setSubmittingReview(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${id}/reviews`), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ rating: reviewRating, content: reviewContent }),
			});
			if (res.ok) {
				toast({ type: 'success', title: 'Review submitted!' });
				setShowReviewForm(false);
				fetchReviews();
			} else {
				const data = await res.json();
				toast({ type: 'error', title: data.error || 'Failed to submit review' });
			}
		} catch (error) {
			console.error('Failed to submit review', error);
			toast({ type: 'error', title: 'Network error' });
		} finally {
			setSubmittingReview(false);
		}
	};

	const deleteReview = async () => {
		if (!user) return;
		setDeletingReview(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${id}/reviews`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (res.ok) {
				toast({ type: 'success', title: 'Review deleted' });
				setReviewContent('');
				setReviewRating(5);
				setDeleteConfirmOpen(false);
				setShowReviewForm(false);
				fetchReviews();
			} else {
				toast({ type: 'error', title: 'Failed to delete review' });
			}
		} catch (error) {
			toast({ type: 'error', title: 'Network error' });
		} finally {
			setDeletingReview(false);
		}
	};

	const voteReview = async (reviewId: string, action: 'upvote' | 'downvote') => {
		if (!user) return toast({ type: 'error', title: 'You must be logged in' });
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${id}/reviews/${reviewId}`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ action }),
			});
			if (res.ok) fetchReviews();
		} catch (error) {
			console.error('Failed to vote on review', error);
		}
	};

	const submitDevResponse = async (reviewId: string) => {
		if (!user) return;
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${id}/reviews/${reviewId}`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ action: 'devResponse', devResponse: devResponseContent }),
			});
			if (res.ok) {
				toast({ type: 'success', title: 'Response added' });
				setReplyingToReview(null);
				setDevResponseContent('');
				fetchReviews();
			} else {
				toast({ type: 'error', title: 'Failed to add response' });
			}
		} catch (error) {
			toast({ type: 'error', title: 'Network error' });
		}
	};

	if (reviewsLoading) {
		return (
			<div className="flex justify-center p-12 bg-(--foreground)/50 border border-(--border)/10 rounded-3xl">
				<Loading />
			</div>
		);
	}

	const averageRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : 0;
	const userReview = user ? reviews.find((r) => r.userId === user.id) : null;
	const isOwner = user && bot && (bot.owners?.includes(user.id) || (bot.ownersData && bot.ownersData[0]?.id === user.id));

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center gap-6 p-8 bg-(--foreground)/50 border border-(--border)/10 rounded-3xl backdrop-blur-md">
				<div className="flex flex-col items-center justify-center">
					<div className="text-5xl font-extrabold text-(--accent)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{averageRating}
					</div>
					<div className="text-sm font-semibold text-(--text-muted) uppercase tracking-wider mt-1">
						{reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
					</div>
				</div>
				<div className="flex flex-col gap-1 flex-1 max-w-xs">
					{[5, 4, 3, 2, 1].map((star) => {
						const count = reviews.filter((r) => r.rating === star).length;
						const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
						return (
							<div key={star} className="flex items-center gap-3 text-sm">
								<div className="flex items-center gap-1 w-8 text-(--text-muted) font-semibold">
									{star} <Star className="w-3 h-3" />
								</div>
								<div className="flex-1 h-2 bg-(--background) rounded-full overflow-hidden">
									<div className="h-full bg-(--accent)" style={{ width: `${percentage}%` }} />
								</div>
								<div className="w-8 text-right text-(--text-muted) text-xs">{count}</div>
							</div>
						);
					})}
				</div>
			</div>

			{user && !showReviewForm && (
				<div className="flex justify-end">
					<Button variant="primary" onClick={() => setShowReviewForm(true)}>
						{userReview ? 'Edit your Review' : 'Write a Review'}
					</Button>
				</div>
			)}

			{user && showReviewForm && (
				<div className="p-6 bg-(--foreground)/30 border border-(--border)/10 rounded-3xl flex flex-col gap-4">
					<div className="flex items-center justify-between">
						<h3 className="text-xl font-bold font-fredoka">{userReview ? 'Update your Review' : 'Write a Review'}</h3>
						<div className="flex items-center gap-2">
							{userReview && (
								<button onClick={() => setDeleteConfirmOpen(true)} className="text-red-500/70 hover:text-red-500 transition-colors p-1" title="Delete Review">
									<Trash2 className="w-5 h-5" />
								</button>
							)}
							<button onClick={() => setShowReviewForm(false)} className="text-(--text-muted) hover:text-(--foreground) transition-colors p-1" title="Cancel">
								&times;
							</button>
						</div>
					</div>
					<Confirm
						open={deleteConfirmOpen}
						onOpenChange={setDeleteConfirmOpen}
						title="Delete Review"
						description="Are you sure you want to delete your review? This action cannot be undone."
						onConfirm={deleteReview}
						loading={deletingReview}
						variant="danger"
					/>
					<div className="flex items-center gap-2">
						{[1, 2, 3, 4, 5].map((star) => (
							<button
								key={star}
								onClick={() => setReviewRating(star)}
								className={`p-1 transition-colors ${reviewRating >= star ? 'text-(--accent)' : 'text-(--border)/30 hover:text-(--accent)/50'}`}
							>
								<Star className="w-8 h-8 fill-current" />
							</button>
						))}
					</div>
					<textarea
						value={reviewContent}
						onChange={(e) => setReviewContent(e.target.value)}
						placeholder="What do you think about this bot? (Optional)"
						className="w-full bg-(--background) border border-(--border)/10 rounded-xl p-4 text-sm resize-none focus:outline-none focus:border-(--accent) transition-colors h-32"
						maxLength={2000}
					/>
					<div className="flex justify-between items-center">
						<span className="text-xs text-(--text-muted)">{reviewContent.length}/2000 characters</span>
						<div className="flex gap-2">
							<Button variant="outline" onClick={() => setShowReviewForm(false)}>
								Cancel
							</Button>
							<Button variant="primary" onClick={submitReview} loading={submittingReview}>
								{userReview ? 'Update Review' : 'Submit Review'}
							</Button>
						</div>
					</div>
				</div>
			)}

			<div className="flex flex-col gap-4">
				{reviews.map((review) => (
					<div key={review._id} className="p-6 bg-(--foreground)/50 border border-(--border)/10 rounded-3xl flex flex-col gap-3">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<Image
									src={
										review.user?.avatar
											? `https://cdn.discordapp.com/avatars/${review.userId}/${review.user.avatar}.png?size=64`
											: `https://cdn.discordapp.com/embed/avatars/${review.user?.discriminator ? Number(review.user.discriminator) % 5 : 0}.png`
									}
									alt="Avatar"
									width={32}
									height={32}
									className="rounded-full object-cover"
								/>
								<div className="flex flex-col">
									<span className="font-bold text-sm">{review.user?.global_name || review.user?.username || 'Unknown User'}</span>
									<span className="text-xs text-(--text-muted)">{new Date(review.createdAt).toLocaleDateString()}</span>
								</div>
							</div>
							<div className="flex items-center text-(--accent)">
								{[...Array(5)].map((_, i) => (
									<Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-(--border)/30'}`} />
								))}
							</div>
						</div>
						{review.content && <p className="text-sm text-(--text-muted) whitespace-pre-wrap mt-2">{review.content}</p>}

						{review.devResponse && (
							<div className="mt-2 ml-4 p-4 bg-(--background)/50 border-l-2 border-(--accent) rounded-r-xl">
								<div className="flex items-center gap-2 mb-1">
									<ShieldCheck className="w-4 h-4 text-(--accent)" />
									<span className="text-xs font-bold text-(--accent)">Developer Response</span>
								</div>
								<p className="text-sm text-(--text-muted) whitespace-pre-wrap">{review.devResponse}</p>
							</div>
						)}

						<div className="flex items-center gap-4 mt-2 pt-3 border-t border-(--border)/10">
							<div className="flex items-center gap-2">
								<button
									onClick={() => voteReview(review._id, 'upvote')}
									className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md transition-colors ${review.upvotes?.includes(user?.id) ? 'bg-green-500/20 text-green-500' : 'text-(--text-muted) hover:bg-(--foreground)'}`}
								>
									<ThumbsUp className="w-3.5 h-3.5" />
									{review.upvotes?.length || 0}
								</button>
								<button
									onClick={() => voteReview(review._id, 'downvote')}
									className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md transition-colors ${review.downvotes?.includes(user?.id) ? 'bg-red-500/20 text-red-500' : 'text-(--text-muted) hover:bg-(--foreground)'}`}
								>
									<ThumbsDown className="w-3.5 h-3.5" />
									{review.downvotes?.length || 0}
								</button>
							</div>

							{isOwner && !review.devResponse && (
								<button
									onClick={() => setReplyingToReview(replyingToReview === review._id ? null : review._id)}
									className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md text-(--text-muted) hover:bg-(--foreground) transition-colors ml-auto"
								>
									<MessageSquareReply className="w-3.5 h-3.5" />
									Reply
								</button>
							)}
						</div>

						{replyingToReview === review._id && (
							<div className="mt-2 flex flex-col gap-2">
								<textarea
									value={devResponseContent}
									onChange={(e) => setDevResponseContent(e.target.value)}
									placeholder="Write your response as the developer..."
									className="w-full bg-(--background) border border-(--border)/10 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-(--accent) transition-colors h-24"
									maxLength={2000}
								/>
								<div className="flex justify-end gap-2">
									<Button variant="outline" onClick={() => setReplyingToReview(null)}>
										Cancel
									</Button>
									<Button variant="primary" onClick={() => submitDevResponse(review._id)}>
										Submit Response
									</Button>
								</div>
							</div>
						)}
					</div>
				))}
				{reviews.length === 0 && (
					<div className="text-center text-(--text-muted) py-12 border border-dashed border-(--border)/10 rounded-3xl bg-(--foreground)/30">No reviews yet. Be the first to review!</div>
				)}
			</div>
		</div>
	);
}
