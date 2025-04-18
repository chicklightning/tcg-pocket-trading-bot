import { Client, Collection, GatewayIntentBits } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';
import db from './database/models/index.js';
import { DatabaseUtilities } from './database/database-utilities.js';

// Create a new client instance
const client = new Client({
	intents: [
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.DirectMessages,
	],
});

// Create cooldowns collection to rate limit command usage
client.cooldowns = new Collection();

// Connect client to database and set up card cache
client.database = new DatabaseUtilities(db);
client.cardCache = await client.database.getModel(client.database.models.Card).findAll();

// Set up commands
client.commands = new Collection();

// TODO: Would like to deduplicate this code
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const foldersPath = path.join(__dirname, 'commands');

// Grab all subdirectories of commands folder
const dirents = fs.readdirSync(foldersPath, { withFileTypes: true });
const commandFolders = dirents
	.filter(dirent => fs.statSync(foldersPath + '/' + dirent.name).isDirectory())
	.map(dirent => dirent.name);

// Error out if no command folders are found
if (commandFolders.length === 0) {
	console.error(`[ERROR] No command folders found in path: ${foldersPath}.`);
	process.exit(1);
}

for (const folderPath of commandFolders) {
	const commandsPath = path.join(foldersPath, folderPath);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

	for (const file of commandFiles) {
		const filePath = 'file:///' + path.join(commandsPath, file);
		const command = await import(filePath);

		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command.default && 'execute' in command.default) {
			console.log(`[LOG] Registering command at path ${filePath}.`);
			client.commands.set(command.default.data.name, command.default);
		}
		else {
			console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// Set up events and event handling
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = 'file:///' + path.join(eventsPath, file);
	const event = await import(filePath);

	if (!event.default || !event.default.name || !event.default.execute) {
		console.warn(`[WARNING] The event at ${filePath} is missing a required "name" or "execute" property.`);
		continue;
	}

	if (event.default.once) {
		client.once(event.default.name, (...args) => event.default.execute(...args));
	}
	else {
		client.on(event.default.name, (...args) => event.default.execute(...args));
	}
}

// Ensure that the DISCORD_TOKEN environment variable is set
if (!process.env.DISCORD_TOKEN) {
	console.error('[ERROR] DISCORD_TOKEN environment variable is not set.');
	process.exit(1);
}

// Log in to Discord with client token
client.login(process.env.DISCORD_TOKEN);