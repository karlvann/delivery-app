// Server-side validation utilities

export interface ValidationError {
  field: string
  message: string
}

export class ValidationException extends Error {
  public errors: ValidationError[]
  
  constructor(errors: ValidationError[]) {
    super('Validation failed')
    this.errors = errors
  }
}

// Validate postcode (Australian format)
export function validatePostcode(postcode: string): boolean {
  const postcodeRegex = /^[0-9]{4}$/
  return postcodeRegex.test(postcode)
}

// Validate email address
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate price (positive number)
export function validatePrice(price: number): boolean {
  return !isNaN(price) && price >= 0
}

// Validate address string
export function validateAddress(address: string): boolean {
  // Basic validation - ensure it's not empty and has reasonable length
  return address && address.length > 5 && address.length < 500
}

// Validate delivery zone
export function validateZone(zone: string): boolean {
  const validZones = ['A', 'B', 'C', 'D', 'E', 'F']
  return validZones.includes(zone.toUpperCase())
}

// Validate corridor type
export function validateCorridor(corridor: string): boolean {
  const validCorridors = ['sydney-brisbane', 'sydney-melbourne', 'none']
  return validCorridors.includes(corridor.toLowerCase())
}

// Sanitize string input (remove potentially harmful characters)
export function sanitizeString(input: string): string {
  if (!input) return ''
  
  // Remove HTML tags and script injections
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim()
}

// Validate and sanitize quote data
export function validateQuoteData(data: any): ValidationError[] {
  const errors: ValidationError[] = []
  
  // Validate required fields
  if (!data.address || !validateAddress(data.address)) {
    errors.push({ field: 'address', message: 'Valid address is required' })
  }
  
  if (data.postcode && !validatePostcode(data.postcode)) {
    errors.push({ field: 'postcode', message: 'Invalid postcode format' })
  }
  
  if (data.email && !validateEmail(data.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' })
  }
  
  if (data.price !== undefined && !validatePrice(data.price)) {
    errors.push({ field: 'price', message: 'Invalid price value' })
  }
  
  return errors
}

// Validate zone data
export function validateZoneData(data: any): ValidationError[] {
  const errors: ValidationError[] = []
  
  if (!data.postcode || !validatePostcode(data.postcode)) {
    errors.push({ field: 'postcode', message: 'Valid postcode is required' })
  }
  
  if (!data.zone || !validateZone(data.zone)) {
    errors.push({ field: 'zone', message: 'Valid zone (A-F) is required' })
  }
  
  if (!data.suburb || data.suburb.length < 2) {
    errors.push({ field: 'suburb', message: 'Valid suburb name is required' })
  }
  
  return errors
}

// Validate corridor data
export function validateCorridorData(data: any): ValidationError[] {
  const errors: ValidationError[] = []
  
  if (!data.postcode || !validatePostcode(data.postcode)) {
    errors.push({ field: 'postcode', message: 'Valid postcode is required' })
  }
  
  if (!data.corridor || !validateCorridor(data.corridor)) {
    errors.push({ field: 'corridor', message: 'Valid corridor type is required' })
  }
  
  if (data.fixedPrice !== undefined && !validatePrice(data.fixedPrice)) {
    errors.push({ field: 'fixedPrice', message: 'Invalid price value' })
  }
  
  return errors
}