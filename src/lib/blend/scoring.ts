export type BlendMemberPreferences = {
  memberId: string
  dietaryRestrictions: string[]
  allergies: string[]
  cuisineWeights: Record<string, number>
  vibeWeights: Record<string, number>
  priceMax: number
  maxDistanceKm: number
}

export type BlendCandidate = {
  restaurantId: string
  name: string
  cuisines: string[]
  vibes: string[]
  supportedDiets: string[]
  allergens: string[]
  priceLevel: number
  distanceKm: number
  palateRating: number
}

export type BlendCandidateScore = {
  restaurantId: string
  eligible: boolean
  score: number
  memberScores: Record<string, number>
  reasons: string[]
  rejectedBy: string[]
}

const normalize = (value: string) => value.trim().toLowerCase()
const normalizedSet = (values: string[]) => new Set(values.map(normalize).filter(Boolean))
const clamp = (value: number, min = 0, max = 100) => Math.min(Math.max(value, min), max)
const round = (value: number) => Math.round(value * 1000) / 1000

function tagPreferenceScore(tags: string[], weights: Record<string, number>): number {
  const normalizedTags = normalizedSet(tags)
  const entries = Object.entries(weights)
    .map(([key, value]) => [normalize(key), clamp(value, -1, 1)] as const)
    .filter(([key]) => key.length > 0)

  if (!entries.length) return 50
  const positive = entries.filter(([, weight]) => weight > 0)
  const disliked = entries.filter(([, weight]) => weight < 0)
  const positiveTotal = positive.reduce((sum, [, weight]) => sum + weight, 0)
  const matchedPositive = positive.reduce(
    (sum, [tag, weight]) => sum + (normalizedTags.has(tag) ? weight : 0),
    0,
  )
  const dislikePenalty = disliked.reduce(
    (sum, [tag, weight]) => sum + (normalizedTags.has(tag) ? Math.abs(weight) : 0),
    0,
  )

  const affinity = positiveTotal > 0 ? matchedPositive / positiveTotal : 0.5
  return clamp(35 + affinity * 65 - dislikePenalty * 60)
}

function hardConstraintFailures(
  candidate: BlendCandidate,
  members: BlendMemberPreferences[],
): string[] {
  const supportedDiets = normalizedSet(candidate.supportedDiets)
  const allergens = normalizedSet(candidate.allergens)
  const failures: string[] = []

  for (const member of members) {
    const missingDiet = member.dietaryRestrictions
      .map(normalize)
      .filter(Boolean)
      .find((restriction) => !supportedDiets.has(restriction))
    if (missingDiet) failures.push(`${member.memberId}:diet:${missingDiet}`)

    const allergy = member.allergies
      .map(normalize)
      .filter(Boolean)
      .find((item) => allergens.has(item))
    if (allergy) failures.push(`${member.memberId}:allergy:${allergy}`)
  }

  return failures
}

function scoreForMember(candidate: BlendCandidate, member: BlendMemberPreferences): number {
  const cuisine = tagPreferenceScore(candidate.cuisines, member.cuisineWeights)
  const vibe = tagPreferenceScore(candidate.vibes, member.vibeWeights)
  const price = candidate.priceLevel <= member.priceMax
    ? 100 - Math.max(0, member.priceMax - candidate.priceLevel) * 8
    : Math.max(0, 40 - (candidate.priceLevel - member.priceMax) * 25)
  const distance = member.maxDistanceKm <= 0
    ? 0
    : clamp(100 - (candidate.distanceKm / member.maxDistanceKm) * 70)
  const rating = clamp((candidate.palateRating / 5) * 100)

  return round(cuisine * 0.34 + vibe * 0.22 + price * 0.17 + distance * 0.17 + rating * 0.1)
}

export function scoreBlendCandidate(
  candidate: BlendCandidate,
  members: BlendMemberPreferences[],
): BlendCandidateScore {
  if (!members.length) {
    return {
      restaurantId: candidate.restaurantId,
      eligible: false,
      score: 0,
      memberScores: {},
      reasons: [],
      rejectedBy: ['no-members'],
    }
  }

  const rejectedBy = hardConstraintFailures(candidate, members)
  if (rejectedBy.length) {
    return {
      restaurantId: candidate.restaurantId,
      eligible: false,
      score: 0,
      memberScores: {},
      reasons: ['Removed because it does not satisfy every dietary and allergy constraint.'],
      rejectedBy,
    }
  }

  const memberScores = Object.fromEntries(
    members.map((member) => [member.memberId, scoreForMember(candidate, member)]),
  )
  const scores = Object.values(memberScores)
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length
  const minimum = Math.min(...scores)
  const variance = scores.reduce((sum, score) => sum + (score - average) ** 2, 0) / scores.length
  const fairnessPenalty = Math.min(20, Math.sqrt(variance) * 0.45)
  const balancedScore = round(average * 0.7 + minimum * 0.3 - fairnessPenalty)

  const reasons = [
    `Meets all ${members.length} members’ dietary and allergy constraints.`,
    `Lowest individual match is ${round(minimum)}.`,
  ]
  if (candidate.priceLevel <= Math.min(...members.map((member) => member.priceMax))) {
    reasons.push('Fits every member’s price ceiling.')
  }
  if (candidate.distanceKm <= Math.min(...members.map((member) => member.maxDistanceKm))) {
    reasons.push('Fits every member’s distance preference.')
  }

  return {
    restaurantId: candidate.restaurantId,
    eligible: true,
    score: balancedScore,
    memberScores,
    reasons,
    rejectedBy: [],
  }
}

export function rankBlendCandidates(
  candidates: BlendCandidate[],
  members: BlendMemberPreferences[],
): BlendCandidateScore[] {
  return candidates
    .map((candidate) => scoreBlendCandidate(candidate, members))
    .sort((left, right) => {
      if (left.eligible !== right.eligible) return left.eligible ? -1 : 1
      if (left.score !== right.score) return right.score - left.score
      return left.restaurantId.localeCompare(right.restaurantId)
    })
}
