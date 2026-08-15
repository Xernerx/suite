const mongoose = require('mongoose');

const MONGO_LEGACY = 'mongodb+srv://Dummi:20Dummi05!@0.gp8rax4.mongodb.net/';

async function check() {
	const legacyConnection = await mongoose.createConnection(MONGO_LEGACY).asPromise();

	// List databases
	const adminDb = legacyConnection.db.admin();
	const dbs = await adminDb.listDatabases();

	for (const dbInfo of dbs.databases) {
		console.log(`\nDB: ${dbInfo.name}`);
		const db = legacyConnection.useDb(dbInfo.name);
		const collections = await db.db.listCollections().toArray();
		for (const coll of collections) {
			const collection = db.collection(coll.name);
			const count = await collection.countDocuments();
			if (count > 0) {
				console.log(`  - Collection ${coll.name}: ${count} documents`);
			}
		}
	}

	process.exit(0);
}
check().catch(console.error);
