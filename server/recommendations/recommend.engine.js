/**
 * EventConnect Hybrid Recommendation Engine
 * Blends explicit onboarding preferences with implicit behavioral signals (views, registrations, ratings)
 * using recency decay: weight = 1 / (1 + daysAgo / 30).
 */

const CATEGORIES = [
  'Music & Concerts',
  'Technology & Workshops',
  'Sports & Fitness',
  'Food & Drink',
  'Arts & Culture',
  'Business & Networking',
  'Comedy & Entertainment',
  'Education & Learning',
  'Community & Charity',
  'Festivals & Celebrations'
];

/**
 * Calculate recency decay factor: 1 / (1 + daysAgo / 30)
 */
const calculateRecencyFactor = (dateString) => {
  if (!dateString) return 0.5;
  const interactionDate = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - interactionDate);
  const daysAgo = diffTime / (1000 * 60 * 60 * 24);
  return 1 / (1 + daysAgo / 30);
};

/**
 * Build hybrid user feature vector blending explicit & implicit signals
 */
const buildUserVector = (userPrefs, interactions = [], registrations = [], reviews = []) => {
  const vec = [];
  const selectedCategories = new Set(userPrefs?.categories || []);
  const categoryScores = {};

  // Initialize base scores for all categories
  CATEGORIES.forEach(cat => {
    categoryScores[cat] = selectedCategories.has(cat) ? 2.0 : 0.0;
  });

  // 1. Implicit signal: Page Views (+0.5 * recency)
  interactions.forEach(item => {
    if (item.category && categoryScores[item.category] !== undefined) {
      const recency = calculateRecencyFactor(item.created_at);
      categoryScores[item.category] += 0.5 * recency;
    }
  });

  // 2. Implicit signal: Event Registrations (+1.5 * recency)
  registrations.forEach(item => {
    if (item.category && categoryScores[item.category] !== undefined) {
      const recency = calculateRecencyFactor(item.created_at || item.start_time);
      categoryScores[item.category] += 1.5 * recency;
    }
  });

  // 3. Implicit signal: High Ratings (>= 4 stars, +2.0 * recency)
  reviews.forEach(item => {
    if (item.rating >= 4 && item.category && categoryScores[item.category] !== undefined) {
      const recency = calculateRecencyFactor(item.created_at);
      categoryScores[item.category] += 2.0 * recency;
    }
  });

  // Push category dimensions
  CATEGORIES.forEach(cat => {
    vec.push(categoryScores[cat]);
  });

  // Budget preference dimensions
  const budget = userPrefs?.budget_pref || 'any';
  vec.push(budget === 'free' ? 1.5 : 0.2);
  vec.push(budget === 'under_500' ? 1.2 : 0.2);
  vec.push(budget === 'under_2000' ? 1.0 : 0.2);
  vec.push(budget === 'any' ? 1.0 : 0.5);

  // Time preference dimensions
  const time = userPrefs?.time_pref || 'anytime';
  vec.push(time === 'weekdays' ? 1.5 : 0.3);
  vec.push(time === 'weekends' ? 1.5 : 0.3);
  vec.push(time === 'evenings' ? 1.5 : 0.3);
  vec.push(time === 'anytime' ? 1.0 : 0.5);

  return { vector: vec, categoryScores };
};

/**
 * Convert event object to feature vector
 */
const buildEventVector = (event) => {
  const vec = [];

  CATEGORIES.forEach(cat => {
    vec.push(event.category === cat ? 1.0 : 0.0);
  });

  const price = Number(event.price) || 0;
  vec.push(price === 0 ? 1.0 : 0.0);
  vec.push(price > 0 && price <= 500 ? 1.0 : 0.0);
  vec.push(price > 500 && price <= 2000 ? 1.0 : 0.0);
  vec.push(price > 2000 ? 1.0 : 0.5);

  const date = new Date(event.start_time);
  const day = date.getDay();
  const isWeekend = (day === 0 || day === 6);
  const hour = date.getHours();
  const isEvening = (hour >= 17 && hour <= 22);

  vec.push(!isWeekend ? 1.0 : 0.0);
  vec.push(isWeekend ? 1.0 : 0.0);
  vec.push(isEvening ? 1.0 : 0.0);
  vec.push(1.0);

  return vec;
};

/**
 * Calculate Cosine Similarity
 */
const cosineSimilarity = (vecA, vecB) => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Generate hybrid explanation rationale sentence
 */
const generateRationale = (event, userPrefs, hasBehaviorSignal) => {
  const userCats = new Set(userPrefs?.categories || []);

  if (hasBehaviorSignal) {
    return `Recommended because you've registered for or interacted with similar ${event.category} events`;
  }

  if (userCats.has(event.category)) {
    return `Recommended because it matches your selected interest in ${event.category}`;
  }

  if (event.price === 0 && userPrefs?.budget_pref === 'free') {
    return `Recommended because it's a free event matching your budget preference`;
  }

  return `Recommended based on popular demand in ${event.category}`;
};

/**
 * Rank events using hybrid model
 */
const rankEventsForUser = (events, userPrefs, interactions = [], registrations = [], reviews = []) => {
  const { vector: userVec, categoryScores } = buildUserVector(userPrefs, interactions, registrations, reviews);

  const scoredEvents = events.map(event => {
    const eventVec = buildEventVector(event);
    const score = cosineSimilarity(userVec, eventVec);

    // Check if score for this category has behavioral boost (> 2.0 or > 0 when not explicitly selected)
    const catScore = categoryScores[event.category] || 0;
    const isExplicit = (userPrefs?.categories || []).includes(event.category);
    const hasBehaviorSignal = catScore > (isExplicit ? 2.0 : 0.0);

    const rationale = generateRationale(event, userPrefs, hasBehaviorSignal);

    return {
      ...event,
      matchScore: Math.min(99, Math.round(score * 100)),
      recommendationRationale: rationale
    };
  });

  return scoredEvents.sort((a, b) => b.matchScore - a.matchScore);
};

module.exports = {
  CATEGORIES,
  buildUserVector,
  buildEventVector,
  cosineSimilarity,
  generateRationale,
  rankEventsForUser
};
