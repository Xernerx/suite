const mongoose = require('mongoose');

async function run() {
	await mongoose.connect('mongodb+srv://Dummi:20Dummi05!@0.a3ghveg.mongodb.net/', { dbName: 'bots' });
	const db = mongoose.connection.db;
	const statsCol = db.collection('stats');

	const latest = await statsCol.find({ id: '782105629572464652' }).sort({ timestamp: -1 }).limit(3).toArray();
	console.log(JSON.stringify(latest, null, 2));

	process.exit(0);
}

run().catch(console.error);
