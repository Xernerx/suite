async function run() {
	const mongoose = require('mongoose');
	await mongoose.connect('mongodb+srv://Dummi:20Dummi05!@0.a3ghveg.mongodb.net/', { dbName: 'bots' });
	const db = mongoose.connection.db;
	const col = db.collection('stats');

	console.log('Checking docs...');
	const sample = await col.findOne();
	console.log('Sample doc:', sample);

	// Convert timestamp numbers to Date objects
	console.log('Updating docs...');
	const result = await col.updateMany({ timestamp: { $type: 'number' } }, [{ $set: { timestamp: { $toDate: '$timestamp' } } }]);
	console.log(`Updated ${result.modifiedCount} docs`);
	process.exit(0);
}

run().catch(console.error);
