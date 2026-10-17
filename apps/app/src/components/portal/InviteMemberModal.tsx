/** @format */
'use client';

import { User } from 'lucide-react';
import { Button, Modal } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

interface InviteMemberModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	inviteUserObj: any;
	confirmInviteMember: () => void;
	invitingMember: boolean;
}

export default function InviteMemberModal({ open, onOpenChange, inviteUserObj, confirmInviteMember, invitingMember }: InviteMemberModalProps) {
	const { t } = useDictionary();

	return (
		<Modal open={open} onOpenChange={onOpenChange} title={t('app.portal.modals.invite.title')} description={t('app.portal.modals.invite.desc')}>
			{inviteUserObj && (
				<div className="flex flex-col items-center justify-center gap-4 bg-(--background)/50 p-6 rounded-3xl border border-(--border)/10">
					<div className="flex flex-col gap-2 p-4 bg-(--background)/50 rounded-2xl border border-(--border)/10">
						<div className="flex items-center gap-4">
							{inviteUserObj.avatarUrl ? (
								<img src={inviteUserObj.avatarUrl} alt="Avatar" className="w-12 h-12 rounded-full shadow-sm" />
							) : (
								<div className="w-12 h-12 bg-(--border)/10 rounded-full flex items-center justify-center">
									<User className="text-(--text-muted) w-6 h-6" />
								</div>
							)}
							<div className="flex flex-col">
								<span className="font-bold text-(--text) text-lg">{inviteUserObj.global_name || inviteUserObj.username}</span>
								<span className="text-sm text-(--text-muted)">@{inviteUserObj.username}</span>
							</div>
						</div>

						{inviteUserObj.fullRoles && inviteUserObj.fullRoles.length > 0 && (
							<div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-(--border)/5">
								{inviteUserObj.fullRoles.map((role: any) => (
									<span
										key={role._id || role.id}
										className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-(--accent)/10 text-(--accent) uppercase border border-(--accent)/20"
									>
										{role.name}
									</span>
								))}
							</div>
						)}
					</div>
				</div>
			)}
			<div className="flex justify-end gap-2 mt-4 pt-4 border-t border-(--border)/10">
				<Button variant="ghost" onClick={() => onOpenChange(false)} disabled={invitingMember}>
					{t('app.portal.modals.invite.cancel')}
				</Button>
				<Button variant="primary" onClick={confirmInviteMember} loading={invitingMember}>
					{t('app.portal.modals.invite.confirm')}
				</Button>
			</div>
		</Modal>
	);
}
