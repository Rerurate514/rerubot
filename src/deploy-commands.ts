import { REST, Routes } from 'discord.js';
import * as pingCommand from './commands/botest/ping.js';
import * as meigenCommand from './commands/text/meigen.js';
import * as omikuziCommand from './commands/text/omikuzi.js';
import * as echoCommand from './commands/text/echo.js';
import * as chooseCommand from './commands/vote/choose.js';
import * as dontFeedCommnad from './commands/text/dont-feed.js';
import * as whosaidCommand from './commands/text/whosaid.js';
import * as excuseCommand from './commands/text/excuse.js';
import * as hypeCommand from './commands/text/hype.js';

//npx tsx --env-file=.env src/deploy-commands.tsでデプロイ

const commands = [
    pingCommand.data.toJSON(),
    meigenCommand.data.toJSON(),
    omikuziCommand.data.toJSON(),
    echoCommand.data.toJSON(),
    chooseCommand.data.toJSON(),
    dontFeedCommnad.data.toJSON(),
    whosaidCommand.data.toJSON(),
    excuseCommand.data.toJSON(),
    hypeCommand.data.toJSON()
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
