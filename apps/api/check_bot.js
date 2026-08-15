const mongoose = require('mongoose');
const MONGO_LEGACY = 'mongodb+srv://Dummi:20Dummi05!@0.gp8rax4.mongodb.net/';
mongoose
	.createConnection(MONGO_LEGACY)
	.asPromise()
	.then(async (conn) => {
		const db = conn.useDb('stats');
		const count = await db.collection('bots').countDocuments({ $or: [{ ownerId: '782105829572484652' }, { id: '782105829572484652' }] });
		console.log('COUNT FOR 782105829572484652:', count);
		process.exit(0);
	});
