import { NextResponse } from 'next/server';
import { getZoneForSuburb } from '@/app/components/zoneService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const suburb = searchParams.get('suburb');
  
  if (!suburb) {
    return NextResponse.json({ error: 'No suburb provided' }, { status: 400 });
  }
  
  console.log('🔥 API TEST: Testing suburb:', suburb);
  
  const zone = getZoneForSuburb(suburb);
  
  console.log('🔥 API TEST: Result:', zone);
  
  return NextResponse.json({ 
    suburb,
    zone,
    message: zone ? 'Zone found' : 'No zone found'
  });
}