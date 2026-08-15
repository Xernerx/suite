const mongoose = require('mongoose');

async function run() {
	await mongoose.connect('mongodb+srv://Dummi:20Dummi05!@0.a3ghveg.mongodb.net/', { dbName: 'bots' });
	const db = mongoose.connection.db;
	const bots = await db.collection('profiles').find({}).toArray();
	console.log(bots.map((b) => ({ id: b.id, name: b.name })));
	process.exit(0);
}

run().catch(console.error);
