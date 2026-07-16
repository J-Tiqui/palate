export type ProviderPhoto = {
  reference: string
  attribution: string | null
}

export type ProviderOpeningHours = {
  openNow: boolean | null
  weekdayDescriptions: string[]
}

export type ProviderLocation = {
  latitude: number
  longitude: number
}

export type ProviderSearchOptions = {
  location?: ProviderLocation
  radiusMeters?: number
  maxResults?: number
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
  primaryType: string | null
  primaryTypeDisplayName: string | null
  businessStatus: 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY' | 'FUTURE_OPENING' | null
  googleMapsUri: string | null
  websiteUri: string | null
  nationalPhoneNumber: string | null
  openingHours: ProviderOpeningHours | null
  photos: ProviderPhoto[]
  refreshedAt: string
}

export interface RestaurantProvider {
  getPlace(placeId: string): Promise<ProviderRestaurant>
  searchText(query: string, options?: ProviderSearchOptions): Promise<ProviderRestaurant[]>
  searchNearby(location: ProviderLocation, options?: Omit<ProviderSearchOptions, 'location'>): Promise<ProviderRestaurant[]>
  getPhoto(photoReference: string, maxWidth: number): Promise<string>
}

export class RestaurantProviderError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message)
    this.name = 'RestaurantProviderError'
  }
}
