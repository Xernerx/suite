const mongoose = require('mongoose');

async function run() {
	await mongoose.connect('mongodb+srv://Dummi:20Dummi05!@0.a3ghveg.mongodb.net/', { dbName: 'bots' });
	const db = mongoose.connection.db;
	const botsCol = db.collection('bots.profiles');
	const statsCol = db.collection('stats');

	console.log('Backfilling vote counts...');
	const bots = await botsCol.find({}).toArray();
	for (const bot of bots) {
		if (bot.voteCount) {
			await statsCol.updateMany({ id: bot.id, $or: [{ voteCount: { $exists: false } }, { voteCount: 0 }] }, { $set: { voteCount: bot.voteCount } });
		}
	}
	console.log('Backfill complete!');
	process.exit(0);
}

run().catch(console.error);
