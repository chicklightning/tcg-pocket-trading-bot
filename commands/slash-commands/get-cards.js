import { EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { Rarities, Sets } from '../command-utilities.js';
import { getUser } from '../../database/database-utilities.js';

const command = {
	data: new SlashCommandBuilder()
		.setName('get-cards')
		.setDescription('Get the list of cards you want others to trade to you.')
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM)
        .addIntegerOption(option =>
            option.setName('rarity')
                .setDescription('The rarity of cards you\'d like to display.')
                .addChoices(
                    { name: Rarities[0], value: 1 },
                    { name: Rarities[1], value: 2 },
                    { name: Rarities[2], value: 3 },
                    { name: Rarities[3], value: 4 },
                    { name: Rarities[4], value: 5 },
                )
                .setRequired(false))
        .addStringOption(option =>
            option.setName('set')
                .setDescription('The set of cards you\'d like to display.')
                .addChoices(
                    { name: Object.keys(Sets)[0], value: Object.keys(Sets)[0] },
                    { name: Object.keys(Sets)[1], value: Object.keys(Sets)[1] },
                    { name: Object.keys(Sets)[2], value: Object.keys(Sets)[2] },
                    { name: Object.keys(Sets)[3], value: Object.keys(Sets)[3] },
                )
                .setRequired(false)),
	async execute(interaction) {
        const rarityFilter = interaction.options.getInteger('rarity') ?? 0; // 0 means no filter
        const setFilter = interaction.options.getString('set') ?? ''; // '' means no filter
		let currentUser = await getUser(interaction.client, interaction.user.id, interaction.user.username);

        // TODO: Make a utility for a base embed builder
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle(`Cards Wanted by ${currentUser.nickname}`)
            .setAuthor({
                name: 'Pokémon TCG Pocket Trader',
                iconURL: 'https://github.com/chicklightning/tcg-pocket-trading-bot/blob/main/assets/icon.png?raw=true',
                url: 'https://github.com/chicklightning/tcg-pocket-trading-bot/wiki/User-manual',
            })
            .setTimestamp();

        let descriptionString = '';
        if (currentUser.desiredCards && currentUser.desiredCards.length > 0) {
            const getCardPromises = currentUser.desiredCards.map(async card => {
                const existingCard = await currentUser.getDesiredCards({
                    where: {
                        id: card.id ,
                        ...(rarityFilter > 0 && { rarity: rarityFilter }), // Filter by rarity if specified
                        ...(setFilter !== '' && { packSet: setFilter }),   // Filter by set if specified
                    },
                });
    
                if (existingCard.length > 0) {
                    const userCard = existingCard[0];
                    if (userCard.UserCard.card_count === 0) {
                        return; // Skip if card count is 0, shouldn't happen though
                    }
                    const totalCount = userCard.UserCard.card_count > 1 ? 'x' + userCard.UserCard.card_count : '';
                    descriptionString += `- [${card.name}](${card.image}) ${totalCount} ${Rarities[card.rarity - 1]} from ${card.packSet}\n`;
                }
                else {
                    console.error(`[ERROR] Something went wrong - ${card.id} not mapped to ${currentUser.nickname} (${currentUser.id}) despite being in desired cards list.`);
                }
            });
    
            // Wait for all card fetches to complete
            await Promise.all(getCardPromises);
        }

        if (descriptionString.length === 0) {
            embed.setDescription('You currently have no cards in your desired list.');
        }
        else {
            embed.setDescription(descriptionString);
        }

        return interaction.reply({
            embeds: [ embed ],
        });
	},
	cooldown: 2,
};

export default command;