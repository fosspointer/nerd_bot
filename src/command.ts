import { SlashCommandOptionsOnlyBuilder, SlashCommandBuilder, ChatInputCommandInteraction, CacheType, Client, SlashCommandSubcommandsOnlyBuilder } from "discord.js";
import fs from 'fs';
import path from 'path';

export interface Command {
    data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder,
    execute(interaction: ChatInputCommandInteraction<CacheType>, client: Client): void;
}

export function isCommand(object: Object): object is Command {
    return object.hasOwnProperty('data') && object.hasOwnProperty('execute');
}

export function loadData(command: Command): any {
    return JSON.parse(fs.readFileSync(path.join(__dirname, `..`, `config.json`)).toString())[command.data.name];
}