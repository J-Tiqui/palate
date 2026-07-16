import { z } from 'zod'

const today = () => new Date().toISOString().slice(0, 10)

const optionalTrimmed = (max: number) => z.string().trim().max(max).optional().default('')
const csvArray = (maxItems: number, itemMax = 80) => z.string()
  .max(maxItems * (itemMax + 1))
  .transform((value) => [...new Set(
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, maxItems),
  )])
  .pipe(z.array(z.string().min(1).max(itemMax)).max(maxItems))

export const emailSchema = z.string().trim().toLowerCase().email().max(254)

export const passwordSchema = z.string()
  .min(12, 'Use at least 12 characters.')
  .max(72, 'Use 72 characters or fewer.')
  .regex(/[a-z]/, 'Add a lowercase letter.')
  .regex(/[A-Z]/, 'Add an uppercase letter.')
  .regex(/[0-9]/, 'Add a number.')

export const usernameSchema = z.string()
  .trim()
  .toLowerCase()
  .min(3, 'Use at least 3 characters.')
  .max(30, 'Use 30 characters or fewer.')
  .regex(/^[a-z0-9](?:[a-z0-9_]{1,28}[a-z0-9])?$/, 'Use lowercase letters, numbers, and underscores; start and end with a letter or number.')
  .refine(
    (value) => !new Set([
      'admin', 'api', 'auth', 'blend', 'discover', 'help', 'lists', 'login',
      'moderator', 'onboarding', 'palate', 'profile', 'restaurants', 'saved',
      'settings', 'signup', 'staff', 'support', 'system', 'www',
    ]).has(value),
    'That username is reserved.',
  )

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(72),
  next: z.string().max(512).optional(),
  captchaToken: z.string().max(4096).optional(),
})

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  terms: z.literal('on', { error: 'Accept the terms to continue.' }),
  captchaToken: z.string().max(4096).optional(),
}).superRefine((values, context) => {
  if (values.password !== values.confirmPassword) {
    context.addIssue({
      code: 'custom',
      path: ['confirmPassword'],
      message: 'Passwords do not match.',
    })
  }
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
  captchaToken: z.string().max(4096).optional(),
})

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).superRefine((values, context) => {
  if (values.password !== values.confirmPassword) {
    context.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'Passwords do not match.' })
  }
})

export const oauthProviderSchema = z.enum(['google', 'apple'])

export const onboardingSchema = z.object({
  username: usernameSchema,
  displayName: z.string().trim().min(1).max(80),
  homeCity: z.string().trim().min(1).max(120),
  favouriteCuisines: csvArray(25),
  preferredVibes: csvArray(25),
  dietaryRestrictions: csvArray(30),
  allergies: csvArray(30),
  priceMin: z.coerce.number().int().min(1).max(4),
  priceMax: z.coerce.number().int().min(1).max(4),
}).refine((values) => values.priceMin <= values.priceMax, {
  message: 'Minimum price cannot be higher than maximum price.',
  path: ['priceMax'],
})

export const profileUpdateSchema = z.object({
  username: usernameSchema,
  displayName: z.string().trim().min(1).max(80),
  bio: optionalTrimmed(500),
  homeCity: z.string().trim().max(120).optional().default(''),
  preferredNeighbourhoods: csvArray(25),
  favouriteCuisines: csvArray(25),
  dislikedCuisines: csvArray(25),
  preferredVibes: csvArray(25),
  pricePreference: csvArray(4, 1).transform((values) => values.map(Number)).pipe(
    z.array(z.number().int().min(1).max(4)).max(4),
  ),
  privacy: z.enum(['public', 'followers', 'private']),
})

export const uuidSchema = z.string().uuid()
export const restaurantIdSchema = uuidSchema
export const slugSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160)

export const reviewSchema = z.object({
  restaurantId: restaurantIdSchema,
  restaurantSlug: slugSchema,
  rating: z.coerce.number().min(0.5).max(5).refine((value) => Number.isInteger(value * 2), 'Use half-star increments.'),
  reviewText: optionalTrimmed(5000),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => !Number.isNaN(Date.parse(value)), 'Enter a valid date.').refine((value) => value <= today(), 'Visit date cannot be in the future.'),
  tags: csvArray(12, 50),
  wouldReturn: z.enum(['yes', 'no', 'unsure']),
})

export const savedRestaurantSchema = z.object({
  restaurantId: restaurantIdSchema,
  restaurantSlug: slugSchema,
  returnTo: z.string().max(512).optional(),
})

export const listSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: optionalTrimmed(2000),
  visibility: z.enum(['public', 'followers', 'private']),
  collaboratorsCanEdit: z.boolean().optional().default(false),
})

export const listItemSchema = z.object({
  listId: uuidSchema,
  restaurantId: restaurantIdSchema,
  notes: optionalTrimmed(1000),
  position: z.coerce.number().int().min(0).max(10000).default(0),
})

export const goalSchema = z.object({
  title: z.string().trim().min(1).max(140),
  description: optionalTrimmed(2000),
  kind: z.enum(['personal', 'challenge']),
  metric: z.string().trim().toLowerCase().regex(/^[a-z][a-z0-9_]{1,49}$/),
  targetCount: z.coerce.number().int().min(1).max(100000),
  startsOn: z.string().date().optional().or(z.literal('')),
  endsOn: z.string().date().optional().or(z.literal('')),
  visibility: z.enum(['public', 'followers', 'private']),
})

export const blendSessionSchema = z.object({
  title: z.string().trim().min(1).max(120),
  dietaryRestrictions: csvArray(30),
  allergies: csvArray(30),
  priceMax: z.coerce.number().int().min(1).max(4),
  maxDistanceKm: z.coerce.number().min(0.1).max(500),
})

export const blendParticipantSchema = z.object({
  sessionId: uuidSchema,
  userId: uuidSchema,
})

export const searchQuerySchema = z.string().trim().max(80).catch('')

export function firstValidationMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Check the form and try again.'
}
