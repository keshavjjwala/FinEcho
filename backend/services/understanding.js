/**
 * Lightweight, explainable financial NLP for transcripts.
 *
 * All heuristics here are simple keyword/regex rules so you can
 * explain them to judges in 1–2 sentences.
 */

const INTENT_KEYWORDS = {
  advisory_discussion: [/invest/, /sip\b/i, /mutual\s+fund/i, /portfolio/i],
  payment_inquiry: [/due\s+date/i, /outstanding/i, /payment\b/i, /bill/i],
  payment_commitment: [/i\s+will\s+pay/i, /i'll\s+pay/i, /make\s+the\s+payment/i],
  complaint: [/complain/i, /issue/i, /problem/i, /not\s+happy/i, /bad\s+service/i],
  follow_up_required: [/call\s+me\s+back/i, /follow[-\s]*up/i, /let\s+you\s+know/i],
};

const AMOUNT_PATTERN = /\b₹?\s?(\d{1,3}(?:,\d{3})*|\d+)(?:\.\d+)?\b/g;
const RATE_PATTERN = /\b(\d+(?:\.\d+)?)\s*%/g;
const MONTH_YEARS_PATTERN = /\b(\d+)\s*(months?|years?)\b/gi;
const DATE_WORDS_PATTERN = /\b(today|tomorrow|next\s+week|next\s+month|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi;

const PRODUCT_KEYWORDS = [/sip\b/i, /mutual\s+fund/i, /insurance\b/i, /policy\b/i, /loan\b/i, /credit\s+card/i];

const OBLIGATION_PATTERNS = [
  /i\s+will\s+pay/i,
  /i'll\s+pay/i,
  /i\s+agree\s+to\s+pay/i,
  /i\s+commit/i,
  /i\s+will\s+confirm/i,
];

const FOLLOW_UP_TIME_PATTERNS = [
  /\bnext\s+week\b/i,
  /\bbefore\s+friday\b/i,
  /\bthis\s+week\b/i,
  /\bnext\s+month\b/i,
  /\btomorrow\b/i,
];

const STRESS_KEYWORDS = [/angry/i, /upset/i, /not\s+happy/i, /frustrated/i, /escalate/i];
const URGENCY_KEYWORDS = [/\burgent\b/i, /\bimmediately\b/i, /\bright\s+now\b/i];
const INTERRUPTION_PHRASES = [/stop\s+talking/i, /let\s+me\s+finish/i, /you\s+keep\s+interrupting/i];

const REGULATORY_REQUIRED = [
  { key: "recorded", pattern: /this\s+call\s+is\s+recorded/i, label: "Call recording disclosure" },
  { key: "market_risk", pattern: /subject\s+to\s+market\s+risk/i, label: "Market risk disclaimer" },
  { key: "not_advice", pattern: /not\s+financial\s+advice/i, label: "Not financial advice disclaimer" },
];

/**
 * Analyse transcript text and return a structured understanding object.
 * @param {string} transcript
 */
export function analyseFinancialUnderstanding(transcript) {
  const text = (transcript || "").trim();
  const lower = text.toLowerCase();

  // 1) Intents
  const intents = [];
  for (const [intent, patterns] of Object.entries(INTENT_KEYWORDS)) {
    if (patterns.some((p) => p.test(text))) intents.push(intent);
  }

  // 2) Entities
  const amounts = [];
  const rates = [];
  const tenures = [];
  const dates = [];
  const products = [];

  let m;
  while ((m = AMOUNT_PATTERN.exec(text)) !== null) {
    amounts.push(m[0].trim());
  }
  while ((m = RATE_PATTERN.exec(text)) !== null) {
    rates.push(m[0].trim());
  }
  while ((m = MONTH_YEARS_PATTERN.exec(text)) !== null) {
    tenures.push(m[0].trim());
  }
  while ((m = DATE_WORDS_PATTERN.exec(text)) !== null) {
    dates.push(m[0].trim());
  }
  for (const pk of PRODUCT_KEYWORDS) {
    if (pk.test(text)) {
      products.push(pk.source.replace(/\\b/gi, "").replace(/\\s\+/g, " "));
    }
  }

  // 3) Obligation & follow-up
  const obligation_detected = OBLIGATION_PATTERNS.some((p) => p.test(text));
  let follow_up_date = null;
  const followMatch = FOLLOW_UP_TIME_PATTERNS.find((p) => p.test(text));
  if (followMatch) {
    follow_up_date = followMatch.source.replace(/\\b/gi, "");
  }

  // 4) Emotion / stress heuristic
  let emotion = "Neutral";
  const hasStress = STRESS_KEYWORDS.some((p) => p.test(text));
  const hasUrgency = URGENCY_KEYWORDS.some((p) => p.test(text));
  const hasInterruptions = INTERRUPTION_PHRASES.some((p) => p.test(text));
  if (hasStress || (hasUrgency && hasInterruptions)) {
    emotion = "Stressed";
  } else if (!hasStress && !hasUrgency && !hasInterruptions) {
    emotion = "Calm";
  }

  // 5) Regulatory phrases: present / missing
  const present = [];
  const missing = [];
  for (const item of REGULATORY_REQUIRED) {
    if (item.pattern.test(text)) present.push(item.label);
    else missing.push(item.label);
  }

  return {
    intents,
    entities: {
      amounts,
      dates,
      rates,
      tenures,
      products,
    },
    obligation_detected,
    follow_up_date,
    emotion,
    regulatory_phrases: {
      present,
      missing,
    },
  };
}

