import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import user from '../../database/models/user.js';

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
		const filtered = interaction.client.cardCache.filter(choice => choice.id.startsWith(focusedValue));
		const rarities = [ '♦️', '♦️♦️', '♦️♦️♦️', '♦️♦️♦️♦️', '⭐️'];

		await interaction.respond(
			filtered.map(choice => ({ name: `${choice.name} - ${choice.set} ${rarities[choice.rarity - 1]}`, value: choice.id })),
		);
	},
	async execute(interaction) {
		const users = user(interaction.client.db.sequelize, interaction.client.db.Sequelize.DataTypes);
		let currentUser = await users.findOne({ where: { id: interaction.user.id } });
		if (!currentUser) {
			currentUser = await users.create({ id: interaction.user.id, nickname: interaction.user.username, desiredCards: [] });
			console.log(`[LOG] Created new user entry for ${interaction.user.username} (${interaction.user.id})`);
		}

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
		].filter(id => id !== null && id.trim() !== '');

		if (cardIds.length === 0) {
			return interaction.reply({ content: 'You must specify at least one card to add to your desired cards list.', ephemeral: true });
		}
		// TODO - Should sort the concatenated list then update
		await currentUser.update({
			revisions: sequelize.fn('array_cat', sequelize.col('desiredCards'), cardIds)
		});

		currentUser.save();
		return interaction.reply({
			content: `Successfully added ${cardIds.length} card${cardIds.length > 1 ? 's' : ''} to your desired cards list!`,
		});
	},
	cooldown: 1,
};

export default command;