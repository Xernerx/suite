import { notFound } from 'next/navigation';
import { database } from '@xernerx/lib/server';
import { auth } from '@xernerx/lib';
import { getServerSession } from 'next-auth';
import { Download, ShieldAlert } from 'lucide-react';
import { Button } from '@xernerx/ui';

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

	const UnauthorizedView = ({ signedIn }: { signedIn: boolean }) => (
		<div className="fixed inset-0 z-[9999] bg-(--background) flex flex-col items-center justify-center p-4">
			<div className="flex flex-col items-center gap-4 text-center max-w-sm">
				<div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
					<ShieldAlert size={40} />
				</div>
				<h1 className="text-2xl font-bold text-(--text)">{signedIn ? 'Forbidden' : 'Unauthorized'}</h1>
				<p className="text-sm text-(--text-muted)">This file is private. You do not have permission to view it.</p>
				{signedIn ? (
					<a href={accountUrl} className="mt-4">
						<Button variant="primary">Return to Library</Button>
					</a>
				) : (
					<a href={`${accountUrl}/login?callbackUrl=${encodeURIComponent(currentUrl)}`} className="mt-4">
						<Button variant="primary">Sign In</Button>
					</a>
				)}
			</div>
		</div>
	);

	// Privacy checks
	if (media.privacy === 'private') {
		const session = await getServerSession(auth);
		const userId = (session?.user as any)?.id;

		if (!userId) {
			return <UnauthorizedView signedIn={false} />;
		}

		const UserModel = models.users.User;
		const user = await UserModel.findOne({ id: userId }).lean();
		const roleIds = user?.roles || [];

		const roles = await RoleModel.find({ id: { $in: roleIds } });
		const canManage = roles.some((r) => r.permissions?.manageMedia);

		if (media.uploaderId !== userId && !media.shared?.includes(userId) && !canManage) {
			return <UnauthorizedView signedIn={true} />;
		}
	}

	const rawUrl = `${baseUrl}/raw/${id}`;

	return (
		<div className="fixed inset-0 z-[9999] bg-(--background) flex flex-col items-center justify-center overflow-hidden">
			{media.mimeType?.startsWith('image/') ? (
				// eslint-disable-next-line @next/next/no-img-element
				<img src={rawUrl} alt={media.filename} className="object-contain w-full h-full" />
			) : media.mimeType?.startsWith('video/') ? (
				<video src={rawUrl} controls className="max-w-full max-h-full outline-none" />
			) : (
				<div className="flex flex-col items-center gap-4 text-(--text-muted)">
					<div className="font-mono text-xl">{media.mimeType || 'Unknown File Type'}</div>
					<a href={rawUrl} download>
						<Button variant="primary">
							<Download size={16} /> Download File
						</Button>
					</a>
				</div>
			)}
		</div>
	);
}
