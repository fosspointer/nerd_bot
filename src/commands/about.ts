import { SlashCommandBuilder, EmbedBuilder } from 'discord.js'
import { Command } from '../command'

const Ping : Command = {
    data: new SlashCommandBuilder()
        .setName('about')
		.setDescription('Displays info about the specified user.')
        .addUserOption(user => 
            user.setName('user')
                .setDescription('The user to display info about.')
                .setRequired(true)
            ),
    async execute(interaction, client) {
        const user = interaction.options.getUser('user', true);
        const date_options : Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: '2-digit' };
        let footer_text : string = '';

        if(user.flags)
            for(let badge of user.flags){
                footer_text = `- ${badge}\n`;
            }
        else footer_text = '-';

        const embed = new EmbedBuilder()
            .setTitle(`${user.username} - Info`)
            .setImage(user.avatarURL())
            .setColor('Aqua')
            .addFields([
                {name: 'Username:', value: `${user.username} (<@${user.id}>)`},
                {name: 'Discriminator:', value: user.discriminator !== '0'? user.discriminator : 'user doesn\'t have a discriminator'},
                {name: 'Accent Color:', value: user.accentColor?.toString() || 'N/A'},
                {name: 'User ID:', value: user.id},
                {name: 'Bot User:', value: user.bot.toString()},
                {name: 'Profile Picture URL:', value: user.avatarURL() || 'N/A'},
                {name: 'Banner URL:', value: user.bannerURL() || 'N/A'},
                {name: 'Joined Date:', value: user.createdAt.toLocaleDateString('en-US', date_options)},
                {name: 'Badges:', value: footer_text}
            ]);

        interaction.reply({ embeds: [embed] });
    }
};

export = Ping;