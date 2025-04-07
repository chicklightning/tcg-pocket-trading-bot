import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { Rarities, Sets } from '../command-utilities.js';
import { getUser } from '../../database/database-utilities.js';

const command = {
	data: new SlashCommandBuilder()
		.setName('get-cards')
		.setDescription('Get the list of cards you want others to trade to you.')
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM)
        .addBooleanOption(option =>
            option.setName('show-images')
                .setDescription('Whether card images should be included in the response.')),
	async execute(interaction) {
        const showImages = interaction.options.getBoolean('show-images') ?? false;
		let currentUser = await getUser(interaction.client, interaction.user.id, interaction.user.username);
        let replyStatement = '';

        const getCardPromises = currentUser.desiredCards.map(async card => {
            const existingCard = await currentUser.getDesiredCards({
                where: { id: card.id },
            });

            if (existingCard.length > 0) {
                const userCard = existingCard[0];
                const totalCount = userCard.UserCard.card_count > 1 ? 'x' + userCard.UserCard.card_count : '';
                replyStatement = `${replyStatement}${card.name} ${totalCount} (${Rarities[card.rarity - 1]} from ${Sets[card.set]})\n`;
            }
            else {
                console.error(`[ERROR] Something went wrong - ${card.id} not mapped to ${currentUser.nickname} (${currentUser.id}) despite being in desired cards list.`);
            }
        });

        // Wait for all card additions to complete
		await Promise.all(getCardPromises);

        if (replyStatement === '') {
            replyStatement = 'You have no desired cards listed. Use `/add-cards` to add some!';
        }

		return interaction.reply({
			content: replyStatement,
		});
	},
	cooldown: 2,
};

export default command;