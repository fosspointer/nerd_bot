import path from 'path';
import crypto from 'crypto';
import { exec, execFile } from 'child_process';
import { CacheType, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export function randomIdentifier(): string {
    return crypto.randomBytes(64).toString('base64url');
}

export function cleanOutput(output: string, filename: string): Promise<string> {
    const maxLength = 1980;
    return new Promise<string>((resolve, reject) => {
        output = output.split(path.basename(filename)).join('source.linc');
        output = output.substring(0, Math.min(output.length, maxLength));
        if(output.length === maxLength)
            output += '...';
        resolve(output);
    });
}

function parseArguments(args: string): string[] {
    args = args.trim().replace(/\s+/gi, ' ');
    let result: string[] = [""];
    let in_quotes: boolean = false;
    for(let i = 0; i < args.length; i++) {    
        if(args[i] == '\\' && i + 1 < args.length) {
            if(args[i + 1] == '\\' || args[i + 1] == '\'')
                result[result.length - 1] += args[i + 1];
            else {
                result[result.length - 1] += args[i];
                result[result.length - 1] += args[i + 1];
            }
            i++;
        }
        else if(args[i] == '\'')
            in_quotes = !in_quotes;
        else if(args[i] == ' ' && !in_quotes)
            result.push("");
        else result[result.length - 1] += args[i];
    }
    return result;
}

export async function runLinc(interaction: ChatInputCommandInteraction<CacheType>, filename: string, cli_arguments: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const directory = path.dirname(filename);
        const base = path.basename(filename);
        const file = 'timeout';
        let command = `5s firejail --seccomp --net=none --private=${directory} --caps.drop=all --quiet --whitelist=${filename} lincenv -a`.split(' ');
        const args = [
            ['CHANNEL_ID', interaction.channelId],
            ['USER_ID', interaction.user.id],
            ['GUILD_ID', interaction.guildId || ""],
        ];
        for(const argument of args)
            command.push(`-D`, `${argument[0]}="${argument[1]}"`);
        command.push(base);
        const cli_arguments_array = parseArguments(cli_arguments);
        for(let argument of cli_arguments_array)
            command.push(argument);
        execFile(file, command, async (error, stdout, stderr) => {
            stdout = await cleanOutput(stdout, filename);
            stderr = await cleanOutput(stderr, filename);
            const error_string = await cleanOutput(error?.toString() || "", filename);
            let content: string;
            let success = false;
            const remove_first_line = (text: string) => {
                const lines = text.split('\n');
                return lines.length > 1? lines.slice(1).join('\n'): text;
            };
            if(error) content = remove_first_line(error_string);
            else if(stderr) content = remove_first_line(stderr);
            else { content = stdout; success = true; }
            const footer = "Process exited with code " + (error?.code?.toString() ?? "0");

            const output_embed = new EmbedBuilder()
                .setColor(success? 0x00ff00: 0xff0000)
                .setTitle(success? "Console output": "Error compiling!")
                .setDescription(content || "No output")
                .setFooter({text: footer});

            await interaction.editReply({embeds: [output_embed]});
            resolve();
        });
    });
}
