import { EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';

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