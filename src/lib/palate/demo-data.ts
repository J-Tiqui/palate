export type PalateRestaurant = {
  id: string
  slug: string
  name: string
  cuisine: string
  neighbourhood: string
  address: string
  price: string
  rating: number
  image: string
  image2: string
  vibe: string[]
  dietary: string[]
  description: string
  reason: string
  recognition?: string
  distance: string
  friends: string[]
  source: 'database' | 'seeded' | 'google'
  detailsHref?: string
  ratingSource?: 'Palate' | 'Google' | 'Sample'
  photoAttribution?: string | null
  latitude?: number
  longitude?: number
}

export const DEMO_NOTICE =
  'Sample content for interface preview. Restaurant details and guide designations must be verified before production use.'

export const images = {
  dining: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=85',
  warm: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85',
  plate: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=85',
  japanese: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1200&q=85',
  italian: 'https://images.unsplash.com/photo-1579684947550-22e945225d9a?auto=format&fit=crop&w=1200&q=85',
  thai: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=1200&q=85',
  grill: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=85',
  room: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=85',
} as const

export const demoRestaurants: PalateRestaurant[] = [
  {
    id: 'demo-alo',
    slug: 'alo',
    name: 'Alo',
    cuisine: 'Contemporary French',
    neighbourhood: 'Queen West',
    address: '163 Spadina Ave.',
    price: '$$$$',
    rating: 4.8,
    image: images.dining,
    image2: images.plate,
    vibe: ['Anniversary', 'Tasting menu', 'Intimate'],
    dietary: ['Vegetarian on request', 'Allergy-aware'],
    description: 'A poised tasting-menu experience above Spadina, balancing precise technique with warm, unhurried service.',
    reason: 'Your polished date-night preference and saved tasting menus',
    recognition: 'Michelin 1 Star · sample',
    distance: '2.4 km',
    friends: ['Maya', 'Priya'],
    source: 'seeded',
    latitude: 43.6486,
    longitude: -79.396,
  },
  {
    id: 'demo-miku-toronto',
    slug: 'miku-toronto',
    name: 'Miku Toronto',
    cuisine: 'Japanese',
    neighbourhood: 'Harbourfront',
    address: '10 Bay St.',
    price: '$$$',
    rating: 4.6,
    image: images.japanese,
    image2: images.room,
    vibe: ['Waterfront', 'Polished', 'Group-friendly'],
    dietary: ['Gluten-aware', 'Pescatarian'],
    description: 'Aburi sushi, sweeping harbour views, and a dining room that works equally well for a celebration or a smart weeknight dinner.',
    reason: 'You rate Japanese highly and Maya saved it last week',
    recognition: 'Palate community pick',
    distance: '3.1 km',
    friends: ['Maya', 'Ethan'],
    source: 'seeded',
    latitude: 43.6411,
    longitude: -79.3774,
  },
  {
    id: 'demo-pai',
    slug: 'pai',
    name: 'PAI',
    cuisine: 'Northern Thai',
    neighbourhood: 'Entertainment District',
    address: '18 Duncan St.',
    price: '$$',
    rating: 4.5,
    image: images.thai,
    image2: images.warm,
    vibe: ['Lively', 'Casual', 'Groups'],
    dietary: ['Vegetarian options', 'Spice adjustable'],
    description: 'A high-energy downtown favourite for northern Thai classics, generous portions, and a room that always feels in motion.',
    reason: 'Matches your spice tolerance and casual group dinners',
    recognition: 'Michelin Selected · sample',
    distance: '1.8 km',
    friends: ['Ethan', 'Priya'],
    source: 'seeded',
    latitude: 43.6478,
    longitude: -79.3887,
  },
  {
    id: 'demo-sunnys-chinese',
    slug: 'sunnys-chinese',
    name: 'Sunny’s Chinese',
    cuisine: 'Regional Chinese',
    neighbourhood: 'Kensington Market',
    address: '60 Kensington Ave.',
    price: '$$$',
    rating: 4.4,
    image: images.grill,
    image2: images.dining,
    vibe: ['Buzzy', 'Share plates', 'Hidden'],
    dietary: ['Vegetarian options'],
    description: 'A playful, low-lit room for regional Chinese dishes, smoky wok flavours, and a table full of things to pass around.',
    reason: 'A hidden-gem fit with strong overlap across your friend group',
    recognition: 'Michelin Bib Gourmand · sample',
    distance: '2.7 km',
    friends: ['Priya'],
    source: 'seeded',
    latitude: 43.6547,
    longitude: -79.4004,
  },
  {
    id: 'demo-giulietta',
    slug: 'giulietta',
    name: 'Giulietta',
    cuisine: 'Italian',
    neighbourhood: 'Little Italy',
    address: '972 College St.',
    price: '$$$',
    rating: 4.7,
    image: images.italian,
    image2: images.warm,
    vibe: ['Date night', 'Warm', 'Neighbourhood'],
    dietary: ['Vegetarian options'],
    description: 'Confident Italian cooking in a handsome room, with excellent pasta, wood-fired dishes, and a neighbourhood pace.',
    reason: 'Fits your Italian favourites and premium-casual profile',
    recognition: 'Michelin Selected · sample',
    distance: '4.0 km',
    friends: ['Maya', 'Ethan'],
    source: 'seeded',
    latitude: 43.6552,
    longitude: -79.4149,
  },
  {
    id: 'demo-quetzal',
    slug: 'quetzal',
    name: 'Quetzal',
    cuisine: 'Mexican',
    neighbourhood: 'Little Italy',
    address: '419 College St.',
    price: '$$$$',
    rating: 4.7,
    image: images.grill,
    image2: images.plate,
    vibe: ['Open fire', 'Celebration', 'Dramatic'],
    dietary: ['Gluten-aware', 'Allergy-aware'],
    description: 'Wood-fire cooking gives the room its pulse, with expressive Mexican flavours and a counter made for special nights.',
    reason: 'Goal match: try three unfamiliar cuisines',
    recognition: 'Michelin 1 Star · sample',
    distance: '3.5 km',
    friends: ['Priya', 'Maya'],
    source: 'seeded',
    latitude: 43.6565,
    longitude: -79.4063,
  },
  {
    id: 'demo-khao-san-road',
    slug: 'khao-san-road',
    name: 'Khao San Road',
    cuisine: 'Thai',
    neighbourhood: 'King West',
    address: '11 Charlotte St.',
    price: '$$',
    rating: 4.3,
    image: images.thai,
    image2: images.room,
    vibe: ['Energetic', 'Casual', 'Friends'],
    dietary: ['Vegetarian options', 'Vegan options'],
    description: 'A downtown standby for bright curries, noodles, and a flexible menu that handles mixed groups well.',
    reason: 'Close by, within budget, and ideal for your usual group size',
    distance: '1.5 km',
    friends: ['Ethan'],
    source: 'seeded',
    latitude: 43.6467,
    longitude: -79.393,
  },
  {
    id: 'demo-enoteca-sociale',
    slug: 'enoteca-sociale',
    name: 'Enoteca Sociale',
    cuisine: 'Roman Italian',
    neighbourhood: 'Dundas West',
    address: '1288 Dundas St. W.',
    price: '$$$',
    rating: 4.6,
    image: images.italian,
    image2: images.dining,
    vibe: ['Cosy', 'Wine-forward', 'Neighbourhood'],
    dietary: ['Vegetarian options'],
    description: 'A compact Roman-inspired dining room where excellent pasta, thoughtful wine, and easy hospitality do the heavy lifting.',
    reason: 'Your favourite cuisine in a neighbourhood you want to explore',
    recognition: 'Michelin Bib Gourmand · sample',
    distance: '4.8 km',
    friends: ['Maya'],
    source: 'seeded',
    latitude: 43.6495,
    longitude: -79.4248,
  },
]

export const demoFriends = [
  { name: 'Maya Chen', initials: 'MC', tone: 'wine', compatibility: 92, taste: 'Japanese · Italian' },
  { name: 'Ethan Brooks', initials: 'EB', tone: 'olive', compatibility: 86, taste: 'Thai · Comfort food' },
  { name: 'Priya Shah', initials: 'PS', tone: 'amber', compatibility: 89, taste: 'Mexican · Vegetarian' },
  { name: 'Noah Williams', initials: 'NW', tone: 'slate', compatibility: 74, taste: 'French · Seafood' },
] as const

export const demoActivity = [
  { person: 'Maya Chen', initials: 'MC', action: 'reviewed', restaurant: 'Giulietta', slug: 'giulietta', time: '34 min', text: 'Exactly the sort of place where one pasta becomes three. The cacio e pepe was the table favourite.', rating: 4.8, image: images.italian },
  { person: 'Priya Shah', initials: 'PS', action: 'completed 3 of 5 in', restaurant: 'New Cuisines', slug: 'quetzal', time: '2 h', text: 'Added Mexican regional cooking to her 2026 goal.', image: images.grill },
  { person: 'Ethan Brooks', initials: 'EB', action: 'saved', restaurant: 'PAI', slug: 'pai', time: 'Yesterday', text: 'Added to Group Dinner Spots.', image: images.thai },
  { person: 'Maya Chen', initials: 'MC', action: 'joined your Blend for', restaurant: 'Friday dinner', slug: 'giulietta', time: 'Yesterday', text: 'Your group now has a 94% top match.', image: images.dining },
] as const

export const demoLists = [
  { title: 'Want to Try', count: 18, privacy: 'Private', images: [images.japanese, images.grill, images.italian] },
  { title: 'Best Sushi in Toronto', count: 9, privacy: 'Shared', images: [images.japanese, images.plate, images.dining] },
  { title: 'Date Night', count: 12, privacy: 'Shared', images: [images.italian, images.warm, images.dining] },
  { title: 'Hidden Gems', count: 7, privacy: 'Public', images: [images.grill, images.room, images.thai] },
  { title: 'Group Dinner Spots', count: 14, privacy: 'Shared', images: [images.thai, images.dining, images.room] },
  { title: 'Cheap Eats', count: 21, privacy: 'Public', images: [images.thai, images.plate, images.grill] },
  { title: 'Premium Casual', count: 10, privacy: 'Private', images: [images.italian, images.japanese, images.warm] },
] as const

export const demoGoals = [
  { title: 'Visit five sushi restaurants', progress: 3, total: 5, next: 'Miku Toronto', nextSlug: 'miku-toronto', badge: 'Sushi Circuit' },
  { title: 'Try ten restaurants in 2026', progress: 7, total: 10, next: 'Giulietta', nextSlug: 'giulietta', badge: 'City Sampler' },
  { title: 'Try three new cuisines', progress: 2, total: 3, next: 'Quetzal', nextSlug: 'quetzal', badge: 'Open Palate' },
  { title: 'Complete a west-end food crawl', progress: 4, total: 6, next: 'Enoteca Sociale', nextSlug: 'enoteca-sociale', badge: 'Neighbourhood Regular' },
  { title: 'Review twenty restaurants', progress: 12, total: 20, next: 'PAI', nextSlug: 'pai', badge: 'Table Critic' },
  { title: 'Visit Michelin-recognised Toronto', progress: 7, total: 15, next: 'Alo', nextSlug: 'alo', badge: 'Guide Chaser' },
] as const

export function getDemoRestaurant(slug: string): PalateRestaurant | undefined {
  return demoRestaurants.find((restaurant) => restaurant.slug === slug)
}
