import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    TextChannel,
    Message
} from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('whosaid')
    .setDescription('サーバーの過去メッセージからランダムに1件引用して誰の発言か当てるクイズを出します');

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const guild = interaction.guild;
    if (!guild) {
        await interaction.editReply('サーバー内でのみ使用できます。');
        return;
    }

    const channels = guild.channels.cache.filter(
        (ch) => ch instanceof TextChannel
    ) as Map<string, TextChannel>;

    const allMessages: { message: Message; authorName: string; authorId: string }[] = [];

    for (const [, channel] of channels) {
        try {
            const messages = await channel.messages.fetch({ limit: 100 });
            for (const [, msg] of messages) {
                if (!msg.content || msg.content.startsWith('/')) continue;
                allMessages.push({
                    message: msg,
                    authorName: msg.author.displayName ?? msg.author.username,
                    authorId: msg.author.id,
                });
            }
        } catch {
            continue;
        }
    }

    if (allMessages.length < 4) {
        await interaction.editReply('メッセージが少なすぎてクイズを作れませんでした。');
        return;
    }

    const picked = allMessages[Math.floor(Math.random() * allMessages.length)];

    const uniqueAuthors = [
        ...new Map(allMessages.map((m) => [m.authorId, m.authorName])).entries(),
    ].filter(([id]) => id !== picked.authorId);

    if (uniqueAuthors.length < 3) {
        await interaction.editReply('クイズを作るのに十分なユーザー数がいません。');
        return;
    }

    const dummies = uniqueAuthors
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(([id, name]) => ({ id, name }));

    const choices = [
        { id: picked.authorId, name: picked.authorName },
        ...dummies,
    ].sort(() => Math.random() - 0.5);

    const embed = new EmbedBuilder()
        .setTitle('🎯 誰がこの発言をしたでしょう？')
        .setDescription(`> ${picked.message.content}`)
        .setFooter({ text: '下のボタンから選んでね！' })
        .setColor(0x5865f2);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        choices.map((choice) =>
            new ButtonBuilder()
                .setCustomId(`whosaid_${choice.id}`)
                .setLabel(choice.name)
                .setStyle(ButtonStyle.Primary)
        )
    );

    const reply = await interaction.editReply({
        embeds: [embed],
        components: [row],
    });

    const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 30_000,
    });

    collector.on('collect', async (btn) => {
        const isCorrect = btn.customId === `whosaid_${picked.authorId}`;

        const resultEmbed = new EmbedBuilder()
            .setDescription(`> ${picked.message.content}`)
            .setColor(isCorrect ? 0x57f287 : 0xed4245)
            .addFields({
                name: isCorrect ? '✅ 正解！' : '❌ 不正解！',
                value: `正解は **${picked.authorName}** でした！`,
            });

        const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            choices.map((choice) =>
                new ButtonBuilder()
                    .setCustomId(`whosaid_${choice.id}`)
                    .setLabel(choice.name)
                    .setStyle(
                        choice.id === picked.authorId
                            ? ButtonStyle.Success
                            : ButtonStyle.Danger
                    )
                    .setDisabled(true)
            )
        );

        await btn.update({ embeds: [resultEmbed], components: [disabledRow] });
        collector.stop();
    });

    collector.on('end', async (_, reason) => {
        if (reason === 'time') {
            const timeoutEmbed = new EmbedBuilder()
                .setDescription(`> ${picked.message.content}`)
                .setColor(0x99aab5)
                .addFields({
                    name: '⏰ 時間切れ！',
                    value: `正解は **${picked.authorName}** でした！`,
                });

            const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                choices.map((choice) =>
                    new ButtonBuilder()
                        .setCustomId(`whosaid_${choice.id}`)
                        .setLabel(choice.name)
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                )
            );

            await interaction.editReply({ embeds: [timeoutEmbed], components: [disabledRow] });
        }
    });
}
