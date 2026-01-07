// Extract coordinates from various Google Maps link formats
export async function extractCoordinatesFromGoogleMaps(googleMapsLink) {
  if (!googleMapsLink) {
    return null;
  }

  try {
    let url = googleMapsLink;

    // If it's a shortened link (maps.app.goo.gl), expand it first
    if (googleMapsLink.includes('maps.app.goo.gl') || googleMapsLink.includes('goo.gl')) {
      try {
        const response = await fetch(googleMapsLink, {
          method: 'HEAD',
          redirect: 'follow',
        });
        url = response.url;
      } catch (error) {
        console.log('Failed to expand shortened URL, trying to parse as-is');
      }
    }

    // Pattern 1: @latitude,longitude format
    // Example: https://www.google.com/maps/@17.385044,78.486671,15z
    const atPattern = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const atMatch = url.match(atPattern);
    if (atMatch) {
      const lat = parseFloat(atMatch[1]);
      const lng = parseFloat(atMatch[2]);
      return [lng, lat]; // [longitude, latitude]
    }

    // Pattern 2: !3d and !4d format (from place URLs)
    // Example: !3d17.385044!4d78.486671
    const placePattern = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/;
    const placeMatch = url.match(placePattern);
    if (placeMatch) {
      const lat = parseFloat(placeMatch[1]);
      const lng = parseFloat(placeMatch[2]);
      return [lng, lat]; // [longitude, latitude]
    }

    // Pattern 3: ll= query parameter
    // Example: ?ll=17.385044,78.486671
    const llPattern = /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const llMatch = url.match(llPattern);
    if (llMatch) {
      const lat = parseFloat(llMatch[1]);
      const lng = parseFloat(llMatch[2]);
      return [lng, lat]; // [longitude, latitude]
    }

    // Pattern 4: q= query parameter (search queries)
    // Example: ?q=17.385044,78.486671
    const qPattern = /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const qMatch = url.match(qPattern);
    if (qMatch) {
      const lat = parseFloat(qMatch[1]);
      const lng = parseFloat(qMatch[2]);
      return [lng, lat]; // [longitude, latitude]
    }

    console.log('Could not extract coordinates from URL:', url);
    return null;
  } catch (error) {
    console.error('Error extracting coordinates:', error);
    return null;
  }
}

// Test if a Google Maps link is valid
export function isValidGoogleMapsLink(url) {
  if (!url) return false;
  
  const validDomains = [
    'maps.google.com',
    'www.google.com/maps',
    'maps.app.goo.gl',
    'goo.gl/maps',
  ];
  
  return validDomains.some(domain => url.includes(domain));
}
