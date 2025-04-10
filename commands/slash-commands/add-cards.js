import { InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { AddRemoveOptionNames, ephemeralErrorReply, generateAutocompleteOptions, Rarities, setupEmbed } from '../command-utilities.js';

const command = {
	data: (() => {
        const builder = new SlashCommandBuilder()
            .setName('add-cards')
            .setDescription('Add one or more cards to the list of cards you want others to trade to you.')
            .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel);

        // Dynamically add string options using AddRemoveOptionNames
        AddRemoveOptionNames.forEach(optionName => {
            builder.addStringOption(option =>
                option.setName(optionName)
                    .setDescription(`Name of the card you want to add to your list of desired cards.`)
                    .setAutocomplete(true)
                    .setRequired(optionName === AddRemoveOptionNames[0]) // Only the first card is required
            );
        });

        return builder;
    })(),
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused().toLowerCase();
		const filterFn = (choice, focusedValue) => choice.id.toLowerCase().startsWith(focusedValue);
		await interaction.respond(generateAutocompleteOptions(interaction.client.cardCache, filterFn, focusedValue));
	},
	async execute(interaction) {
		const db = interaction.client.database;
		let currentUser = await db.getOrAddUser(interaction.user.id, interaction.user.username);
		if (!currentUser) {
			return ephemeralErrorReply(interaction, 'Sorry, something went wrong. Please contact the bot\'s admin to let them know.');
		}

		const cardIds = AddRemoveOptionNames
            .map(optionName => interaction.options.getString(optionName)?.trim())
            .filter(id => id !== null && id !== undefined && id?.trim() !== '');

		if (cardIds.length === 0) {
			return ephemeralErrorReply(interaction, 'You must specify at least one card to add to your desired cards list.');
		}

		const cardIdsWithCount = Array.from(new Set(cardIds)).map(a =>
			({ name: a, count: cardIds.filter(f => f === a).length }));

		const embed = setupEmbed().setTitle(`Cards Added by ${currentUser.nickname}`);

		const cards = db.getModel(db.models.Card);
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