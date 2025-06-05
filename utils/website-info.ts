// utils/website-info.ts

export interface WebsiteInfo {
  domain: string;
  displayName: string;
  logo?: string;
  color?: string;
}

// Common German real estate websites
const KNOWN_SITES: Record<string, Omit<WebsiteInfo, 'domain'>> = {
  'immobilienscout24.de': {
    displayName: 'ImmobilienScout24',
    color: '#FF6200',
    logo: 'https://www.immobilienscout24.de/favicon.ico'
  },
  'immowelt.de': {
    displayName: 'Immowelt',
    color: '#0066CC',
    logo: 'https://www.immowelt.de/favicon.ico'
  },
  'wg-gesucht.de': {
    displayName: 'WG-Gesucht',
    color: '#FF6B35',
    logo: 'https://www.wg-gesucht.de/favicon.ico'
  },
  'studenten-wg.de': {
    displayName: 'Studenten-WG',
    color: '#2E8B57',
    logo: 'https://www.studenten-wg.de/favicon.ico'
  },
  'wohnungsboerse.net': {
    displayName: 'Wohnungsbörse',
    color: '#4169E1',
    logo: 'https://www.wohnungsboerse.net/favicon.ico'
  },
  'zwischenmiete.de': {
    displayName: 'Zwischenmiete',
    color: '#FF4500',
    logo: 'https://www.zwischenmiete.de/favicon.ico'
  },
  'ebay-kleinanzeigen.de': {
    displayName: 'eBay Kleinanzeigen',
    color: '#E53E3E',
    logo: 'https://www.ebay-kleinanzeigen.de/favicon.ico'
  },
  'kleinanzeigen.de': {
    displayName: 'Kleinanzeigen',
    color: '#E53E3E',
    logo: 'https://www.kleinanzeigen.de/favicon.ico'
  },
  'immonet.de': {
    displayName: 'Immonet',
    color: '#0080FF',
    logo: 'https://www.immonet.de/favicon.ico'
  },
  'immoweb.be': {
    displayName: 'Immoweb',
    color: '#FF6B00',
    logo: 'https://www.immoweb.be/favicon.ico'
  }
};

export function extractWebsiteInfo(url: string): WebsiteInfo | null {
  if (!url || !url.trim()) {
    return null;
  }

  try {
    // Handle URLs without protocol
    let processUrl = url.trim();
    if (!processUrl.startsWith('http://') && !processUrl.startsWith('https://')) {
      processUrl = 'https://' + processUrl;
    }

    const urlObj = new URL(processUrl);
    let domain = urlObj.hostname.toLowerCase();
    
    // Remove 'www.' prefix if present
    if (domain.startsWith('www.')) {
      domain = domain.substring(4);
    }

    // Check if we have specific info for this site
    const knownSite = KNOWN_SITES[domain];
    if (knownSite) {
      return {
        domain,
        ...knownSite
      };
    }

    // For unknown sites, create a generic entry
    return {
      domain,
      displayName: domain.charAt(0).toUpperCase() + domain.slice(1),
      color: '#6B7280' // Gray color for unknown sites
    };

  } catch (error) {
    console.error('Error parsing URL:', error);
    return null;
  }
}

export function getWebsiteFavicon(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
}