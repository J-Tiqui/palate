import 'server-only'

export type ProviderPhoto = {
  reference: string
  attribution: string | null
}

export type ProviderRestaurant = {
  provider: 'google_places'
  providerPlaceId: string
  name: string
  formattedAddress: string | null
  city: string | null
  region: string | null
  countryCode: string | null
  neighbourhood: string | null
  latitude: number | null
  longitude: number | null
  priceLevel: number | null
  providerRating: number | null
  providerReviewCount: number | null
  types: string[]
  photos: ProviderPhoto[]
  refreshedAt: string
}

export interface RestaurantProvider {
  getPlace(placeId: string): Promise<ProviderRestaurant>
}

export class RestaurantProviderError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message)
    this.name = 'RestaurantProviderError'
  }
}
