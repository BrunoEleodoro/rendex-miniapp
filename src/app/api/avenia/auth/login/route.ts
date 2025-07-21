import { NextRequest, NextResponse } from 'next/server';
import { AveniaService as _AveniaService } from '../../../../../lib/avenia/service';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `login-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[API:Login] ${requestId} - Starting login request`);
  
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log(`[API:Login] ${requestId} - Received login request for email: ${email}`);

    if (!email || !password) {
      console.warn(`[API:Login] ${requestId} - Missing credentials - email: ${!!email}, password: ${!!password}`);
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log(`[API:Login] ${requestId} - Login route called but using wallet-based auth (mock response)`);
    // Note: Traditional email/password login is disabled in favor of wallet-based authentication
    // This endpoint returns a mock success for backward compatibility
    
    const duration = Date.now() - startTime;
    console.log(`[API:Login] ${requestId} - Mock login response for: ${email} (${duration}ms)`);

    return NextResponse.json({
      success: true,
      message: 'Email token sent. Please check your email and use /validate-login endpoint.',
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[API:Login] ${requestId} - Login failed after ${duration}ms:`, {
      message: error.message,
      stack: error.stack,
    });
    
    return NextResponse.json(
      { error: 'Login failed. Please check your credentials.' },
      { status: 400 }
    );
  }
}