import { 
    ChatInputCommandInteraction, 
    SlashCommandBuilder, 
    TextChannel 
} from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('meigen')
    .setDescription('名言を特定のチャンネルに送信します')
    .addStringOption(option =>
        option
            .setName('text')
            .setDescription('送信する名言を入力してください')
            .setRequired(true)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const meigenText = interaction.options.getString('text', true);
    
    const targetChannelId = process.env.MEIGEN_CHANNEL_ID;

    if (!targetChannelId) {
        await interaction.reply({
            content: 'システムエラー: 環境変数 `MEIGEN_CHANNEL_ID` が設定されていません。',
            ephemeral: true
        });
        return;
    }

    try {
        const channel = await interaction.client.channels.fetch(targetChannelId);

        if (!channel || !(channel instanceof TextChannel)) {
            await interaction.reply({ 
                content: '指定されたチャンネルが見つからないか、テキストチャンネルではありません。', 
                ephemeral: true 
            });
            return;
        }

        await channel.send(`${meigenText}`);

        await interaction.reply({ 
            content: '名言を送信しました！', 
            ephemeral: true 
        });

    } catch (error) {
        console.error(error);
        await interaction.reply({ 
            content: 'エラーが発生しました。', 
            ephemeral: true 
        });
    }
}
