import { SlashCommandBuilder, ChannelType } from 'discord.js'
import { Command } from '../command'

function delay(time: number) {
    return new Promise(resolve => setTimeout(resolve, time));
} 

const ClearChannel : Command = {
    data: new SlashCommandBuilder()
        .setName('clear_channel')
		.setDescription('Clones the channel the message was entered in, deleting the original.'),
    async execute(interaction, client) {
        if(!interaction.channel || interaction.channel!.type !== ChannelType.GuildText) 
        return await interaction.reply('Clear channel is only available on server text channels!');
        await interaction.reply(`Clearing <#${interaction.channelId}>...`);
        await interaction.channel.clone().then(cloned => {
            if(!interaction.channel || interaction.channel!.type !== ChannelType.GuildText) return;
            const position = interaction.channel!.position;
            interaction.channel.delete().catch(error => console.error(error));
            cloned.setPosition(position);
        });
    }
};

export = ClearChannel;