/** @format */

export const getFlagCode = (localeCode: string) => {
	switch (localeCode) {
		case 'en-GB':
			return 'uk';
		case 'en-US':
			return 'us';
		default:
			return localeCode;
	}
};

export function flattenObject(obj: any, prefix = ''): Record<string, string> {
	const flattened: Record<string, string> = {};
	for (const k in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, k)) {
			const pre = prefix.length ? prefix + '.' : '';
			if (typeof obj[k] === 'object' && obj[k] !== null) {
				Object.assign(flattened, flattenObject(obj[k], pre + k));
			} else {
				flattened[pre + k] = String(obj[k]);
			}
		}
	}
	return flattened;
}

export function unflattenObject(data: Record<string, string>) {
	const result: any = {};
	for (const p in data) {
		if (Object.prototype.hasOwnProperty.call(data, p)) {
			const val = data[p];
			if (val === undefined || val === null || val.trim() === '') {
				continue;
			}
			let schema = result;
			const arr = p.split('.');
			for (let i = 0; i < arr.length; i++) {
				const elem = arr[i];
				if (schema[elem] === undefined) {
					const nextElem = arr[i + 1];
					schema[elem] = i === arr.length - 1 ? val : /^\d+$/.test(nextElem) ? [] : {};
				}
				schema = schema[elem];
			}
		}
	}
	return result;
}
