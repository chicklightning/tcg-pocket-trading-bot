import { InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { setupEmbed } from '../command-utilities.js';

const addCardsEmbed = setupEmbed()
    .setURL('https://github.com/chicklightning/tcg-pocket-trading-bot/wiki/User-manual#add-cards')
    .setDescription('This command lets you add cards to the list of cards you want other people to trade to you (so cards you need).')
    .addFields([
        {
            name: 'Scope',
            value: 'This command can be called in DMs with the bot, DMs with other users, or in a server channel.'
        },
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

const removeCardsEmbed = setupEmbed()
    .setURL('https://github.com/chicklightning/tcg-pocket-trading-bot/wiki/User-manual#remove-cards')
    .setDescription('This command lets you remove cards from the list of cards you want other people to trade to you (so cards you no longer need).')
    .addFields([
        {
            name: 'Scope',
            value: 'This command can be called in DMs with the bot, DMs with other users, or in a server channel.'
        },
        {
            name: 'Constraints',
            value: 'You can remove up to 10 cards at a time, and must remove a minimum of one (1) card each time you use this command.'
        },
        {
            name: 'Autocomplete',
            value: 'For each card "input" option, you can start typing the name of the card you want to remove (like "sha" for "Shaymin") and a list of matching cards from your desired cards list will appear. You should select one of these options rather than typing your own, or the command will not remove the card.'
        },
        {
            name: 'Multiple copies of a card',
            value: 'If you want to remove multiple copies of the same card, you must remove them separately, i.e. first-card would be "Burmy from TL ♦️" and second-card would be "Burmy from TL ♦️" to remove two copies of this card from your list.'
        },
        {
            name: 'Error states',
            value: 'If you attempt to remove a card from your list that was never in your list, the command will let you know in the response.'
        },
    ]);

const getCardsEmbed = setupEmbed()
    .setURL('https://github.com/chicklightning/tcg-pocket-trading-bot/wiki/User-manual#get-cards')
    .setDescription('This command returns a user\'s list of cards they wanted traded to them (your own by default). Each card has a link to an image of the card.')
    .addFields([
        {
            name: 'Scope',
            value: 'This command can be called in DMs with the bot, DMs with other users, or in a server channel. You cannot target other users if it\'s called in the bot\'s DMs.'
        },
        {
            name: 'Filtering',
            value: 'You can optionally filter the list based on rarity or on card set (i.e. Triumphant Light). You can only pick one rarity and/or one set, so you can show all ⭐ cards you want from Genetic Apex, but not all ♦️ and ♦️♦️ cards. The default filtering is all rarities and all card sets if you do not choose an option for either.\n\nIf you select a target, you can opt to only show cards that they need that you don\'t also need by setting "filter-my-cards" to True. This is OFF by default.'
        },
        {
            name: 'Target',
            value: 'You can request to see another user\'s list of desired trade cards by typing their handle in the "target" option.'
        },
        {
            name: 'Visibility',
            value: 'By default, the response of this command is only visible to you. If you want the response to be visible to all users in the channel, set the "visible-to-all" option to True.'
        },
        {
            name: 'Pagination',
            value: 'If there are more than 25 cards in the returned list, the response is paginated so you can scroll between pages in the list using the arrow buttons that appear at the bottom of the response. This will stop working after a period of time, so you can\'t go back to all old messages and scroll.'
        },
    ]);

const startTradeEmbed = setupEmbed()
    .setURL('https://github.com/chicklightning/tcg-pocket-trading-bot/wiki/User-manual#start-trade')
    .setDescription('This command lets you start a trade with another user. You must start a trade before offering a card. It will send a direct message to the other user letting them know you\'ve started a trade with them.')
    .addFields([
        {
            name: 'Scope',
            value: 'This command can be called in DMs with other users or in a server channel.'
        },
        {
            name: 'Target',
            value: 'You must specify another user to start the trade with or you cannot complete the command. You cannot have multiple open trades with the same user.'
        },
        {
            name: 'Error states',
            value: 'If you have an open trade with your target user and attempt to open another trade, the bot will let you know in the response and the other user will not receive a new DM.'
        },
    ]);

const getOpenTradesEmbed = setupEmbed()
    .setURL('https://github.com/chicklightning/tcg-pocket-trading-bot/wiki/User-manual#get-open-trades')
    .setDescription('This command lets you see your open (not completed) trades.')
    .addFields([
        {
            name: 'Scope',
            value: 'This command can be called in DMs with the bot, DMs with other users, or in a server channel. You cannot target other users if it\'s called in the bot\'s DMs.'
        },
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

const offerCardEmbed = setupEmbed()
    .setURL('https://github.com/chicklightning/tcg-pocket-trading-bot/wiki/User-manual#offer-card')
    .setDescription('TThis command lets you offer a card to a user you have started a trade with. You must start a trade (/start-trade) before offering a card.')
    .addFields([
        {
            name: 'Scope',
            value: 'This command can be called in DMs with other users or in a server channel.'
        },
        {
            name: 'Target',
            value: 'You must specify another user to send the offered card to. You can only send a card to a user you\'ve started a trade with.'
        },
        {
            name: 'Autocomplete',
            value: 'For the card you want to offer, you can start typing the name of the card you want (like "sha" for "Shaymin") and a list of matching tradeable cards will appear. The list shown by default is the list of cards the other user wants if they have any, otherwise it will show the list of all cards.\n\nIf the other user has already offered a card, the autocomplete options will be filtered to cards of a matching rarity from the other user\'s desired cards list if they have any, otherwise it will show all tradeable cards with a matching rarity.\n\nAutocomplete will never suggest a card that you also need (a card in your list of desired cards).',
        },
        {
            name: 'Autocomplete filter',
            value: 'There are two autocomplete filter options turned on by default: "filter-to-target" filters card options based on what cards the target user has in their desired cards list, and "filter-rarity" filters card options based on the rarity of what the other user has offered (if they\'ve offered a card). The default is to only see cards in the other user\'s desired card list that match the rarity of the card they\'ve offered to you. If they haven\'t offered you a card, you will see all of their desired cards.',
        },
        {
            name: 'Weird autocomplete behavior',
            value: 'The filtering behavior here is weird depending on what order you enter the command options and what text is in the "card" option. Discord caches whatever autocomplete list you were shown FIRST when entering the command and you\'ll see this list whenever the "card" option has text you\'ve entered before (like an empty "card" text box or just the letter "s"), even if you\'ve updated the filter or changed the target user. If you start typing more of your query, your autocomplete options will match the options you expect to see from the filters you have turned on or off. This is unfortunately behavior I cannot change.\n\nIf your autocomplete options stop matching what you expect to see, restart typing the command.'
        },
        {
            name: 'Error states',
            value: 'If you don\'t have a trade open with this user or you offer a card that doesn\'t exist (or mistyped the name), the bot will let you know in the response.'
        },
    ]);

const completeTradeEmbed = setupEmbed()
    .setURL('https://github.com/chicklightning/tcg-pocket-trading-bot/wiki/User-manual#complete-trade')
    .setDescription('This command lets you complete a trade started with another user. You don\'t need to be the user who started the trade to complete it. If the card you received was in your desired cards list, the count for that card will be decreased by 1.')
    .addFields([
        {
            name: 'Scope',
            value: 'This command can be called in DMs with other users or in a server channel.'
        },
        {
            name: 'Target',
            value: 'You must specify the other user you\'re completing the trade with. You can only complete a trade with a user you have an open trade with.'
        },
        {
            name: 'Error states',
            value: 'If you don\'t have a trade open with this user, or the trade is invalid (one or both of you have not offered a card, or the cards don\'t match in rarity) the bot will let you know in the response.'
        },
    ]);

const cancelTradeEmbed = setupEmbed()
    .setURL('https://github.com/chicklightning/tcg-pocket-trading-bot/wiki/User-manual#cancel-trade')
    .setDescription('This command lets you cancel a trade started with another user. You don\'t need to be the user who started the trade to cancel it.')
    .addFields([
        {
            name: 'Scope',
            value: 'This command can be called in DMs with other users or in a server channel.'
        },
        {
            name: 'Target',
            value: 'You must specify the other user you\'re canceling the trade with. You can only cancel a trade with a user you have an open trade with.'
        },
        {
            name: 'Error states',
            value: 'If you don\'t have a trade open with this user, the bot will let you know in the response.'
        },
    ]);

const commandToEmbedMap = {
    '/add-cards': addCardsEmbed,
    '/remove-cards': removeCardsEmbed,
    '/get-cards': getCardsEmbed,
    '/start-trade': startTradeEmbed,
    '/get-open-trades': getOpenTradesEmbed,
    '/offer-card': offerCardEmbed,
    '/complete-trade': completeTradeEmbed,
    '/cancel-trade': cancelTradeEmbed,
};

const command = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Add one or more cards to the list of cards you want others to trade to you.')
		.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
		.addStringOption(option =>
			option.setName('command-name')
				.setDescription('Name of the command you want information on.')
				.setRequired(false)
                .addChoices(
                    Object.keys(commandToEmbedMap).map(command => ({
                        name: command,
                        value: command,
                    }))
                )),
	async execute(interaction) {
		const commandName = interaction.options.getString('command-name') ?? '';
        
        // Fetch the corresponding embed or default to a generic help embed
        const embed = commandName
            ? commandToEmbedMap[commandName].setTitle(`Command Help: ${commandName}`) ||
                setupEmbed()
                    .setTitle('Unknown Command')
                    .setDescription('The specified command does not exist.')
            : setupEmbed()
                .setTitle('Command Help')
                .setDescription('Use this command to get help for specific commands.')
                .addFields([
                    { name: 'Available Commands', value: Object.keys(commandToEmbedMap).join(', ') },
                    { name: 'Usage', value: '/help command-name:[command-name]' },
                ]);

		return interaction.reply({
			embeds: [ embed ],
			flags: MessageFlags.Ephemeral,
		});
	},
	cooldown: 2,
};

export default command;