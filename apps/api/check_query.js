require('dotenv').config({ path: '../../.env' });
const { database } = require('../../packages/lib/src/database.js'); // adjust path if needed

async function test() {
	const db = await database('xernerx');
	const StatModel = db.models.bots.Stat;
	console.log('Connected. Querying...');
	const rawStats = await StatModel.find({ id: '782105629572464652' })
		.select('timestamp createdAt guildCount servers userCount users shardCount voteCount votes onlineSince')
		.sort({ timestamp: -1 })
		.limit(20000)
		.lean();
	console.log('Fetched ' + rawStats.length + ' stats.');
	if (rawStats.length > 0) {
		console.log('First stat:', rawStats[0]);
	}
	process.exit(0);
}
test().catch(console.error);
