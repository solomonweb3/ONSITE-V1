// Parse a pasted brand email into a draft activation. Pure + dependency-free
// so it's easy to reason about and test. This replaces the need for Gmail
// OAuth: the creator just pastes the email and we extract the essentials.

export type ParsedEmail = {
  title: string;
  brand: string;
  items: { title: string; owner: 'my'; due: string }[];
};

// "Rare Beauty <team@rarebeauty.com>" -> "Rare Beauty"
// "partnerships@altacoffee.com"       -> "Altacoffee"
function nameFromSender(from: string): string {
  // Prefer a real display name from the "Name <email>" form.
  const display = from.match(/^\s*"?([^"<]*?)"?\s*<[^>]*>\s*$/)?.[1]?.trim();
  if (display && !display.includes('@')) return display;
  // Otherwise derive the brand from the email domain.
  const domain = from.match(/[\w.+-]+@([a-z0-9.-]+\.[a-z]{2,})/i)?.[1];
  if (domain) return titleCase(domain.split('.')[0]);
  return from.trim();
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

// Ordered specific -> generic; first match per label wins (deduped).
const DELIVERABLE_TYPES: { re: RegExp; label: string }[] = [
  { re: /instagram reels?|ig reels?|reels?/i, label: 'Instagram Reel' },
  { re: /instagram stor(?:y|ies)|ig stor(?:y|ies)|stor(?:y|ies)/i, label: 'Instagram Story' },
  { re: /tiktoks?/i, label: 'TikTok Post' },
  { re: /youtube shorts?|yt shorts?|shorts?/i, label: 'YouTube Short' },
  { re: /carousels?/i, label: 'Instagram Carousel' },
  { re: /instagram posts?|ig posts?|posts?/i, label: 'Instagram Post' },
  { re: /flat ?lays?/i, label: 'Product Flatlay' },
  { re: /ugc videos?|ugc/i, label: 'UGC Video' },
  { re: /photos?|photography/i, label: 'Photo' },
  { re: /videos?/i, label: 'Video' },
];

function extractItems(text: string): ParsedEmail['items'] {
  const items: ParsedEmail['items'] = [];
  const seen = new Set<string>();
  for (const { re, label } of DELIVERABLE_TYPES) {
    // Optional leading quantity: "2x TikToks", "3 reels", "one story".
    const qtyMatch = text.match(new RegExp(`(\\d+)\\s*(?:x|×)?\\s*(?:${re.source})`, 'i'));
    const mentioned = re.test(text);
    if (!mentioned || seen.has(label)) continue;
    const qty = qtyMatch ? Math.min(parseInt(qtyMatch[1], 10) || 1, 20) : 1;
    seen.add(label);
    items.push({ title: `${qty}x ${label}`, owner: 'my', due: 'TBD' });
  }
  if (items.length === 0) items.push({ title: 'Deliver content', owner: 'my', due: 'TBD' });
  return items;
}

export function parseBrandEmail(raw: string): ParsedEmail {
  const text = (raw ?? '').trim();
  const lines = text.split(/\r?\n/).map((l) => l.trim());

  const subject = text.match(/^subject:\s*(.+)$/im)?.[1]?.trim();
  const firstLine = lines.find(Boolean) ?? '';
  const title = (subject || firstLine || 'Brand activation').slice(0, 80);

  const fromLine = text.match(/^from:\s*(.+)$/im)?.[1];
  let brand = fromLine ? nameFromSender(fromLine) : '';
  if (!brand) {
    const domain = text.match(/@([a-z0-9.-]+\.[a-z]{2,})/i)?.[1];
    if (domain) brand = titleCase(domain.split('.')[0]);
  }

  return { title, brand, items: extractItems(text) };
}
