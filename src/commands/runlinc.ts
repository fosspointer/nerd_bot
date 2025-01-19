import { Attachment, CacheType, ChatInputCommandInteraction, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { Command } from '../command';
import { exec } from 'child_process';
import * as fs from 'fs';
import path from 'path';
import { randomIdentifier, runLinc } from '../linc';

const RunLinc : Command = {
    data: new SlashCommandBuilder()
        .setName('runlinc')
		.setDescription('Execute linc code.')
        .setContexts(InteractionContextType.PrivateChannel)
        .addAttachmentOption(option =>
            option.setName('file').setDescription('Evaluate linc code from a file.').setRequired(true)
        )
        .addStringOption(option =>
            option.setName('args').setDescription('Specify command line arguments for the program to execute with').setRequired(false)
        ),
    async execute(interaction, client) {
        const file = interaction.options.getAttachment('file', true);
        const args = interaction.options.getString('args', false) || "";
        const pattern = /[^A-Za-z0-9\-+*/<>@_'"\s=]/gi;
        const response = await fetch(file.url);
        const input = await response.text();

        if(/system|sys_|read/gi.test(input))
            return await interaction.reply('For safety reasons, syscall/file/shell/read interactions are disabled in this session.');

        if(pattern.test(args))
            return await interaction.reply('For security reasons, the only allowed argument characters are A-Za-z0-9+-*/<>@_');

        await interaction.deferReply();
        const relative_filename = path.join('.', 'temp', `${randomIdentifier()}.linc`);
        const filename = path.resolve(relative_filename);
        await fs.writeFileSync(filename, input);
        await runLinc(interaction, filename, args);
        await fs.unlinkSync(filename);
    }
};

export = RunLinc;