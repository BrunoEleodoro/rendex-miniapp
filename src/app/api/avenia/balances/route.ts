import { NextRequest, NextResponse } from 'next/server';
import { AveniaService } from '../../../../lib/avenia/service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const aveniaService = new AveniaService();
    const balances = await aveniaService.getUserBalances(userId);

    return NextResponse.json({
      success: true,
      balances: balances.balances,
    });
  } catch (error) {
    console.error('Get balances error:', error);
    return NextResponse.json(
      { error: 'Failed to get balances' },
      { status: 500 }
    );
  }
}