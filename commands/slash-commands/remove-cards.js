import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { Rarities, Sets } from '../command-utilities.js';
import { Models, getModel, getUser } from '../../database/database-utilities.js';

const command = {
	data: new SlashCommandBuilder()
		.setName('remove-cards')
		.setDescription('Remove one or more cards from the list of cards you want others to trade to you.')
		.addStringOption(option =>
			option.setName('first-card')
				.setDescription('Name of the card you want to remove from your list of desired cards.')
				.setAutocomplete(true)
				.setRequired(true))
		.addStringOption(option =>
			option.setName('second-card')
				.setDescription('Name of the card you want to remove from your list of desired cards.')
				.setAutocomplete(true)
				.setRequired(false))
		.addStringOption(option =>
			option.setName('third-card')
				.setDescription('Name of the card you want to remove from your list of desired cards.')
				.setAutocomplete(true)
				.setRequired(false))
		.addStringOption(option =>
			option.setName('fourth-card')
				.setDescription('Name of the card you want to remove from your list of desired cards.')
				.setAutocomplete(true)
				.setRequired(false))
		.addStringOption(option =>
			option.setName('fifth-card')
				.setDescription('Name of the card you want to remove from your list of desired cards.')
				.setAutocomplete(true)
				.setRequired(false))
		.addStringOption(option =>
			option.setName('sixth-card')
				.setDescription('Name of the card you want to remove from your list of desired cards.')
				.setAutocomplete(true)
				.setRequired(false))
		.addStringOption(option =>
			option.setName('seventh-card')
				.setDescription('Name of the card you want to remove from your list of desired cards.')
				.setAutocomplete(true)
				.setRequired(false))
		.addStringOption(option =>
			option.setName('eighth-card')
				.setDescription('Name of the card you want to remove from your list of desired cards.')
				.setAutocomplete(true)
				.setRequired(false))
		.addStringOption(option =>
			option.setName('ninth-card')
				.setDescription('Name of the card you want to remove from your list of desired cards.')
				.setAutocomplete(true)
				.setRequired(false))
		.addStringOption(option =>
			option.setName('tenth-card')
				.setDescription('Name of the card you want to remove from your list of desired cards.')
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
			return interaction.reply({ content: 'You must specify at least one card to remove from your desired cards list.', ephemeral: true });
		}

		const cards = getModel(interaction.client.db, Models.Card);
		let removedCardCount = 0, notRemovedCount = 0;
		const removeCardPromises = cardIds.map(async cardId => {
			const card = await cards.findByPk(cardId);
			if (card) {
				// Check if the card already exists in the user's desiredCards
				const existingCard = await currentUser.getDesiredCards({
					where: { id: card.id },
				});
		
				if (existingCard.length > 0) {
					// If the card exists, decrement the count
					const userCard = existingCard[0];
					if (userCard.UserCard.card_count > 1) {
                        userCard.UserCard.card_count -= 1;
                        removedCardCount++;
                        await userCard.UserCard.save();
                        console.log(`[LOG] Decremented count for card ${card.id} in user ${currentUser.nickname} (${currentUser.id}).`);
                    }
                    else {
                        notRemovedCount++;
                    }
				}
				else {
					notRemovedCount++;
                    // Log kept here for debugging but this is expected behavior, users may attempt to remove cards they've never added
                    // console.error(`[ERROR] Card ${card.id} not found in desired cards list for user ${currentUser.nickname} (${currentUser.id}).`);
				}
			} else {
				notRemovedCount++;
			}
		});
		
		// Wait for all card removals to complete
		await Promise.all(removeCardPromises);

		currentUser.save();
		let replyStatement = (removedCardCount > 0) ?
			`Successfully removed ${removedCardCount} card${removedCardCount === 1 ? '' : 's'} from your desired cards list!` :
			'Sorry, no cards were removed.';
		replyStatement = (notRemovedCount > 0)
			? `${replyStatement} Something went wrong removing ${notRemovedCount} card${notRemovedCount === 1 ? '' : 's'}.`
			: replyStatement;

		return interaction.reply({
			content: replyStatement,
			flags: MessageFlags.Ephemeral,
		});
	},
	cooldown: 1,
};

export default command;