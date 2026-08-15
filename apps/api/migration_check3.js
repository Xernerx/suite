const mongoose = require('mongoose');

async function check() {
	const conn = await mongoose.createConnection('mongodb+srv://Dummi:20Dummi05!@0.a3ghveg.mongodb.net/bots').asPromise();
	const db = conn.useDb('bots');
	const stats = db.collection('stats');
	const bots_stats = db.collection('bots_stats');

	console.log('stats docs:', await stats.countDocuments());
	console.log('bots_stats docs:', await bots_stats.countDocuments());

	process.exit(0);
}
check().catch(console.error);
