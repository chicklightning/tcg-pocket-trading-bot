import { MessageFlags } from 'discord.js';
import { setupEmbed, setupTargetUserCommand, TargetUserOptionName } from '../command-utilities.js';
import { getOpenTradeForUsers } from '../../database/database-utilities.js';

const command = {
	data: setupTargetUserCommand('The user you want to cancel the trade with.')
        .setName('cancel-trade')
        .setDescription('Cancels a trade you\'ve started with another user.'),
	async execute(interaction) {
        const targetUser = interaction.options.getUser(TargetUserOptionName);

        if (targetUser.id === interaction.client.user.id) {
            return interaction.reply({
                content: `You can't cancel a trade with me.`,
                flags: MessageFlags.Ephemeral,
            });
        }

		if (targetUser.id === interaction.user.id) {
            return interaction.reply({
                content: `You can't cancel a trade with yourself.`,
                flags: MessageFlags.Ephemeral,
            });
        }

        // Check if there is an ongoing trade between the two users
        const trade = await getOpenTradeForUsers(interaction.client.db, interaction.user.id, targetUser.id);
        if (!trade) {
            return interaction.reply({
                content: `No open trade exists between you and ${targetUser.username}.`,
                flags: MessageFlags.Ephemeral,
            });
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