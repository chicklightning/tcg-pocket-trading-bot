import { InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { setupEmbed } from '../command-utilities.js';
import { Models, getModel, getUser } from '../../database/database-utilities.js';
import { Op } from 'sequelize';

const command = {
	data: new SlashCommandBuilder()
		.setName('start-trade')
		.setDescription('Start a trade with another user. You must start a trade before offering a card.')
		.setContexts(InteractionContextType.Guild, InteractionContextType.PrivateChannel)
		.addUserOption(option =>
            option.setName('target')
                .setDescription('The user you want to trade with.')
                .setRequired(true)),
	async execute(interaction) {
		const targetUser = interaction.options.getUser('target');

		if (targetUser.id === interaction.user.id) {
            return interaction.reply({
                content: `You can't start a trade with yourself.`,
                flags: MessageFlags.Ephemeral,
            });
        }

        // Check if there is an ongoing trade between the two users
        const trades = getModel(interaction.client.db, Models.Trade);
        const existingTrade = await trades.findOne({
            where: {
                isComplete: false,
                [Op.or]: [
                    { owner: interaction.user.id, target: targetUser.id },
                    { owner: targetUser.id, target: interaction.user.id },
                ],
            },
        });

        if (existingTrade) {
            return interaction.reply({
                content: `There is already an ongoing trade between you and ${targetUser.username}. Complete this trade before starting a new one.`,
                flags: MessageFlags.Ephemeral,
            });
        }

		// If the users don't exist in the database, create an entry for them
		await getUser(interaction.client, targetUser.id, targetUser.username);
		await getUser(interaction.client, interaction.user.id, interaction.user.username);

        // Create a new trade
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