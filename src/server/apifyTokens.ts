import { ApifyClient } from 'apify-client';

/**
 * Tries Apify tokens in order, remembering which one last worked ("sticky")
 * instead of re-attempting an exhausted token on every subsequent call. This
 * is what lets the one-shot scrape script (scripts/scrape-once.ts) spend
 * down two separate free-credit tokens back-to-back — burn through token 1,
 * then keep going on token 2 — rather than splitting work across them
 * up front and wasting calls if one alone would've been enough.
 */
export class TokenRotator {
  private index = 0;
  private readonly tokens: string[];

  constructor(tokens: string | string[]) {
    this.tokens = Array.isArray(tokens) ? tokens.filter(Boolean) : [tokens].filter(Boolean);
    if (this.tokens.length === 0) throw new Error('TokenRotator needs at least one Apify token');
  }

  /** Run `fn` with the current token; on failure, advance and retry with each remaining token once. */
  async run<T>(fn: (client: ApifyClient) => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt < this.tokens.length; attempt++) {
      const token = this.tokens[this.index];
      try {
        return await fn(new ApifyClient({ token }));
      } catch (error) {
        lastError = error;
        const tokenNumber = this.index + 1;
        this.index = (this.index + 1) % this.tokens.length;
        if (this.tokens.length > 1) {
          console.warn(`  [apify] token #${tokenNumber} failed (${(error as any)?.message || error}) — trying next token`);
        }
      }
    }
    throw lastError;
  }
}
