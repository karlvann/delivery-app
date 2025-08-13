// Lean postcode service - handles corridor CSV operations only
import { getZoneForPostcode } from './zoneService';

let corridorData = {
  brisbane: new Set(),
  melbourne: new Set()
};

// Track loading state
let isLoading = false;
let loadPromise = null;

// Load CSV data
export async function loadCorridors() {
  // Return existing promise if already loading
  if (loadPromise) return loadPromise;
  
  loadPromise = (async () => {
    try {
      isLoading = true;
      console.log('Loading corridor data...');
      
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        console.log('Not in browser environment, skipping corridor load');
        return;
      }
      
      // Load from localStorage first (user edits)
      const savedBrisbane = localStorage.getItem('syd-bris-corridor');
      const savedMelbourne = localStorage.getItem('syd-melb-corridor');
      
      if (savedBrisbane) {
        corridorData.brisbane = new Set(JSON.parse(savedBrisbane));
        console.log('Loaded Brisbane corridor from localStorage:', corridorData.brisbane.size);
      } else {
        // Load from CSV
        const response = await fetch('/sydney-brisbane-corridor.csv');
        const text = await response.text();
        corridorData.brisbane = parseCSV(text);
        console.log('Loaded Brisbane corridor from CSV:', corridorData.brisbane.size);
      }
      
      if (savedMelbourne) {
        corridorData.melbourne = new Set(JSON.parse(savedMelbourne));
        console.log('Loaded Melbourne corridor from localStorage:', corridorData.melbourne.size);
      } else {
        // Load from CSV
        const response = await fetch('/sydney-melbourne-corridor.csv');
        const text = await response.text();
        corridorData.melbourne = parseCSV(text);
        console.log('Loaded Melbourne corridor from CSV:', corridorData.melbourne.size);
      }
      
      isLoading = false;
      console.log('Corridor data loaded successfully');
    } catch (error) {
      console.error('Failed to load corridor data:', error);
      isLoading = false;
    }
  })();
  
  return loadPromise;
}

// Parse CSV to Set of postcodes
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const postcodes = new Set();
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      const postcode = line.split(',')[0].trim();
      if (postcode && /^\d{4}$/.test(postcode)) {
        postcodes.add(postcode);
      }
    }
  }
  
  console.log('Parsed postcodes:', postcodes.size, 'entries');
  return postcodes;
}

// Extract postcode from address
export function extractPostcode(address) {
  const match = address.match(/\b\d{4}\b/);
  return match ? match[0] : null;
}

// Check if postcode is in any corridor
export async function isCorridorPostcode(postcode) {
  if (!postcode) return null;
  
  try {
    // First, try to check database via API
    const [brisbaneResponse, melbourneResponse] = await Promise.all([
      fetch(`/api/corridors?corridor=brisbane`),
      fetch(`/api/corridors?corridor=melbourne`)
    ]);
    
    if (brisbaneResponse.ok && melbourneResponse.ok) {
      const brisbaneData = await brisbaneResponse.json();
      const melbourneData = await melbourneResponse.json();
      
      if (brisbaneData.postcodes) {
        const brisbanePostcodes = brisbaneData.postcodes.map(p => p.postcode);
        if (brisbanePostcodes.includes(postcode)) {
          console.log(`Postcode ${postcode} found in Brisbane corridor (database)`);
          return 'brisbane';
        }
      }
      
      if (melbourneData.postcodes) {
        const melbournePostcodes = melbourneData.postcodes.map(p => p.postcode);
        if (melbournePostcodes.includes(postcode)) {
          console.log(`Postcode ${postcode} found in Melbourne corridor (database)`);
          return 'melbourne';
        }
      }
      
      return null;
    }
  } catch (error) {
    console.log('Database check failed, falling back to localStorage');
  }
  
  // Fallback to localStorage/CSV data
  await loadCorridors();
  
  console.log('Checking postcode:', postcode);
  console.log('Brisbane corridor has:', corridorData.brisbane.size, 'postcodes');
  console.log('Melbourne corridor has:', corridorData.melbourne.size, 'postcodes');
  console.log('Is in Brisbane corridor?', corridorData.brisbane.has(postcode));
  console.log('Is in Melbourne corridor?', corridorData.melbourne.has(postcode));
  
  if (corridorData.brisbane.has(postcode)) return 'brisbane';
  if (corridorData.melbourne.has(postcode)) return 'melbourne';
  return null;
}

// Save corridors to localStorage
export function saveCorridors() {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.setItem('syd-bris-corridor', JSON.stringify([...corridorData.brisbane]));
    localStorage.setItem('syd-melb-corridor', JSON.stringify([...corridorData.melbourne]));
  }
}

// Add/remove postcodes (for management UI)
export function addPostcode(corridor, postcode) {
  corridorData[corridor].add(postcode);
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    saveCorridors();
  }
}

export function removePostcode(corridor, postcode) {
  corridorData[corridor].delete(postcode);
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    saveCorridors();
  }
}

// Get all postcodes for a corridor
export function getCorridorPostcodes(corridor) {
  return [...corridorData[corridor]];
}

// Get zone for a postcode
export async function getPostcodeZone(postcode) {
  if (!postcode) {
    console.log('🔴 getPostcodeZone: No postcode provided');
    return null;
  }
  
  console.log(`🔍 getPostcodeZone: Checking zone for postcode ${postcode}`);
  
  try {
    // First, try to get zone from database
    const response = await fetch(`/api/zones?postcode=${postcode}`);
    if (response.ok) {
      const data = await response.json();
      if (data.zone) {
        console.log(`✅ Zone for ${postcode} from database: ${data.zone.zone}`);
        return data.zone.zone;
      }
    }
  } catch (error) {
    console.log('📦 Database zone check failed, using local zone data');
  }
  
  // Use the proper zone service that reads from sydney-zones.json
  const zoneInfo = getZoneForPostcode(postcode);
  if (zoneInfo) {
    console.log(`✅ Postcode ${postcode} found in zone "${zoneInfo.key}" (${zoneInfo.name})`);
    return zoneInfo.key;
  }
  
  console.log(`⚠️ Postcode ${postcode} not found in any zone`);
  return null;
}

// Legacy function for backward compatibility
export async function isEasternSuburb(postcode) {
  const zone = await getPostcodeZone(postcode);
  return zone === 'eastern';
}

// Get 2-person delivery available days
export function getTwoPersonDeliveryDays() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    // Default: Tuesday, Wednesday, Thursday
    return [2, 3, 4];
  }
  
  const saved = localStorage.getItem('twoPersonDeliveryDays');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse 2-person delivery days:', e);
    }
  }
  
  // Default: Tuesday, Wednesday, Thursday
  return [2, 3, 4];
}

// Check if a specific day is available for 2-person delivery
export function isTwoPersonDeliveryAvailable(dayOfWeek) {
  const availableDays = getTwoPersonDeliveryDays();
  return availableDays.includes(dayOfWeek);
}
