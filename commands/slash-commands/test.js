import { SlashCommandBuilder } from 'discord.js';

const command = {
	data: new SlashCommandBuilder()
		.setName('user')
		.setDescription('Provides information about the user.'),
	async execute(interaction) {
		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		await interaction.reply(`User ${interaction.user.username}`);
	},
	cooldown: 1,
};

export default command;