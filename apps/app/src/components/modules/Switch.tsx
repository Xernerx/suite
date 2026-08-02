/** @format */

import { motion } from 'framer-motion';

type SwitchProps = {
	checked: boolean;
	onChange: (checked: boolean) => void;
	disabled?: boolean;
};

export function Switch({ checked, onChange, disabled = false }: SwitchProps) {
	return (
		<button
			type="button"
			onClick={() => !disabled && onChange(!checked)}
			disabled={disabled}
			className={`relative flex h-5 w-9 items-center rounded-full px-0.5 transition-all duration-200 ${
				disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer opacity-100'
			} ${checked ? 'justify-end' : 'justify-start'}`}
			style={{
				background: checked ? 'var(--accent)' : 'color-mix(in srgb, var(--border) 70%, transparent)',
			}}
		>
			<motion.div layout transition={{ type: 'spring', stiffness: 500, damping: 30 }} className="h-4 w-4 rounded-full bg-white shadow-sm" />
		</button>
	);
}
