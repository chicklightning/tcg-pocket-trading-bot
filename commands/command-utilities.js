import { EmbedBuilder } from 'discord.js';

export const Rarities = ['♦️', '♦️♦️', '♦️♦️♦️', '♦️♦️♦️♦️', '⭐️'];
export const Sets = {
	'Genetic Apex': 'GA',
	'Mythical Island': 'MI',
	'Space-Time Smackdown': 'STS',
	'Triumphant Light': 'TL',
};

export const BaseEmbed = new EmbedBuilder()
	.setColor(0xFF0000)
	.setAuthor({
		name: 'Pokémon TCG Pocket Trader',
		iconURL: 'https://github.com/chicklightning/tcg-pocket-trading-bot/blob/main/assets/icon.png?raw=true',
		url: 'https://github.com/chicklightning/tcg-pocket-trading-bot/wiki/User-manual',
	})
	.setTimestamp();