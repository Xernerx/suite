const mongoose = require('mongoose');
async function check() {
	const conn = await mongoose.createConnection('mongodb+srv://Dummi:20Dummi05!@0.a3ghveg.mongodb.net/bots').asPromise();
	const db = conn.useDb('bots');
	const stats = db.collection('stats');

	const sample = await stats.findOne();
	console.log('Sample stat document:', sample);

	const countWithId = await stats.countDocuments({ id: { $exists: true } });
	const countWithOwnerId = await stats.countDocuments({ ownerId: { $exists: true } });

	console.log('Stats with id:', countWithId);
	console.log('Stats with ownerId:', countWithOwnerId);
	process.exit(0);
}
check().catch(console.error);
