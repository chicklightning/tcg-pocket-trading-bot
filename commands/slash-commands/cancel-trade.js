import { MessageFlags } from 'discord.js';
import { ephemeralErrorReply, setupEmbed, setupTargetUserCommand, TargetUserOptionName } from '../command-utilities.js';

const command = {
	data: setupTargetUserCommand('The user you want to cancel the trade with.')
        .setName('cancel-trade')
        .setDescription('Cancels a trade you\'ve started with another user.'),
	async execute(interaction) {
        const targetUser = interaction.options.getUser(TargetUserOptionName);
        if (targetUser.id === interaction.client.user.id) {
            return ephemeralErrorReply(interaction, 'You can\'t cancel a trade with me.');
        }
		if (targetUser.id === interaction.user.id) {
            return ephemeralErrorReply(interaction, 'You can\'t cancel a trade with yourself.');
        }

        // Check if there is an ongoing trade between the two users
        const db = interaction.client.database;
        const trade = await db.getOpenTradeForUsers(interaction.user.id, targetUser.id);
        if (!trade) {
            return ephemeralErrorReply(interaction, `No open trade exists between you and ${targetUser.username}.`);
        }

        await trade.destroy();

        const targetUserEmbed = setupEmbed()
            .setTitle(`${interaction.user.username} Has Canceled Your Trade`)
            .setDescription(`Your open trade with <@${interaction.user.id}> has been canceled.`);

		targetUser.send({
			embeds: [ targetUserEmbed ],
			flags: MessageFlags.Ephemeral,
		}).catch(() => {
			// If the user has DMs disabled, we can't notify them
		});

        const embed = setupEmbed()
            .setTitle(`You Canceled Your Trade with ${targetUser.username}`)
            .setDescription(`Your open trade with <@${targetUser.id}> has been canceled.`);
		
        return interaction.reply({
			embeds: [ embed ],
			flags: MessageFlags.Ephemeral,
		});
	},
	cooldown: 2,
};

export default command;