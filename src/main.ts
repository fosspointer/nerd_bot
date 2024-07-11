import * as discord from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { isCommand, Command } from './command';
import * as storage from './storage'

import * as _dotenv from 'dotenv';
_dotenv.config();

const client = new discord.Client({
    intents: [
        discord.IntentsBitField.Flags.Guilds,
        discord.IntentsBitField.Flags.GuildMessages, 
        discord.IntentsBitField.Flags.MessageContent, 
        discord.IntentsBitField.Flags.GuildModeration,
        discord.IntentsBitField.Flags.GuildMembers,
        discord.IntentsBitField.Flags.DirectMessages,
    ]
});

const commands = new discord.Collection<string, Command>();

const command_path = path.join(__dirname, 'commands');
const command_files = fs.readdirSync(command_path).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

for(const file of command_files)  {
    const file_path = path.join(command_path, file);
	const command = require(file_path);
	
    if(isCommand(command)) {
        commands.set(command.data.name, command);
    }
    else {
        console.warn(`[WARNING] '${file_path}' does not implement the 'Command' interface!`);
    }
}

client.once('ready', async () => {
    console.log(`Client logged in as \`${client.user?.tag}\`.`);
    const guilds = await client.guilds.fetch();
    guilds.forEach(async guild => {
        storage.addCollectors(guild.id, client);
    });
    console.log(`Updated all role-selection collectors.`);
});

const handle_command_interaction = async (interaction: discord.ChatInputCommandInteraction<discord.CacheType>) => {
    const command = commands.get(interaction.commandName);

	if (!command) return console.log(interaction.commandName);

	try {
		await command.execute(interaction, client);
	} catch (error) {
		console.error(error);
		const message: discord.InteractionReplyOptions = { content: 'There was an error while executing this command!', ephemeral: true };
        if (interaction.replied || interaction.deferred)
			await interaction.followUp(message);
		else
			await interaction.reply(message);
	}
}

const handle_string_select_interaction = async (interaction: discord.StringSelectMenuInteraction<discord.CacheType>) => {
    interaction.deferUpdate();
}

const handle_role_select_interaction = async (interaction: discord.RoleSelectMenuInteraction<discord.CacheType>) => {
    interaction.deferUpdate();
}

const handle_user_select_interaction = async (interaction: discord.UserSelectMenuInteraction<discord.CacheType>) => {
    interaction.deferUpdate();
}

const handle_channel_select_interaction = async (interaction: discord.ChannelSelectMenuInteraction<discord.CacheType>) => {
    interaction.deferUpdate();
}

const handle_button_interaction = async (interaction: discord.ButtonInteraction<discord.CacheType>) => {   
    interaction.deferUpdate();
}

client.on('interactionCreate', async interaction => {
	if(interaction.isChatInputCommand())
        return await handle_command_interaction(interaction);
    else if(interaction.isButton())
        return await handle_button_interaction(interaction);
    else if(interaction.isStringSelectMenu())
        return await handle_string_select_interaction(interaction);
    else if(interaction.isRoleSelectMenu())
        return await handle_role_select_interaction(interaction);
    else if(interaction.isChannelSelectMenu())
        return await handle_channel_select_interaction(interaction);
    else if(interaction.isUserSelectMenu())
        return await handle_user_select_interaction(interaction);
});

client.on('messageCreate', async message => {
    if(message.inGuild() || message.author.bot) return;
    await message.author.send("Hello there! Unfortuantely, I don't support direct messages yet...");
});

client.on('messageDelete', message => {
    storage.removeRoleMenu(message.guildId!, message.id);
});

client.login(process.env.BOT_TOKEN);