import { REST, Routes } from 'discord.js';
import * as pingCommand from './commands/botest/ping.js';
import * as meigenCommand from './commands/text/meigen.js';

//npx tsx --env-file=.env src/deploy-commands.tsでデプロイ

const commands = [
    pingCommand.data.toJSON(),
    meigenCommand.data.toJSON()
];
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
    try {
        console.log('コマンド登録開始...');
        console.log(commands);
        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID!,
                process.env.GUILD_ID!
            ),
            { body: commands }
        );
        console.log('コマンド登録完了！');
    } catch (error) {
        console.error(error);
    }
})();
