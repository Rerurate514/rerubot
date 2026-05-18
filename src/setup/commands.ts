import * as pingCommand from '../commands/botest/ping.js';
import * as meigenCommand from '../commands/text/meigen.js';
import * as omikuziCommand from '../commands/text/omikuzi.js';
import { Collection } from 'discord.js';

export const commands = new Collection<string, any>();
commands.set(pingCommand.data.name, pingCommand);
commands.set(meigenCommand.data.name, meigenCommand);
commands.set(omikuziCommand.data.name, omikuziCommand);
