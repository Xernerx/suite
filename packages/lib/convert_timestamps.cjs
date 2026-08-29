const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../../.env');
const envContent = fs.readFileSync(envPath, 'utf8');

let NEW_URI = '';
envContent.split('\n').forEach((line) => {
	if (line.startsWith('MONGO_XERNERX=')) NEW_URI = line.split('=')[1].replace(/"/g, '').trim();
});

async function run() {
	console.log('Connecting to database...');

	for (const dbName of ['bots', 'guilds']) {
		const targetUri = `${NEW_URI.replace(/\/$/, '')}/${dbName}`;
		const targetConn = await mongoose.createConnection(targetUri).asPromise();
		const sourceColl = targetConn.db.collection('stats');

		console.log(`Checking ${dbName}.stats...`);

		const cursor = sourceColl.find({ timestamp: { $type: 'number' } });
		let updated = 0;
		let batch = [];

		const processBatch = async () => {
			if (batch.length === 0) return;
			const bulkOps = batch.map((doc) => ({
				updateOne: {
					filter: { _id: doc._id },
					update: { $set: { timestamp: new Date(doc.timestamp) } },
				},
			}));
			await sourceColl.bulkWrite(bulkOps, { ordered: false });
			updated += batch.length;
			batch = [];
			console.log(`  Updated ${updated} documents...`);
		};

		for await (const doc of cursor) {
			batch.push(doc);
			if (batch.length >= 1000) {
				await processBatch();
			}
		}
		await processBatch();

		console.log(`Finished ${dbName}.stats: ${updated} updated.`);
		await targetConn.close();
	}

	console.log('Done!');
	process.exit(0);
}

run().catch(console.error);
