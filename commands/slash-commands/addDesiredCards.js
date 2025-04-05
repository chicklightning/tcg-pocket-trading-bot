import { SlashCommandBuilder } from 'discord.js';

const command = {
	data: new SlashCommandBuilder()
		.setName('addDesiredCards')
		.setDescription('Adds one or more cards to the list of cards you want others to trade to you. You can add duplicate values.')
        .setContexts(InteractionContextType.BotDM)
		.addStringOption(option =>
			option.setName('firstCard')
				.setDescription('Descriptive name of the card you want to add to your list of desired cards.')
				.setAutocomplete(true))
				.setRequired(true)
		.addStringOption(option =>
			option.setName('secondCard')
				.setDescription('Descriptive name of the card you want to add to your list of desired cards.')
				.setAutocomplete(true))
				.setRequired(false)
		.addStringOption(option =>
			option.setName('thirdCard')
				.setDescription('Descriptive name of the card you want to add to your list of desired cards.')
				.setAutocomplete(true))
				.setRequired(false)
		.addStringOption(option =>
			option.setName('fourthCard')
				.setDescription('Descriptive name of the card you want to add to your list of desired cards.')
				.setAutocomplete(true))
				.setRequired(false)
		.addStringOption(option =>
			option.setName('fifthCard')
				.setDescription('Descriptive name of the card you want to add to your list of desired cards.')
				.setAutocomplete(true))
				.setRequired(false)
		.addStringOption(option =>
			option.setName('sixthCard')
				.setDescription('Descriptive name of the card you want to add to your list of desired cards.')
				.setAutocomplete(true))
				.setRequired(false)
		.addStringOption(option =>
			option.setName('seventhCard')
				.setDescription('Descriptive name of the card you want to add to your list of desired cards.')
				.setAutocomplete(true))
				.setRequired(false)
		.addStringOption(option =>
			option.setName('eighthCard')
				.setDescription('Descriptive name of the card you want to add to your list of desired cards.')
				.setAutocomplete(true))
				.setRequired(false)
		.addStringOption(option =>
			option.setName('ninthCard')
				.setDescription('Descriptive name of the card you want to add to your list of desired cards.')
				.setAutocomplete(true))
				.setRequired(false)
		.addStringOption(option =>
			option.setName('tenthCard')
				.setDescription('Descriptive name of the card you want to add to your list of desired cards.')
				.setAutocomplete(true))
				.setRequired(false),
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();
		const filtered = interaction.client.cardCache.filter(choice => choice.id.startsWith(focusedValue));
		const rarities = [ '♦️', '♦️♦️', '♦️♦️♦️', '♦️♦️♦️♦️', '⭐️'];

		await interaction.respond(
			filtered.map(choice => ({ name: `${choice.name} - ${choice.set} ${rarities[choice.rarity - 1]}`, value: choice.id })),
		);
	},
	async execute(interaction) {
		const user = require('../../database/models/user.js')(sequelize, Sequelize.DataTypes);
		let currentUser = await user.findOne({ where: { id: interaction.user.id } });
		if (!currentUser) {
			currentUser = await user.create({ id: interaction.user.id, nickname: interaction.user.username, desiredCards: [] });
			console.log(`[LOG] Created new user entry for ${interaction.user.username} (${interaction.user.id})`);
		}

		const cardIds = [
			interaction.options.getString('firstCard'),
			interaction.options.getString('secondCard'),
			interaction.options.getString('thirdCard'),
			interaction.options.getString('fourthCard'),
			interaction.options.getString('fifthCard'),
			interaction.options.getString('sixthCard'),
			interaction.options.getString('seventhCard'),
			interaction.options.getString('eighthCard'),
			interaction.options.getString('ninthCard'),
			interaction.options.getString('tenthCard'),
		].filter(id => id !== null && id.trim() !== '');

		if (cardIds.length === 0) {
			return interaction.reply({ content: 'You must specify at least one card to add to your desired cards list.', ephemeral: true });
		}

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