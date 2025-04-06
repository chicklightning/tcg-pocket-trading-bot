const rarities = ['♦️', '♦️♦️', '♦️♦️♦️', '♦️♦️♦️♦️', '⭐️'];
const sets = {
	'Genetic Apex': 'GA',
	'Mythical Island': 'MI',
	'Space-Time Smackdown': 'STS',
	'Triumphant Light': 'TL',
};

function getModel(database, modelName) {
    if (!database || !modelName) {
        throw new Error('Database and model name must be provided.');
    }
    const model = database[modelName];
    if (!model) {
        throw new Error(`Model ${modelName} not found in the database.`);
    }
    return model;
};

async function getUser(client, userId, userNickname) {
    const users = getModel(client.db, 'User');
    let fetchedUser = await users.findOne({
        where: { id: userId },
        include: [{
            model: getModel(client.db, 'Card'),
            as: 'desiredCards',
        }],
      });
    
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
};

const utilities = {
    rarities,
    sets,
    getModel,
    getUser,
};

export default utilities;