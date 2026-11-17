/** @format */

export const DEFAULT_STORE_CURRENCY = 'EUR';

export function formatStorePrice(amount: number | null | undefined, currency: string = DEFAULT_STORE_CURRENCY): string {
	if (amount === null || amount === undefined || !Number.isFinite(amount)) return '—';
	const normalizedCurrency = (currency || DEFAULT_STORE_CURRENCY).trim().toUpperCase();
	const roundedCents = Math.round(amount * 100);
	const normalizedAmount = roundedCents / 100;
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: normalizedCurrency,
		minimumFractionDigits: normalizedAmount % 1 === 0 ? 0 : 2,
		maximumFractionDigits: 2,
	}).format(normalizedAmount);
}
