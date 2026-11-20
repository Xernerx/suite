/** @format */

export type ButtonLinkVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonLinkSize = 'sm' | 'md' | 'lg' | 'icon';

const BASE_STYLES =
	'inline-flex items-center justify-center rounded-2xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background) active:scale-95';

const VARIANT_STYLES: Record<ButtonLinkVariant, string> = {
	primary:
		'bg-(--accent) text-(--accent-contrast) border border-(--border)/15 shadow-sm hover:bg-(--hover-accent) hover:shadow-[0_0_15px_color-mix(in_srgb,var(--accent-readable,var(--accent))_40%,transparent)]',
	secondary: 'border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md text-(--text) shadow-sm hover:bg-(--foreground)/50 hover:border-(--accent)/50',
	outline: 'border border-(--border)/10 bg-transparent text-(--text) hover:bg-(--foreground)/30 hover:backdrop-blur-md',
	ghost: 'bg-transparent text-(--text) hover:bg-(--foreground)/30 hover:backdrop-blur-md hover:text-(--text)',
	danger: 'bg-(--accent-red)/10 text-(--accent-red) border border-(--accent-red)/20 hover:bg-(--accent-red)/20 shadow-sm',
};

const SIZE_STYLES: Record<ButtonLinkSize, string> = {
	sm: 'h-8 px-3 text-xs gap-1.5',
	md: 'h-10 px-4 text-sm gap-2',
	lg: 'h-12 px-6 text-base gap-2.5',
	icon: 'h-10 w-10 shrink-0',
};

export function getButtonLinkClasses(variant: ButtonLinkVariant = 'primary', size: ButtonLinkSize = 'md', className = ''): string {
	return `${BASE_STYLES} ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${className}`.trim();
}
