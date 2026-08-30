const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../../.env');
const envContent = fs.readFileSync(envPath, 'utf8');

let LEGACY_URI = '';
let NEW_URI = '';

envContent.split('\n').forEach((line) => {
	if (line.startsWith('MONGO_LEGACY=')) LEGACY_URI = line.split('=')[1].replace(/"/g, '').trim();
	if (line.startsWith('MONGO_XERNERX=')) NEW_URI = line.split('=')[1].replace(/"/g, '').trim();
});

if (!LEGACY_URI || !NEW_URI) {
	console.error('MONGO_LEGACY or MONGO_XERNERX is missing from .env');
	process.exit(1);
}

const MIGRATION_MAP = {
	profiles: {
		bots: { db: 'bots', collection: 'profiles' },
		guilds: { db: 'guilds', collection: 'profiles' },
		users: { db: 'users', collection: 'profiles' },
		organizations: { db: 'organizations', collection: 'profiles' },
	},
	stats: {
		bots: { db: 'bots', collection: 'stats' },
		guilds: { db: 'guilds', collection: 'stats' },
	},
};

async function run() {
	console.log('Connecting to databases...');

	for (const [legacyDbName, collections] of Object.entries(MIGRATION_MAP)) {
		const legacyUri = `${LEGACY_URI.replace(/\/$/, '')}/${legacyDbName}`;
		const legacyConn = await mongoose.createConnection(legacyUri).asPromise();
		console.log(`\nConnected to Legacy DB: ${legacyDbName}`);

		for (const [legacyCollName, target] of Object.entries(collections)) {
			const targetUri = `${NEW_URI.replace(/\/$/, '')}/${target.db}`;
			const targetConn = await mongoose.createConnection(targetUri).asPromise();

			const sourceColl = legacyConn.db.collection(legacyCollName);
			const targetColl = targetConn.db.collection(target.collection);

			const count = await sourceColl.countDocuments();
			console.log(`Migrating ${legacyDbName}.${legacyCollName} -> ${target.db}.${target.collection} (${count} documents)...`);

			if (count === 0) {
				console.log('  Skipping, no documents found.');
				await targetConn.close();
				continue;
			}

			const cursor = sourceColl.find({});
			let migrated = 0;
			let skipped = 0;
			let errors = 0;

			let batch = [];

			const processBatch = async () => {
				if (batch.length === 0) return;
				try {
					const bulkOps = batch.map((doc) => {
						let filter;
						if (legacyDbName === 'stats') {
							filter = { _id: doc._id };
						} else {
							filter = doc.id ? { id: doc.id } : { _id: doc._id };
						}
						return {
							updateOne: {
								filter,
								update: { $setOnInsert: doc },
								upsert: true,
							},
						};
					});

					const result = await targetColl.bulkWrite(bulkOps, { ordered: false });
					migrated += result.upsertedCount;
					skipped += result.matchedCount;
				} catch (err) {
					console.error(`  Batch error:`, err.message);
					errors += batch.length;
				}
				batch = [];
			};

			for await (const doc of cursor) {
				batch.push(doc);
				if (batch.length >= 500) {
					await processBatch();
				}
			}
			await processBatch();

			console.log(`  Done: ${migrated} migrated, ${skipped} skipped (already existed), ${errors} errors.`);
			await targetConn.close();
		}

		await legacyConn.close();
	}

	console.log('\nMigration complete.');
	process.exit(0);
}

run().catch((err) => {
	console.error('Migration failed:', err);
	process.exit(1);
});
