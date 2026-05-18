import * as pingCommand from '../commands/botest/ping.js';
import * as meigenCommand from '../commands/text/meigen.js';
import * as omikuziCommand from '../commands/text/omikuzi.js';
import * as echoCommand from '../commands/text/echo.js';
import * as chooseCommand from '../commands/vote/choose.js';
import { Collection } from 'discord.js';

export const commands = new Collection<string, any>();
commands.set(pingCommand.data.name, pingCommand);
commands.set(meigenCommand.data.name, meigenCommand);
commands.set(omikuziCommand.data.name, omikuziCommand);
commands.set(echoCommand.data.name, echoCommand);
commands.set(chooseCommand.data.name, chooseCommand);
