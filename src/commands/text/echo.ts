import { ChatInputCommandInteraction, SlashCommandBuilder, TextChannel } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('echo')
    .setDescription('あなたの姿を借りてBotがメッセージを代弁します')
    .addStringOption(option =>
        option.setName('message').setDescription('喋らせたい内容').setRequired(true)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const message = interaction.options.getString('message', true);
    const channel = interaction.channel;

    if (!channel || !(channel instanceof TextChannel)) {
        await interaction.reply({ content: 'このチャンネルでは実行できません。', ephemeral: true });
        return;
    }

    await interaction.reply({ content: '送信中...', ephemeral: true });

    const webhook = await channel.createWebhook({
        name: interaction.user.username,
        avatar: interaction.user.displayAvatarURL(),
        reason: 'Echo command temporary webhook'
    });

    await webhook.send({ content: message });
    await webhook.delete('Echo command finished');
    await interaction.deleteReply();
}
