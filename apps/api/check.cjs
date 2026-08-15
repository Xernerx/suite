const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const env = fs.readFileSync(path.resolve('../../.env'), 'utf8');
let url = '';
env.split('\n').forEach((line) => {
	if (line.startsWith('MONGO_XERNERX=')) url = line.split('=')[1].replace(/"/g, '').trim();
});
url = url.replace(/\/$/, '');
mongoose.connect(url + '/bots').then(async () => {
	const bots = await mongoose.connection.db.collection('profiles').find({}).toArray();
	console.log(bots.map((b) => ({ name: b.name, org: b.organization })));
	process.exit();
});
