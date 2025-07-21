import { NextRequest, NextResponse } from 'next/server';
import { AveniaService } from '../../../../../lib/avenia/service';
import connectMongoDB from '../../../../../lib/mongodb';
import User from '../../../../../models/User';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const startTime = Date.now();
  const requestId = `balances-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const resolvedParams = await params;
  const userId = resolvedParams.userId;
  
  console.log(`[API:Balances] ${requestId} - Getting balances for user: ${userId}`);
  
  try {
    await connectMongoDB();
    const aveniaService = new AveniaService();

    // Get user and subaccount ID
    const user = await User.findById(userId);
    if (!user || !user.aveniaSubaccountId) {
      console.error(`[API:Balances] ${requestId} - User not found or no subaccount: ${userId}`);
      return NextResponse.json(
        { error: 'User not found or no subaccount' },
        { status: 404 }
      );
    }

    console.log(`[API:Balances] ${requestId} - User found: ${user.email}, subaccount: ${user.aveniaSubaccountId}`);

    // Get balances for the subaccount
    console.log(`[API:Balances] ${requestId} - Fetching subaccount balances`);
    
    const balances = await aveniaService.getSubaccountBalances(user.aveniaSubaccountId);
    
    console.log(`[API:Balances] ${requestId} - Balances retrieved:`, balances);

    const duration = Date.now() - startTime;
    console.log(`[API:Balances] ${requestId} - Balance check completed (${duration}ms)`);

    return NextResponse.json({
      success: true,
      userId,
      subaccountId: user.aveniaSubaccountId,
      balances: balances.balances,
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[API:Balances] ${requestId} - Balance check failed after ${duration}ms:`, {
      message: error.message,
      stack: error.stack,
    });
    
    return NextResponse.json(
      { error: 'Failed to get balances', details: error.message },
      { status: 500 }
    );
  }
}