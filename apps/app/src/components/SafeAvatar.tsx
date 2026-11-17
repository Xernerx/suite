/** @format */
'use client';

import React, { useState } from 'react';
import Image from 'next/image';

export interface SafeAvatarProps {
	src?: string | null;
	alt: string;
	width?: number;
	height?: number;
	fill?: boolean;
	className?: string;
	unoptimized?: boolean;
	fallback?: React.ReactNode;
}

export function SafeAvatar({ src, alt, width = 48, height = 48, fill = false, className = '', unoptimized = true, fallback = null }: SafeAvatarProps) {
	const [erroredSrc, setErroredSrc] = useState<string | null>(null);

	if (!src || erroredSrc === src) {
		return <>{fallback}</>;
	}

	if (fill) {
		return <Image src={src} alt={alt} fill unoptimized={unoptimized} className={className} onError={() => setErroredSrc(src)} />;
	}

	return <Image src={src} alt={alt} width={width} height={height} unoptimized={unoptimized} className={className} onError={() => setErroredSrc(src)} />;
}

export default SafeAvatar;
