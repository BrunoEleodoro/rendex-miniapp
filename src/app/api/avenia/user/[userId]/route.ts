import { NextRequest, NextResponse } from 'next/server';
import { AveniaService } from '../../../../../lib/avenia/service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const startTime = Date.now();
  const requestId = `user-data-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const resolvedParams = await params;
  
  console.log(`[API:UserData] ${requestId} - Starting user data request for: ${resolvedParams.userId}`);
  
  try {
    const userId = resolvedParams.userId;

    if (!userId) {
      console.warn(`[API:UserData] ${requestId} - Missing userId parameter`);
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`[API:UserData] ${requestId} - Initializing Avenia service for user: ${userId}`);
    const aveniaService = new AveniaService();
    
    // Get user transactions, subaccounts, and user info in parallel
    console.log(`[API:UserData] ${requestId} - Fetching user data for: ${userId}`);
    const [transactions, subaccounts, userInfo] = await Promise.all([
      aveniaService.getUserTransactions(userId),
      aveniaService.getUserSubaccounts(userId),
      aveniaService.getUserInfo(userId), // New method to get user info including KYC status
    ]);

    const duration = Date.now() - startTime;
    console.log(`[API:UserData] ${requestId} - User data retrieved successfully for: ${userId} (${duration}ms)`);
    console.log(`[API:UserData] ${requestId} - Data summary: ${transactions.length} transactions, ${subaccounts.length} subaccounts, KYC: ${userInfo.kycStatus}`);

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        subaccounts,
        user: {
          id: userInfo._id,
          email: userInfo.email,
          kycStatus: userInfo.kycStatus,
          kycAttemptId: userInfo.kycAttemptId,
        },
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[API:UserData] ${requestId} - Failed to get user data after ${duration}ms:`, {
      message: error.message,
      stack: error.stack,
    });
    
    return NextResponse.json(
      { error: 'Failed to get user data' },
      { status: 500 }
    );
  }
}