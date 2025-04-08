import { InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { Rarities, Sets, setupEmbed } from '../command-utilities.js';
import { Models, getModel, getUser } from '../../database/database-utilities.js';

const command = {
	data: new SlashCommandBuilder()
		.setName('add-cards')
		.setDescription('Add one or more cards to the list of cards you want others to trade to you.')
		.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM)
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
		// TODO: Make an autocomplete utility function that filters the card cache based on the user's input
		const focusedValue = interaction.options.getFocused().toLowerCase();
		const filtered = interaction.client.cardCache
			.filter(choice => choice.id.toLowerCase().startsWith(focusedValue))
			.slice(0, 25); // Limit results to 25
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

		const cardIdsWithCount = Array.from(new Set(cardIds)).map(a =>
			({ name: a, count: cardIds.filter(f => f === a).length }));

		const embed = setupEmbed().setTitle(`Cards Added by ${currentUser.nickname}`);

		const cards = getModel(interaction.client.db, Models.Card);
		let descriptionString = '';
		const addCardPromises = cardIdsWithCount.map(async ({ name: cardId, count: countToAdd }) => {
			const card = await cards.findByPk(cardId);
			if (card) {
				// Check if the card already exists in the user's desiredCards
				const existingCards = await currentUser.getDesiredCards({
					where: { id: card.id },
				});
		
				if (existingCards.length > 0) {
					const userCard = existingCards[0];
					userCard.UserCard.card_count += countToAdd;
					await userCard.UserCard.save();
					console.log(`[LOG] Incremented count for card ${card.id} in user ${currentUser.nickname} (${currentUser.id}).`);
				}
				else {
					// If the card doesn't exist, add it to the desiredCards
					await currentUser.addDesiredCard(card);
					const newUserCard = await currentUser.getDesiredCards({
						where: { id: card.id },
					});

					if (!newUserCard || newUserCard.length === 0) {
						descriptionString += `- Issue adding [${card.name}](${card.image}) ${totalCount} ${Rarities[card.rarity - 1]} from ${card.packSet}, internal error\n`;
						console.error(`[ERROR] Something went wrong - ${card.id} not added to ${currentUser.nickname} (${currentUser.id}) despite being in desired cards list.`);
						return;
					}
					newUserCard[0].UserCard.card_count += countToAdd - 1; // New usercards are initiated with count 1
					await newUserCard[0].UserCard.save();
					console.log(`[LOG] Successfully added card ${card.id} to user ${currentUser.nickname} (${currentUser.id}).`);
				}

				const totalCount = countToAdd > 1 ? 'x' + countToAdd : '';
				descriptionString += `- Added [${card.name}](${card.image}) ${totalCount} ${Rarities[card.rarity - 1]} from ${card.packSet}\n`;
			}
			else {
				descriptionString += `- Issue adding ${cardId}, no such card exists\n`;
			}
		});
		
		// Wait for all card additions to complete
		await Promise.all(addCardPromises);

		currentUser.save();
		embed.setDescription(descriptionString);
		return interaction.reply({
			embeds: [ embed ],
			flags: MessageFlags.Ephemeral,
		});
	},
	cooldown: 1,
};

export default command;