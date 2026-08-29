/** @format */

export interface TimezoneOption {
	value: string;
	label: string;
	offset: string;
	region: string;
}

export const timezones: TimezoneOption[] = [
	{ value: 'UTC', label: 'UTC', offset: '+00:00', region: 'UTC' },
	{ value: 'Europe/Brussels', label: 'Brussels', offset: '+02:00', region: 'Europe' },
	{ value: 'Europe/Amsterdam', label: 'Amsterdam', offset: '+02:00', region: 'Europe' },
	{ value: 'Europe/Berlin', label: 'Berlin', offset: '+02:00', region: 'Europe' },
	{ value: 'Europe/Paris', label: 'Paris', offset: '+02:00', region: 'Europe' },
	{ value: 'Europe/London', label: 'London', offset: '+01:00', region: 'Europe' },
	{ value: 'Europe/Dublin', label: 'Dublin', offset: '+01:00', region: 'Europe' },
	{ value: 'Europe/Madrid', label: 'Madrid', offset: '+02:00', region: 'Europe' },
	{ value: 'Europe/Rome', label: 'Rome', offset: '+02:00', region: 'Europe' },
	{ value: 'Europe/Zurich', label: 'Zurich', offset: '+02:00', region: 'Europe' },
	{ value: 'Europe/Vienna', label: 'Vienna', offset: '+02:00', region: 'Europe' },
	{ value: 'Europe/Warsaw', label: 'Warsaw', offset: '+02:00', region: 'Europe' },
	{ value: 'Europe/Stockholm', label: 'Stockholm', offset: '+02:00', region: 'Europe' },
	{ value: 'Europe/Oslo', label: 'Oslo', offset: '+02:00', region: 'Europe' },
	{ value: 'Europe/Copenhagen', label: 'Copenhagen', offset: '+02:00', region: 'Europe' },
	{ value: 'Europe/Helsinki', label: 'Helsinki', offset: '+03:00', region: 'Europe' },
	{ value: 'Europe/Athens', label: 'Athens', offset: '+03:00', region: 'Europe' },
	{ value: 'Europe/Bucharest', label: 'Bucharest', offset: '+03:00', region: 'Europe' },
	{ value: 'Europe/Kyiv', label: 'Kyiv', offset: '+03:00', region: 'Europe' },
	{ value: 'Europe/Moscow', label: 'Moscow', offset: '+03:00', region: 'Europe' },
	{ value: 'Europe/Istanbul', label: 'Istanbul', offset: '+03:00', region: 'Europe' },
	{ value: 'America/New_York', label: 'New York (Eastern)', offset: '-04:00', region: 'America' },
	{ value: 'America/Chicago', label: 'Chicago (Central)', offset: '-05:00', region: 'America' },
	{ value: 'America/Denver', label: 'Denver (Mountain)', offset: '-06:00', region: 'America' },
	{ value: 'America/Los_Angeles', label: 'Los Angeles (Pacific)', offset: '-07:00', region: 'America' },
	{ value: 'America/Anchorage', label: 'Anchorage', offset: '-08:00', region: 'America' },
	{ value: 'America/Honolulu', label: 'Honolulu', offset: '-10:00', region: 'America' },
	{ value: 'America/Toronto', label: 'Toronto', offset: '-04:00', region: 'America' },
	{ value: 'America/Vancouver', label: 'Vancouver', offset: '-07:00', region: 'America' },
	{ value: 'America/Mexico_City', label: 'Mexico City', offset: '-06:00', region: 'America' },
	{ value: 'America/Sao_Paulo', label: 'São Paulo', offset: '-03:00', region: 'America' },
	{ value: 'America/Buenos_Aires', label: 'Buenos Aires', offset: '-03:00', region: 'America' },
	{ value: 'Asia/Tokyo', label: 'Tokyo', offset: '+09:00', region: 'Asia' },
	{ value: 'Asia/Shanghai', label: 'Shanghai', offset: '+08:00', region: 'Asia' },
	{ value: 'Asia/Hong_Kong', label: 'Hong Kong', offset: '+08:00', region: 'Asia' },
	{ value: 'Asia/Singapore', label: 'Singapore', offset: '+08:00', region: 'Asia' },
	{ value: 'Asia/Dubai', label: 'Dubai', offset: '+04:00', region: 'Asia' },
	{ value: 'Asia/Kolkata', label: 'Kolkata (India)', offset: '+05:30', region: 'Asia' },
	{ value: 'Asia/Seoul', label: 'Seoul', offset: '+09:00', region: 'Asia' },
	{ value: 'Asia/Bangkok', label: 'Bangkok', offset: '+07:00', region: 'Asia' },
	{ value: 'Australia/Sydney', label: 'Sydney', offset: '+10:00', region: 'Australia' },
	{ value: 'Australia/Melbourne', label: 'Melbourne', offset: '+10:00', region: 'Australia' },
	{ value: 'Australia/Brisbane', label: 'Brisbane', offset: '+10:00', region: 'Australia' },
	{ value: 'Australia/Perth', label: 'Perth', offset: '+08:00', region: 'Australia' },
	{ value: 'Pacific/Auckland', label: 'Auckland', offset: '+12:00', region: 'Pacific' },
	{ value: 'Africa/Cairo', label: 'Cairo', offset: '+02:00', region: 'Africa' },
	{ value: 'Africa/Johannesburg', label: 'Johannesburg', offset: '+02:00', region: 'Africa' },
	{ value: 'Africa/Lagos', label: 'Lagos', offset: '+01:00', region: 'Africa' },
];
