const mongoose = require('mongoose');
async function run() {
	console.log('Connecting to legacy...');
	const legacyConn = await mongoose.createConnection('mongodb+srv://Dummi:20Dummi05!@0.gp8rax4.mongodb.net/tokens').asPromise();
	const legacyTokens = await legacyConn.collection('apis').find({}).toArray();
	console.log('Found', legacyTokens.length, 'tokens in legacy DB.');
	console.log('Connecting to new...');
	const newConn = await mongoose.createConnection('mongodb+srv://Dummi:20Dummi05!@0.a3ghveg.mongodb.net/xernerx').asPromise();
	const tokenSchema = new mongoose.Schema({ id: String, name: String, owners: [String], status: String, botId: String }, { timestamps: true });
	const TokenModel = newConn.model('tokens', tokenSchema, 'users.tokens');
	let migrated = 0;
	for (const t of legacyTokens) {
		const existing = await TokenModel.findOne({ id: t.id });
		if (!existing) {
			await TokenModel.create({ id: t.id, name: t.name, owners: t.owners, status: t.status, botId: t.botId, createdAt: t.createdAt, updatedAt: t.updatedAt });
			migrated++;
		}
	}
	console.log('Migrated', migrated, 'tokens successfully.');
	process.exit(0);
}
run().catch(console.error);
