/** @format */

import { Schema, connect } from 'mongoose';

import Guild from './schema/virtue/profiles/Guild.js';
import Member from './schema/virtue/profiles/Member.js';
import User from './schema/virtue/profiles/User.js';

export default async function database() {
	const connection = await connect(`${process.env.MONGO_VIRTUE!}/profiles`);

	connection.model('guilds', Guild);
	connection.model('users', User);
	connection.model('members', Member);
}
