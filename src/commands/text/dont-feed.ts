import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('dontfeed')
    .setDescription('絶対に、この子に餌を与えないで下さい!!!!!');

export async function execute(interaction: ChatInputCommandInteraction) {
    const messageContent = 'https://tenor.com/view/bloo-bloodtrail-twitch-gif-27655908\n⬇️この子に餌を与えないで下さい⬇️';

    const response = await interaction.reply({
        content: messageContent,
        fetchReply: true
    });

    const foods = [
        '🍖', '🍗', '🥩', '🍔', '🍟', 
        '🍕', '🌭', '🥪', '🌮', '🌯', 
        '🍙', '🍣', '🍤', '🍥', '🍡', 
        '🥟', '🍰', '🍩', '🍪', '🍫'
    ];

    for (const food of foods) {
        await response.react(food).catch(() => null);
    }
}
