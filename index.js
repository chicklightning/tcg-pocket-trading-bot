import { Client, Events, GatewayIntentBits } from 'discord.js';

// Create a new client instance
const client = new Client(
	{ intents: [GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages] });

// Ensure that the DISCORD_TOKEN environment variable is set
if (!process.env.DISCORD_TOKEN) {
	console.error('Error: DISCORD_TOKEN environment variable is not set.');
	process.exit(1);
}

// When the client is ready, run this code (only once).
client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Log in to Discord with client token
client.login(process.env.DISCORD_TOKEN);