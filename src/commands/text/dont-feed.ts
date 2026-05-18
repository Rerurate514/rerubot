import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, '../../../data/dontfeed_data.json');

type FeedData = {
    totalCount: number;
    feeders: Record<string, { name: string; count: number }>;
    watchedMessageIds: string[];
};

function loadData(): FeedData {
    if (!fs.existsSync(DATA_FILE)) return { totalCount: 0, feeders: {}, watchedMessageIds: [] };
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    if (!data.watchedMessageIds) data.watchedMessageIds = [];
    return data;
}

function saveData(data: FeedData) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getReaction(totalCount: number): string {
    if (totalCount === 0) return '😴 （おとなしく寝てる）';
    if (totalCount < 5) return '😠 やめろ！！';
    if (totalCount < 10) return '🤬 激おこ！！！';
    if (totalCount < 20) return '💢💢 もう限界だ！！！！';
    return '👹 完全に覚醒してしまった………';
}

function getGifUrl(totalCount: number): string {
    if (totalCount < 5) return 'https://tenor.com/view/bloo-bloodtrail-twitch-gif-27655908';
    if (totalCount < 10) return 'https://tenor.com/view/bloo-bloodtrail-twitch-gif-27655908';
    return 'https://tenor.com/view/bloo-bloodtrail-twitch-gif-27655908';
}

export const data = new SlashCommandBuilder()
    .setName('dontfeed')
    .setDescription('絶対に、この子に餌を与えないで下さい!!!!!');

export async function execute(interaction: ChatInputCommandInteraction) {
    const feedData = loadData();

    const reactionStatus = getReaction(feedData.totalCount);
    const gifUrl = getGifUrl(feedData.totalCount);

    const topFeeders = Object.values(feedData.feeders)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map((f, i) => `${['🥇', '🥈', '🥉'][i]} ${f.name}：${f.count}回`)
        .join('\n') || 'まだ誰も餌を与えていない…';

    const messageContent = [
        gifUrl,
        `⬇️この子に餌を与えないで下さい⬇️`,
        ``,
        `現在の状態：${reactionStatus}`,
        `累計餌やり回数：**${feedData.totalCount}回**`,
        ``,
        `🏆 最も餌を与えた犯人`,
        topFeeders,
    ].join('\n');

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('feed_button')
            .setLabel('🍖 餌を与える（やめろ）')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('status_button')
            .setLabel('📊 現在のステータス')
            .setStyle(ButtonStyle.Secondary)
    );

    const foods = [
        '🍖', '🍗', '🥩', '🍔', '🍟',
        '🍕', '🌭', '🥪', '🌮', '🌯',
        '🍙', '🍣', '🍤', '🍥', '🍡',
        '🥟', '🍰', '🍩', '🍪', '🍫'
    ];

    const response = await interaction.reply({
        content: messageContent,
        components: [row],
        fetchReply: true,
    });

    const currentData = loadData();
    if (!currentData.watchedMessageIds.includes(response.id)) {
        currentData.watchedMessageIds.push(response.id);
        saveData(currentData);
    }

    for (const food of foods) {
        await response.react(food).catch(() => null);
    }

    const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 5 * 60 * 1000,
    });

    collector.on('collect', async (btn) => {
        const currentData = loadData();

        if (btn.customId === 'feed_button') {
            currentData.totalCount += 1;
            const userId = btn.user.id;
            const userName = btn.user.displayName ?? btn.user.username;
            if (!currentData.feeders[userId]) {
                currentData.feeders[userId] = { name: userName, count: 0 };
            }
            currentData.feeders[userId].count += 1;
            saveData(currentData);

            const newReaction = getReaction(currentData.totalCount);
            const userCount = currentData.feeders[userId].count;

            const responses = [
                `${btn.user}！！なんで餌やるんですか！！（累計${currentData.totalCount}回目）\n現在の状態：${newReaction}`,
                `またお前か${btn.user}！これで${userCount}回目だぞ！\n状態：${newReaction}`,
                `${btn.user}は${userCount}回も餌をあげています。通報しました。\n状態：${newReaction}`,
            ];

            await btn.reply({
                content: responses[Math.floor(Math.random() * responses.length)],
                ephemeral: true,
            });

        } else if (btn.customId === 'status_button') {
            const topList = Object.values(currentData.feeders)
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)
                .map((f, i) => `${['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i]} ${f.name}：${f.count}回`)
                .join('\n') || 'まだ誰も餌を与えていない…';

            await btn.reply({
                content: [
                    `📊 **現在のステータス**`,
                    `状態：${getReaction(currentData.totalCount)}`,
                    `累計餌やり回数：${currentData.totalCount}回`,
                    ``,
                    `🏆 餌やり犯ランキング`,
                    topList,
                ].join('\n'),
                ephemeral: true,
            });
        }
    });
}
