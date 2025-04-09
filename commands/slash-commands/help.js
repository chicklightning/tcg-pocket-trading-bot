import { InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { setupEmbed } from '../command-utilities.js';

// TODO: Map command names to embeds, create help embeds and choices programmatically
const addCardsCommand = '/add-cards';
const removeCardsCommand = '/remove-cards';
const getCardsCommand = '/get-cards';
const startTradeCommand = '/start-trade';
const getOpenTradesCommand = '/get-open-trades';
const offerCardCommand = '/offer-card';
const cancelTradeCommand = '/cancel-trade';
const completeTradeCommand = '/complete-trade';

const command = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Add one or more cards to the list of cards you want others to trade to you.')
		.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM)
		.addStringOption(option =>
			option.setName('command-name')
				.setDescription('Name of the command you want information on.')
				.setRequired(false)
                .addChoices(
                    { name: addCardsCommand, value: addCardsCommand },
                    { name: removeCardsCommand, value: removeCardsCommand },
                    { name: getCardsCommand, value: getCardsCommand },
                    { name: startTradeCommand, value: startTradeCommand },
                    { name: getOpenTradesCommand, value: getOpenTradesCommand },
                    { name: offerCardCommand, value: offerCardCommand}
                )),
	async execute(interaction) {
		const commandName = interaction.options.getString('command-name') ?? '';
        
        let embed;
        if (commandName === addCardsCommand) {
            embed = setupEmbed()
            .setTitle(`Command Help: ${addCardsCommand}`)
            .setURL('https://github.com/chicklightning/tcg-pocket-trading-bot/wiki/User-manual#add-cards')
            .setDescription('This command lets you add cards to the list of cards you want other people to trade to you (so cards you need).')
            .addFields([
                {
                    name: 'Constraints',
                    value: 'You can add up to 10 cards at a time, and must add a minimum of one (1) card each time you use this command.'
                },
                {
                    name: 'Autocomplete',
                    value: 'For each card "input" option, you can start typing the name of the card you want (like "sha" for "Shaymin") and a list of matching tradeable cards will appear. You should select one of these options rather than typing your own, or the command will not add the card.'
                },
                {
                    name: 'Multiple copies of a card',
                    value: 'If you want to add multiple copies of the same card, you must add them separately, i.e. first-card would be "Burmy from TL ♦️" and second-card would be "Burmy from TL ♦️" to add two copies of this card to your list.'
                },
                {
                    name: 'Error states',
                    value: 'If you attempt to add a card to your list that doesn\'t exist or was mistyped, the command will let you know in the response.'
                },
            ]);
        }
        else if (commandName === removeCardsCommand) {
            embed = setupEmbed()
            .setTitle(`Command Help: ${removeCardsCommand}`)
            .setURL('https://github.com/chicklightning/tcg-pocket-trading-bot/wiki/User-manual#remove-cards')
            .setDescription('This command lets you remove cards from the list of cards you want other people to trade to you (so cards you no longer need).')
            .addFields([
                {
                    name: 'Constraints',
                    value: 'You can remove up to 10 cards at a time, and must remove a minimum of one (1) card each time you use this command.'
                },
                {
                    name: 'Autocomplete',
                    value: 'For each card "input" option, you can start typing the name of the card you want (like "sha" for "Shaymin") and a list of matching tradeable cards will appear. You should select one of these options rather than typing your own, or the command will not remove the card.'
                },
                {
                    name: 'Multiple copies of a card',
                    value: 'If you want to remove multiple copies of the same card, you must remove them separately, i.e. first-card would be "Burmy from TL ♦️" and second-card would be "Burmy from TL ♦️" to remove two copies of this card from your list.'
                },
                {
                    name: 'Error states',
                    value: 'If you attempt to remove a card from your list that was never in your list or remove more copies of a card than were in your list, the command will let you know in the response.'
                },
            ]);
        }
        else if (commandName === getCardsCommand) {
            embed = setupEmbed()
            .setTitle(`Command Help: ${getCardsCommand}`)
            .setURL('https://github.com/chicklightning/tcg-pocket-trading-bot/wiki/User-manual#get-cards')
            .setDescription('This command returns a user\'s list of cards they wanted traded to them (your own by default). Each card has a link to an image of the card.')
            .addFields([
                {
                    name: 'Filtering',
                    value: 'You can optionally filter the list based on rarity or on card set (i.e. Triumphant Light). You can only pick one rarity and/or one set, so you can show all ⭐ cards you want from Genetic Apex, but not all ♦️ and ♦️♦️ cards. The default filtering is all rarities and all card sets if you do not choose an option for either.'
                },
                {
                    name: 'Target',
                    value: 'You can request to see another user\'s list of desired trade cards by typing their handle in the "target" option.'
                },
                {
                    name: 'Pagination',
                    value: 'If there are more than 25 cards in the returned list, the response is paginated so you can scroll between pages in the list using the arrow buttons that appear at the bottom of the response. This will stop working after a period of time, so you can\'t go back to all old messages and scroll.'
                },
            ]);
        }
        else if (commandName === startTradeCommand) {
            embed = setupEmbed()
                .setTitle(`Command Help: ${startTradeCommand}`)
                .setURL('https://github.com/chicklightning/tcg-pocket-trading-bot/wiki/User-manual#start-trade')
                .setDescription('This command lets you start a trade with another user. It sends a DM to the other user letting them know. You must start a trade before offering a card.')
                .addFields([
                    {
                        name: 'Target',
                        value: 'You must specify another user to start the trade with or you cannot complete the command. You cannot have multiple open trades with the same user.'
                    },
                    {
                        name: 'Error states',
                        value: 'If you have an open trade with your target user and attempt to open another trade, the bot will let you know in the response and the other user will not receive a new DM.'
                    },
                ]);
        }
        else if (commandName === getOpenTradesCommand) {
            embed = setupEmbed()
                .setTitle(`Command Help: ${getOpenTradesCommand}`)
                .setURL('https://github.com/chicklightning/tcg-pocket-trading-bot/wiki/User-manual#get-open-trades')
                .setDescription('This command lets you see your open (not completed) trades.')
                .addFields([
                    {
                        name: 'Target',
                        value: 'You can specify a target and see if you have an open trade with this user. If you don\'t specify a target, you will see all of your open trades.'
                    },
                    {
                        name: 'Pagination',
                        value: 'If there are more than 10 trades in the returned list, the response is paginated so you can scroll between pages in the list using the arrow buttons that appear at the bottom of the response. This will stop working after a period of time, so you can\'t go back to all old messages and scroll.'
                    },
                    {
                        name: 'Error states',
                        value: 'If you specify a target and do not have an open trade with them, the bot will let you know in the response.'
                    },
                ]);
        }
        else if (commandName === offerCardCommand) {
            embed = setupEmbed()
                .setTitle(`Command Help: ${offerCardCommand}`)
                .setURL('https://github.com/chicklightning/tcg-pocket-trading-bot/wiki/User-manual#offer-card')
                .setDescription('TThis command lets you offer a card to a user you have started a trade with. You must start a trade (/start-trade) before offering a card.')
                .addFields([
                    {
                        name: 'Target',
                        value: 'You must specify another user to send the offered card to. You can only send a card to a user you\'ve started a trade with.'
                    },
                    {
                        name: 'Autocomplete',
                        value: 'For the card you want to offer, you can start typing the name of the card you want (like "sha" for "Shaymin") and a list of matching tradeable cards will appear. The list shown by default is the list of cards the other user wants if they have any, otherwise it will show the list of all cards. If the other user has already offered a card, the autocomplete options will be filtered to cards of a matching rarity from the other user\'s desired cards list if they have any, otherwise it will show all tradeable cards with a matching rarity.',
                    },
                    {
                        name: 'Autocomplete filter',
                        value: 'There is an optional "filter-cards" option; this is set to "True" by default so the autocomplete options are only from your target user\'s desired cards list. If you want autocomplete options to be any tradeable card, set this option to "False".',
                    },
                    {
                        name: 'Weird autocomplete behavior',
                        value: 'The filtering behavior here is weird depending on what order you enter the command options and what text is in the "card" option. Discord caches whatever autocomplete list you were shown FIRST when entering the command and you\'ll see this list whenever the "card" option has no text, even if you\'ve updated the filter or changed the target user. If you start typing, your autocomplete options will match the filter-option and filters described above.'
                    },
                    {
                        name: 'Error states',
                        value: 'If you don\'t have a trade open with this user, the bot will let you know in the response.'
                    },
                ]);
        }
        else {
            embed = setupEmbed()
                .setTitle('Command Help')
                .setURL('https://github.com/chicklightning/tcg-pocket-trading-bot/wiki/User-manual#help')
                .setDescription('Use this command to get help for specific commands. Specify a command name to get detailed information about it.')
                .addFields([
                    { name: 'Available Commands', value: `${addCardsCommand}, ${removeCardsCommand}, ${getCardsCommand}, ${startTradeCommand}, ${getOpenTradesCommand}` },
                    { name: 'Usage', value: '/help command-name:[command-name]' },
                ]);
        }

		return interaction.reply({
			embeds: [ embed ],
			flags: MessageFlags.Ephemeral,
		});
	},
	cooldown: 2,
};

export default command;