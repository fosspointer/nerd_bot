import * as fs from 'fs';
import * as path from 'path';
import * as discord from 'discord.js';

const data_directory: string = '../data';

export interface RoleMenuData {
    channelId: string;
    messageId: string;
    timestamp: number;
}

export interface GuildData {
    roleMenus: Array<RoleMenuData>;
}

export function isRoleMenuData(object: Object): object is RoleMenuData {
    return object.hasOwnProperty('guildId') && object.hasOwnProperty('channelId') && object.hasOwnProperty('messageId');
}

export function readGuild(guild_id: string): GuildData {
    const guild_directory: string = path.join(__dirname, data_directory, `${guild_id}.json`);
    const default_data_json: string = `{"roleMenus": []}`;

    if(!fs.existsSync(guild_directory))
    {
        fs.writeFileSync(guild_directory, default_data_json);
        const database: GuildData = JSON.parse(default_data_json);
        return database;
    }

    const database: GuildData = JSON.parse(fs.readFileSync(guild_directory).toString());
    return database;
}

export function writeGuild(guild_id: string, guild_data: GuildData): void {
    const guild_directory: string = path.join(__dirname, data_directory, `${guild_id}.json`);
    
    fs.writeFileSync(guild_directory, JSON.stringify(guild_data, null, 4));
}

export function addRoleMenu(guild_id: string, role_menu: RoleMenuData): void {
    const guild_data: GuildData = readGuild(guild_id);
    
    guild_data.roleMenus.push(role_menu);
    writeGuild(guild_id, guild_data);
}

export function removeRoleMenu(guild_id: string, message_id: string): void {
    const guild_data: GuildData = readGuild(guild_id);
    const element_index = guild_data.roleMenus.findIndex(roleMenu => roleMenu.messageId === message_id);
    if(element_index === -1) return;

    guild_data.roleMenus.splice(element_index, 1);
    writeGuild(guild_id, guild_data);
}

export async function addCollectors(guild_id: string, client: discord.Client): Promise<void> {
    const data: GuildData = readGuild(guild_id);
    const guild: discord.Guild = await client.guilds.fetch(guild_id);

    for(const menu of data.roleMenus) {
        const channel = await guild.channels.fetch(menu.channelId).catch(() => {
            removeRoleMenu(guild_id, menu.messageId);
            return;
        });

        if(!channel?.isTextBased()) return;
        
        try{
            const message = await channel.messages.fetch(menu.messageId);
            addCollector(message, menu.timestamp);
        }
        catch(err) {
            removeRoleMenu(guild_id, menu.messageId);
            return;
        }
    }
}

export async function addCollector(message: discord.Message, id: number): Promise<void> {
    const select_collector = message.createMessageComponentCollector({ componentType: discord.ComponentType.StringSelect });
    let selected_roles: Map<string, string> = new Map();

    select_collector.on('collect', async (i: discord.StringSelectMenuInteraction) => {
        if(i.customId === `roles-${id}`) {
            selected_roles.set(i.user.id, i.values[0]);
        }
    });

    const button_collector = message.createMessageComponentCollector({ componentType: discord.ComponentType.Button });

    button_collector.on('collect', async (i: discord.ButtonInteraction) => {
        const selected_role = selected_roles.get(i.user.id);
        if(!selected_role) return;

        const role = i?.guild?.roles.cache.get(selected_role);
        const member = i?.guild?.members.cache.get(i.user.id);

        if(!role || !member) {
            return;
        }
        
        if(i.customId === `roles_add-${id}`) {
            await member.roles.add(role);
            return;
        }

        else if(i.customId === `roles_remove-${id}`) {
            await member.roles.remove(role);
            return
        }
    });
}