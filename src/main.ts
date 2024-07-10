import { ButtonComponent, ButtonInteraction, CacheType, ChannelSelectMenuInteraction, ChatInputCommandInteraction, Client, Collection, IntentsBitField, Interaction, InteractionReplyOptions, InteractionType, Message, RoleSelectMenuInteraction, StringSelectMenuComponent, StringSelectMenuInteraction, UserSelectMenuInteraction } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { isCommand, Command } from './command';
import * as Event from './event'
import * as storage from './storage'

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
    console.log(`Client logged in as '${client.user?.tag}'`);
    const guilds = await client.guilds.fetch();
    guilds.forEach(async guild => {
        storage.addCollectors(guild.id, client);
    });
});

const handle_command_interaction = async (interaction: ChatInputCommandInteraction<CacheType>) => {
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
}

let role :string;

const handle_string_select_interaction = async (interaction: StringSelectMenuInteraction<CacheType>) => {
    interaction.deferUpdate();
}

const handle_role_select_interaction = async (interaction: RoleSelectMenuInteraction<CacheType>) => {
    interaction.deferUpdate();
}

const handle_user_select_interaction = async (interaction: UserSelectMenuInteraction<CacheType>) => {
    interaction.deferUpdate();
}

const handle_channel_select_interaction = async (interaction: ChannelSelectMenuInteraction<CacheType>) => {
    interaction.deferUpdate();
}

const handle_button_interaction = async (interaction: ButtonInteraction<CacheType>) => {   
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

client.login(process.env.BOT_TOKEN);