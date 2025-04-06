import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { Rarities, Sets } from '../command-utilities.js';
import { Models, getModel, getUser } from '../../database/database-utilities.js';

const command = {
	data: new SlashCommandBuilder()
		.setName('add-cards')
		.setDescription('Add one or more cards to the list of cards you want others to trade to you.')
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
						name: `${choice.name} from ${Sets[choice.packSet]} ${Rarities[choice.rarity - 1]}`,
						value: choice.id 
					})),
		);
	},
	async execute(interaction) {
		let currentUser = await getUser(interaction.client, interaction.user.id, interaction.user.username);

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

		const cards = getModel(interaction.client.db, Models.Card);
		let addedCardCount = 0, notAddedCount = 0;
		const addCardPromises = cardIds.map(async cardId => {
			const card = await cards.findByPk(cardId);
			if (card) {
				// Check if the card already exists in the user's desiredCards
				const existingCard = await currentUser.getDesiredCards({
					where: { id: card.id },
				});
		
				if (existingCard.length > 0) {
					// If the card exists, increment the count
					const userCard = existingCard[0];
					userCard.UserCard.card_count += 1;
					await userCard.UserCard.save();
					addedCardCount++;
					console.log(`[LOG] Incremented count for card ${card.id} in user ${currentUser.nickname} (${currentUser.id}).`);
				}
				else {
					// If the card doesn't exist, add it to the desiredCards
					await currentUser.addDesiredCard(card);
					addedCardCount++;
					console.log(`[LOG] Successfully added card ${card.id} to user ${currentUser.nickname} (${currentUser.id}).`);
				}
			} else {
				notAddedCount++;
			}
		});
		
		// Wait for all card additions to complete
		await Promise.all(addCardPromises);

		currentUser.save();
		let replyStatement = (addedCardCount > 0) ?
			`Successfully added ${addedCardCount} card${addedCardCount === 1 ? '' : 's'} to your desired cards list!` :
			'Sorry, no cards were added.';
		replyStatement = (notAddedCount > 0)
			? `${replyStatement} Something went wrong adding ${notAddedCount} card${notAddedCount === 1 ? '' : 's'}.`
			: replyStatement;

		return interaction.reply({
			content: replyStatement,
			flags: MessageFlags.Ephemeral,
		});
	},
	cooldown: 1,
};

export default command;