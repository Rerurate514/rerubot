import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('omikuji')
    .setDescription('今日の運勢を占います');

export async function execute(interaction: ChatInputCommandInteraction) {
    const fortunes = ['大吉 🌟', '吉 ✨', '中吉 👍', '小吉 😊', '末吉 😐', '凶 💀', '大凶 👻'];
    const randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)];

    await interaction.reply({
        content: `${interaction.user.username} さんの今日の運勢は **${randomFortune}** です！`
    });
}
