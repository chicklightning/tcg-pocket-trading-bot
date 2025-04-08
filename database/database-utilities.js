export const Models = {
    User: 'User',
    Card: 'Card',
    Trade: 'Trade',
};

export function getModel(database, modelEnum) {
    if (!database || !modelEnum) {
        throw new Error('Database and model enum value must be provided.');
    }
    const model = database[Models[modelEnum]];
    if (!model) {
        throw new Error(`Model ${modelEnum} not found in the database.`);
    }
    return model;
};

export async function getUser(client, userId, userNickname) {
    const users = getModel(client.db, Models.User);
    let fetchedUser = await users.findOne({
        where: { id: userId },
        include: [{
            model: getModel(client.db, Models.Card),
            as: 'desiredCards',
        }],
      });
    
    if (!fetchedUser) {
        fetchedUser = await users.create({ id: userId, nickname: userNickname });
        console.log(`[LOG] Created new user entry for ${userNickname} (${userId})`);
    }
    else if (userNickname && fetchedUser.nickname !== userNickname) {
        fetchedUser.nickname = userNickname;
        await fetchedUser.save();
        console.log(`[LOG] Updated nickname for user ${userId} to ${userNickname}`);
    }

    return fetchedUser;
};