import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('letsgo')
    .setDescription('今ならんん〜いけｴｴウｯｯ!!!!🤏😎');

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({
        content: '今ならんん〜いけｴｴウｯｯ!!!!🤏😎'
    });
}
