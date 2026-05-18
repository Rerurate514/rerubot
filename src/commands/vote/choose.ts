import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('choose')
    .setDescription('入力された選択肢の中から1つをランダムに選びます')
    .addStringOption(option =>
        option.setName('options').setDescription('選択肢をスペースで区切って入力（例: 寿司 焼肉 中華）').setRequired(true)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const rawOptions = interaction.options.getString('options', true);
    
    const options = rawOptions.split(/\s+/).filter(opt => opt.length > 0);

    if (options.length < 2) {
        await interaction.reply({ content: '選択肢は2つ以上入力してください。', ephemeral: true });
        return;
    }

    const picked = options[Math.floor(Math.random() * options.length)];

    await interaction.reply({
        content: `🤔 候補: [ ${options.join(', ')} ]\n\n✨ Botのオススメは **【${picked}】** です！`
    });
}
