import { NextRequest, NextResponse } from 'next/server';
import { getZoneByPostcode } from '@/lib/db';
import { sql } from '@vercel/postgres';
import sydneyZones from '@/data/sydney-zones.json';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const postcode = searchParams.get('postcode');

  // Try database first, fall back to JSON file
  try {
    if (postcode) {
      // Try to get from database
      try {
        const zone = await getZoneByPostcode(postcode);
        if (zone) {
          return NextResponse.json({ 
            success: true, 
            zone: zone 
          });
        }
      } catch (dbError) {
        console.log('Database unavailable, using JSON fallback');
      }
      
      // Fallback to JSON file
      for (const [zone, zoneData] of Object.entries(sydneyZones)) {
        // Check if zoneData has postcodes array
        if (zoneData && zoneData.postcodes && zoneData.postcodes.includes(postcode)) {
          return NextResponse.json({ 
            success: true, 
            zone: zone 
          });
        }
      }
      
      return NextResponse.json({ 
        success: true, 
        zone: null 
      });
    }
    
    // Get all zones - try database first
    try {
      const result = await sql`
        SELECT * FROM delivery_zones
        ORDER BY zone, postcode
      `;
      
      // Group by zone
      const zoneMap: Record<string, string[]> = {};
      result.rows.forEach(row => {
        if (!zoneMap[row.zone]) {
          zoneMap[row.zone] = [];
        }
        zoneMap[row.zone].push(row.postcode);
      });
      
      return NextResponse.json({ 
        success: true,
        zones: zoneMap 
      });
    } catch (dbError) {
      console.log('Database unavailable, using JSON fallback for all zones');
      // Return the JSON data directly
      return NextResponse.json({ 
        success: true,
        zones: sydneyZones 
      });
    }
  } catch (error) {
    console.error('Error in zone API:', error);
    // Even if everything fails, return the JSON data
    if (postcode) {
      for (const [zone, zoneData] of Object.entries(sydneyZones)) {
        if (zoneData && zoneData.postcodes && zoneData.postcodes.includes(postcode)) {
          return NextResponse.json({ 
            success: true, 
            zone: zone 
          });
        }
      }
      return NextResponse.json({ 
        success: true, 
        zone: null 
      });
    }
    
    return NextResponse.json({ 
      success: true,
      zones: sydneyZones 
    });
  }
}

// POST - Save zone configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { zones } = body; // zones is an object like { eastern: ['2000-2050'], western: [...] }
    
    // First, create a unique constraint if it doesn't exist
    await sql`
      ALTER TABLE delivery_zones 
      ADD CONSTRAINT IF NOT EXISTS unique_postcode 
      UNIQUE (postcode)
    `.catch(() => {
      // Constraint might already exist
    });
    
    // Clear existing zones
    await sql`DELETE FROM delivery_zones`;
    
    // Insert new zones
    for (const [zone, ranges] of Object.entries(zones)) {
      for (const range of ranges as string[]) {
        if (range.includes('-')) {
          // Handle range like '2000-2050'
          const [start, end] = range.split('-').map(Number);
          for (let postcode = start; postcode <= end; postcode++) {
            const postcodeStr = postcode.toString().padStart(4, '0');
            await sql`
              INSERT INTO delivery_zones (postcode, zone, city)
              VALUES (${postcodeStr}, ${zone}, 'sydney')
              ON CONFLICT (postcode) DO UPDATE SET zone = ${zone}
            `;
          }
        } else {
          // Single postcode
          await sql`
            INSERT INTO delivery_zones (postcode, zone, city)
            VALUES (${range}, ${zone}, 'sydney')
            ON CONFLICT (postcode) DO UPDATE SET zone = ${zone}
          `;
        }
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving zones:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save zones - database not configured' },
      { status: 500 }
    );
  }
}