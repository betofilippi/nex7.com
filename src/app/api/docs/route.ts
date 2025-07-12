import { NextRequest, NextResponse } from 'next/server';
import { createSwaggerSpec } from 'next-swagger-doc';
import swaggerConfig from '../../../../lib/swagger/config';

export async function GET(request: NextRequest) {
  try {
    const spec = createSwaggerSpec({
      definition: swaggerConfig,
      apiFolder: 'src/app/api',
    });

    return NextResponse.json(spec, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error generating API documentation:', error);
    return NextResponse.json(
      { error: 'Failed to generate API documentation' },
      { status: 500 }
    );
  }
}