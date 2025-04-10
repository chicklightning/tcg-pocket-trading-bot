import { ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { ephemeralErrorReply, Rarities, Sets, setupEmbed, TargetUserOptionName } from '../command-utilities.js';

const rarityFilterOptionName = 'rarity';
const setFilterOptionName = 'set';
const visibilityOptionName = 'visible-to-all';
const filterCallerCardsOptionName = 'filter-my-cards';

const backId = 'back'
const forwardId = 'forward'

const backButton = new ButtonBuilder()
    .setCustomId(backId)
    .setStyle(ButtonStyle.Secondary)
    .setLabel('Back')
    .setEmoji('⬅️');

const forwardButton = new ButtonBuilder()
    .setCustomId(forwardId)
    .setStyle(ButtonStyle.Secondary)
    .setLabel('Forward')
    .setEmoji('➡️');

/**
 * Creates an embed with guilds starting from an index.
 * @param {number} start The index to start from.
 * @returns {Promise<EmbedBuilder>}
 */
const generateEmbed = async (sortedCardList, targetUser, start) => {
    const current = sortedCardList.slice(start, start + 25)
  
    const titlePages = (current.length === sortedCardList.length) 
        ? ''
        : ` ${start + 1}-${start + current.length} out of ${sortedCardList.length}`;
    const embed = setupEmbed().setTitle(`Cards Wanted by ${targetUser.nickname}${titlePages}`);

    let descriptionString = '';
    await Promise.all(current.map(async card => {
        const existingCard = await targetUser.getDesiredCards({
            where: { id: card.id },
        });

        if (existingCard.length > 0) {
            const userCard = existingCard[0];
            if (userCard.UserCard.card_count === 0) {
                return; // Skip if card count is 0, shouldn't happen though
            }
            const totalCount = userCard.UserCard.card_count > 1 ? ' x' + userCard.UserCard.card_count : '';
            descriptionString += `- [${card.name}](${card.image})${totalCount} ${Rarities[card.rarity - 1]} from ${card.packSet}\n`;
        }
        else {
            console.error(`[ERROR] Something went wrong - ${card.id} not mapped to ${targetUser.nickname} (${targetUser.id}) despite being in desired cards list.`);
        }
    }));
    
    if (descriptionString.length === 0) {
        embed.setDescription('There are no cards in the desired list.');
    }
    else {
        embed.setDescription(descriptionString);
    }

    return embed;
};

const command = {
	data: new SlashCommandBuilder()
		.setName('get-cards')
		.setDescription('Get the list of cards you want others to trade to you.')
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
        .addIntegerOption(option => {
            option.setName(rarityFilterOptionName)
            .setDescription('The rarity of cards you\'d like to display.');
        
            // Dynamically add rarity choices
            Rarities.forEach((rarity, index) => {
                option.addChoices({ name: rarity, value: index + 1 });
            });

            return option.setRequired(false);
        })
        .addStringOption(option => {
            option.setName(setFilterOptionName)
                .setDescription('The set of cards you\'d like to display.');
            
            // Dynamically add set choices
            Object.keys(Sets).forEach(setName => {
                option.addChoices({ name: setName, value: setName });
            });

            return option.setRequired(false);
        })
        .addUserOption(option =>
            option.setName(TargetUserOptionName)
                .setDescription('The user whose desired cards you want to view. If not specified, you will see your own list.')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName(visibilityOptionName)
                .setDescription('Set if message contents are visible to all users or only to you. OFF by default.')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName(filterCallerCardsOptionName)
                .setDescription('If showing a target user\'s cards, don\'t show cards you also need. OFF by default.')
                .setRequired(false)),
	async execute(interaction) {
        const rarityFilter = interaction.options.getInteger(rarityFilterOptionName) ?? 0; // 0 means no filter
        const setFilter = interaction.options.getString(setFilterOptionName) ?? ''; // '' means no filter
        const userOption = interaction.options.getUser(TargetUserOptionName);
        const visibility = interaction.options.getBoolean(visibilityOptionName) ?? false;

        const db = interaction.client.database;
		const targetUser = await db.getUser(userOption?.id ?? interaction.user.id, userOption?.username ?? interaction.user.username);

        if (targetUser && targetUser.desiredCards && targetUser.desiredCards.length > 0) {
            const filterDesiredCards = interaction.options.getBoolean(filterCallerCardsOptionName) ?? false;
            let user = null;

            if (targetUser.id !== interaction.user.id && filterDesiredCards) {
                user = await db.getUser(interaction.user.id, interaction.user.username);
            }

            // Sort the desired cards by rarity (ascending) and then by name (alphabetically)
            const sortedCards = targetUser.desiredCards
                .filter(card => {
                    if (rarityFilter > 0) {
                        return card.rarity === rarityFilter; // Filter by rarity if specified
                    }
                    
                    if (setFilter !== '') {
                        return card.packSet.toLowerCase() === setFilter.toLowerCase(); // Filter by set if specified
                    }

                    if (user && filterDesiredCards) {
                        return !user.desiredCards.find(userCard => userCard.id === card.id);
                    }

                    return true;
                })
                .sort((a, b) => {
                    return (a.rarity === b.rarity) ? a.name.localeCompare(b.name) : a.rarity - b.rarity;
                });
            
            // Send the embed with the first 25 cards
            const row = new ActionRowBuilder().addComponents(forwardButton);

            const canFitOnOnePage = sortedCards.length <= 25;
            const embedMessage = await interaction.reply({
                embeds: [ await generateEmbed(sortedCards, targetUser, 0) ],
                flags: (!visibility) ? MessageFlags.Ephemeral : null,
                components: canFitOnOnePage ? [] : [ row ]
            });

            // Exit if there is only one page of guilds (no need for all of this)
            if (canFitOnOnePage)  {
                return;
            }

            // Collect button interactions (when a user clicks a button)
            const collector = embedMessage.createMessageComponentCollector();

            let currentIndex = 0;
            collector.on('collect', async interaction => {
                // Increase/decrease index
                interaction.customId === backId ? (currentIndex -= 25) : (currentIndex += 25);

                // Respond to interaction by updating message with new embed
                await interaction.update({
                    embeds: [ await generateEmbed(sortedCards, targetUser, currentIndex) ],
                    flags: (!visibility) ? MessageFlags.Ephemeral : null,
                    components: [
                        new ActionRowBuilder().addComponents(
                            // back button if it isn't the start
                            ...(currentIndex ? [ backButton ] : []),
                            // forward button if it isn't the end
                            ...(currentIndex + 25 < sortedCards.length ? [ forwardButton ] : [])
                        )
                    ]
                });
            });
        }
        else if (userOption.id === interaction.client.user.id) {
            return ephemeralErrorReply(interaction, 'I don\'t have any desired cards.');
        }
        else {
            let stubUser = {
                nickname: userOption?.username ?? interaction.user.username,
            }
            await interaction.reply({
                embeds: [ await generateEmbed([], stubUser, 0) ],
                flags: (!visibility) ? MessageFlags.Ephemeral : null,
            });
        }
	},
	cooldown: 2,
};

export default command;