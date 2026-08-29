const mongoose = require('mongoose');

async function run() {
	await mongoose.connect('mongodb+srv://Dummi:20Dummi05!@0.a3ghveg.mongodb.net/', { dbName: 'bots' });
	const db = mongoose.connection.db;
	const bots = db.collection('profiles');

	const virtue = await bots.findOne({ id: '782105629572464652' });
	if (!virtue || !virtue.votes || virtue.votes.length === 0) {
		console.log('No votes found for Virtue');
		process.exit(1);
	}

	// Get the latest voter
	const latestVote = virtue.votes[virtue.votes.length - 1];
	const userId = latestVote.userId;
	console.log('Found voter ID:', userId);

	// Connect to users DB to refund
	const usersDb = mongoose.connection.useDb('users');
	const credits = usersDb.collection('credits');

	await credits.updateOne({ ownerId: userId }, { $inc: { balance: 100 } }, { upsert: true });

	console.log('Successfully refunded 100 credits to user', userId);
	process.exit(0);
}

run().catch(console.error);
