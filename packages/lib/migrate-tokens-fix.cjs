const mongoose = require('mongoose');
async function run() {
	console.log('Connecting to new cluster...');
	const conn = await mongoose.createConnection('mongodb+srv://Dummi:20Dummi05!@0.a3ghveg.mongodb.net/').asPromise();
	const xernerxDb = conn.useDb('xernerx');
	const usersDb = conn.useDb('users');
	const tokensToMove = await xernerxDb.collection('users.tokens').find({}).toArray();
	console.log('Found', tokensToMove.length, 'tokens in xernerx.users.tokens');
	let migrated = 0;
	for (const t of tokensToMove) {
		const existing = await usersDb.collection('tokens').findOne({ id: t.id });
		if (!existing) {
			await usersDb.collection('tokens').insertOne(t);
			migrated++;
		}
	}
	console.log('Successfully moved', migrated, 'tokens to users.tokens');
	await xernerxDb
		.collection('users.tokens')
		.drop()
		.catch(() => {});
	console.log('Cleaned up old collection.');
	process.exit(0);
}
run().catch(console.error);
