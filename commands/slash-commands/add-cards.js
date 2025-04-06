import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import user from '../../database/models/user.js';
import utilities from '../command-utilities.js';

const command = {
	data: new SlashCommandBuilder()
		.setName('add-cards')
		.setDescription('Add one or more cards to the list of cards you want others to trade to you.')
        .setContexts(InteractionContextType.BotDM)
		.addStringOption(option =>
			option.setName('first-card')
				.setDescription('Name of the card you want to add to your list of desired cards.')
				.setAutocomplete(true)
				.setRequired(true))
		.addStringOption(option =>
			option.setName('second-card')
				.setDescription('Name of the card you want to add to your list of desired cards.')
				.setAutocomplete(true)
				.setRequired(false))
		.addStringOption(option =>
			option.setName('third-card')
				.setDescription('Name of the card you want to add to your list of desired cards.')
				.setAutocomplete(true)
				.setRequired(false))
		.addStringOption(option =>
			option.setName('fourth-card')
				.setDescription('Name of the card you want to add to your list of desired cards.')
				.setAutocomplete(true)
				.setRequired(false))
		.addStringOption(option =>
			option.setName('fifth-card')
				.setDescription('Name of the card you want to add to your list of desired cards.')
				.setAutocomplete(true)
				.setRequired(false))
		.addStringOption(option =>
			option.setName('sixth-card')
				.setDescription('Name of the card you want to add to your list of desired cards.')
				.setAutocomplete(true)
				.setRequired(false))
		.addStringOption(option =>
			option.setName('seventh-card')
				.setDescription('Name of the card you want to add to your list of desired cards.')
				.setAutocomplete(true)
				.setRequired(false))
		.addStringOption(option =>
			option.setName('eighth-card')
				.setDescription('Name of the card you want to add to your list of desired cards.')
				.setAutocomplete(true)
				.setRequired(false))
		.addStringOption(option =>
			option.setName('ninth-card')
				.setDescription('Name of the card you want to add to your list of desired cards.')
				.setAutocomplete(true)
				.setRequired(false))
		.addStringOption(option =>
			option.setName('tenth-card')
				.setDescription('Name of the card you want to add to your list of desired cards.')
				.setAutocomplete(true)
				.setRequired(false)),
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();
		const filtered = interaction.client.cardCache.filter(choice => choice.id.startsWith(focusedValue)).slice(0, 25);
		await interaction.respond(
			filtered.map(
				choice => ({
						name: `${choice.name} from ${utilities.sets[choice.packSet]} ${utilities.rarities[choice.rarity - 1]}`,
						value: choice.id 
					})),
		);
	},
	async execute(interaction) {
		let currentUser = utilities.getUser(interaction.client, interaction.user.id, interaction.user.username);

		const cardIds = [
			interaction.options.getString('first-card'),
			interaction.options.getString('second-card'),
			interaction.options.getString('third-card'),
			interaction.options.getString('fourth-card'),
			interaction.options.getString('fifth-card'),
			interaction.options.getString('sixth-card'),
			interaction.options.getString('seventh-card'),
			interaction.options.getString('eighth-card'),
			interaction.options.getString('ninth-card'),
			interaction.options.getString('tenth-card'),
		]
			.filter(id => id !== null && id.trim() !== '')
			.map(id => id.trim());

		if (cardIds.length === 0) {
			return interaction.reply({ content: 'You must specify at least one card to add to your desired cards list.', ephemeral: true });
		}



		return interaction.reply({
			content: `Successfully added ${cardIds.length} card${cardIds.length > 1 ? 's' : ''} to your desired cards list!`,
		});
	},
	cooldown: 1,
};

export default command;