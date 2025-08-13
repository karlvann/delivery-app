import { NextRequest, NextResponse } from 'next/server';
import { 
  getCorridorPostcodes, 
  addCorridorPostcode, 
  removeCorridorPostcode 
} from '@/lib/db';
import { readFileSync } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const corridor = searchParams.get('corridor');

    if (!corridor) {
      return NextResponse.json(
        { error: 'Corridor parameter is required' },
        { status: 400 }
      );
    }

    let postcodes: string[] = [];
    
    try {
      // Try database first
      postcodes = await getCorridorPostcodes(corridor);
    } catch (dbError) {
      // Fallback to CSV files
      console.log('Database unavailable, falling back to CSV files');
      try {
        const csvPath = path.join(process.cwd(), 'public', `sydney-${corridor}-corridor.csv`);
        const csvData = readFileSync(csvPath, 'utf-8');
        postcodes = csvData.split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('postcode'));
      } catch (fileError) {
        console.log(`CSV file not found: sydney-${corridor}-corridor.csv, returning empty array`);
        postcodes = [];
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      postcodes 
    });
  } catch (error) {
    console.error('Error fetching corridor postcodes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch corridor data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postcode, corridor } = body;

    if (!postcode || !corridor) {
      return NextResponse.json(
        { error: 'Postcode and corridor are required' },
        { status: 400 }
      );
    }

    const result = await addCorridorPostcode(postcode, corridor);
    
    return NextResponse.json({ 
      success: true, 
      data: result 
    });
  } catch (error) {
    console.error('Error adding corridor postcode:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add corridor postcode' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const postcode = searchParams.get('postcode');
    const corridor = searchParams.get('corridor');

    if (!postcode || !corridor) {
      return NextResponse.json(
        { error: 'Postcode and corridor are required' },
        { status: 400 }
      );
    }

    await removeCorridorPostcode(postcode, corridor);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Postcode removed successfully' 
    });
  } catch (error) {
    console.error('Error removing corridor postcode:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove corridor postcode' },
      { status: 500 }
    );
  }
}