import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    Message,
    Collection,
    Snowflake,
} from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('hype')
    .setDescription('このチャンネルの直近の会話の熱量・盛り上がり度を多角的に測定します')
    .addIntegerOption(option =>
        option
            .setName('limit')
            .setDescription('取得するメッセージ数 (デフォルト: 100)')
            .setMinValue(10)
            .setMaxValue(10000000)
    );

interface HypeMetrics {
    velocityScore: number;
    emojiScore: number;
    excitementScore: number;
    burstScore: number;
    diversityScore: number;
    reactionScore: number;
    interactionScore: number;
    vocabularyScore: number;
    mediaScore: number;
    latenightBonus: number;
}

interface HypeAnalysis {
    totalScore: number;
    metrics: HypeMetrics;
    messageCount: number;
    uniqueUsers: number;
    spanSeconds: number;
    topUser: { name: string; count: number } | null;
    level: HypeLevel;
}

type HypeLevel = '🧊 静寂' | '😐 普通' | '🙂 活発' | '😄 盛り上がり中' | '🔥 激アツ' | '💥 カオス';

const WEIGHTS = {
    velocity:    0.22,
    emoji:       0.10,
    excitement:  0.12,
    burst:       0.10,
    diversity:   0.12,
    reaction:    0.10,
    interaction: 0.10,
    vocabulary:  0.08,
    media:       0.06,
} as const;

const EXCITEMENT_PATTERNS = [
    /！{2,}/g,
    /!{2,}/g,
    /w{2,}/gi,
    /笑{1,}/g,
    /草/g,
    /ｗ{2,}/g,
    /爆笑/g,
    /やばい/gi,
    /やば[いっ]/g,
    /すご[いっ]/g,
    /最高/g,
    /神/g,
    /天才/g,
    /ありがとう/g,
    /まじ[でか！]/g,
];

const HOT_VOCABULARY = [
    'やばい', 'やば', 'すごい', 'すご', '最高', '神', '草', '笑', 'ｗ', 'w',
    '天才', 'まじ', 'ガチ', 'えぐい', 'えぐ', 'きた', 'きたきた', '好き',
    'ありがとう', 'おめ', 'おめでとう', 'うける', 'ウケる', '?!', '!?',
    'nani', 'lol', 'lmao', 'omg', 'wtf', 'gg',
];

const clamp = (v: number) => Math.max(0, Math.min(100, v));
const logistic = (x: number, mid: number, k = 0.1) =>
    100 / (1 + Math.exp(-k * (x - mid)));

function calcVelocityScore(messages: Message[], spanSec: number): number {
    if (spanSec <= 0) return 50;
    const msgsPerMin = (messages.length / spanSec) * 60;
    return clamp(logistic(msgsPerMin, 10, 0.3));
}

function calcEmojiScore(messages: Message[]): number {
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic}|<:[a-zA-Z0-9_]+:\d+>)/gu;
    const withEmoji = messages.filter(m => emojiRegex.test(m.content)).length;
    return clamp((withEmoji / messages.length) * 100 * 1.2);
}

function calcExcitementScore(messages: Message[]): number {
    let totalHits = 0;
    for (const msg of messages) {
        for (const pattern of EXCITEMENT_PATTERNS) {
            const matches = msg.content.match(new RegExp(pattern.source, pattern.flags));
            if (matches) totalHits += matches.length;
        }
    }
    const rate = totalHits / messages.length;
    return clamp(logistic(rate, 1.5, 2));
}

function calcBurstScore(messages: Message[]): number {
    const sorted = [...messages].sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    let burstPairs = 0;
    for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        const diff = (curr.createdTimestamp - prev.createdTimestamp) / 1000;
        if (curr.author.id === prev.author.id && diff <= 30) burstPairs++;
    }
    const rate = burstPairs / Math.max(sorted.length - 1, 1);
    return clamp(rate * 150);
}

function calcDiversityScore(uniqueUsers: number, total: number): number {
    const ratio = uniqueUsers / total;
    const userBonus = clamp(logistic(uniqueUsers, 4, 0.8));
    return clamp((ratio * 60) + (userBonus * 0.4));
}

function calcReactionScore(messages: Message[]): number {
    let totalReactions = 0;
    for (const msg of messages) {
        msg.reactions.cache.forEach(r => { totalReactions += r.count ?? 0; });
    }
    const avg = totalReactions / messages.length;
    return clamp(logistic(avg, 1, 3));
}

function calcInteractionScore(messages: Message[]): number {
    let interactions = 0;
    for (const msg of messages) {
        if (msg.mentions.users.size > 0) interactions++;
        if (msg.reference) interactions++;
    }
    const rate = interactions / messages.length;
    return clamp(rate * 130);
}

function calcVocabularyScore(messages: Message[]): number {
    let hits = 0;
    for (const msg of messages) {
        const lower = msg.content.toLowerCase();
        for (const word of HOT_VOCABULARY) {
            if (lower.includes(word)) { hits++; break; }
        }
    }
    return clamp((hits / messages.length) * 120);
}

function calcMediaScore(messages: Message[]): number {
    const withMedia = messages.filter(
        m => m.attachments.size > 0 || m.stickers.size > 0 || m.embeds.length > 0
    ).length;
    return clamp((withMedia / messages.length) * 130);
}

function calcLatenightBonus(messages: Message[]): number {
    const latest = messages[0];
    const hour = new Date(latest.createdTimestamp).getHours();
    if (hour >= 23 || hour <= 4) return 10;
    if (hour >= 21) return 5;
    return 0;
}

function analyzeHype(messages: Message[]): HypeAnalysis {
    const sorted = [...messages].sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    const spanSec = (sorted[sorted.length - 1].createdTimestamp - sorted[0].createdTimestamp) / 1000;

    const userCounts = new Map<string, { count: number; name: string }>();
    for (const msg of messages) {
        const entry = userCounts.get(msg.author.id) ?? { count: 0, name: msg.author.displayName };
        entry.count++;
        userCounts.set(msg.author.id, entry);
    }
    const uniqueUsers = userCounts.size;
    const topUserEntry = [...userCounts.values()].sort((a, b) => b.count - a.count)[0] ?? null;

    const metrics: HypeMetrics = {
        velocityScore:    calcVelocityScore(messages, spanSec),
        emojiScore:       calcEmojiScore(messages),
        excitementScore:  calcExcitementScore(messages),
        burstScore:       calcBurstScore(messages),
        diversityScore:   calcDiversityScore(uniqueUsers, messages.length),
        reactionScore:    calcReactionScore(messages),
        interactionScore: calcInteractionScore(messages),
        vocabularyScore:  calcVocabularyScore(messages),
        mediaScore:       calcMediaScore(messages),
        latenightBonus:   calcLatenightBonus(messages),
    };

    const rawScore =
        metrics.velocityScore    * WEIGHTS.velocity    +
        metrics.emojiScore       * WEIGHTS.emoji       +
        metrics.excitementScore  * WEIGHTS.excitement  +
        metrics.burstScore       * WEIGHTS.burst       +
        metrics.diversityScore   * WEIGHTS.diversity   +
        metrics.reactionScore    * WEIGHTS.reaction    +
        metrics.interactionScore * WEIGHTS.interaction +
        metrics.vocabularyScore  * WEIGHTS.vocabulary  +
        metrics.mediaScore       * WEIGHTS.media;

    const totalScore = clamp(Math.round(rawScore + metrics.latenightBonus));

    const level: HypeLevel =
        totalScore >= 90 ? '💥 カオス'        :
        totalScore >= 75 ? '🔥 激アツ'        :
        totalScore >= 55 ? '😄 盛り上がり中'  :
        totalScore >= 35 ? '🙂 活発'          :
        totalScore >= 15 ? '😐 普通'          :
                           '🧊 静寂';

    return {
        totalScore,
        metrics,
        messageCount: messages.length,
        uniqueUsers,
        spanSeconds: spanSec,
        topUser: topUserEntry ? { name: topUserEntry.name, count: topUserEntry.count } : null,
        level,
    };
}

function makeBar(score: number, blocks = 8): string {
    const filled = Math.round((score / 100) * blocks);
    return '█'.repeat(filled) + '░'.repeat(blocks - filled);
}

function formatSeconds(sec: number): string {
    if (sec < 60) return `${Math.round(sec)}秒`;
    if (sec < 3600) return `${Math.round(sec / 60)}分`;
    return `${(sec / 3600).toFixed(1)}時間`;
}

function buildEmbed(analysis: HypeAnalysis): EmbedBuilder {
    const { totalScore, metrics, level, messageCount, uniqueUsers, spanSeconds, topUser } = analysis;

    const color =
        totalScore >= 90 ? 0xff0000 :
        totalScore >= 75 ? 0xff4500 :
        totalScore >= 55 ? 0xff8c00 :
        totalScore >= 35 ? 0x00bfff :
        totalScore >= 15 ? 0x6495ed :
                           0x708090;

    const mainBar = makeBar(totalScore, 12);
    const msgsPerMin = spanSeconds > 0 ? ((messageCount / spanSeconds) * 60).toFixed(1) : '—';

    const pt = (n: number) => `**${Math.round(n)}**pt`;
    const row = (score: number, extra = '') =>
        `\`${makeBar(score)}\` ${pt(score)}${extra ? `  ${extra}` : ''}`;

    const footerParts = [
        `対象: ${messageCount}件`,
        `期間: ${formatSeconds(spanSeconds)}`,
        topUser ? `最多投稿: ${topUser.name} (${topUser.count}件)` : null,
        metrics.latenightBonus > 0 ? `🌙 深夜ボーナス +${metrics.latenightBonus}pt` : null,
    ].filter(Boolean).join('  |  ');

    return new EmbedBuilder()
        .setColor(color)
        .setTitle(`📊 チャンネル熱量レポート`)
        .setDescription(
            `## ${level}\n` +
            `**総合スコア: ${totalScore} / 100**\n` +
            `\`${mainBar}\``
        )
        .addFields(
            { name: '投稿密度',     value: row(metrics.velocityScore,    `(${msgsPerMin}件/分)`), inline: false },
            { name: '絵文字率',     value: row(metrics.emojiScore),                               inline: false },
            { name: '興奮語',       value: row(metrics.excitementScore),                          inline: false },
            { name: '連投爆発',     value: row(metrics.burstScore),                               inline: false },
            { name: '参加多様性',   value: row(metrics.diversityScore,   `(${uniqueUsers}人)`),   inline: false },
            { name: 'リアクション', value: row(metrics.reactionScore),                            inline: false },
            { name: '絡み度',       value: row(metrics.interactionScore),                         inline: false },
            { name: '熱量語彙',     value: row(metrics.vocabularyScore),                          inline: false },
            { name: 'メディア率',   value: row(metrics.mediaScore),                               inline: false },
        )
        .setFooter({ text: footerParts })
        .setTimestamp();
}

export async function execute(interaction: ChatInputCommandInteraction) {
    const channel = interaction.channel;
    if (!channel || !channel.isTextBased()) return;

    await interaction.deferReply();

    const limit = interaction.options.getInteger('limit') ?? 100;

    let fetched: Collection<Snowflake, Message>;
    try {
        fetched = await channel.messages.fetch({ limit });
    } catch {
        await interaction.editReply({ content: '❌ メッセージの取得に失敗しました。権限を確認してください。' });
        return;
    }

    const messages = fetched.filter(m => !m.author.bot).map(m => m);

    if (messages.length < 5) {
        await interaction.editReply({
            content: '📊 データが不足しています（人間のメッセージが5件未満）。もう少し会話が溜まってから再試行してください。',
        });
        return;
    }

    const analysis = analyzeHype(messages);
    const embed = buildEmbed(analysis);

    await interaction.editReply({ embeds: [embed] });
}
