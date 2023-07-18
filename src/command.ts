import { SlashCommandBuilder, ChatInputCommandInteraction, CacheType, Client, SlashCommandSubcommandsOnlyBuilder } from "discord.js";

export interface Command {
    data: 
        | Omit<SlashCommandBuilder, "addSubcommandGroup" | "addSubcommand">
        | SlashCommandSubcommandsOnlyBuilder,
    execute(interaction: ChatInputCommandInteraction<CacheType>, client: Client): void;
}

export function isCommand(object: Object): object is Command {
    return object.hasOwnProperty('data') && object.hasOwnProperty('execute');
}