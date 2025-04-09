import { InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { Rarities, Sets, setupEmbed } from '../command-utilities.js';
import { Models, getModel, getUser } from '../../database/database-utilities.js';
import { Op } from 'sequelize';

const command = {
	data: new SlashCommandBuilder()
		.setName('cancel-trade')
		.setDescription('Cancels a trade you\'ve started with another user.')
		.setContexts(InteractionContextType.Guild)
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user you want to cancel the trade with.')
                .setRequired(true)),
	async execute(interaction) {
        const targetUser = interaction.options.getUser('target');

		if (targetUser.id === interaction.user.id) {
            return interaction.reply({
                content: `You can't complete a trade with yourself.`,
                flags: MessageFlags.Ephemeral,
            });
        }

        // Check if there is an ongoing trade between the two users
        const trades = getModel(interaction.client.db, Models.Trade);
        const trade = await trades.findOne({
            where: {
                isComplete: false,
                [Op.or]: [
                    { owner: interaction.user.id, target: targetUser.id },
                    { owner: targetUser.id, target: interaction.user.id },
                ],
            },
        });

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