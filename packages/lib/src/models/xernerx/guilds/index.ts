/** @format */

import Member from './Member';
import Profile from './Profile';
import Review from './Review';
import Role from './Role';
import Stat from './Stat';
import Vote from './Vote';

export const Guilds = {
	Members: Member,
	Profiles: Profile,
	Reviews: Review,
	Roles: Role,
	Stats: Stat,
	Votes: Vote,
};

export { Member, Profile, Review, Review as Reviews, Role, Stat, Vote };
export default Guilds;
