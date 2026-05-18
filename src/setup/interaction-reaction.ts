import { Events, MessageReaction, User } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../../data/dontfeed_data.json');

const foods = [
    '🍖', '🍗', '🥩', '🍔', '🍟',
    '🍕', '🌭', '🥪', '🌮', '🌯',
    '🍙', '🍣', '🍤', '🍥', '🍡',
    '🥟', '🍰', '🍩', '🍪', '🍫'
];

export default {
    name: Events.MessageReactionAdd,
    async execute(reaction: MessageReaction, user: User) {
        if (user.bot) return;
        if (!foods.includes(reaction.emoji.name ?? '')) return;

        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const data = JSON.parse(raw);

        if (!data.watchedMessageIds?.includes(reaction.message.id)) return;

        data.totalCount += 1;
        const userId = user.id;
        const userName = user.displayName ?? user.username;
        if (!data.feeders[userId]) {
            data.feeders[userId] = { name: userName, count: 0 };
        }
        data.feeders[userId].count += 1;
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

        const responses = [
            `${user}！！リアクションで餌やるな！！（累計${data.totalCount}回目）`,
            `${user}がこっそり餌をあげようとしています。通報しました。`,
            `絵文字でも餌は餌です${user}！${data.feeders[userId].count}回目ですよ！`,
        ];

        await reaction.message.reply({
            content: responses[Math.floor(Math.random() * responses.length)],
        });
    }
};
