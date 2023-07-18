import { BanOptions, Guild, GuildMember, Interaction, PermissionResolvable, PermissionsBitField, SlashCommandBuilder } from 'discord.js'
import { Command } from '../command'

const get_user = (user_id: string, guild : Guild | null) : GuildMember | undefined => {
    return guild?.members?.cache?.get(user_id);
}

const check_admin = (user_id: string, interaction : Interaction) : boolean => {
    return get_user(user_id, interaction.guild)?.permissions?.has(PermissionsBitField.Flags.Administrator) || false;
}

const Ping : Command = {
    data: new SlashCommandBuilder()
        .setName('ban')
		.setDescription('Bans any specified user. Requires Admin.')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('User to ban from the server.')
                .setRequired(true))
        .addNumberOption(option => 
            option.setName('minutes_to_delete')
                .setDescription('Number of message minutes to delete since ban.')
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(10080))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Briefly summarize the cause of the ban.')
                .setRequired(false)
                .setMinLength(1)
                .setMaxLength(500))
        ,
    async execute(interaction, client) {
        const user = interaction.options.getUser('user', true);
        const _reason = interaction.options.getString('reason', false);
        const reason = _reason? _reason.toString() : undefined;
        const minutes = interaction.options.getNumber('minutes_to_delete', false) || 0;
        const ban_options : BanOptions = { reason, deleteMessageSeconds: minutes * 60 };

        if(!check_admin(interaction.user.id, interaction))
            return await interaction.reply(`You are not priviliged enough to run this command, as it requires the 'Admin' permission!`);
        if(check_admin(user.id, interaction))
            return await interaction.reply(`You cannot ban a user with the 'Admin' permission!`);

        const bot_member = get_user(client.user!.id, interaction.guild)!;
        const user_member = get_user(user.id, interaction.guild)!;

        if(bot_member.roles.highest.position <= user_member.roles.highest.position)
            return await interaction.reply(`You cannot ban a user with a role higher than the bot's.`);
        
        await interaction.guild?.bans.create(user, ban_options).then(() => {
            interaction.reply(`Successfully banned user ${user.toString()}`);
        });
    }
};

export = Ping;