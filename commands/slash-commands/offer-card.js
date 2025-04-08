import { InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { Rarities, Sets, setupEmbed } from '../command-utilities.js';
import { Models, getModel, getUser } from '../../database/database-utilities.js';
import { Op } from 'sequelize';

const command = {
	data: new SlashCommandBuilder()
		.setName('offer-card')
		.setDescription('Choose a card to offer to another user in a trade.')
		.setContexts(InteractionContextType.Guild)
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user you want to offer a card to.')
                .setRequired(true))
		.addStringOption(option =>
			option.setName('card')
				.setDescription('Name of the card you want to offer from the other user\'s desired card list.')
				.setAutocomplete(true)
				.setRequired(true))
        .addBooleanOption(option =>
            option.setName('filter-cards')
                .setDescription('Only show cards from the target user\'s desired cards list. ON by default.')
                .setRequired(false)),
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused().toLowerCase();

        // The filter is on by default - this is because Discord caches a copy of the first autocomplete
        //   list sent when the focusedValue is empty, and we want the default list shown to be the
        //   taret user's desired cards if they have any; otherwise, we show all cards when the
        //   focusValue updates (or if the filter is turned off)
        const filterOption = interaction.options.getBoolean('filter-cards') ?? true;

        if (filterOption) {
            // We need to get this option by name, it hasn't resolved into a user yet and has limited information
            const target = interaction.options.get('target');

            if (target) {
                const targetUser = await getUser(interaction.client, target.value, null);
                if (targetUser.desiredCards && targetUser.desiredCards.length > 0) {
                    const filtered = targetUser.desiredCards
                        .filter(choice => choice.name.toLowerCase().startsWith(focusedValue))
                        .slice(0, 25); // Limit results to 25

                    return interaction.respond(filtered.map(
                        choice => ({
                            name: `${choice.name} ${Rarities[choice.rarity - 1]} from ${Sets[choice.packSet]}`,
                            value: choice.id 
                        })));
                }
            }
        }
        
        const filtered = interaction.client.cardCache
            .filter(choice => choice.id.toLowerCase().startsWith(focusedValue))
            .slice(0, 25); // Limit results to 25
        
        return interaction.respond(filtered.map(
            choice => ({
                name: `${choice.name} ${Rarities[choice.rarity - 1]} from ${Sets[choice.packSet]}`,
                value: choice.id 
            })));
    },
	async execute(interaction) {
        const targetUser = interaction.options.getUser('target');

		if (targetUser.id === interaction.user.id) {
            return interaction.reply({
                content: `You can't offer yourself a card to trade.`,
                flags: MessageFlags.Ephemeral,
            });
        }

        // Check if there is an ongoing trade between the two users
        const trades = getModel(interaction.client.db, Models.Trade);
        const trade = await trades.findOne({
            where: {
                isComplete: false,
                [Op.or]: [
                    { owner: interaction.user.id, target: targetUser.id },
                    { owner: targetUser.id, target: interaction.user.id },
                ],
            },
        });

        if (!trade) {
            return interaction.reply({
                content: `No open trade exists between you and ${targetUser.username}. Did you forget to call /start-trade?`,
                flags: MessageFlags.Ephemeral,
            });
        }

        // Make sure the card exists
        const cards = getModel(interaction.client.db, Models.Card);
        const cardId = interaction.options.getString('card').trim();
        const card = (cardId !== '') ? await cards.findByPk(cardId) : null;
        if (!card) {
            return interaction.reply({
                content: `The card you specified does not exist.`,
                flags: MessageFlags.Ephemeral,
            });
        }

		// Update the trade with the offered card
        if (interaction.user.id === trade.owner) {
            trade.desiredCardA = cardId;
        }
        else {
            trade.desiredCardB = cardId;
        }
        trade.save();

        const targetUserEmbed = setupEmbed()
            .setTitle(`${interaction.user.username} Has Offered You a Card`)
            .setDescription(`${card.name} ${Rarities[card.rarity - 1]} from ${card.packSet} was offered.`)
            .setImage(card.image);

		targetUser.send({
			embeds: [ targetUserEmbed ],
			flags: MessageFlags.Ephemeral,
		}).catch(() => {
			// If the user has DMs disabled, we can't notify them
		});

        const embed = setupEmbed()
            .setTitle(`You Offered a Card to ${targetUser.username}`)
            .setDescription(`${card.name} ${Rarities[card.rarity - 1]} from ${card.packSet} offered to <@${targetUser.id}>.`)
            .setImage(card.image);
		
        return interaction.reply({
			embeds: [ embed ],
			flags: MessageFlags.Ephemeral,
		});
	},
	cooldown: 1,
};

export default command;