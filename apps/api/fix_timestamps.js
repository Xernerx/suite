const mongoose = require('mongoose');

async function run() {
	await mongoose.connect('mongodb+srv://Dummi:20Dummi05!@0.a3ghveg.mongodb.net/xernerx');
	const db = mongoose.connection.db;
	const col = db.collection('bots.stats');

	console.log('Checking docs...');

	// Convert timestamp numbers to Date objects
	console.log('Updating docs...');
	await col.updateMany({ timestamp: { $type: 'number' } }, [{ $set: { timestamp: { $toDate: '$timestamp' } } }]);
	console.log('Done!');
	process.exit(0);
}

run().catch(console.error);
