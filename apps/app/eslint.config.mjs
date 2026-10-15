/** @format */

import { defineConfig, globalIgnores } from 'eslint/config';

import nextTs from 'eslint-config-next/typescript';
import nextVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = defineConfig([
	...nextVitals,
	...nextTs,
	// Override default ignores of eslint-config-next.
	globalIgnores([
		// Default ignores of eslint-config-next:
		'.next/**',
		'out/**',
		'build/**',
		'next-env.d.ts',
	]),
	{
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'react-hooks/set-state-in-effect': 'off',
			'react-hooks/purity': 'off',
		},
	},
]);

export default eslintConfig;
