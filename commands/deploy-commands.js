import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const commands = [];
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const commandsPath = path.join(__dirname, 'slash-commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Error out if no commands are found
if (commandFiles.length === 0) {
	console.error(`[ERROR] No command files found in folder: ${commandsPath}.`);
	process.exit(1);
}

for (const file of commandFiles) {
	const filePath = 'file:///' + path.join(commandsPath, file);
	const command = await import(filePath);

	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	if ('data' in command.default && 'execute' in command.default) {
		commands.push(command.default.data.toJSON());
	}
	else {
		console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// and deploy your commands!
(async () => {
	try {
		console.log(`[LOG] Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands with the current set
		const data = await rest.put(
			Routes.applicationCommands(process.env.CLIENT_ID),
			{ body: commands },
		);

		console.log(`[LOG] Successfully reloaded ${data.length} application (/) commands.`);
	}
	catch (error) {
		console.error(error);
	}
})();