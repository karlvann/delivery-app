// API utility functions for frontend components

export async function fetchZoneByPostcode(postcode: string) {
  const response = await fetch(`/api/zones?postcode=${postcode}`);
  if (!response.ok) throw new Error('Failed to fetch zone');
  return response.json();
}

export async function fetchCorridorPostcodes(corridor: string) {
  const response = await fetch(`/api/corridors?corridor=${corridor}`);
  if (!response.ok) throw new Error('Failed to fetch corridor postcodes');
  return response.json();
}

export async function addCorridorPostcode(postcode: string, corridor: string) {
  const response = await fetch('/api/corridors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postcode, corridor })
  });
  if (!response.ok) throw new Error('Failed to add corridor postcode');
  return response.json();
}

export async function removeCorridorPostcode(postcode: string, corridor: string) {
  const response = await fetch(`/api/corridors?postcode=${postcode}&corridor=${corridor}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Failed to remove corridor postcode');
  return response.json();
}

export async function saveDeliveryQuote(quoteData: any) {
  const response = await fetch('/api/quotes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(quoteData)
  });
  if (!response.ok) throw new Error('Failed to save quote');
  return response.json();
}

export async function fetchZoneRecommendations() {
  const response = await fetch('/api/zone-recommendations');
  if (!response.ok) throw new Error('Failed to fetch zone recommendations');
  return response.json();
}

export async function updateZoneRecommendations(zone: string, days: number[]) {
  const response = await fetch('/api/zone-recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ zone, days })
  });
  if (!response.ok) throw new Error('Failed to update zone recommendations');
  return response.json();
}

export async function initializeDatabase() {
  const response = await fetch('/api/init-db');
  if (!response.ok) throw new Error('Failed to initialize database');
  return response.json();
}