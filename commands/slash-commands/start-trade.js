import { InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { BaseEmbed, Rarities, Sets } from '../command-utilities.js';
import { Models, getModel, getUser } from '../../database/database-utilities.js';

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
		const userOption = interaction.options.getUser('target');
		const targetUser = await getUser(interaction.client, userOption?.id ?? interaction.user.id, userOption?.username ?? interaction.user.username);

		

		return interaction.reply({
			embeds: [ embed ],
			flags: MessageFlags.Ephemeral,
		});
	},
	cooldown: 1,
};

export default command;