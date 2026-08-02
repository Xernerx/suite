/** @format */

'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import { useSession } from 'next-auth/react';
import { useToast } from './ToastProvider';

type User = any;

const UserContext = createContext<any>({});

export function UserProvider({ children }: { children: React.ReactNode }) {
	const { data: session, status }: any = useSession();
	const { toast } = useToast();

	const [user, setUser] = useState<User | null>(null);
	const [guilds, setGuilds] = useState([]);

	useEffect(() => {
		toast('Fetching user info', 'info');
	}, []);

	useEffect(() => {
		if (status !== 'authenticated' || !session) return;

		(async () => {
			const discord = await fetch('/api/v1/discord/users/me/profile')
				.then((res) => res.json())
				.catch(() => {});

			const { guilds } = await fetch(`/api/v1/discord/guilds`)
				.then((res) => res.json())
				.catch(() => ({ guilds: [] }));

			const profile = await fetch(`/api/v1/users/${session.user.id}/profile`)
				.then((res) => res.json())
				.catch(() => {});

			const u = {
				...session,
				...discord,
				...profile,
			};

			setUser(u);

			setGuilds(guilds);
		})();
	}, [status, session]);

	async function updateUser(data: Partial<User>) {
		if (!user?.id) return;

		const optimistic = {
			...user,
			...data,
		};

		setUser(optimistic);

		try {
			const response = await fetch(`/api/v1/users/${user.id}/profile`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				throw new Error('Failed to update user');
			}

			const updated = await response.json();

			setUser((prev: any) => ({
				...prev,
				...updated,
			}));
		} catch (error) {
			console.error(error);

			// rollback
			setUser(user);
		}
	}

	return (
		<UserContext.Provider
			value={{
				user,
				guilds,
				updateUser,
			}}
		>
			{children}
		</UserContext.Provider>
	);
}

export function useUser() {
	return useContext(UserContext);
}
