import { InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { setupEmbed } from '../command-utilities.js';
import { Models, getModel } from '../../database/database-utilities.js';

const command = {
	data: new SlashCommandBuilder()
		.setName('start-trade')
		.setDescription('Start a trade with another user.')
		.setContexts(InteractionContextType.Guild)
		.addUserOption(option =>
            option.setName('target')
                .setDescription('The user you want to trade with.')
                .setRequired(true)),
	async execute(interaction) {
		const targetUser = interaction.options.getUser('target');

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

        // Create a new trade
        await trades.create({
            owner: interaction.user.id,
            target: targetUser.id,
        });

        const embed = setupEmbed().setTitle(`Trade Started by ${interaction.user.username}`)
            .setDescription(`You have started a trade with <@${targetUser.id}>.`);

		return interaction.reply({
			embeds: [ embed ],
			flags: MessageFlags.Ephemeral,
		});
	},
	cooldown: 1,
};

export default command;