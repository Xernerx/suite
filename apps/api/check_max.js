const mongoose = require('mongoose');
const MONGO_LEGACY = 'mongodb+srv://Dummi:20Dummi05!@0.gp8rax4.mongodb.net/';
mongoose
	.createConnection(MONGO_LEGACY)
	.asPromise()
	.then(async (conn) => {
		const db = conn.useDb('stats');
		const maxStat = await db
			.collection('bots')
			.find({ id: '782105629572464652', guildCount: { $gte: 18000 } })
			.sort({ timestamp: -1 })
			.limit(1)
			.toArray();
		console.log('MAX STAT:', JSON.stringify(maxStat, null, 2));
		process.exit(0);
	});
