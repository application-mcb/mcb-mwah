// Philippines location data using PSGC GitLab API
export interface Region {
  code: string;
  name: string;
  regionName: string;
}

export interface Province {
  code: string;
  name: string;
  regionCode: string;
  islandGroupCode: string;
  psgc10DigitCode: string;
}

export interface Municipality {
  code: string;
  name: string;
  oldName: string;
  isCapital: boolean;
  isCity: boolean;
  isMunicipality: boolean;
  provinceCode: string;
  districtCode: string | boolean;
  regionCode: string;
  islandGroupCode: string;
  psgc10DigitCode: string;
}

export interface Barangay {
  code: string;
  name: string;
  oldName: string;
  subMunicipalityCode: string | boolean;
  cityCode: string | boolean;
  municipalityCode: string;
  districtCode: string | boolean;
  provinceCode: string;
  regionCode: string;
  islandGroupCode: string;
  psgc10DigitCode: string;
}

// PSGC GitLab API Base URL
const PSGC_API_BASE = 'https://psgc.gitlab.io/api';

// Cache for API responses
const cache = new Map<string, any>();

// No fallback data needed - using real PSGC GitLab API

// Generic API fetch function with caching
async function fetchFromAPI<T>(endpoint: string): Promise<T[]> {
  const cacheKey = endpoint;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  try {
    const response = await fetch(`${PSGC_API_BASE}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`Error fetching from ${endpoint}:`, error);
    return [];
  }
}

// API Functions
export const getRegions = async (): Promise<Region[]> => {
  const data = await fetchFromAPI<Region>('/regions');
  return data.sort((a, b) => a.name.localeCompare(b.name));
};

export const getProvinces = async (): Promise<Province[]> => {
  const data = await fetchFromAPI<Province>('/provinces/');
  return data.sort((a, b) => a.name.localeCompare(b.name));
};

export const getMunicipalities = async (provinceCode: string): Promise<Municipality[]> => {
  const data = await fetchFromAPI<Municipality>(`/provinces/${provinceCode}/cities-municipalities/`);
  return data.sort((a, b) => a.name.localeCompare(b.name));
};

export const getBarangays = async (municipalityCode: string): Promise<Barangay[]> => {
  const data = await fetchFromAPI<Barangay>(`/cities-municipalities/${municipalityCode}/barangays/`);
  return data.sort((a, b) => a.name.localeCompare(b.name));
};

// Helper functions for backward compatibility
export const getProvincesSync = (): Province[] => {
  // This will be populated when the async function is called
  return [];
};

export const getMunicipalitiesByProvince = async (provinceCode: string): Promise<Municipality[]> => {
  return await getMunicipalities(provinceCode);
};

export const getBarangaysByMunicipality = async (municipalityCode: string): Promise<Barangay[]> => {
  return await getBarangays(municipalityCode);
};

export const getZipCodeByBarangay = (barangay: Barangay): string => {
  // PSGC API doesn't provide zip codes directly
  // This would need to be implemented with a separate zip code lookup
  // For now, return empty string - zip codes can be entered manually
  return '';
};
