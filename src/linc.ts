import path from 'path';
import crypto from 'crypto';
import { exec } from 'child_process';
import { CacheType, ChatInputCommandInteraction } from 'discord.js';

export function randomIdentifier(): string {
    return crypto.randomBytes(64).toString('base64url');
}

export function cleanOutput(output: string, filename: string): Promise<string> {
    const maxLength = 1980;
    return new Promise<string>((resolve, reject) => {
        output = output.replace(/\x1B.*?m/gi, '');
        output = output.split(path.basename(filename)).join('source.linc');
        output = output.substring(0, Math.min(output.length, maxLength));
        if(output.length === maxLength)
            output += '...';
        resolve(output);
    });
}

export async function runLinc(interaction: ChatInputCommandInteraction<CacheType>, filename: string, cli_arguments: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const directory = path.dirname(filename);
        const base = path.basename(filename);
        let command = `timeout 5s firejail --net=none --private=${directory} --caps.drop=all --quiet --whitelist=${filename} lincenv`;
        const args = [
            ['CHANNEL_ID', interaction.channelId],
            ['USER_ID', interaction.user.id],
            ['GUILD_ID', interaction.guildId || ""],
        ];
        for(const argument of args)
            command += ` -D '${argument[0]}="${argument[1]}"'`;
        command += `  ${base} ${cli_arguments}`;
        exec(command, async (error, stdout, stderr) => {
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
