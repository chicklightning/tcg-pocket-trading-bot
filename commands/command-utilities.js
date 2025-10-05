import { EmbedBuilder, InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';

/** Option names for add/remove card commands */
export const AddRemoveOptionNames = Object.freeze([
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
]);

/** Card rarity symbols */
export const Rarities = Object.freeze(['♦️', '♦️♦️', '♦️♦️♦️', '♦️♦️♦️♦️', '⭐️']);

/** Card set abbreviations */
export const Sets = Object.freeze({
    'Genetic Apex': 'GA',
    'Mythical Island': 'MI',
    'Space-Time Smackdown': 'STS',
    'Triumphant Light': 'TL',
    'Shining Revelry': 'SR',
    'Celestial Guardians': 'CG',
    'Extradimensional Crisis': 'EC',
    'Eevee Grove': 'EG',
    'Wisdom of Sea and Sky': 'WSS',
    'Secluded Springs': 'SS',
});

export const TargetUserOptionName = 'target';

/**
 * Sends an ephemeral error reply to the interaction.
 * @param {Interaction} interaction 
 * @param {string} message 
 */
export async function ephemeralErrorReply(interaction, message) {
    return interaction.reply({
        content: message,
        flags: MessageFlags.Ephemeral,
    });
}

/**
 * Generates autocomplete options for Discord commands.
 * @param {Array} list 
 * @param {Function} filterFn 
 * @param  {...any} filterParams 
 * @returns {Array}
 */
export function generateAutocompleteOptions(list, filterFn, ...filterParams) {
    const filtered = list
        .filter(item => filterFn(item, ...filterParams))
        .sort((a, b) => {
            if (a.rarity !== b.rarity) return a.rarity - b.rarity;
            return a.name.localeCompare(b.name);
        })
        .slice(0, 25);

    return filtered.map(item => ({
        name: `${item.name} ${Rarities[item.rarity - 1]} from ${Sets[item.packSet]}`,
        value: item.id,
    }));
}

/** Returns a pre-configured embed for bot messages. */
export function setupEmbed() {
    return new EmbedBuilder()
        .setColor(0xFF0000)
        .setAuthor({
            name: 'Pokémon TCG Pocket Trader',
            iconURL: 'https://github.com/chicklightning/tcg-pocket-trading-bot/blob/main/assets/icon.png?raw=true',
            url: 'https://github.com/chicklightning/tcg-pocket-trading-bot/wiki/User-manual',
        })
        .setTimestamp();
}

/**
 * Sets up a SlashCommandBuilder with a required target user option.
 * @param {string} targetUserOptionDescription 
 */
export function setupTargetUserCommand(targetUserOptionDescription) {
    return new SlashCommandBuilder()
        .setContexts(InteractionContextType.Guild, InteractionContextType.PrivateChannel)
        .addUserOption(option =>
            option.setName(TargetUserOptionName)
                .setDescription(targetUserOptionDescription)
                .setRequired(true)
        );
}