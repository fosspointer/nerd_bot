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

const QuickLinc : Command = {
    data: new SlashCommandBuilder()
        .setName('quicklinc')
		.setDescription('Execute linc code.')
        .setContexts(InteractionContextType.PrivateChannel)
        .addStringOption(option =>
            option.setName('inline').setDescription('Evaluate linc code inline.').setRequired(true).setAutocomplete(false)
        ),
    async execute(interaction, client) {
        const input = interaction.options.getString('inline', true);
        
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

export = QuickLinc;