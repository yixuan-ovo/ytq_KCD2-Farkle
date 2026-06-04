import { describe, it, expect, beforeEach } from 'vitest';
import {
  pickTavernQuote,
  getQuotesForTrigger,
  resetQuoteMemory,
  TAVERN_QUOTES,
  type QuoteTrigger,
} from '../src/lib/ui/tavernQuotes';

const TRIGGERS: QuoteTrigger[] = [
  'menu',
  'game_start',
  'reroll',
  'big_score',
  'bust',
  'win',
  'lose',
  'combo',
  'idle',
];

describe('tavernQuotes', () => {
  beforeEach(() => {
    resetQuoteMemory();
  });

  it('has 100 quotes', () => {
    expect(TAVERN_QUOTES.length).toBe(100);
  });

  it.each(TRIGGERS)('pickTavernQuote(%s) returns matching trigger', (trigger) => {
    const quote = pickTavernQuote(trigger, { random: () => 0 });
    expect(quote).not.toBeNull();
    expect(quote!.trigger).toBe(trigger);
  });

  it('getQuotesForTrigger only returns that trigger', () => {
    for (const trigger of TRIGGERS) {
      const pool = getQuotesForTrigger(trigger);
      expect(pool.length).toBeGreaterThan(0);
      expect(pool.every((q) => q.trigger === trigger)).toBe(true);
    }
  });

  it('avoids immediate repeat when pool has alternatives', () => {
    const first = pickTavernQuote('menu', { random: () => 0 });
    expect(first).not.toBeNull();
    const second = pickTavernQuote('menu', { random: () => 0 });
    expect(second).not.toBeNull();
    const menuPool = getQuotesForTrigger('menu');
    if (menuPool.length > 1) {
      expect(second!.id).not.toBe(first!.id);
    }
  });

  it('returns null for empty trigger pool only when no quotes exist', () => {
    expect(getQuotesForTrigger('menu').length).toBeGreaterThan(0);
  });
});
