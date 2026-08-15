const { database } = require('@xernerx/lib/server');

async function check() {
	const db = await database('xernerx');
	const BotModel = db.models.bots.Bot;
	const bot = await BotModel.findOne({ id: '782105829572484652' }).lean();
	console.log('API FOUND PROFILE:', bot ? bot.id : 'null');

	const StatModel = db.models.bots.Stat;
	const stats = await StatModel.find({ id: '782105829572484652' }).lean();
	console.log('API FOUND STATS:', stats.length);

	process.exit(0);
}

check().catch(console.error);
