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

export async function getOrAddUser(client, userId, userNickname) {
    if (!client || !userId) {
        throw new Error('Client and userId must be provided.');
    }

    let fetchedUser = getUser(client, userId, userNickname);
    if (!fetchedUser) {
        const newUser = await users.create({ id: userId, nickname: userNickname });
        console.log(`[LOG] Created new user entry for ${userNickname} (${userId})`);

        fetchedUser = await users.findOne({
          where: { id: userId },
          include: [{
              model: getModel(client.db, Models.Card),
              as: 'desiredCards',
          }],
        });
    }
};

export async function getUser(client, userId, userNickname) {
    if (!client || !userId) {
        throw new Error('Client and userId must be provided.');
    }

    const users = getModel(client.db, Models.User);
    let fetchedUser = await users.findOne({
      where: { id: userId },
      include: [{
          model: getModel(client.db, Models.Card),
          as: 'desiredCards',
      }],
    });

    if (fetchedUser && userNickname && fetchedUser.nickname !== userNickname) {
        fetchedUser.nickname = userNickname;
        await fetchedUser.save();
        console.log(`[LOG] Updated nickname for user ${userId} to ${userNickname}`);
    }

    return fetchedUser;
};