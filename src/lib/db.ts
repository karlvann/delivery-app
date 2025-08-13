import { sql } from '@vercel/postgres';

export async function createTables() {
  try {
    // Create delivery zones table
    await sql`
      CREATE TABLE IF NOT EXISTS delivery_zones (
        id SERIAL PRIMARY KEY,
        postcode VARCHAR(4) NOT NULL,
        suburb VARCHAR(100),
        zone VARCHAR(20),
        city VARCHAR(50),
        base_price DECIMAL(10,2),
        two_person_surcharge DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create corridor postcodes table
    await sql`
      CREATE TABLE IF NOT EXISTS corridor_postcodes (
        id SERIAL PRIMARY KEY,
        postcode VARCHAR(4) NOT NULL,
        corridor VARCHAR(50) NOT NULL,
        fixed_price DECIMAL(10,2) DEFAULT 190.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(postcode, corridor)
      )
    `;

    // Create zone recommendations table
    await sql`
      CREATE TABLE IF NOT EXISTS zone_recommendations (
        id SERIAL PRIMARY KEY,
        zone VARCHAR(20) NOT NULL UNIQUE,
        recommended_days INTEGER[] NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create delivery quotes table for tracking
    await sql`
      CREATE TABLE IF NOT EXISTS delivery_quotes (
        id SERIAL PRIMARY KEY,
        address TEXT NOT NULL,
        postcode VARCHAR(4),
        suburb VARCHAR(100),
        zone VARCHAR(20),
        distance_km DECIMAL(10,2),
        base_price DECIMAL(10,2),
        two_person_selected BOOLEAN DEFAULT FALSE,
        total_price DECIMAL(10,2),
        delivery_day VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

// Helper functions for database operations
export async function getZoneByPostcode(postcode: string) {
  const result = await sql`
    SELECT * FROM delivery_zones 
    WHERE postcode = ${postcode}
    LIMIT 1
  `;
  return result.rows[0];
}

export async function getCorridorPostcodes(corridor: string) {
  const result = await sql`
    SELECT * FROM corridor_postcodes
    WHERE corridor = ${corridor}
    ORDER BY postcode
  `;
  return result.rows;
}

export async function addCorridorPostcode(postcode: string, corridor: string) {
  const result = await sql`
    INSERT INTO corridor_postcodes (postcode, corridor)
    VALUES (${postcode}, ${corridor})
    ON CONFLICT (postcode, corridor) DO NOTHING
    RETURNING *
  `;
  return result.rows[0];
}

export async function removeCorridorPostcode(postcode: string, corridor: string) {
  await sql`
    DELETE FROM corridor_postcodes
    WHERE postcode = ${postcode} AND corridor = ${corridor}
  `;
}

export async function saveDeliveryQuote(quoteData: any) {
  const result = await sql`
    INSERT INTO delivery_quotes (
      address, postcode, suburb, zone, distance_km,
      base_price, two_person_selected, total_price, delivery_day
    ) VALUES (
      ${quoteData.address},
      ${quoteData.postcode},
      ${quoteData.suburb},
      ${quoteData.zone},
      ${quoteData.distance_km},
      ${quoteData.base_price},
      ${quoteData.two_person_selected},
      ${quoteData.total_price},
      ${quoteData.delivery_day}
    )
    RETURNING *
  `;
  return result.rows[0];
}

export async function getZoneRecommendations() {
  const result = await sql`
    SELECT * FROM zone_recommendations
  `;
  return result.rows;
}

export async function updateZoneRecommendations(zone: string, days: number[]) {
  // Convert array to PostgreSQL array format
  const daysArray = `{${days.join(',')}}`;
  
  const result = await sql`
    INSERT INTO zone_recommendations (zone, recommended_days)
    VALUES (${zone}, ${daysArray})
    ON CONFLICT (zone) 
    DO UPDATE SET 
      recommended_days = ${daysArray},
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;
  return result.rows[0];
}