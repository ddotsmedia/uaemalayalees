// NSFW & Spam Detection Rules

const NSFW_KEYWORDS = [
  'explicit',
  'adult',
  'xxx',
  'pornographic',
  'sexual',
  'nude',
  'naked',
  // Add 20-30 curated keywords in production
];

export function detectNSFW(content: string): { flagged: boolean; score: number } {
  const lower = content.toLowerCase();
  let score = 0;

  for (const keyword of NSFW_KEYWORDS) {
    if (lower.includes(keyword)) {
      score += 1;
    }
  }

  return {
    flagged: score >= 3,
    score,
  };
}

export function detectSpam(content: string): { flagged: boolean; score: number } {
  let score = 0;

  // Count links (URLs)
  const linkCount = (content.match(/https?:\/\//g) || []).length;
  if (linkCount > 3) {
    score += 2;
  }

  // Detect phone numbers
  if (/\d{7,}/.test(content)) {
    score += 4;
  }

  // Count hashtags
  const hashtagCount = (content.match(/#\w+/g) || []).length;
  if (hashtagCount > 10) {
    score += 1;
  }

  // Check if mostly uppercase (ALL CAPS)
  const uppercaseRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (uppercaseRatio > 0.8) {
    score += 1;
  }

  // Repeated characters (spammy)
  if (/(.)\1{4,}/.test(content)) {
    score += 2;
  }

  return {
    flagged: score >= 8,
    score,
  };
}

export function createModerationReport(
  postId: string,
  type: 'nsfw' | 'spam',
  score: number
): {
  type: string;
  reason: string;
  score: number;
  requiresApproval: boolean;
} {
  return {
    type,
    reason:
      type === 'nsfw'
        ? `NSFW content detected (score: ${score})`
        : `Spam indicators detected (score: ${score})`,
    score,
    requiresApproval: true, // All flags require admin review
  };
}
