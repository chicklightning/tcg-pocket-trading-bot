import { ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { setupEmbed, Rarities } from '../command-utilities.js';
import { Models, getModel } from '../../database/database-utilities.js';
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
        const cardA = trade.desiredCardA !== null ? await cards.findByPk(trade.desiredCardA) : null;
        const cardB = trade.desiredCardB !== null ? await cards.findByPk(trade.desiredCardB) : null;

        if (targetUser) {
            if (cardA) {
                const cardOwner = trade.owner === interaction.user.id ? 'You\'re' : 'They\'re';
                descriptionString += ` ${cardOwner} offering ${cardA.name} ${Rarities[cardA.rarity - 1]} from ${cardA.packSet} and `;
                embed
                    .setURL('https://github.com/chicklightning/tcg-pocket-trading-bot/wiki')
                    .setImage(cardA.image);
            }
            else {
                const cardOwner = trade.owner === interaction.user.id ? 'You' : 'They';
                descriptionString += `${cardOwner} have not offered a card and `;
            }
            
            if (cardB) {
                const cardOwner = trade.target === interaction.user.id ? 'you\'re' : 'they\'re';
                descriptionString += `${cardOwner} offering ${cardB.name} ${Rarities[cardB.rarity - 1]} from ${cardB.packSet}.\n`;

                // If two embeds are created with the same URL, Discord will aggregate the images from both into a single embed,
                //   so let's show the card images since it's a single trade being shown
                const secondEmbed = new EmbedBuilder()
                    .setURL('https://github.com/chicklightning/tcg-pocket-trading-bot/wiki')
                    .setImage(cardB.image);
                embeds.push(secondEmbed);
            }
            else {
                const cardOwner = trade.target === interaction.user.id ? 'you' : 'they';
                descriptionString += `${cardOwner} have not offered a card.\n`;
            }
        }
        else {
            if (cardA) {
                const cardOwner = trade.owner === interaction.user.id ? 'You have' : `<@${trade.owner}> has`;
                descriptionString += `- ${cardOwner} offered [${cardA.name}](${cardA.image}) ${Rarities[cardA.rarity - 1]} from ${cardA.packSet} and `;
            }
            else {
                const cardOwner = trade.owner === interaction.user.id ? 'You have' : `<@${trade.owner}> has`;
                descriptionString += `- ${cardOwner} not offered a card and `;
            }
            
            if (cardB) {
                const cardOwner = trade.target === interaction.user.id ? 'you have' : `<@${trade.target}> has`;
                descriptionString += `${cardOwner} offered [${cardB.name}](${cardB.image}) ${Rarities[cardB.rarity - 1]} from ${cardB.packSet}.\n`;
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
		.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM)
		.addUserOption(option =>
            option.setName('target')
                .setDescription('Will show you an open trade with this user, if one exists.')
                .setRequired(false)),
	async execute(interaction) {
		const targetUser = interaction.options.getUser('target');
        const trades = getModel(interaction.client.db, Models.Trade);
        let tradesList = {};
        if (targetUser) {
            // Check if there is an ongoing trade between the two users
            const existingTrade = await trades.findOne({
                where: {
                    isComplete: false,
                    [Op.or]: [
                        { owner: interaction.user.id, target: targetUser.id },
                        { owner: targetUser.id, target: interaction.user.id },
                    ],
                },
            });

            if (!existingTrade) {
                return interaction.reply({
                    content: `No open trade exists between you and ${targetUser.username}.`,
                    flags: MessageFlags.Ephemeral,
                });
            }

            tradesList = [ existingTrade ];
        }
        else {
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
        const row = new ActionRowBuilder()
            .addComponents(forwardButton);
        
        const canFitOnOnePage = tradesList.length <= 10;
        const embedMessage = await interaction.reply({
            embeds: [ ...await generateEmbeds(tradesList, interaction, targetUser, 0) ],
            components: canFitOnOnePage ? [] : [ row ],
            flags: MessageFlags.Ephemeral,
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