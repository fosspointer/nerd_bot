import { Client, Collection, IntentsBitField, Interaction, InteractionReplyOptions, InteractionType, Message } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { Command, isCommand } from './command'

import * as _dotenv from 'dotenv';
_dotenv.config();


const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages, 
        IntentsBitField.Flags.MessageContent, 
        IntentsBitField.Flags.GuildModeration,
        IntentsBitField.Flags.GuildMembers,
    ]
});

const commands = new Collection<string, Command>();

const command_path = path.join(__dirname, 'commands');
const command_files = fs.readdirSync(command_path).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

for (const file of command_files)  {
    const file_path = path.join(command_path, file);
	const command = require(file_path);
	
    if (isCommand(command)) {
        commands.set(command.data.name, command);
    }
    else {
        console.warn(`[WARNING] '${file_path}' does not implement the 'Command' interface!`);
    }
}

client.once('ready', () => {
    console.log(`Client logged in as '${client.user?.tag}'`);
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = commands.get(interaction.commandName);

	if (!command) return console.log(interaction.commandName);

	try {
		await command.execute(interaction, client);
	} catch (error) {
		console.error(error);
		const message: InteractionReplyOptions = { content: 'There was an error while executing this command!', ephemeral: true };
        if (interaction.replied || interaction.deferred)
			await interaction.followUp(message);
		else
			await interaction.reply(message);
	}
});

client.login(process.env.BOT_TOKEN);