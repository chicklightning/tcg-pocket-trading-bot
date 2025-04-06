import user from '../database/models/user.js';
import card from '../database/models/card.js';

const rarities = ['♦️', '♦️♦️', '♦️♦️♦️', '♦️♦️♦️♦️', '⭐️'];
const sets = {
	'Genetic Apex': 'GA',
	'Mythical Island': 'MI',
	'Space-Time Smackdown': 'STS',
	'Triumphant Light': 'TL',
};

const utilities = {
    rarities,
    sets,
    async getUser(client, userId, userNickname) {
        const users = user(client.sequelize, client.Sequelize.DataTypes);
        let fetchedUser = await users.findOne({ where: { id: userId } });
        if (!fetchedUser) {
            fetchedUser = await users.create({ id: userId, nickname: userNickname });
            console.log(`[LOG] Created new user entry for ${userNickname} (${userId})`);
        }
        else if (fetchedUser.nickname !== userNickname) {
            fetchedUser.nickname = userNickname;
            await fetchedUser.save();
            console.log(`[LOG] Updated nickname for user ${userId} to ${userNickname}`);
        }
    
        return fetchedUser;
    },
};

export default utilities;