const mongoose = require('mongoose');
const MONGO_XERNERX = 'mongodb+srv://Dummi:20Dummi05!@0.a3ghveg.mongodb.net/';
mongoose
	.createConnection(MONGO_XERNERX)
	.asPromise()
	.then(async (conn) => {
		const db = conn.useDb('bots');
		console.log('Creating index on timestamp...');
		await db.collection('stats').createIndex({ id: 1, timestamp: 1 });
		console.log('Index created!');
		process.exit(0);
	});
