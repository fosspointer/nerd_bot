import { SlashCommandBuilder } from 'discord.js'
import { Command } from '../command'

const Ping : Command = {
    data: new SlashCommandBuilder()
        .setName('ping')
		.setDescription('Replies with Pong!'),
    async execute(interaction, client) {
        await interaction.reply('Pong!');
    }
};

export = Ping;