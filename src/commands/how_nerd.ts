import { SlashCommandBuilder, ChannelType } from 'discord.js'
import * as command from '../command'

function distributeMessage(message_list: Array<string>): string {
    if(message_list.length === 0) return "";
    return message_list[Math.floor(Math.random() * message_list.length)];
}

interface NerdData {
    messages: Array<Array<string>>
}

const HowNerd : command.Command = {
    data: new SlashCommandBuilder()
        .setName('how_nerd')
		.setDescription('You = not a nerd? hmmmmmm'),
    async execute(interaction, client) {
        const percentage = Math.random() * 100;
        let message: string = `You are ${percentage.toFixed(1)}% nerdy. `;
        
        const nerd_data: NerdData = command.loadData(this);

        if(percentage < 10)
            message += distributeMessage(nerd_data.messages[0]);
        else if(percentage < 20)
            message += distributeMessage(nerd_data.messages[1]);
        else if(percentage < 40)
            message += distributeMessage(nerd_data.messages[2]);
        else if(percentage < 60)
            message += distributeMessage(nerd_data.messages[3]);
        else if(percentage < 80)
            message += distributeMessage(nerd_data.messages[4]);
        else if(percentage < 90)
            distributeMessage(nerd_data.messages[5]);
        else distributeMessage(nerd_data.messages[6]); 
    
        interaction.reply(message);
    }
};

export = HowNerd;