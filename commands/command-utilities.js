import { EmbedBuilder, InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';

export const AddRemoveOptionNames = [
	'first-card',
	'second-card',
	'third-card',
	'fourth-card',
	'fifth-card',
	'sixth-card',
	'seventh-card',
	'eighth-card',
	'ninth-card',
	'tenth-card',
];

export const Rarities = ['♦️', '♦️♦️', '♦️♦️♦️', '♦️♦️♦️♦️', '⭐️'];

export const Sets = {
	'Genetic Apex': 'GA',
	'Mythical Island': 'MI',
	'Space-Time Smackdown': 'STS',
	'Triumphant Light': 'TL',
};

export const TargetUserOptionName = 'target';

export async function ephemeralErrorReply(interaction, message) {
	return interaction.reply({
		content: message,
		flags: MessageFlags.Ephemeral,
	});
};

export function generateAutocompleteOptions(list, filterFn, ...filterParams) {
    const filtered = list
        .filter(item => filterFn(item, ...filterParams)) // Pass additional parameters to the filter function
		.sort((a, b) => {
			return (a.rarity === b.rarity) ? a.name.localeCompare(b.name) : a.rarity - b.rarity;
		})
        .slice(0, 25); // Limit results to 25

    return filtered.map(item => ({
		name: `${item.name} ${Rarities[item.rarity - 1]} from ${Sets[item.packSet]}`,
		value: item.id,
	}));
};

export function setupEmbed() {
	return new EmbedBuilder()
		.setColor(0xFF0000)
		.setAuthor({
			name: 'Pokémon TCG Pocket Trader',
			iconURL: 'https://github.com/chicklightning/tcg-pocket-trading-bot/blob/main/assets/icon.png?raw=true',
			url: 'https://github.com/chicklightning/tcg-pocket-trading-bot/wiki/User-manual',
		})
		.setTimestamp();
};

export function setupTargetUserCommand(targetUserOptionDescription) {
	return new SlashCommandBuilder()
		.setContexts(InteractionContextType.Guild, InteractionContextType.PrivateChannel)
        .addUserOption(option =>
            option.setName(TargetUserOptionName)
                .setDescription(targetUserOptionDescription)
                .setRequired(true));
};