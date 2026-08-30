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

async function run() {
	const legacyUri = `${LEGACY_URI.replace(/\/$/, '')}/stats`;
	const legacyConn = await mongoose.createConnection(legacyUri).asPromise();
	const sourceColl = legacyConn.db.collection('bots');

	const count = await sourceColl.countDocuments({ id: '881678826906730547' });
	console.log(`Documents for bot 881678826906730547: ${count}`);

	await legacyConn.close();
	process.exit(0);
}

run().catch(console.error);
