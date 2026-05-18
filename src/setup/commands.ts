import * as pingCommand from '../commands/botest/ping.js';
import { Collection } from 'discord.js';

export const commands = new Collection<string, any>();
commands.set(pingCommand.data.name, pingCommand);
