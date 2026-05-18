import { Events } from 'discord.js';
import { client } from './client.js';
import { commands } from './commands.js';

client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'エラーが発生しました', ephemeral: true });
            } else {
                await interaction.reply({ content: 'エラーが発生しました', ephemeral: true });
            }
        }
    }
});
