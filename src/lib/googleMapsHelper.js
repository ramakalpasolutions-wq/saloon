/**
 * Extract latitude and longitude from various Google Maps link formats
 */
export function extractCoordinatesFromGoogleMapsLink(url) {
  if (!url) return null;

  try {
    // Format 1: ?q=lat,lng
    const qMatch = url.match(/[?&]q=([-+]?[0-9]*\.?[0-9]+),([-+]?[0-9]*\.?[0-9]+)/);
    if (qMatch) {
      return {
        latitude: parseFloat(qMatch[1]),
        longitude: parseFloat(qMatch[2]),
      };
    }

    // Format 2 & 3: /@lat,lng or /place/@lat,lng
    const atMatch = url.match(/@([-+]?[0-9]*\.?[0-9]+),([-+]?[0-9]*\.?[0-9]+)/);
    if (atMatch) {
      return {
        latitude: parseFloat(atMatch[1]),
        longitude: parseFloat(atMatch[2]),
      };
    }

    // Format: /place/name/@lat,lng
    const placeMatch = url.match(/\/place\/[^/]+\/@([-+]?[0-9]*\.?[0-9]+),([-+]?[0-9]*\.?[0-9]+)/);
    if (placeMatch) {
      return {
        latitude: parseFloat(placeMatch[1]),
        longitude: parseFloat(placeMatch[2]),
      };
    }

    // Format: ll=lat,lng
    const llMatch = url.match(/[?&]ll=([-+]?[0-9]*\.?[0-9]+),([-+]?[0-9]*\.?[0-9]+)/);
    if (llMatch) {
      return {
        latitude: parseFloat(llMatch[1]),
        longitude: parseFloat(llMatch[2]),
      };
    }

    return null;
  } catch (error) {
    console.error('Error extracting coordinates:', error);
    return null;
  }
}

/**
 * Generate Google Maps link from coordinates
 */
export function generateGoogleMapsLink(latitude, longitude) {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

/**
 * Validate if string is a valid Google Maps link
 */
export function isValidGoogleMapsLink(url) {
  if (!url) return false;
  
  const googleMapsPatterns = [
    /maps\.google\.com/,
    /google\.com\/maps/,
    /goo\.gl\/maps/,
    /maps\.app\.goo\.gl/,
  ];
  
  return googleMapsPatterns.some(pattern => pattern.test(url));
}
