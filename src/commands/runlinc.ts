import { Attachment, CacheType, ChatInputCommandInteraction, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { Command } from '../command';
import { exec } from 'child_process';
import * as fs from 'fs';
import path from 'path';
import crypto from 'crypto';

function randomIdentifier(): string {
    return crypto.randomBytes(64).toString('base64url');
}

async function cleanOutput(output: string, filename: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        output = output.replace(/\x1B.*?m/gi, '');
        output = output.split(filename).join('source.linc');
        resolve(output);
    });
}

async function runLinc(interaction: ChatInputCommandInteraction<CacheType>, filename: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        exec(`timeout 5s firejail --quiet --whitelist=${filename} lincenv ${filename}`, async (error, stdout, stderr) => {
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

const RunLinc : Command = {
    data: new SlashCommandBuilder()
        .setName('runlinc')
		.setDescription('Execute linc code.')
        .setContexts(InteractionContextType.PrivateChannel)
        .addAttachmentOption(option =>
            option.setName('file').setDescription('Evaluate linc code from a file.').setRequired(true)
        ),
    async execute(interaction, client) {
        const file = interaction.options.getAttachment('file', true);
        const response = await fetch(file.url);
        const input = await response.text();

        if(/system|sys_|read/gi.test(input))
            return await interaction.reply('For safety reasons, syscall/file/shell/read interactions are disabled in this session.');
        await interaction.deferReply();
        const relative_filename = path.join('.', 'temp', `${randomIdentifier()}.linc`);
        const filename = path.resolve(relative_filename);
        await fs.writeFileSync(filename, input);
        await runLinc(interaction, filename);
        await fs.unlinkSync(filename);
    }
};

export = RunLinc;