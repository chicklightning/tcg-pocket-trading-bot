import { Op } from 'sequelize'; 

export class DatabaseUtilities {
    constructor(database) {
        if (!database) {
            throw new Error('A database instance must be provided.');
        }

        this.database = database;
        this.models = {
            User: 'User',
            Card: 'Card',
            Trade: 'Trade',
        };
    }

    getModel(modelEnum) {
        if (!modelEnum) {
            throw new Error('Model enum value must be provided.');
        }
        const model = this.database[this.models[modelEnum]];
        if (!model) {
            throw new Error(`Model ${modelEnum} not found in the database.`);
        }
        return model;
    }

    async getUser(userId, userNickname) {
        if (!userId) {
            throw new Error('userId must be provided.');
        }

        const users = this.getModel(this.models.User);
        let fetchedUser = await users.findOne({
            where: { id: userId },
            include: [{
                model: this.getModel(this.models.Card),
                as: 'desiredCards',
            }],
        });

        if (fetchedUser && userNickname && fetchedUser.nickname !== userNickname) {
            fetchedUser.nickname = userNickname;
            await fetchedUser.save();
            console.log(`[LOG] Updated nickname for user ${userId} to ${userNickname}`);
        }

        return fetchedUser;
    }

    async getOrAddUser(userId, userNickname) {
        if (!userId) {
            throw new Error('userId must be provided.');
        }

        let fetchedUser = await this.getUser(userId, userNickname);
        if (!fetchedUser) {
            const users = this.getModel(this.models.User);
            fetchedUser = await users.create({ id: userId, nickname: userNickname }, {
                include: [{
                    model: this.getModel(this.models.Card),
                    as: 'desiredCards',
                }],
            });
            
            console.log(`[LOG] Created new user entry for ${userNickname} (${userId})`);
        }

        return fetchedUser;
    }

    async getOpenTradeForUsers(userIdA, userIdB) {
        const trades = this.getModel(this.models.Trade);
        return await trades.findOne({
            where: {
                isComplete: false,
                [Op.or]: [
                    { owner: userIdA, target: userIdB },
                    { owner: userIdB, target: userIdA },
                ],
            },
        });
    }
};