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
	const targetUri = `${NEW_URI.replace(/\/$/, '')}/bots`;
	const targetConn = await mongoose.createConnection(targetUri).asPromise();
	const sourceColl = targetConn.db.collection('stats');

	const all = await sourceColl.find({ id: '881678826906730547' }).toArray();
	let numCount = 0;
	let dateCount = 0;
	let otherCount = 0;
	for (const doc of all) {
		if (typeof doc.timestamp === 'number') numCount++;
		else if (doc.timestamp instanceof Date) dateCount++;
		else otherCount++;
	}

	console.log(`Total: ${all.length}, Numbers: ${numCount}, Dates: ${dateCount}, Other: ${otherCount}`);

	await targetConn.close();
	process.exit(0);
}

run().catch(console.error);
