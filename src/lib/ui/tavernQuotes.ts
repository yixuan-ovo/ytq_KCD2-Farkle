export type QuoteTrigger =
  | 'menu'
  | 'game_start'
  | 'reroll'
  | 'big_score'
  | 'bust'
  | 'win'
  | 'lose'
  | 'combo'
  | 'idle';

export type QuoteRarity = 'common' | 'rare' | 'epic';

export interface TavernQuote {
  id: string;
  npc: string;
  role: string;
  rarity: QuoteRarity;
  trigger: QuoteTrigger;
  text: string;
}

const STORAGE_KEY = 'farkle-quote-seen';

const RARITY_WEIGHT: Record<QuoteRarity, number> = {
  common: 70,
  rare: 25,
  epic: 5,
};

const MAX_SEEN = 30;

let seenIds = new Set<string>();

function loadSeenFromStorage(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const ids = JSON.parse(raw) as string[];
    if (Array.isArray(ids)) seenIds = new Set(ids);
  } catch {
    /* ignore */
  }
}

function persistSeen(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...seenIds]));
  } catch {
    /* ignore */
  }
}

function rememberQuote(id: string): void {
  seenIds.add(id);
  if (seenIds.size >= MAX_SEEN) {
    seenIds = new Set([id]);
  }
  persistSeen();
}

loadSeenFromStorage();

function q(
  id: string,
  npc: string,
  role: string,
  trigger: QuoteTrigger,
  rarity: QuoteRarity,
  text: string,
): TavernQuote {
  return { id, npc, role, trigger, rarity, text };
}

/** 酒馆语录全集（5 位 NPC × 20 条） */
export const TAVERN_QUOTES: readonly TavernQuote[] = [
  // 酒馆老板
  q('innkeeper-01', '酒馆老板', '掌柜', 'menu', 'common', '骰子不会说谎，但它们经常骗人。'),
  q('innkeeper-02', '酒馆老板', '掌柜', 'menu', 'common', '今天输光的人已经有七个了，希望你不是第八个。'),
  q('innkeeper-03', '酒馆老板', '掌柜', 'menu', 'common', '每个人进门时都觉得自己会赢。'),
  q('innkeeper-04', '酒馆老板', '掌柜', 'game_start', 'common', '好了，看看今天是谁给酒馆送钱。'),
  q('innkeeper-05', '酒馆老板', '掌柜', 'game_start', 'common', '别紧张，骰子闻得到恐惧。'),
  q('innkeeper-06', '酒馆老板', '掌柜', 'reroll', 'common', '又一次机会，通常也是最后一次。'),
  q('innkeeper-07', '酒馆老板', '掌柜', 'reroll', 'common', '很多人就是死在最后一次贪心上。'),
  q('innkeeper-08', '酒馆老板', '掌柜', 'big_score', 'rare', '哦？看来幸运女神终于睁眼了。'),
  q('innkeeper-09', '酒馆老板', '掌柜', 'big_score', 'rare', '不错，这一手够你吹三天。'),
  q('innkeeper-10', '酒馆老板', '掌柜', 'bust', 'common', '哈哈，我见过比这更惨的。'),
  q('innkeeper-11', '酒馆老板', '掌柜', 'bust', 'common', '骰子似乎不喜欢你。'),
  q('innkeeper-12', '酒馆老板', '掌柜', 'win', 'rare', '今晚的酒应该更香了。'),
  q('innkeeper-13', '酒馆老板', '掌柜', 'win', 'rare', '赢家总是走得比较慢。'),
  q('innkeeper-14', '酒馆老板', '掌柜', 'lose', 'common', '没关系，桌子还在这里。'),
  q('innkeeper-15', '酒馆老板', '掌柜', 'lose', 'common', '你的钱只是换了个主人。'),
  q('innkeeper-16', '酒馆老板', '掌柜', 'idle', 'common', '想得越久，点数也不会变。'),
  q('innkeeper-17', '酒馆老板', '掌柜', 'idle', 'common', '骰子可不会自己滚。'),
  q('innkeeper-18', '酒馆老板', '掌柜', 'combo', 'epic', '这种好运，我一年见不到几次。'),
  q('innkeeper-19', '酒馆老板', '掌柜', 'combo', 'epic', '继续这样下去，别人会怀疑你作弊。'),
  q('innkeeper-20', '酒馆老板', '掌柜', 'menu', 'rare', '运气是上帝借给你的钱，迟早要还。'),
  // 守卫
  q('guard-01', '守卫', '巡夜人', 'game_start', 'common', '别闹事，我今天心情不错。'),
  q('guard-02', '守卫', '巡夜人', 'game_start', 'common', '只要不打架，我什么都没看见。'),
  q('guard-03', '守卫', '巡夜人', 'bust', 'common', '这下够安静了。'),
  q('guard-04', '守卫', '巡夜人', 'bust', 'common', '我猜你现在想砸桌子。'),
  q('guard-05', '守卫', '巡夜人', 'win', 'common', '看来今晚不用把你抬出去。'),
  q('guard-06', '守卫', '巡夜人', 'lose', 'common', '输了就认，别找借口。'),
  q('guard-07', '守卫', '巡夜人', 'reroll', 'common', '你确定？很多麻烦都从这里开始。'),
  q('guard-08', '守卫', '巡夜人', 'reroll', 'common', '贪心的人总喜欢再来一次。'),
  q('guard-09', '守卫', '巡夜人', 'idle', 'common', '动作快点，我还有巡逻。'),
  q('guard-10', '守卫', '巡夜人', 'idle', 'common', '你在等神迹吗？'),
  q('guard-11', '守卫', '巡夜人', 'big_score', 'rare', '哟，这运气可不常见。'),
  q('guard-12', '守卫', '巡夜人', 'big_score', 'rare', '我开始理解别人为什么讨厌赢家了。'),
  q('guard-13', '守卫', '巡夜人', 'combo', 'epic', '这可不像正常人的运气。'),
  q('guard-14', '守卫', '巡夜人', 'combo', 'epic', '有人要检查一下这些骰子吗？'),
  q('guard-15', '守卫', '巡夜人', 'lose', 'common', '至少你还穿着裤子。'),
  q('guard-16', '守卫', '巡夜人', 'lose', 'common', '我见过更惨的。'),
  q('guard-17', '守卫', '巡夜人', 'menu', 'common', '今天酒馆很安静，希望别持续太久。'),
  q('guard-18', '守卫', '巡夜人', 'menu', 'common', '每次看到赌徒，我都知道有乐子看了。'),
  q('guard-19', '守卫', '巡夜人', 'game_start', 'rare', '希望今晚没人哭。'),
  q('guard-20', '守卫', '巡夜人', 'win', 'rare', '不错，你暂时保住了尊严。'),
  // 农夫
  q('farmer-01', '农夫', '乡邻', 'menu', 'common', '我宁可和天气打赌。'),
  q('farmer-02', '农夫', '乡邻', 'menu', 'common', '庄稼都比骰子讲道理。'),
  q('farmer-03', '农夫', '乡邻', 'game_start', 'common', '希望今天比收成好一点。'),
  q('farmer-04', '农夫', '乡邻', 'game_start', 'common', '至少这里不用锄地。'),
  q('farmer-05', '农夫', '乡邻', 'reroll', 'common', '种子都比这靠谱。'),
  q('farmer-06', '农夫', '乡邻', 'reroll', 'common', '你这是在拿命运当玩笑。'),
  q('farmer-07', '农夫', '乡邻', 'bust', 'common', '和去年收成一样惨。'),
  q('farmer-08', '农夫', '乡邻', 'bust', 'common', '我熟悉这种感觉。'),
  q('farmer-09', '农夫', '乡邻', 'big_score', 'rare', '这比丰收还难得。'),
  q('farmer-10', '农夫', '乡邻', 'big_score', 'rare', '你今天肯定踩到幸运马蹄铁了。'),
  q('farmer-11', '农夫', '乡邻', 'idle', 'common', '你再想下去天都黑了。'),
  q('farmer-12', '农夫', '乡邻', 'idle', 'common', '麦子都长出来了。'),
  q('farmer-13', '农夫', '乡邻', 'lose', 'common', '又白忙活了。'),
  q('farmer-14', '农夫', '乡邻', 'lose', 'common', '跟种地一样，总有赔的时候。'),
  q('farmer-15', '农夫', '乡邻', 'win', 'common', '今晚能多买两块面包。'),
  q('farmer-16', '农夫', '乡邻', 'win', 'common', '总算不是空手回家。'),
  q('farmer-17', '农夫', '乡邻', 'combo', 'epic', '这运气够用一年。'),
  q('farmer-18', '农夫', '乡邻', 'combo', 'epic', '老天爷终于想起你了。'),
  q('farmer-19', '农夫', '乡邻', 'menu', 'rare', '如果好运能种出来，我早发财了。'),
  q('farmer-20', '农夫', '乡邻', 'menu', 'rare', '猪圈里的猪都比某些赌徒聪明。'),
  // 修士
  q('monk-01', '修士', '布道者', 'menu', 'common', '愿主保佑你的选择。'),
  q('monk-02', '修士', '布道者', 'menu', 'common', '诱惑总是披着好运的外衣。'),
  q('monk-03', '修士', '布道者', 'game_start', 'common', '保持克制，孩子。'),
  q('monk-04', '修士', '布道者', 'game_start', 'common', '别让贪念蒙蔽双眼。'),
  q('monk-05', '修士', '布道者', 'reroll', 'common', '你确定这不是贪婪吗？'),
  q('monk-06', '修士', '布道者', 'reroll', 'common', '最后一次通常不是最后一次。'),
  q('monk-07', '修士', '布道者', 'bust', 'common', '命运自有安排。'),
  q('monk-08', '修士', '布道者', 'bust', 'common', '或许这是个教训。'),
  q('monk-09', '修士', '布道者', 'big_score', 'rare', '感谢主的恩赐。'),
  q('monk-10', '修士', '布道者', 'big_score', 'rare', '今天似乎站在你这边。'),
  q('monk-11', '修士', '布道者', 'win', 'rare', '胜利也是一种考验。'),
  q('monk-12', '修士', '布道者', 'win', 'rare', '别让骄傲毁掉好运。'),
  q('monk-13', '修士', '布道者', 'lose', 'common', '谦逊总是好的。'),
  q('monk-14', '修士', '布道者', 'lose', 'common', '至少你学到了什么。'),
  q('monk-15', '修士', '布道者', 'idle', 'common', '犹豫也是一种选择。'),
  q('monk-16', '修士', '布道者', 'idle', 'common', '时间不会为任何人停留。'),
  q('monk-17', '修士', '布道者', 'combo', 'epic', '这种事足够写进布道词。'),
  q('monk-18', '修士', '布道者', 'combo', 'epic', '看来主今天特别关注你。'),
  q('monk-19', '修士', '布道者', 'menu', 'rare', '有人祈求丰收，有人祈求六点。'),
  q('monk-20', '修士', '布道者', 'menu', 'rare', '幸运与信仰从不是一回事。'),
  // 酒馆女招待
  q('waitress-01', '女招待', '侍酒', 'menu', 'common', '输了别怪酒。'),
  q('waitress-02', '女招待', '侍酒', 'menu', 'common', '酒钱记得先付。'),
  q('waitress-03', '女招待', '侍酒', 'game_start', 'common', '祝你好运，我是说真的。'),
  q('waitress-04', '女招待', '侍酒', 'game_start', 'common', '希望你比上一位客人强。'),
  q('waitress-05', '女招待', '侍酒', 'reroll', 'common', '又来？我就知道。'),
  q('waitress-06', '女招待', '侍酒', 'reroll', 'common', '赌徒最爱这三个字：再一次。'),
  q('waitress-07', '女招待', '侍酒', 'bust', 'common', '哎呀，真可惜。'),
  q('waitress-08', '女招待', '侍酒', 'bust', 'common', '至少酒还没洒。'),
  q('waitress-09', '女招待', '侍酒', 'big_score', 'rare', '哇哦，这下全酒馆都看见了。'),
  q('waitress-10', '女招待', '侍酒', 'big_score', 'rare', '有人今晚要吹牛了。'),
  q('waitress-11', '女招待', '侍酒', 'win', 'common', '赢家的笑容都差不多。'),
  q('waitress-12', '女招待', '侍酒', 'win', 'common', '看来今晚值得庆祝。'),
  q('waitress-13', '女招待', '侍酒', 'lose', 'common', '别担心，明天还有机会。'),
  q('waitress-14', '女招待', '侍酒', 'lose', 'common', '酒馆欢迎所有输家。'),
  q('waitress-15', '女招待', '侍酒', 'idle', 'common', '骰子不会因为害羞变成六点。'),
  q('waitress-16', '女招待', '侍酒', 'idle', 'common', '你已经盯着它们很久了。'),
  q('waitress-17', '女招待', '侍酒', 'combo', 'epic', '我怀疑你偷偷拜过幸运女神。'),
  q('waitress-18', '女招待', '侍酒', 'combo', 'epic', '这种好运让我都嫉妒了。'),
  q('waitress-19', '女招待', '侍酒', 'menu', 'rare', '那位先生已经说了五次最后一把。'),
  q('waitress-20', '女招待', '侍酒', 'menu', 'rare', '今晚一定会有人后悔。'),
] as const;

export function getQuotesForTrigger(trigger: QuoteTrigger): TavernQuote[] {
  return TAVERN_QUOTES.filter((quote) => quote.trigger === trigger);
}

export interface PickQuoteOptions {
  excludeIds?: string[];
  /** 测试用：固定随机 [0,1) */
  random?: () => number;
}

function pickWeighted(
  pool: TavernQuote[],
  random: () => number,
): TavernQuote {
  const rarities = [...new Set(pool.map((p) => p.rarity))];
  if (rarities.length === 1) {
    return pool[Math.floor(random() * pool.length)]!;
  }

  const weights = pool.map((p) => RARITY_WEIGHT[p.rarity]);
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = random() * total;
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i]!;
    if (roll < 0) return pool[i]!;
  }
  return pool[pool.length - 1]!;
}

export function pickTavernQuote(
  trigger: QuoteTrigger,
  opts: PickQuoteOptions = {},
): TavernQuote | null {
  const exclude = new Set([...seenIds, ...(opts.excludeIds ?? [])]);
  let pool = getQuotesForTrigger(trigger).filter((q) => !exclude.has(q.id));

  if (pool.length === 0) {
    pool = getQuotesForTrigger(trigger);
    if (pool.length === 0) return null;
  }

  const random = opts.random ?? Math.random;
  const picked = pickWeighted(pool, random);
  rememberQuote(picked.id);
  return picked;
}

/** 测试用：清空去重记录 */
export function resetQuoteMemory(): void {
  seenIds = new Set();
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
}
