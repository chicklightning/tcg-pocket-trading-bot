import { MessageFlags } from 'discord.js';
import { ephemeralErrorReply, setupEmbed, setupTargetUserCommand, TargetUserOptionName } from '../command-utilities.js';

const command = {
	data: setupTargetUserCommand('The user you want to trade with.')
		.setName('start-trade')
		.setDescription('Start a trade with another user. You must start a trade before offering a card.'),
	async execute(interaction) {
        const targetUser = interaction.options.getUser(TargetUserOptionName);

        if (targetUser.id === interaction.user.id) {
            return ephemeralErrorReply(interaction, 'You can\'t start a trade with yourself.');
        }

        if (targetUser.id === interaction.client.user.id) {
            return ephemeralErrorReply(interaction, 'You can\'t start a trade with me.');
        }

        // Check if there is an ongoing trade between the two users
        const db = interaction.client.database;
        const existingTrade = await db.getOpenTradeForUsers(interaction.user.id, targetUser.id);
        if (existingTrade) {
            return ephemeralErrorReply(interaction, `There is already an ongoing trade between you and ${targetUser.username}. Complete this trade before starting a new one.`);
        }

		// If the users don't exist in the database, create an entry for them
		const newUser1 = await db.getOrAddUser(targetUser.id, targetUser.username);
		const newUser2 = await db.getOrAddUser(interaction.user.id, interaction.user.username);

        if (!newUser1 || !newUser2) {
            return ephemeralErrorReply(interaction, 'Sorry, something went wrong. Please contact the bot\'s admin to let them know.');
		}

        // Create a new trade
        const trades = db.getModel(db.models.Trade);
        await trades.create({
            owner: interaction.user.id,
            target: targetUser.id,
        });

        const response = setupEmbed().setTitle(`Trade Started by ${interaction.user.username}`)
            .setDescription(`You have started a trade with <@${targetUser.id}>.`);

		const targetUserEmbed = setupEmbed().setTitle(`Trade Started by ${interaction.user.username}`)
            .setDescription(`<@${interaction.user.id}> has started a trade with you.`);

		targetUser.send({
			embeds: [ targetUserEmbed ],
			flags: MessageFlags.Ephemeral,
		}).catch(() => {
			// If the user has DMs disabled, we can't notify them
		});

		return interaction.reply({
			embeds: [ response ],
			flags: MessageFlags.Ephemeral,
		});
	},
	cooldown: 1,
};

export default command;