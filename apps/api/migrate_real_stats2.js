const mongoose = require('mongoose');

const MONGO_LEGACY = 'mongodb+srv://Dummi:20Dummi05!@0.gp8rax4.mongodb.net/';
const MONGO_XERNERX = 'mongodb+srv://Dummi:20Dummi05!@0.a3ghveg.mongodb.net/';

async function migrate() {
	console.log('Connecting to Legacy DB...');
	const legacyConn = await mongoose.createConnection(MONGO_LEGACY).asPromise();
	const legacyStatsCollection = legacyConn.useDb('stats').collection('bots');

	console.log('Connecting to New DB...');
	const newConn = await mongoose.createConnection(MONGO_XERNERX).asPromise();
	const newStatsCollection = newConn.useDb('bots').collection('stats');

	const totalDocs = await legacyStatsCollection.countDocuments();
	console.log(`Found ${totalDocs} legacy stats to migrate.`);

	if (totalDocs === 0) {
		console.log('No docs to migrate. Exiting.');
		process.exit(0);
	}

	// Clear existing to avoid duplicates if rerunning
	await newStatsCollection.deleteMany({});
	console.log('Cleared existing stats in new database.');

	let cursor = legacyStatsCollection.find({});
	let batch = [];
	let migrated = 0;

	console.log('Starting migration...');

	while (await cursor.hasNext()) {
		const stat = await cursor.next();

		// Prioritize stat.timestamp FIRST!
		let correctTimestamp = stat.timestamp || stat.createdAt || stat.updatedAt || new Date();

		// Convert to new schema format
		batch.push({
			id: stat.ownerId || stat.id,
			guildCount: stat.guildCount || 0,
			userCount: stat.userCount || 0,
			shardCount: stat.shardCount || 0,
			voteCount: stat.voteCount || 0,
			shards: stat.shards || [],
			onlineSince: stat.onlineSince || 0,
			timestamp: correctTimestamp,
			createdAt: stat.createdAt || new Date(),
			updatedAt: stat.updatedAt || new Date(),
		});

		if (batch.length >= 5000) {
			await newStatsCollection.insertMany(batch);
			migrated += batch.length;
			console.log(`Migrated ${migrated} / ${totalDocs} stats...`);
			batch = [];
		}
	}

	if (batch.length > 0) {
		await newStatsCollection.insertMany(batch);
		migrated += batch.length;
		console.log(`Migrated ${migrated} / ${totalDocs} stats...`);
	}

	console.log('Migration complete!');
	process.exit(0);
}

migrate().catch(console.error);
