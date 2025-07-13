import { NextRequest, NextResponse } from 'next/server';

export async function validateRequest(req: NextRequest) {
  // Simplified validation
  return true;
}

export function sanitizeInput(input: any) {
  if (typeof input === 'string') {
    return input.replace(/[<>]/g, '');
  }
  return input;
}

export async function withAuth(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const isValid = await validateRequest(req);
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return handler(req);
  };
}

export function generateCSRFToken() {
  return Math.random().toString(36).substr(2, 9);
}
