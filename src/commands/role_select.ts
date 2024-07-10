import Discord, { ButtonInteraction, ActionRowBuilder, ComponentType, Interaction, MessageComponentType, RoleSelectMenuBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction, StringSelectMenuOptionBuilder } from 'discord.js'
import { Command } from '../command'
import * as storage from '../storage'

const error = async (interaction: Discord.ChatInputCommandInteraction<Discord.CacheType>, message?: string | undefined) => {
    message = message ?? 'You timed out. You only have 15 seconds to respond to the message, in order to prevent abuse of the server\'s resources.';
    interaction.reply(`${message} Aborting.`);
}

const RoleSelect : Command = {
    data: new Discord.SlashCommandBuilder()
        .setName('role_select')
		.setDescription('Add roles to a menu, for easily accessible, user-friendly role selection.'),
    async execute(interaction, client) {
        if(!interaction.channel)
            return await error(interaction, 'Interaction channel cannot be null. Maybe try running the command again?');
        
        const id = Date.now();

        const first_row = new Discord.ActionRowBuilder<StringSelectMenuBuilder>();
        let title: string = '';

        await interaction.reply(`Mention all the roles to be added to the selection menu. Do not enter any extraneous text.`);
        await interaction.channel!.awaitMessages({
            max: 1,
            time: 15000,
            errors: ['time']
        }).then(async message => {
            const msg = message.first()!;
            if(msg.mentions.roles.clone().size == 0)
                return await error(interaction, 'You need to specify at least one role to add to the menu!')
            
            const roles: Discord.RestOrArray<StringSelectMenuOptionBuilder> = [];

            for(const role of msg.mentions.roles){
                roles.push(
                    new Discord.StringSelectMenuOptionBuilder()
                    .setLabel(interaction.guild!.roles.cache.get(role[0])!.name)
                    .setValue(role[0])
                    )
            }
            
            const menu = new Discord.StringSelectMenuBuilder()
                .setCustomId(`roles-${id}`)
                .addOptions(roles);
            first_row.addComponents(menu);
            
            await msg.reply("Now, enter a title (placeholder) for the selection menu:");
            
        }).catch(async () => {
            await error(interaction);
        }).finally(async () => {
            await interaction.channel!.awaitMessages({
                max: 1,
                time: 15000,
                errors: ['time']
            }).then(async message => {
                const msg = message.first()!;
                if(!msg.content)
                    return await error(interaction, 'Menu title cannot be empty.');
                title = msg.content.trim();
            }).catch(async () => {
                await error(interaction);
            }).finally(async () => {
                const second_row = new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
                    .addComponents([
                        new Discord.ButtonBuilder()
                            .setLabel("Add role")
                            .setStyle(Discord.ButtonStyle.Primary)
                            .setCustomId(`roles_add-${id}`),
                        new Discord.ButtonBuilder()
                            .setLabel("Remove role")
                            .setStyle(Discord.ButtonStyle.Secondary)
                            .setCustomId(`roles_remove-${id}`),
                    ]);

                await first_row.components[0].setPlaceholder(title);
                const select = await interaction.channel!.send({
                    components: [first_row, second_row]
                });

                const role_menu_data: storage.RoleMenuData = {
                    channelId: select.channelId,
                    messageId: select.id,
                    timestamp: id
                };
                
                await storage.addRoleMenu(select.guildId!, role_menu_data);
                await storage.addCollector(select, id);
            });
        });
    }
};

export = RoleSelect;