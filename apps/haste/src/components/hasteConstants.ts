/** @format */

export interface HasteAuthor {
	id: string;
	name: string;
	image?: string | null;
	verified?: boolean;
}

export interface HasteDocumentItem {
	id: string;
	key: string;
	userId: string;
	title: string;
	content?: string;
	preview?: string;
	language: string;
	privacy: 'public' | 'limited' | 'private';
	views: number;
	size: number;
	expiresIn: '1h' | '24h' | '7d' | '30d' | 'never';
	expiresAt: number | null;
	createdAt: number;
	updatedAt: number;
	url: string;
	rawUrl: string;
	isOwner: boolean;
	author?: HasteAuthor;
}

export const HASTE_LANGUAGES = [
	{ value: 'typescript', label: 'TypeScript (.ts)' },
	{ value: 'javascript', label: 'JavaScript (.js)' },
	{ value: 'json', label: 'JSON (.json)' },
	{ value: 'python', label: 'Python (.py)' },
	{ value: 'bash', label: 'Bash / Shell (.sh)' },
	{ value: 'markdown', label: 'Markdown (.md)' },
	{ value: 'html', label: 'HTML (.html)' },
	{ value: 'css', label: 'CSS (.css)' },
	{ value: 'sql', label: 'SQL (.sql)' },
	{ value: 'yaml', label: 'YAML (.yml)' },
	{ value: 'rust', label: 'Rust (.rs)' },
	{ value: 'go', label: 'Go (.go)' },
	{ value: 'java', label: 'Java (.java)' },
	{ value: 'csharp', label: 'C# (.cs)' },
	{ value: 'cpp', label: 'C++ (.cpp)' },
	{ value: 'php', label: 'PHP (.php)' },
	{ value: 'ruby', label: 'Ruby (.rb)' },
	{ value: 'dockerfile', label: 'Dockerfile' },
	{ value: 'plaintext', label: 'Plain Text (.txt)' },
] as const;

export const HASTE_FILE_EXTENSION_MAP: Record<string, string> = {
	typescript: 'ts',
	javascript: 'js',
	json: 'json',
	python: 'py',
	bash: 'sh',
	markdown: 'md',
	html: 'html',
	css: 'css',
	sql: 'sql',
	yaml: 'yml',
	rust: 'rs',
	go: 'go',
	java: 'java',
	csharp: 'cs',
	cpp: 'cpp',
	php: 'php',
	ruby: 'rb',
	dockerfile: 'Dockerfile',
	plaintext: 'txt',
};

export function formatBytes(bytes: number): string {
	if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
	if (bytes < 1024) return `${bytes} B`;
	const kb = bytes / 1024;
	if (kb < 1024) return `${kb.toFixed(1)} KB`;
	return `${(kb / 1024).toFixed(2)} MB`;
}
