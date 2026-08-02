/** @format */

'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type DebugContextType = {
	metadata: {
		debug: boolean;
	};
};

const DebugContext = createContext<DebugContextType | null>(null);

export function DebugProvider({ children }: { children: React.ReactNode }) {
	const [metadata, setMetaData] = useState({ debug: false });

	useEffect(() => {
		setMetaData(window?.electron?.metadata);
	}, []);

	return (
		<DebugContext.Provider value={{ metadata }}>
			{metadata?.debug ? (
				<div className="rounded border-l-2 border-r-2 border-b-2 border-amber-300 w-full h-full">
					<div className="flex justify-center items-center bg-amber-300 text-black">DEBUG MODE</div>
					{children}
				</div>
			) : (
				<>{children}</>
			)}
		</DebugContext.Provider>
	);
}

export function useDebug() {
	const ctx = useContext(DebugContext);

	if (!ctx) throw new Error('DebugProvider missing');

	return ctx;
}
