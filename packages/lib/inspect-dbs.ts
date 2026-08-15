import mongoose from 'mongoose';

async function run() {
	await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017');
	const admin = mongoose.connection.db.admin();
	const dbs = await admin.listDatabases();

	console.log(
		'Databases:',
		dbs.databases.map((d) => d.name)
	);

	// Check old databases (xernerx-core, xernerx-users, etc.)
	for (const dbName of ['xernerx', 'xernerx-core', 'xernerx-users', 'xernerx-bots', 'xernerx-api']) {
		try {
			const db = mongoose.connection.useDb(dbName);
			const collections = await db.db.listCollections().toArray();
			console.log(
				`\nCollections in ${dbName}:`,
				collections.map((c) => c.name)
			);

			// Log a sample from tokens or users
			for (const c of collections) {
				if (c.name.toLowerCase().includes('token') || c.name.toLowerCase().includes('auth')) {
					const sample = await db.collection(c.name).findOne({});
					console.log(`Sample from ${dbName}.${c.name}:`, sample);
				}
			}
		} catch (e) {}
	}

	process.exit(0);
}

run().catch(console.error);
