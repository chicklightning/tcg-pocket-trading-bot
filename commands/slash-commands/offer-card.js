import { InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { Rarities, Sets, setupEmbed } from '../command-utilities.js';
import { Models, getModel, getUser } from '../../database/database-utilities.js';
import { Op } from 'sequelize';

const command = {
	data: new SlashCommandBuilder()
		.setName('offer-card')
		.setDescription('Choose a card to offer to another user in a trade.')
		.setContexts(InteractionContextType.Guild, InteractionContextType.PrivateChannel)
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
            option.setName('filter-to-target')
                .setDescription('Only show cards from the target user\'s desired cards list. ON by default.')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('filter-rarity')
                .setDescription('If target user has offered a card, only show cards of matching rarity. ON by default.')
                .setRequired(false)),
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused().toLowerCase();

        // The filters are on by default - this is because Discord caches a copy of the first autocomplete
        //   list sent when the focusedValue is empty, and we want the default list shown to be the
        //   taret user's desired cards if they have any; otherwise, we show all cards when the
        //   focusValue updates (or if the filter are turned off)
        const targetFilter = interaction.options.getBoolean('filter-to-target') ?? true;
        const rarityFilter = interaction.options.getBoolean('filter-rarity') ?? true;
        let otherCardRarity = 0;
        let filteredList = [];
        const target = interaction.options.get('target');
        const targetUser = (target) ? await getUser(interaction.client, target.value, null) : null;
        const user = await getUser(interaction.client, interaction.user.id, interaction.user.username);
        if (targetUser) {
            // Get trade between users so we can see if we need to filter offered cards by rarity
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

            if (trade) {
                // Get the rarity of the card offered by the target user (if they've offered a card) so we can suggest cards of matching rarity
                const cards = getModel(interaction.client.db, Models.Card);
                let card = null;
                if (interaction.user.id === trade.owner && trade.targetOfferedCard !== null && trade.targetOfferedCard !== '') {
                    card = await cards.findByPk(trade.targetOfferedCard);
                }
                else if (trade.ownerOfferedCard !== null && trade.ownerOfferedCard !== '') {
                    card = await cards.findByPk(trade.ownerOfferedCard);
                }

                if (card) {
                    otherCardRarity = card.rarity;
                }
            }
            // If a target is specified and there's no open trade found, the command will fail and the user will receive an error message
        }

        if (targetFilter && targetUser && targetUser.desiredCards && targetUser.desiredCards.length > 0) {
            let filtered = targetUser.desiredCards
                .filter(choice => {
                    const startsWith = choice.name.toLowerCase().startsWith(focusedValue);
                    let matchesRarity = true;
                    if (otherCardRarity !== 0 && rarityFilter) {
                        matchesRarity = (choice.rarity === otherCardRarity);
                    }
                    return startsWith && matchesRarity && !user.desiredCards.find((card) => card.id == choice.id);
                })
                .slice(0, 25) // Limit results to 25
                .sort((a, b) => {
                    return (a.rarity === b.rarity) ? a.name.localeCompare(b.name) : a.rarity - b.rarity;
                });

            // If user filter returns no cards, then show all cards (and filter where applicable)
            if (filtered.length === 0) {
                filtered = interaction.client.cardCache
                    .filter(choice => {
                        const startsWith = choice.name.toLowerCase().startsWith(focusedValue);
                        let matchesRarity = true;
                        if (otherCardRarity !== 0 && rarityFilter) {
                            matchesRarity = (choice.rarity === otherCardRarity);
                        }
                        return startsWith && matchesRarity && !user.desiredCards.find((card) => card.id == choice.id);
                    })
                    .slice(0, 25) // Limit results to 25
                    .sort((a, b) => {
						return (a.rarity === b.rarity) ? a.name.localeCompare(b.name) : a.rarity - b.rarity;
					});
            }
                
            filteredList = filtered
                .map(
                    choice => ({
                        name: `${choice.name} ${Rarities[choice.rarity - 1]} from ${Sets[choice.packSet]}`,
                        value: choice.id 
                    }))
                .sort((a, b) => {
                    return (a.rarity === b.rarity) ? a.name.localeCompare(b.name) : a.rarity - b.rarity;
                });
        }
        else {
            const filtered = interaction.client.cardCache
                .filter(choice => {
                    const startsWith = choice.name.toLowerCase().startsWith(focusedValue);
                    let matchesRarity = true;
                    if (otherCardRarity !== 0 && rarityFilter) {
                        matchesRarity = (choice.rarity === otherCardRarity);
                    }
                    return startsWith && matchesRarity && !user.desiredCards.find((card) => card.id == choice.id);
                })
                .slice(0, 25) // Limit results to 25
                .sort((a, b) => {
                    return (a.rarity === b.rarity) ? a.name.localeCompare(b.name) : a.rarity - b.rarity;
                });

            filteredList = filtered
                .map(
                    choice => ({
                        name: `${choice.name} ${Rarities[choice.rarity - 1]} from ${Sets[choice.packSet]}`,
                        value: choice.id 
                    }));
        }
        
        return interaction.respond(filteredList);
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
            trade.ownerOfferedCard = cardId;

            if (trade.targetOfferedCard !== null && trade.targetOfferedCard !== '') {
                const otherCard = await cards.findByPk(trade.targetOfferedCard);
                trade.isValid = card.rarity === otherCard.rarity;
            }
        }
        else {
            trade.targetOfferedCard = cardId;

            if (trade.ownerOfferedCard !== null && trade.ownerOfferedCard !== '') {
                const otherCard = await cards.findByPk(trade.ownerOfferedCard);
                trade.isValid = card.rarity === otherCard.rarity;
            }
        }

        trade.save();

        const targetUserEmbed = setupEmbed()
            .setTitle(`${interaction.user.username} Has Offered You a Card`)
            .setDescription(`<@${interaction.user.id}> offered ${card.name} ${Rarities[card.rarity - 1]} from ${card.packSet}.`)
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