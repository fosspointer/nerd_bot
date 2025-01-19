import { Collection, REST, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes, SlashCommandBuilder } from 'discord.js';

import * as _dotenv from 'dotenv';
_dotenv.config();

import fs from 'node:fs';
import path from 'node:path';
import { Command, isCommand } from './command';

function variableIsString(variable: string | undefined): variable is string {
    return variable !== undefined;
}

(() => {
    if (!variableIsString(process.env.BOT_TOKEN)
     || !variableIsString(process.env.GUILD_ID)
     || !variableIsString(process.env.CLIENT_ID))
           return console.error('Please check that all three required variables all set correctly in .env!');
        
    const commands: Array<RESTPostAPIChatInputApplicationCommandsJSONBody> = [];
    const command_path = path.join(__dirname, 'commands');
    const command_files = fs.readdirSync(command_path).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
       
    for (const file of command_files)  {
        const file_path = path.join(command_path, file);
        const command = require(file_path);
           
        if (isCommand(command))
            commands.push(command.data.toJSON());
        else
            console.warn(`[WARNING] '${file_path}' does not implement the 'Command' interface!`);
    }
       
    const rest = new REST({ version: '9' }).setToken(process.env.BOT_TOKEN);
       
    (async () => {
        try {
            console.log(`Started refreshing ${commands.length} application (/) commands.`);
       
            await rest.put(
                // Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!),
                Routes.applicationCommands(process.env.CLIENT_ID!),
                { body: commands },
            ).then(() => {
                console.log(`Successfully reloaded all application (/) commands.`);
            });
        } catch (error) {
            console.error(`[ERROR] ${error}`);
        }
    })();
})();