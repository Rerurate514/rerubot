import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Botの詳細な実行状況を表示します。');

export async function execute(interaction: ChatInputCommandInteraction) {
    const sent = await interaction.reply({ content: '計測中...', fetchReply: true });

    const botLatency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    const uptime = interaction.client.uptime ?? 0;
    const days = Math.floor(uptime / 86400000);
    const hours = Math.floor((uptime % 86400000) / 3600000);
    const minutes = Math.floor((uptime % 3600000) / 60000);
    const seconds = Math.floor((uptime % 60000) / 1000);
    const uptimeStr = `${days}日 ${hours}時間 ${minutes}分 ${seconds}秒`;

    const guild = interaction.guild;
    const memberCount = guild?.memberCount ?? '不明';
    const guildName = guild?.name ?? '不明';
    const guildCreatedAt = guild?.createdAt.toLocaleDateString('ja-JP') ?? '不明';

    const embed = new EmbedBuilder()
        .setTitle('🏓 Pong!')
        .setColor(botLatency < 100 ? 0x00ff00 : botLatency < 200 ? 0xffff00 : 0xff0000)
        .addFields(
            { name: '📶 Botレイテンシ', value: `${botLatency}ms`, inline: true },
            { name: '🌐 APIレイテンシ', value: `${apiLatency}ms`, inline: true },
            { name: '⏱️ 稼働時間', value: uptimeStr, inline: false },
            { name: '🏠 サーバー名', value: guildName, inline: true },
            { name: '👥 メンバー数', value: `${memberCount}人`, inline: true },
            { name: '📅 サーバー作成日', value: guildCreatedAt, inline: true },
        )
        .setFooter({ text: `要求者: ${interaction.user.tag}` })
        .setTimestamp();

    await interaction.editReply({ content: '', embeds: [embed] });
}
