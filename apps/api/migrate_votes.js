const mongoose = require('mongoose');

async function run() {
	console.log('Connecting to bots database...');
	const dbBots = mongoose.connection.useDb('bots');
	await mongoose.connect('mongodb+srv://Dummi:20Dummi05!@0.a3ghveg.mongodb.net/', { dbName: 'bots' });

	const botProfiles = dbBots.collection('profiles');
	const botVotes = dbBots.collection('votes');

	console.log('Migrating bot votes...');
	const bots = await botProfiles.find({ votes: { $exists: true, $ne: [] } }).toArray();

	let botVotesInserted = 0;
	for (const bot of bots) {
		if (!bot.votes || bot.votes.length === 0) continue;

		for (const vote of bot.votes) {
			// Check if it already exists to avoid duplicates if run twice
			const exists = await botVotes.findOne({ botId: bot.id, userId: vote.userId, createdAt: new Date(vote.timestamp) });
			if (!exists) {
				await botVotes.insertOne({
					botId: bot.id,
					userId: vote.userId,
					createdAt: new Date(vote.timestamp),
					updatedAt: new Date(vote.timestamp),
				});
				botVotesInserted++;
			}
		}

		// Unset the old array to clean up space
		await botProfiles.updateOne({ _id: bot._id }, { $unset: { votes: 1, voteCount: 1 } });
	}
	console.log(`Successfully migrated ${botVotesInserted} bot votes!`);

	console.log('Connecting to guilds database...');
	const dbGuilds = mongoose.connection.useDb('guilds');
	const guildProfiles = dbGuilds.collection('profiles');
	const guildVotes = dbGuilds.collection('votes');

	console.log('Migrating guild votes...');
	const guilds = await guildProfiles.find({ votes: { $exists: true, $ne: [] } }).toArray();

	let guildVotesInserted = 0;
	for (const guild of guilds) {
		if (!guild.votes || guild.votes.length === 0) continue;

		for (const vote of guild.votes) {
			const exists = await guildVotes.findOne({ guildId: guild.id, userId: vote.userId, createdAt: new Date(vote.timestamp) });
			if (!exists) {
				await guildVotes.insertOne({
					guildId: guild.id,
					userId: vote.userId,
					createdAt: new Date(vote.timestamp),
					updatedAt: new Date(vote.timestamp),
				});
				guildVotesInserted++;
			}
		}

		// Unset the old array
		await guildProfiles.updateOne({ _id: guild._id }, { $unset: { votes: 1, voteCount: 1 } });
	}
	console.log(`Successfully migrated ${guildVotesInserted} guild votes!`);

	process.exit(0);
}

run().catch(console.error);
