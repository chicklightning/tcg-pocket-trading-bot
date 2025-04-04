import { Events } from 'discord.js';

const event = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`[LOG] Ready! Logged in as ${client.user.tag}.`);
	},
};

export default event;