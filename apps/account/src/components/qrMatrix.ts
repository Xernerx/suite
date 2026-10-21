/** @format */

// Pure ISO/IEC 18004 QR Code Matrix Generator (Byte Mode, ECC Level L, Versions 1–6)
const VERSION_SPEC: Record<number, { size: number; totalCodewords: number; dataCodewords: number; ecCodewords: number; align: number[] }> = {
	1: { size: 21, totalCodewords: 26, dataCodewords: 19, ecCodewords: 7, align: [] },
	2: { size: 25, totalCodewords: 44, dataCodewords: 34, ecCodewords: 10, align: [6, 18] },
	3: { size: 29, totalCodewords: 70, dataCodewords: 55, ecCodewords: 15, align: [6, 22] },
	4: { size: 33, totalCodewords: 100, dataCodewords: 80, ecCodewords: 20, align: [6, 26] },
	5: { size: 37, totalCodewords: 134, dataCodewords: 108, ecCodewords: 26, align: [6, 30] },
	6: { size: 41, totalCodewords: 172, dataCodewords: 136, ecCodewords: 18, align: [6, 34] }, // 2 blocks of (68, 18)
};

function gfMul(a: number, b: number): number {
	let p = 0;
	let x = a;
	let y = b;
	for (let i = 0; i < 8; i++) {
		if (y & 1) p ^= x;
		const hi = x & 0x80;
		x = (x << 1) & 0xff;
		if (hi) x ^= 0x11d;
		y >>= 1;
	}
	return p;
}

function rsGeneratorPoly(degree: number): number[] {
	let poly = [1];
	let root = 1;
	for (let i = 0; i < degree; i++) {
		const next = new Array(poly.length + 1).fill(0);
		for (let j = 0; j < poly.length; j++) {
			next[j] ^= poly[j];
			next[j + 1] ^= gfMul(poly[j], root);
		}
		poly = next;
		root = gfMul(root, 2);
	}
	return poly;
}

function rsEncode(data: number[], ecLen: number): number[] {
	const gen = rsGeneratorPoly(ecLen);
	const rem = new Array(ecLen).fill(0);
	for (const byte of data) {
		const factor = byte ^ rem[0];
		rem.shift();
		rem.push(0);
		for (let i = 0; i < ecLen; i++) {
			rem[i] ^= gfMul(gen[i + 1], factor);
		}
	}
	return rem;
}

export function generateQrMatrix(text: string): boolean[][] {
	const bytes = Array.from(new TextEncoder().encode(text));
	let version = 1;
	while (version <= 5 && bytes.length + 2 > VERSION_SPEC[version].dataCodewords) {
		version++;
	}
	if (version > 5) version = 5;

	const spec = VERSION_SPEC[version];
	const { size, dataCodewords, ecCodewords, align } = spec;

	// Build bit stream: 0100 (Byte mode) + 8-bit length + bytes + terminator + pad
	const bits: number[] = [0, 1, 0, 0];
	const len = Math.min(bytes.length, dataCodewords - 2);
	for (let i = 7; i >= 0; i--) bits.push((len >> i) & 1);
	for (let idx = 0; idx < len; idx++) {
		const b = bytes[idx];
		for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
	}
	for (let i = 0; i < 4 && bits.length < dataCodewords * 8; i++) bits.push(0);
	while (bits.length % 8 !== 0) bits.push(0);

	const dataBytes: number[] = [];
	for (let i = 0; i < bits.length; i += 8) {
		let val = 0;
		for (let j = 0; j < 8; j++) val = (val << 1) | bits[i + j];
		dataBytes.push(val);
	}
	let padToggle = true;
	while (dataBytes.length < dataCodewords) {
		dataBytes.push(padToggle ? 0xec : 0x11);
		padToggle = !padToggle;
	}

	const ecBytes = rsEncode(dataBytes, ecCodewords);
	const allBytes = [...dataBytes, ...ecBytes];

	const modules: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));
	const isFunc: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));

	const setFunction = (r: number, c: number, dark: boolean) => {
		if (r >= 0 && r < size && c >= 0 && c < size) {
			modules[r][c] = dark;
			isFunc[r][c] = true;
		}
	};

	const drawFinder = (r0: number, c0: number) => {
		for (let dr = -1; dr <= 7; dr++) {
			for (let dc = -1; dc <= 7; dc++) {
				const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6 && (dr === 0 || dr === 6 || dc === 0 || dc === 6);
				const inInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
				setFunction(r0 + dr, c0 + dc, inOuter || inInner);
			}
		}
	};

	drawFinder(0, 0);
	drawFinder(0, size - 7);
	drawFinder(size - 7, 0);

	// Timing patterns
	for (let i = 8; i < size - 8; i++) {
		setFunction(6, i, i % 2 === 0);
		setFunction(i, 6, i % 2 === 0);
	}

	// Alignment patterns
	for (const r of align) {
		for (const c of align) {
			if ((r === 6 && c === 6) || (r === 6 && c === size - 7) || (r === size - 7 && c === 6)) continue;
			for (let dr = -2; dr <= 2; dr++) {
				for (let dc = -2; dc <= 2; dc++) {
					const dark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
					setFunction(r + dr, c + dc, dark);
				}
			}
		}
	}

	// Reserve format info & dark module
	for (let i = 0; i < 9; i++) {
		if (i !== 6) {
			isFunc[8][i] = true;
			isFunc[i][8] = true;
		}
	}
	for (let i = 0; i < 8; i++) {
		isFunc[8][size - 1 - i] = true;
		isFunc[size - 1 - i][8] = true;
	}
	setFunction(size - 8, 8, true);

	// Place data bits in zigzag
	let bitIdx = 0;
	const totalBits = allBytes.length * 8;
	for (let right = size - 1; right >= 1; right -= 2) {
		if (right === 6) right = 5;
		for (let vert = 0; vert < size; vert++) {
			for (let j = 0; j < 2; j++) {
				const c = right - j;
				const upward = ((right + 1) & 2) === 0;
				const r = upward ? size - 1 - vert : vert;
				if (!isFunc[r][c]) {
					let dark = false;
					if (bitIdx < totalBits) {
						dark = ((allBytes[bitIdx >> 3] >> (7 - (bitIdx & 7))) & 1) !== 0;
						bitIdx++;
					}
					// Apply Mask 0: (r + c) % 2 === 0
					if ((r + c) % 2 === 0) dark = !dark;
					modules[r][c] = dark;
				}
			}
		}
	}

	// Format bits for ECC Level L (01) + Mask 0 (000) => 0x77c4 (111011111000100)
	const formatBits = 0x77c4;
	const getFormatBit = (idx: number) => ((formatBits >> idx) & 1) !== 0;

	for (let i = 0; i <= 5; i++) modules[i][8] = getFormatBit(i);
	modules[7][8] = getFormatBit(6);
	modules[8][8] = getFormatBit(7);
	modules[8][7] = getFormatBit(8);
	for (let i = 9; i < 15; i++) modules[8][14 - i] = getFormatBit(i);

	for (let i = 0; i < 8; i++) modules[8][size - 1 - i] = getFormatBit(i);
	for (let i = 8; i < 15; i++) modules[size - 15 + i][8] = getFormatBit(i);

	return modules;
}
