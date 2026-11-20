/** @format */

import os from 'os';

const VIRTUAL_OR_VPN_ADAPTER_REGEX =
	/warp|cloudflare|tailscale|zerotier|wireguard|nord|mullvad|proton|openvpn|vethernet|wsl|hyper-v|docker|vmware|virtualbox|vbox|hamachi|loopback|utun|tun\d|tap\d|wg\d/i;

export function getLocalIp(): string {
	const interfaces = os.networkInterfaces();
	const candidates: Array<{ name: string; address: string; score: number }> = [];

	for (const [name, list] of Object.entries(interfaces)) {
		for (const iface of list || []) {
			if (iface.family !== 'IPv4' || iface.internal) continue;
			const addr = iface.address;
			if (addr.startsWith('169.254.')) continue; // link-local

			let score = 0;
			if (!VIRTUAL_OR_VPN_ADAPTER_REGEX.test(name)) score += 100;
			if (/wi-?fi|wlan|ethernet|en\d/i.test(name)) score += 20;
			if (addr.startsWith('192.168.')) score += 30;
			else if (addr.startsWith('10.')) score += 20;
			else if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(addr)) score += 5;

			candidates.push({ name, address: addr, score });
		}
	}

	candidates.sort((a, b) => b.score - a.score);
	return candidates[0]?.address || '127.0.0.1';
}
