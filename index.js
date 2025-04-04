import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

// Create a new client instance
const client = new Client({
	intents: [
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.DirectMessages,
	],
});

// Set up commands
client.commands = new Collection();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Error out if no commands are found
if (commandFiles.length === 0) {
	console.error(`[ERROR] No command files found in folder: ${commandsPath}`);
	process.exit(1);
}

for (const file of commandFiles) {
	const filePath = 'file:///' + path.join(commandsPath, file);
	const command = await import(filePath);

	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command.default && 'execute' in command.default) {
		client.commands.set(command.default.data.name, command.default);
	}
	else {
		console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`[ERROR] No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	}
	catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		}
		else {
			await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		}
	}
});

// Ensure that the DISCORD_TOKEN environment variable is set
if (!process.env.DISCORD_TOKEN) {
	console.error('[ERROR] DISCORD_TOKEN environment variable is not set.');
	process.exit(1);
}

// When the client is ready, run this code (only once).
client.once(Events.ClientReady, readyClient => {
	console.log(`[LOG] Ready! Logged in as ${readyClient.user.tag}`);
});

// Log in to Discord with client token
client.login(process.env.DISCORD_TOKEN);