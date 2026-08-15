const mongoose = require('mongoose');

async function run() {
	await mongoose.connect('mongodb+srv://Dummi:20Dummi05!@0.a3ghveg.mongodb.net/', { dbName: 'bots' });
	const db = mongoose.connection.db;
	const statsCol = db.collection('stats');

	console.log('Cleaning up bad stat records...');

	// Find bad records
	const badRecords = await statsCol
		.find({
			id: '782105629572464652',
			guildCount: 0,
			userCount: 0,
		})
		.sort({ timestamp: -1 })
		.toArray();

	console.log(`Found ${badRecords.length} bad records to delete.`);

	// Delete them
	const result = await statsCol.deleteMany({
		id: '782105629572464652',
		guildCount: 0,
		userCount: 0,
	});

	console.log(`Deleted ${result.deletedCount} bad records.`);

	process.exit(0);
}

run().catch(console.error);
