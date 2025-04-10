import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { setupEmbed, Rarities, TargetUserOptionName } from '../command-utilities.js';
import { Models, getModel, getOpenTradeForUsers } from '../../database/database-utilities.js';
import { Op } from 'sequelize';

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
const generateEmbeds = async (tradesList, interaction, targetUser, start) => {
    const current = tradesList.slice(start, start + 10)
  
    const titlePages = (current.length === tradesList.length) 
        ? ''
        : ` ${start + 1}-${start + current.length} out of ${tradesList.length}`;

    let embeds = [];
    const tradeWithText = targetUser ? ` with ${targetUser.username}` : '';
    const embed = setupEmbed().setTitle(`Open Trade${tradesList.length === 1 ? '' : 's'}${tradeWithText}${titlePages}`);
    embeds.push(embed);

    let descriptionString = '';
    const cards = getModel(interaction.client.db, Models.Card);
    await Promise.all(current.map(async trade => {
        const ownerOfferedCard = trade.ownerOfferedCard !== null ? await cards.findByPk(trade.ownerOfferedCard) : null;
        const targetOfferedCard = trade.targetOfferedCard !== null ? await cards.findByPk(trade.targetOfferedCard) : null;

        if (targetUser) {
            if (ownerOfferedCard) {
                const cardOwner = trade.owner === interaction.user.id ? 'You\'re' : `<@${targetUser.id}> is`;
                descriptionString += ` ${cardOwner} offering ${ownerOfferedCard.name} ${Rarities[ownerOfferedCard.rarity - 1]} from ${ownerOfferedCard.packSet} and `;
                embed
                    .setURL('https://github.com/chicklightning/tcg-pocket-trading-bot/wiki')
                    .setImage(ownerOfferedCard.image);
            }
            else {
                const cardOwner = trade.owner === interaction.user.id ? 'You have' : `<@${targetUser.id}> has`;
                descriptionString += `${cardOwner} not offered a card and `;
            }
            
            if (targetOfferedCard) {
                const cardOwner = trade.target === interaction.user.id ? 'you\'re' : `<@${targetUser.id}> is`;
                descriptionString += `${cardOwner} offering ${targetOfferedCard.name} ${Rarities[targetOfferedCard.rarity - 1]} from ${targetOfferedCard.packSet}.\n`;

                if (!ownerOfferedCard) {
                    embed.setImage(targetOfferedCard.image);
                }
                else {
                    // If two embeds are created with the same URL, Discord will aggregate the images from both into a single embed,
                    //   so let's show the card images since it's a single trade being shown
                    const secondEmbed = new EmbedBuilder()
                        .setURL('https://github.com/chicklightning/tcg-pocket-trading-bot/wiki')
                        .setImage(targetOfferedCard.image);
                    embeds.push(secondEmbed);
                }
            }
            else {
                const cardOwner = trade.target === interaction.user.id ? 'you have' : `<@${targetUser.id}> has`;
                descriptionString += `${cardOwner} not offered a card.\n`;
            }
        }
        else {
            if (ownerOfferedCard) {
                const cardOwner = trade.owner === interaction.user.id ? 'You have' : `<@${trade.owner}> has`;
                descriptionString += `- ${cardOwner} offered [${ownerOfferedCard.name}](${ownerOfferedCard.image}) ${Rarities[ownerOfferedCard.rarity - 1]} from ${ownerOfferedCard.packSet} and `;
            }
            else {
                const cardOwner = trade.owner === interaction.user.id ? 'You have' : `<@${trade.owner}> has`;
                descriptionString += `- ${cardOwner} not offered a card and `;
            }
            
            if (targetOfferedCard) {
                const cardOwner = trade.target === interaction.user.id ? 'you have' : `<@${trade.target}> has`;
                descriptionString += `${cardOwner} offered [${targetOfferedCard.name}](${targetOfferedCard.image}) ${Rarities[targetOfferedCard.rarity - 1]} from ${targetOfferedCard.packSet}.\n`;
            }
            else {
                const cardOwner = trade.target === interaction.user.id ? 'you have' : `<@${trade.target}> has`;
                descriptionString += `${cardOwner} not offered a card.\n`;
            }
        }
    }));

    if (descriptionString.length === 0) {
        embed.setDescription('You have no open trades.');
    }
    else {
        embed.setDescription(descriptionString);
    }

    return embeds;
};

const command = {
	data: new SlashCommandBuilder()
		.setName('get-open-trades')
		.setDescription('See your open trades.')
		.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
		.addUserOption(option =>
            option.setName(TargetUserOptionName)
                .setDescription('Will show you an open trade with this user, if one exists.')
                .setRequired(false)),
	async execute(interaction) {
		const targetUser = interaction.options.getUser(TargetUserOptionName);
        let tradesList = {};
        if (targetUser) {
            // Check if there is an ongoing trade between the two users
            const existingTrade = await getOpenTradeForUsers(interaction.client.db, interaction.user.id, targetUser.id);
            if (!existingTrade) {
                return interaction.reply({
                    content: `No open trade exists between you and ${targetUser.username}.`,
                    flags: MessageFlags.Ephemeral,
                });
            }

            tradesList = [ existingTrade ];
        }
        else {
            const trades = getModel(interaction.client.db, Models.Trade);
            tradesList = await trades.findAll({
                where: {
                    isComplete: false,
                    [Op.or]: [
                        { owner:  interaction.user.id },
                        { target: interaction.user.id },
                    ],
                },
            });
        }

        // Send the embed with the first 10 trades
        const row = new ActionRowBuilder().addComponents(forwardButton);
        
        const canFitOnOnePage = tradesList.length <= 10;
        const embedMessage = await interaction.reply({
            embeds: [ ...await generateEmbeds(tradesList, interaction, targetUser, 0) ],
            components: canFitOnOnePage ? [] : [ row ],
            flags: MessageFlags.Ephemeral,
        });

        // Exit if there is only one page of guilds (no need for all of this)
        if (canFitOnOnePage) {
            return;
        }

        // Collect button interactions (when a user clicks a button)
        const collector = embedMessage.createMessageComponentCollector();
        let currentIndex = 0;
        collector.on('collect', async interaction => {
            // Increase/decrease index
            interaction.customId === backId ? (currentIndex -= 10) : (currentIndex += 10);

            // Respond to interaction by updating message with new embed
            await interaction.update({
                embeds: [ ...await generateEmbeds(tradesList, interaction, targetUser, currentIndex) ],
                components: [
                    new ActionRowBuilder().addComponents(
                        // back button if it isn't the start
                        ...(currentIndex ? [ backButton ] : []),
                        // forward button if it isn't the end
                        ...(currentIndex + 10 < tradesList.length ? [ forwardButton ] : [])
                    )
                ],
                flags: MessageFlags.Ephemeral,
            });
        });
	},
	cooldown: 3,
};

export default command;