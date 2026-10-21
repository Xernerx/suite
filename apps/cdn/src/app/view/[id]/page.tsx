/** @format */
import type { Metadata } from 'next';
import Image from 'next/image';
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
			description: 'This media asset is private or does not exist on the Xernerx Studios Content Delivery Network.',
			alternates: { canonical: `/view/${id}` },
			robots: { index: false, follow: false },
		};
	}

	const domain = process.env.DOMAIN || 'xernerx.com';
	const isDev = process.env.ENVIRONMENT === 'DEVELOPMENT';
	const baseUrl = isDev ? `https://cdn.dev.${domain}` : `https://cdn.${domain}`;
	const rawUrl = `${baseUrl}/raw/${id}`;
	const description = `View or download ${media.filename || 'media asset'} (${media.mimeType || 'file'}) hosted on the Xernerx Studios Content Delivery Network.`;

	if (media.mimeType?.startsWith('image/')) {
		return {
			title: media.filename || 'Image Asset',
			description,
			alternates: { canonical: `/view/${id}` },
			openGraph: {
				title: `Xernerx CDN | ${media.filename || 'Image Asset'}`,
				description,
				url: `${baseUrl}/view/${id}`,
				siteName: 'Xernerx CDN',
				images: [rawUrl],
			},
			twitter: {
				card: 'summary_large_image',
				title: `Xernerx CDN | ${media.filename || 'Image Asset'}`,
				description,
				images: [rawUrl],
			},
		};
	}

	if (media.mimeType?.startsWith('video/')) {
		return {
			title: media.filename || 'Video Asset',
			description,
			alternates: { canonical: `/view/${id}` },
			openGraph: {
				title: `Xernerx CDN | ${media.filename || 'Video Asset'}`,
				description,
				url: `${baseUrl}/view/${id}`,
				siteName: 'Xernerx CDN',
				videos: [{ url: rawUrl }],
			},
		};
	}

	return {
		title: media.filename || 'File Asset',
		description,
		alternates: { canonical: `/view/${id}` },
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
			<h1 className="sr-only">{media.filename || 'Media Asset'}</h1>
			<MediaActions rawUrl={rawUrl} />
			{media.mimeType?.startsWith('image/') ? (
				<Image src={rawUrl} alt={media.filename} fill unoptimized className="object-contain" />
			) : media.mimeType?.startsWith('video/') ? (
				<video src={rawUrl} controls className="max-w-full max-h-full outline-none" />
			) : (
				<MediaFileDownload rawUrl={rawUrl} mimeType={media.mimeType} />
			)}
		</div>
	);
}
