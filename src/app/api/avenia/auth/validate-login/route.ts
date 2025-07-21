import { NextRequest, NextResponse } from 'next/server';
import { AveniaService as _AveniaService } from '../../../../../lib/avenia/service';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `validate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[API:ValidateLogin] ${requestId} - Starting login validation request`);
  
  try {
    const body = await request.json();
    const { email, emailToken } = body;

    console.log(`[API:ValidateLogin] ${requestId} - Received validation request for email: ${email}, token: ${emailToken}`);

    if (!email || !emailToken) {
      console.warn(`[API:ValidateLogin] ${requestId} - Missing parameters - email: ${!!email}, emailToken: ${!!emailToken}`);
      return NextResponse.json(
        { error: 'Email and email token are required' },
        { status: 400 }
      );
    }

    console.log(`[API:ValidateLogin] ${requestId} - Validate login called but using wallet-based auth (mock response)`);
    // Note: Traditional email/password validation is disabled in favor of wallet-based authentication
    // This endpoint returns a mock success for backward compatibility
    
    const mockUser = {
      _id: 'mock_user_id',
      email,
      kycStatus: 'not_started',
      farcasterFid: null
    };

    const duration = Date.now() - startTime;
    console.log(`[API:ValidateLogin] ${requestId} - Mock validation response for: ${email} (${duration}ms)`);
    console.log(`[API:ValidateLogin] ${requestId} - Mock user details: KYC status: ${mockUser.kycStatus}, FID: ${mockUser.farcasterFid || 'none'}`);

    return NextResponse.json({
      success: true,
      user: {
        id: mockUser._id,
        email: mockUser.email,
        kycStatus: mockUser.kycStatus,
        farcasterFid: mockUser.farcasterFid,
        walletAddress: null,
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[API:ValidateLogin] ${requestId} - Validation failed after ${duration}ms:`, {
      message: error.message,
      stack: error.stack,
    });
    
    return NextResponse.json(
      { error: 'Login validation failed. Please check your email token.' },
      { status: 400 }
    );
  }
}