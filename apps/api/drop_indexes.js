const mongoose = require('mongoose');

async function run() {
	await mongoose.connect('mongodb+srv://Dummi:20Dummi05!@0.a3ghveg.mongodb.net/', { dbName: 'bots' });
	const db = mongoose.connection.db;
	try {
		await db.collection('votes').dropIndexes();
	} catch (e) {}
	console.log('Dropped bot vote indexes');

	const dbGuilds = mongoose.connection.useDb('guilds');
	try {
		await dbGuilds.collection('votes').dropIndexes();
	} catch (e) {}
	console.log('Dropped guild vote indexes');

	process.exit(0);
}

run().catch(console.error);
