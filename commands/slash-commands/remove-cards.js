import { EmbedBuilder, InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { Rarities, Sets } from '../command-utilities.js';
import { Models, getModel, getUser } from '../../database/database-utilities.js';

const command = {
	data: new SlashCommandBuilder()
		.setName('remove-cards')
		.setDescription('Remove one or more cards from the list of cards you want others to trade to you.')
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM)
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

        const cardIdsWithCount = Array.from(new Set(cardIds)).map(a =>
            ({ name: a, count: cardIds.filter(f => f === a).length }));

        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle(`Cards Removed by ${currentUser.nickname}`)
            .setAuthor({
                name: 'Pokémon TCG Pocket Trader',
                iconURL: 'https://github.com/chicklightning/tcg-pocket-trading-bot/blob/main/assets/icon.png?raw=true',
                url: 'https://github.com/chicklightning/tcg-pocket-trading-bot',
            })
            .setTimestamp();

		const cards = getModel(interaction.client.db, Models.Card);
        let descriptionString = '';

		const removeCardPromises = cardIdsWithCount.map(async ({ name: cardId, count: countToRemove }) => {
			const card = await cards.findByPk(cardId);
			if (card) {
				const existingCards = await currentUser.getDesiredCards({
                    where: { id: card.id },
                });
		
				if (existingCards.length > 0) {
					// If the card exists and count is above 0, decrement the count
					const userCard = existingCards[0];

					if (userCard.UserCard.card_count > 0) {
                        userCard.UserCard.card_count -= countToRemove;
        
                        const totalCount = countToRemove > 1 ? 'x' + countToRemove : '';
                        descriptionString += `- Removed [${card.name}](${card.image}) ${totalCount} ${Rarities[card.rarity - 1]} from ${card.packSet}\n`;
                        if (userCard.UserCard.card_count <= 0) {
                            // Remove the UserCard record if the count becomes 0 or less
                            await userCard.UserCard.destroy();
                            console.log(`[LOG] Removed card ${card.id} from user ${currentUser.nickname} (${currentUser.id}) as count reached 0.`);
                        }
                        else {
                            // Otherwise, save the updated count
                            await userCard.UserCard.save();
                            console.log(`[LOG] Decremented count for card ${card.id} in user ${currentUser.nickname} (${currentUser.id}).`);
                        }
                    }
                    else {
                        descriptionString += `- Issue removing [${card.name}](${card.image}) ${Rarities[card.rarity - 1]} from ${card.packSet}, internal error\n`;
                    }
				}
				else {
                    descriptionString += `- Issue removing [${card.name}](${card.image}) ${Rarities[card.rarity - 1]} from ${card.packSet}, card not in your list\n`;
                    // Log kept here for debugging but this is expected behavior, users may attempt to remove cards they've never added
                    // console.error(`[ERROR] Card ${card.id} not found in desired cards list for user ${currentUser.nickname} (${currentUser.id}).`);
				}
			}
            else {
                descriptionString += `- Issue removing ${cardId}, couldn't find card\n`;
			}
		});
		
		// Wait for all card removals to complete
		await Promise.all(removeCardPromises);

        embed.setDescription(descriptionString);
		currentUser.save();

		return interaction.reply({
			embeds: [ embed ],
			flags: MessageFlags.Ephemeral,
		});
	},
	cooldown: 1,
};

export default command;