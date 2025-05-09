import { MessageFlags } from 'discord.js';
import { ephemeralErrorReply, Rarities, setupEmbed, setupTargetUserCommand, TargetUserOptionName } from '../command-utilities.js';

const command = {
	data: setupTargetUserCommand('The user you want to complete the trade with.')
		.setName('complete-trade')
		.setDescription('Completes a trade you\'ve started with another user.'),
	async execute(interaction) {
        const targetUser = interaction.options.getUser(TargetUserOptionName);

		if (targetUser.id === interaction.user.id) {
            return ephemeralErrorReply(interaction, 'You can\'t complete a trade with yourself.');
        }

        if (targetUser.id === interaction.client.user.id) {
            return ephemeralErrorReply(interaction, 'You can\'t complete a trade with me.');
        }

        // Check if there is an ongoing trade between the two users
        const db = interaction.client.database;
        const trade = await db.getOpenTradeForUsers(interaction.user.id, targetUser.id);
        if (!trade) {
            return ephemeralErrorReply(interaction, `No open trade exists between you and ${targetUser.username}. Did you forget to call /start-trade?`);
        }

        if (trade.ownerOfferedCard === null || trade.ownerOfferedCard === '' || trade.targetOfferedCard === null || trade.targetOfferedCard === '') {
            return ephemeralErrorReply(interaction, 'Both users must offer a card to complete the trade.');
        }

        if (!trade.isValid) {
            return ephemeralErrorReply(interaction, 'Both users must offer a card of the same rarity to complete the trade.');
        }

        // If offered card was on a user's desired cards list, then remove a count from the list or destroy the record
        const target = await db.getUser(targetUser.id, targetUser.username);
		const user = await db.getUser(interaction.user.id, interaction.user.username);

        // Get each user's desired cards list, remove the traded card from their list if it exists then mark the trade as complete
        // If the calling user is the trade owner, look at the target's offered card, otherwise look at the owner offered card
        const callingUserCardReceivedId = (trade.owner === user.id) ? trade.targetOfferedCard : trade.ownerOfferedCard;
        const callingUserDesiredCard = await user.getDesiredCards({
            where: {
                id: callingUserCardReceivedId
            },
        });

        if (callingUserDesiredCard.length > 0) {
            // If the card exists and count is above 0, decrement the count
            const userCard = callingUserDesiredCard[0];

            if (userCard.UserCard.card_count > 0) {
                userCard.UserCard.card_count -= 1;
                if (userCard.UserCard.card_count <= 0) {
                    // Remove the UserCard record if the count becomes 0 or less
                    await userCard.UserCard.destroy();
                    console.log(`[LOG] Removed card ${userCard.UserCard.card_id} from user ${user.nickname} (${user.id}) as count reached 0.`);
                }
                else {
                    // Otherwise, save the updated count
                    await userCard.UserCard.save();
                    console.log(`[LOG] Decremented count for card ${userCard.UserCard.card_id} in user ${user.nickname} (${user.id}).`);
                }
            }
            else {
                // Log kept here for debugging but this is expected behavior, users may trade cards they don't need (aka have in their desired cards list)
                // console.log(`[LOG] Card ${userCard.UserCard.card_id} not found in desired cards list for user ${user.nickname} (${user.id}).`);
            }
        }
        else {
            // Log kept here for debugging but this is expected behavior, users may trade cards they don't need (aka have in their desired cards list)
            // console.log(`[LOG] Card ${userCard.UserCard.card_id} not found in desired cards list for user ${user.nickname} (${user.id}).`);
        }

        // Set up embeds
        const embed1 = setupEmbed()
            .setTitle(`Your Trade with ${targetUser.username} Is Complete`)
            .setDescription(`Your open trade with <@${targetUser.id}> is complete.`)
            .setURL('https://github.com/chicklightning/tcg-pocket-trading-bot/wiki');

        const embed2 = setupEmbed()
            .setURL('https://github.com/chicklightning/tcg-pocket-trading-bot/wiki');

        // Set up target user embed message
        const targetUserEmbed1 = setupEmbed()
            .setTitle(`Your Trade with ${interaction.user.username} Is Complete`)
            .setDescription(`Your open trade with <@${interaction.user.id}> is complete.`)
            .setURL('https://github.com/chicklightning/tcg-pocket-trading-bot/wiki');
        let targetSentField;

        const targetUserEmbed2 = setupEmbed().setURL('https://github.com/chicklightning/tcg-pocket-trading-bot/wiki');

        const cards = db.getModel(db.models.Card);
        const callingUserCardReceived = await cards.findByPk(callingUserCardReceivedId);
        if (callingUserCardReceived) {
            embed1
                .setImage(callingUserCardReceived.image)
                .addFields({
                    name: 'Card Received',
                    value: `${callingUserCardReceived.name} ${Rarities[callingUserCardReceived.rarity - 1]} from ${callingUserCardReceived.packSet}`,
                });

            targetSentField = {
                name: 'Card Sent',
                value: `${callingUserCardReceived.name} ${Rarities[callingUserCardReceived.rarity - 1]} from ${callingUserCardReceived.packSet}`,
            };
            targetUserEmbed2.setImage(callingUserCardReceived.image);
        }
        else {
            console.error(`[ERROR] Card ${callingUserCardReceivedId} not found for trade ${trade.id}.`);
        }

        // If the other user is the trade owner, look at the target's offered card, otherwise look at the owner offered card\
        // If the calling user is the trade owner, look at the target's offered card, otherwise look at the owner offered card
        const targetUserCardReceivedId = (trade.owner === target.id) ? trade.targetOfferedCard : trade.ownerOfferedCard;
        const targetUserDesiredCard = await target.getDesiredCards({
            where: {
                id: targetUserCardReceivedId
            },
        });

        if (targetUserDesiredCard.length > 0) {
            // If the card exists and count is above 0, decrement the count
            const userCard = targetUserDesiredCard[0];

            if (userCard.UserCard.card_count > 0) {
                userCard.UserCard.card_count -= 1;
                if (userCard.UserCard.card_count <= 0) {
                    // Remove the UserCard record if the count becomes 0 or less
                    await userCard.UserCard.destroy();
                    console.log(`[LOG] Removed card ${userCard.UserCard.card_id} from user ${target.nickname} (${target.id}) as count reached 0.`);
                }
                else {
                    // Otherwise, save the updated count
                    await userCard.UserCard.save();
                    console.log(`[LOG] Decremented count for card ${userCard.UserCard.card_id} in user ${target.nickname} (${target.id}).`);
                }
            }
            else {
                // Log kept here for debugging but this is expected behavior, users may trade cards they don't need (aka have in their desired cards list)
                // console.debug(`[DEBUG] Card ${userCard.UserCard.card_id} not found in desired cards list for user ${target.nickname} (${target.id}).`);
            }
        }
        else {
            // Log kept here for debugging but this is expected behavior, users may trade cards they don't need (aka have in their desired cards list)
            // console.debug(`[DEBUG] Card ${userCard.UserCard.card_id} not found in desired cards list for user ${target.nickname} (${target.id}).`);
        }

        const targetUserCardReceived = await cards.findByPk(targetUserCardReceivedId);
        if (targetUserCardReceived) {
            embed1.addFields({
                name: 'Card Sent',
                value: `${targetUserCardReceived.name} ${Rarities[targetUserCardReceived.rarity - 1]} from ${targetUserCardReceived.packSet}`,
            });
            embed2.setImage(targetUserCardReceived.image);

            targetUserEmbed1
                .addFields(
                    {
                        name: 'Card Received',
                        value: `${targetUserCardReceived.name} ${Rarities[targetUserCardReceived.rarity - 1]} from ${targetUserCardReceived.packSet}`,
                    },
                    targetSentField)
                .setImage(targetUserCardReceived.image);
        }
        else {
            console.error(`[ERROR] Card ${callingUserCardReceivedId} not found for trade ${trade.id}.`);
        }

        trade.isComplete = true;
        await trade.save();

        targetUser.send({
            embeds: [ targetUserEmbed1, targetUserEmbed2 ],
            flags: MessageFlags.Ephemeral,
        }).catch(() => {
            // If the user has DMs disabled, we can't notify them
        });

        return interaction.reply({
			embeds: [ embed1, embed2 ],
			flags: MessageFlags.Ephemeral,
		});
	},
	cooldown: 2,
};

export default command;