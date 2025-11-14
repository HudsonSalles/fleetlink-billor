import { Address, Coordinate } from '../types/entities';

/**
 * Geocoding service for converting addresses to coordinates using Mapbox API
 */
export class GeocodingService {
  private static readonly MAPBOX_ACCESS_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
  private static readonly GEOCODING_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

  /**
   * Convert an address to coordinates
   */
  static async addressToCoordinates(address: Address): Promise<Coordinate | null> {
    if (!this.MAPBOX_ACCESS_TOKEN) {
      console.error('Mapbox access token not configured');
      return null;
    }
    // Guard against accidentally using a secret token in the browser
    if (this.MAPBOX_ACCESS_TOKEN.startsWith('sk.')) {
      console.error('Invalid Mapbox token for browser use. Use a public token starting with "pk."');
      return null;
    }

    try {
      // Format the address for Brazilian geocoding
      const addressString = `${address.street}, ${address.city}, ${address.state}, ${address.zipCode}, Brazil`;
      
      const url = new URL(`${this.GEOCODING_URL}/${encodeURIComponent(addressString)}.json`);
      url.searchParams.set('access_token', this.MAPBOX_ACCESS_TOKEN);
      url.searchParams.set('country', 'br'); // Restrict to Brazil
      url.searchParams.set('limit', '1');
      url.searchParams.set('language', 'pt'); // Portuguese language

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error('Geocoding failed: Unauthorized (invalid Mapbox token).');
          return null;
        }
        if (response.status === 403) {
          console.error('Geocoding failed: Forbidden (token restricted for this URL).');
          return null;
        }
        throw new Error(`Geocoding failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [lng, lat] = feature.center;
        
        return { lat, lng };
      }

      console.warn('No coordinates found for address:', addressString);
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Convert coordinates to address (reverse geocoding)
   */
  static async coordinatesToAddress(coordinates: Coordinate): Promise<Partial<Address> | null> {
    if (!this.MAPBOX_ACCESS_TOKEN) {
      console.error('Mapbox access token not configured');
      return null;
    }
    if (this.MAPBOX_ACCESS_TOKEN.startsWith('sk.')) {
      console.error('Invalid Mapbox token for browser use. Use a public token starting with "pk."');
      return null;
    }

    try {
      const url = new URL(`${this.GEOCODING_URL}/${coordinates.lng},${coordinates.lat}.json`);
      url.searchParams.set('access_token', this.MAPBOX_ACCESS_TOKEN);
      url.searchParams.set('country', 'br');
      url.searchParams.set('language', 'pt');

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error('Reverse geocoding failed: Unauthorized (invalid Mapbox token).');
          return null;
        }
        if (response.status === 403) {
          console.error('Reverse geocoding failed: Forbidden (token restricted for this URL).');
          return null;
        }
        throw new Error(`Reverse geocoding failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const context = feature.context || [];
        
        // Parse Brazilian address components
        const addressNumber = feature.address || '';
        const streetName = feature.text || '';
        const street = `${streetName}${addressNumber ? `, ${addressNumber}` : ''}`;
        
        // const district = context.find((c: any) => c.id.includes('district'))?.text || '';
        const city = context.find((c: any) => c.id.includes('place'))?.text || '';
        const state = context.find((c: any) => c.id.includes('region'))?.short_code?.replace('BR-', '') || '';
        const zipCode = context.find((c: any) => c.id.includes('postcode'))?.text || '';

        return {
          street,
          city,
          state,
          zipCode,
          coordinates
        };
      }

      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }

  /**
   * Batch geocode multiple addresses
   */
  static async batchGeocode(addresses: Address[]): Promise<Array<{ address: Address; coordinates: Coordinate | null }>> {
    const results = await Promise.allSettled(
      addresses.map(async (address) => ({
        address,
        coordinates: await this.addressToCoordinates(address)
      }))
    );

    return results
      .filter((result): result is PromiseFulfilledResult<{ address: Address; coordinates: Coordinate | null }> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);
  }

  /**
   * Validate if coordinates are within Brazil boundaries
   */
  static isWithinBrazil(coordinates: Coordinate): boolean {
    const { lat, lng } = coordinates;
    
    // Brazil approximate boundaries
    const brazilBounds = {
      north: 5.27438888,
      south: -33.75118944,
      east: -28.63525,
      west: -73.98283055
    };

    return lat >= brazilBounds.south && 
           lat <= brazilBounds.north && 
           lng >= brazilBounds.west && 
           lng <= brazilBounds.east;
  }
}