import { NextRequest, NextResponse } from 'next/server';
import { saveDeliveryQuote } from '@/lib/db';
import { validateQuoteData, sanitizeString, ValidationException } from '@/app/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input data
    const validationErrors = validateQuoteData(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, errors: validationErrors },
        { status: 400 }
      );
    }
    
    // Sanitize string inputs
    const sanitizedData = {
      ...body,
      address: sanitizeString(body.address),
      suburb: body.suburb ? sanitizeString(body.suburb) : undefined,
      notes: body.notes ? sanitizeString(body.notes) : undefined
    };
    
    const quote = await saveDeliveryQuote(sanitizedData);
    
    return NextResponse.json({ 
      success: true, 
      quote 
    });
  } catch (error) {
    console.error('Error saving delivery quote:', error);
    
    if (error instanceof ValidationException) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to save delivery quote' },
      { status: 500 }
    );
  }
}