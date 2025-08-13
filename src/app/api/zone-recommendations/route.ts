import { NextRequest, NextResponse } from 'next/server';
import { getZoneRecommendations, updateZoneRecommendations } from '@/lib/db';

export async function GET() {
  try {
    const recommendations = await getZoneRecommendations();
    
    return NextResponse.json({ 
      success: true, 
      recommendations 
    });
  } catch (error) {
    console.error('Error fetching zone recommendations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch zone recommendations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { zone, days } = body;

    if (!zone || !days || !Array.isArray(days)) {
      return NextResponse.json(
        { error: 'Zone and days array are required' },
        { status: 400 }
      );
    }

    const result = await updateZoneRecommendations(zone, days);
    
    return NextResponse.json({ 
      success: true, 
      data: result 
    });
  } catch (error) {
    console.error('Error updating zone recommendations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update zone recommendations' },
      { status: 500 }
    );
  }
}