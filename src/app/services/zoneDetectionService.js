// Enhanced zone detection service with suburb and region mapping
// This provides intelligent fallback when postcodes aren't in our lists

// Comprehensive suburb to zone mapping for Sydney
const SUBURB_ZONE_MAPPING = {
  // Eastern Suburbs
  eastern: [
    // Beaches
    'bondi', 'bondi beach', 'bondi junction', 'tamarama', 'bronte', 'clovelly',
    'coogee', 'south coogee', 'maroubra', 'maroubra junction', 'malabar', 'little bay',
    'la perouse', 'phillip bay', 'port botany', 'banksmeadow', 'hillsdale', 'eastgardens',
    
    // Eastern suburbs proper
    'woollahra', 'double bay', 'bellevue hill', 'point piper', 'rose bay',
    'vaucluse', 'watsons bay', 'dover heights', 'north bondi',
    'queens park', 'centennial park', 'paddington', 'edgecliff',
    'darling point', 'elizabeth bay', 'potts point', 'rushcutters bay',
    'woolloomooloo', 'kings cross', 'darlinghurst', 'surry hills',
    
    // Eastern suburbs extended
    'randwick', 'kensington', 'kingsford', 'rosebery', 'mascot', 'eastlakes',
    'pagewood', 'botany', 'daceyville', 'waterloo', 'zetland', 'beaconsfield',
    'alexandria', 'moore park', 'paddington', 'woollahra'
  ],
  
  // Inner West
  innerWest: [
    'marrickville', 'sydenham', 'tempe', 'st peters', 'erskineville', 'newtown',
    'enmore', 'stanmore', 'petersham', 'lewisham', 'dulwich hill', 'hurlstone park',
    'ashbury', 'summer hill', 'ashfield', 'haberfield', 'leichhardt', 'lilyfield',
    'annandale', 'rozelle', 'balmain', 'balmain east', 'birchgrove',
    'glebe', 'forest lodge', 'camperdown', 'ultimo', 'pyrmont',
    'five dock', 'russell lea', 'rodd point', 'wareemba', 'abbotsford',
    'canada bay', 'concord', 'concord west', 'north strathfield', 'strathfield',
    'homebush', 'homebush west', 'burwood', 'burwood heights', 'enfield',
    'croydon', 'croydon park', 'campsie', 'canterbury', 'hurlstone park'
  ],
  
  // Western Sydney
  western: [
    'parramatta', 'westmead', 'harris park', 'granville', 'clyde', 'auburn',
    'lidcombe', 'silverwater', 'newington', 'sydney olympic park', 'homebush bay',
    'merrylands', 'merrylands west', 'guildford', 'guildford west', 'yennora',
    'fairfield', 'fairfield west', 'fairfield east', 'fairfield heights',
    'cabramatta', 'cabramatta west', 'canley vale', 'canley heights',
    'wakeley', 'smithfield', 'prairiewood', 'wetherill park', 'prospect',
    'pemulwuy', 'greystanes', 'south wentworthville', 'wentworthville',
    'pendle hill', 'toongabbie', 'old toongabbie', 'winston hills',
    'northmead', 'north parramatta', 'north rocks', 'carlingford',
    'telopea', 'dundas', 'dundas valley', 'ermington', 'rydalmere',
    'camellia', 'rosehill', 'blacktown', 'seven hills', 'lalor park',
    'kings park', 'marayong', 'quakers hill', 'kings langley'
  ],
  
  // Northern Suburbs (Lower North Shore)
  northern: [
    'north sydney', 'milsons point', 'mcmahons point', 'waverton', 'wollstonecraft',
    'crows nest', 'st leonards', 'greenwich', 'naremburn', 'cammeray',
    'neutral bay', 'cremorne', 'cremorne point', 'mosman', 'clifton gardens',
    'chatswood', 'chatswood west', 'artarmon', 'lane cove', 'lane cove north',
    'lane cove west', 'longueville', 'northwood', 'riverview',
    'willoughby', 'willoughby east', 'castlecrag', 'middle cove', 'castle cove',
    'northbridge', 'beauty point', 'seaforth', 'balgowlah', 'balgowlah heights',
    'clontarf', 'manly', 'manly vale', 'fairlight', 'queenscliff',
    'freshwater', 'curl curl', 'north curl curl', 'brookvale', 'dee why',
    'north manly', 'allambie heights', 'beacon hill', 'narraweena', 'cromer',
    'collaroy', 'collaroy plateau', 'wheeler heights', 'narrabeen', 'north narrabeen',
    'warriewood', 'mona vale', 'newport', 'bilgola', 'bilgola plateau',
    'avalon', 'avalon beach', 'whale beach', 'palm beach', 'clareville',
    'bayview', 'church point', 'scotland island', 'morning bay'
  ],
  
  // Southern Suburbs (Sutherland Shire & St George)
  southern: [
    'hurstville', 'penshurst', 'mortdale', 'oatley', 'peakhurst', 'peakhurst heights',
    'lugarno', 'riverwood', 'narwee', 'beverly hills', 'kingsgrove', 'bexley',
    'bexley north', 'rockdale', 'banksia', 'arncliffe', 'wolli creek', 'turrella',
    'bardwell park', 'bardwell valley', 'earlwood', 'clemton park', 'campsie',
    'belmore', 'lakemba', 'wiley park', 'punchbowl', 'roselands', 'narwee',
    'padstow', 'padstow heights', 'revesby', 'revesby heights', 'panania',
    'east hills', 'picnic point', 'milperra', 'bankstown', 'bankstown aerodrome',
    'condell park', 'yagoona', 'yagoona west', 'birrong', 'potts hill',
    'regents park', 'sefton', 'chester hill', 'villawood', 'bass hill',
    'georges hall', 'lansdowne', 'chipping norton', 'moorebank', 'hammondville',
    'holsworthy', 'wattle grove', 'voyager point', 'sandy point', 'pleasure point',
    'alfords point', 'illawong', 'menai', 'bangor', 'barden ridge',
    'lucas heights', 'woronora dam', 'engadine', 'heathcote', 'waterfall',
    'sutherland', 'kirrawee', 'gymea', 'gymea bay', 'miranda', 'yowie bay',
    'caringbah', 'caringbah south', 'dolans bay', 'port hacking', 'lilli pilli',
    'sylvania', 'sylvania waters', 'kangaroo point', 'sans souci', 'ramsgate',
    'ramsgate beach', 'monterey', 'beverley park', 'kogarah', 'kogarah bay',
    'carlton', 'allawah', 'kyle bay', 'blakehurst', 'carss park',
    'connells point', 'hurstville grove', 'south hurstville',
    'cronulla', 'woolooware', 'burraneer', 'kurnell', 'greenhills beach'
  ],
  
  // North West
  northWest: [
    'castle hill', 'baulkham hills', 'bella vista', 'kellyville', 'kellyville ridge',
    'beaumont hills', 'rouse hill', 'box hill', 'nelson', 'annangrove',
    'kenthurst', 'glenorie', 'dural', 'round corner', 'arcadia', 'berrilee',
    'fiddletown', 'galston', 'glenwood', 'parklea', 'stanhope gardens',
    'the ponds', 'schofields', 'nirimba fields', 'marsden park', 'riverstone',
    'vineyard', 'berkshire park', 'windsor', 'south windsor', 'bligh park',
    'windsor downs', 'mcgraths hill', 'mulgrave', 'pitt town', 'scheyville',
    'maraylya', 'oakville', 'clarendon', 'richmond', 'hobartville', 'richmond lowlands',
    'yarramundi', 'agnes banks', 'glossodia', 'freemans reach', 'wilberforce',
    'ebenezer', 'north richmond', 'tennyson', 'the slopes', 'kurmond',
    'kurrajong', 'kurrajong hills', 'kurrajong heights', 'berambing', 'bilpin',
    'mountain lagoon', 'colo', 'colo heights', 'wheeny creek', 'upper colo'
  ],
  
  // South West
  southWest: [
    'liverpool', 'warwick farm', 'carnes hill', 'horningsea park', 'hoxton park',
    'middleton grange', 'elizabeth hills', 'cecil hills', 'cecil park',
    'austral', 'leppington', 'catherine field', 'gregory hills', 'gledswood hills',
    'harrington park', 'harrington grove', 'oran park', 'cobbitty', 'ellis lane',
    'rossmore', 'badgerys creek', 'kemps creek', 'mount vernon', 'luddenham',
    'wallacia', 'mulgoa', 'mulgoa rise', 'regentville', 'jamisontown',
    'penrith', 'south penrith', 'glenmore park', 'orchard hills',
    'emu plains', 'emu heights', 'leonay', 'lapstone', 'glenbrook',
    'blaxland', 'warrimoo', 'valley heights', 'springwood', 'winmalee',
    'yellow rock', 'hawkesbury heights', 'faulconbridge', 'linden',
    'woodford', 'hazelbrook', 'lawson', 'bullaburra', 'wentworth falls',
    'leura', 'katoomba', 'medlow bath', 'blackheath', 'mount victoria',
    'bell', 'mount wilson', 'mount irvine', 'mount tomah', 'berambing',
    'campbelltown', 'macarthur', 'ambarvale', 'rosemeadow', 'bradbury',
    'airds', 'blair athol', 'blairmount', 'claymore', 'eagle vale',
    'eschol park', 'kearns', 'minto', 'minto heights', 'raby', 'st andrews',
    'bow bowing', 'minto', 'ingleburn', 'macquarie fields', 'glenfield',
    'casula', 'prestons', 'edmondson park', 'bardia', 'denham court'
  ]
};

// Region-based fallback zones
const REGION_KEYWORDS = {
  eastern: ['eastern suburbs', 'eastern beaches', 'east sydney', 'eastern sydney'],
  innerWest: ['inner west', 'inner western'],
  western: ['western sydney', 'west sydney', 'greater western'],
  northern: ['north shore', 'northern beaches', 'north sydney', 'northern suburbs'],
  southern: ['sutherland shire', 'southern sydney', 'south sydney', 'st george'],
  northWest: ['north west', 'northwest', 'hills district', 'hills shire'],
  southWest: ['south west', 'southwest', 'macarthur', 'liverpool', 'campbelltown']
};

/**
 * Extract suburb from address string
 * @param {string} address - Full address string
 * @returns {string|null} Extracted suburb name
 */
function extractSuburb(address) {
  if (!address) return null;
  
  // Common patterns for suburb extraction
  // Format: "Street, Suburb STATE Postcode" or "Street Suburb STATE Postcode"
  const patterns = [
    /,\s*([^,]+?)\s+(?:NSW|QLD|VIC|ACT|SA|WA|TAS|NT)\s+\d{4}/i,
    /,\s*([^,]+?)\s+\d{4}/,
    /\d+\s+[^,]+,\s*([^,]+?)(?:\s+\d{4})?$/,
    // Sometimes suburb comes before state without comma
    /\s([A-Za-z\s]+?)\s+(?:NSW|QLD|VIC|ACT|SA|WA|TAS|NT)\s+\d{4}/i
  ];
  
  for (const pattern of patterns) {
    const match = address.match(pattern);
    if (match && match[1]) {
      return match[1].trim().toLowerCase();
    }
  }
  
  return null;
}

/**
 * Detect zone based on suburb name
 * @param {string} suburb - Suburb name
 * @returns {string|null} Zone identifier
 */
function getZoneFromSuburb(suburb) {
  if (!suburb) return null;
  
  const cleanSuburb = suburb.toLowerCase().trim();
  
  // Check each zone's suburb list
  for (const [zone, suburbs] of Object.entries(SUBURB_ZONE_MAPPING)) {
    if (suburbs.some(s => s === cleanSuburb || cleanSuburb.includes(s))) {
      return zone;
    }
  }
  
  // Check for region keywords in the suburb/address
  for (const [zone, keywords] of Object.entries(REGION_KEYWORDS)) {
    if (keywords.some(keyword => cleanSuburb.includes(keyword))) {
      return zone;
    }
  }
  
  return null;
}

/**
 * Enhanced zone detection with intelligent fallback
 * @param {string} address - Full address string
 * @param {string} postcode - Postcode (if already extracted)
 * @param {string} existingZone - Zone from postcode lookup (if any)
 * @returns {Object} Zone information with confidence level
 */
export async function detectZoneIntelligently(address, postcode, existingZone) {
  const result = {
    zone: existingZone,
    source: existingZone ? 'postcode' : null,
    confidence: existingZone ? 'high' : 'none',
    suburb: null,
    suggestedZone: null
  };
  
  // Extract suburb from address
  const suburb = extractSuburb(address);
  result.suburb = suburb;
  
  if (!existingZone || existingZone === 'Not in any zone') {
    // Try to detect zone from suburb
    const suburbZone = getZoneFromSuburb(suburb);
    
    if (suburbZone) {
      result.zone = suburbZone;
      result.source = 'suburb';
      result.confidence = 'medium';
      result.suggestedZone = suburbZone;
    } else if (address) {
      // Last resort: check if the full address contains region keywords
      const addressLower = address.toLowerCase();
      for (const [zone, keywords] of Object.entries(REGION_KEYWORDS)) {
        if (keywords.some(keyword => addressLower.includes(keyword))) {
          result.zone = zone;
          result.source = 'region';
          result.confidence = 'low';
          result.suggestedZone = zone;
          break;
        }
      }
    }
  }
  
  // Format zone name for display
  if (result.zone && result.zone !== 'Not in any zone') {
    result.displayName = formatZoneName(result.zone);
  }
  
  return result;
}

/**
 * Format zone name for display
 * @param {string} zone - Zone identifier
 * @returns {string} Formatted zone name
 */
function formatZoneName(zone) {
  const names = {
    eastern: 'Eastern Suburbs',
    innerWest: 'Inner West',
    western: 'Western Sydney',
    northern: 'Northern Suburbs',
    southern: 'Southern Sydney',
    northWest: 'North West Sydney',
    southWest: 'South West Sydney'
  };
  
  return names[zone] || zone.charAt(0).toUpperCase() + zone.slice(1);
}

/**
 * Get all suburbs for a zone
 * @param {string} zone - Zone identifier
 * @returns {Array} List of suburbs
 */
export function getSuburbsForZone(zone) {
  return SUBURB_ZONE_MAPPING[zone] || [];
}

/**
 * Check if we should use intelligent detection
 * @returns {boolean} Whether to use intelligent detection
 */
export function shouldUseIntelligentDetection() {
  // Check if admin has enabled it (could be stored in localStorage)
  const setting = localStorage.getItem('useIntelligentZoneDetection');
  return setting === 'true' || setting === null; // Default to true
}

/**
 * Save intelligent detection preference
 * @param {boolean} enabled - Whether to enable intelligent detection
 */
export function setIntelligentDetection(enabled) {
  localStorage.setItem('useIntelligentZoneDetection', enabled.toString());
}