/** @format */
import React from 'react';
import { Html, Head, Body, Container, Text, Section, Link, Heading } from '@react-email/components';

export interface BasicTemplateProps {
	title: string;
	message: string;
	actionUrl?: string;
	actionText?: string;
}

export function BasicTemplate({ title, message, actionUrl, actionText }: BasicTemplateProps) {
	return (
		<Html>
			<Head />
			<Body style={{ backgroundColor: '#0f0f11', color: '#ffffff', fontFamily: 'sans-serif', margin: 0, padding: '20px' }}>
				<Container style={{ backgroundColor: '#1a1a1d', border: '1px solid #333', borderRadius: '12px', padding: '30px', maxWidth: '600px', margin: '0 auto' }}>
					<Heading style={{ color: '#ffffff', fontSize: '24px', marginBottom: '16px', marginTop: 0 }}>{title}</Heading>

					<Text style={{ color: '#a0a0a0', fontSize: '16px', lineHeight: '24px', marginBottom: '24px' }}>{message}</Text>

					{actionUrl && actionText && (
						<Section style={{ textAlign: 'center', marginTop: '32px' }}>
							<Link
								href={actionUrl}
								style={{
									backgroundColor: '#ffffff',
									color: '#000000',
									padding: '12px 24px',
									borderRadius: '8px',
									textDecoration: 'none',
									fontWeight: 'bold',
									display: 'inline-block',
								}}
							>
								{actionText}
							</Link>
						</Section>
					)}
				</Container>
			</Body>
		</Html>
	);
}
