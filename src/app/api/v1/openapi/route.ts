import { NextRequest, NextResponse } from 'next/server';
import { openAPISpec } from '@/lib/api/openapi';

export async function GET(request: NextRequest) {
  return NextResponse.json(openAPISpec);
}