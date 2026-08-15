const mongoose = require('mongoose');

const MONGO_XERNERX = 'mongodb+srv://Dummi:20Dummi05!@0.a3ghveg.mongodb.net/';
const MONGO_LEGACY = 'mongodb+srv://Dummi:20Dummi05!@0.gp8rax4.mongodb.net/';

async function check() {
	const legacyConnection = await mongoose.createConnection(MONGO_LEGACY).asPromise();
	const legacyDb = legacyConnection.useDb('xernerx');
	const legacyStats = legacyDb.collection('stats');

	const newConnection = await mongoose.createConnection(MONGO_XERNERX).asPromise();
	const newDb = newConnection.useDb('xernerx');
	const newStats = newDb.collection('stats');

	const legacyCount = await legacyStats.countDocuments();
	const newCount = await newStats.countDocuments();

	console.log('Legacy Stats Count:', legacyCount);
	console.log('New Stats Count:', newCount);

	const newOwnerIds = await newStats.distinct('ownerId');
	const missingInNew = await legacyStats.find({ ownerId: { $nin: newOwnerIds } }).toArray();

	console.log('Missing entries count:', missingInNew.length);
	if (missingInNew.length > 0) {
		console.log(
			'First few missing ownerIds:',
			missingInNew.slice(0, 5).map((m) => m.ownerId)
		);
	}

	process.exit(0);
}
check().catch(console.error);
