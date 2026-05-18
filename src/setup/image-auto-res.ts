import { Message, EmbedBuilder, TextChannel } from 'discord.js';
import { client } from './client.js';

client.on('messageCreate', async (message: Message) => {
    if (message.author.bot || !message.guild) return;

    if (message.attachments.size === 0) return;

    const targetChannelId = process.env.FORWARD_CHANNEL_ID;
    if (!targetChannelId) return;

    if (message.channelId === targetChannelId) return;

    const firstAttachment = message.attachments.first();
    if (!firstAttachment) return;

    const isImage = firstAttachment.contentType?.startsWith('image/');
    if (!isImage) return;

    try {
        const targetChannel = await client.channels.fetch(targetChannelId);
        if (!targetChannel || !(targetChannel instanceof TextChannel)) return;

        const embed = new EmbedBuilder()
            .setAuthor({
                name: message.client.user.username,
                iconURL: message.client.user.displayAvatarURL()
            })
            .setTitle('参考資料')
            .addFields(
                { name: 'ユーザー', value: `${message.author.username}`, inline: false }
            )
            .setImage(firstAttachment.url)
            .setFooter({
                text: `©️ BotName | Guide message text | 参考資料`
            })
            .setTimestamp(message.createdAt);

        await targetChannel.send({ embeds: [embed] });

    } catch (error) {
        console.error('画像の転送中にエラーが発生しました:', error);
    }
});
