/** @format */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { database } from '@xernerx/lib/server';
import { auth } from '@xernerx/lib';
import { getServerSession } from 'next-auth';
import { MediaActions } from '@/components/MediaActions';
import { UnauthorizedView } from '@/components/UnauthorizedView';
import { MediaFileDownload } from '@/components/MediaFileDownload';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
	const { id } = await params;
	const { models } = await database('xernerx');
	const MediaModel = models.core.Media;

	const media = await MediaModel.findById(id);

	if (!media || media.privacy === 'private') {
		return {
			title: 'File Not Found or Private',
		};
	}

	const domain = process.env.DOMAIN || 'xernerx.com';
	const isDev = process.env.ENVIRONMENT === 'DEVELOPMENT';
	const baseUrl = isDev ? `https://cdn.dev.${domain}` : `https://cdn.${domain}`;
	const rawUrl = `${baseUrl}/raw/${id}`;

	if (media.mimeType?.startsWith('image/')) {
		return {
			title: media.filename || 'Image',
			openGraph: {
				images: [rawUrl],
			},
			twitter: {
				card: 'summary_large_image',
				images: [rawUrl],
			},
		};
	}

	if (media.mimeType?.startsWith('video/')) {
		return {
			title: media.filename || 'Video',
			openGraph: {
				videos: [{ url: rawUrl }],
			},
		};
	}

	return {
		title: media.filename || 'File',
	};
}

export default async function MediaViewPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const { models } = await database('xernerx');
	const MediaModel = models.core.Media;
	const RoleModel = models.core.Role;

	const media = await MediaModel.findById(id);
	if (!media) {
		notFound();
	}

	const domain = process.env.DOMAIN || 'xernerx.com';
	const isDev = process.env.ENVIRONMENT === 'DEVELOPMENT';
	const baseUrl = isDev ? `https://cdn.dev.${domain}` : `https://cdn.${domain}`;
	const accountUrl = isDev ? `https://account.dev.${domain}` : `https://account.${domain}`;
	const currentUrl = `${baseUrl}/view/${id}`;

	// Privacy checks
	if (media.privacy === 'private') {
		const session = await getServerSession(auth);
		const userId = (session?.user as any)?.id;

		if (!userId) {
			return <UnauthorizedView signedIn={false} accountUrl={accountUrl} currentUrl={currentUrl} />;
		}

		const UserModel = models.users.User;
		const user = await UserModel.findOne({ id: userId }).lean();
		const roleIds = user?.roles || [];

		const roles = await RoleModel.find({ id: { $in: roleIds } });
		const canManage = roles.some((r) => r.permissions?.manageMedia);

		if (media.uploaderId !== userId && !media.shared?.includes(userId) && !canManage) {
			return <UnauthorizedView signedIn={true} accountUrl={accountUrl} currentUrl={currentUrl} />;
		}
	}

	const rawUrl = `${baseUrl}/raw/${id}`;

	return (
		<div className="fixed inset-0 z-[9999] bg-(--background) flex flex-col items-center justify-center overflow-hidden group">
			<MediaActions rawUrl={rawUrl} />
			{media.mimeType?.startsWith('image/') ? (
				// eslint-disable-next-line @next/next/no-img-element
				<img src={rawUrl} alt={media.filename} className="object-contain w-full h-full" />
			) : media.mimeType?.startsWith('video/') ? (
				<video src={rawUrl} controls className="max-w-full max-h-full outline-none" />
			) : (
				<MediaFileDownload rawUrl={rawUrl} mimeType={media.mimeType} />
			)}
		</div>
	);
}
