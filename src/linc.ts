import path from 'path';
import crypto from 'crypto';
import { exec, execFile } from 'child_process';
import { CacheType, ChatInputCommandInteraction } from 'discord.js';

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
        let command = `5s firejail --net=none --private=${directory} --caps.drop=all --quiet --whitelist=${filename} lincenv -a`.split(' ');
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
            if(error){
                await interaction.editReply({content: `\`\`\`stderr\n${error_string}\`\`\``});
                resolve();
                return;
            }
        
            if(stderr){
                await interaction.editReply({content: `\`\`\`stderr\n${stderr}\`\`\``});
                resolve();
                return;
            }
        
            await interaction.editReply({content: `\`\`\`stdout\n${stdout}\`\`\``});
            resolve();
        });
    });
}
