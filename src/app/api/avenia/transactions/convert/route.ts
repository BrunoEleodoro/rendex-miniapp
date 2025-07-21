import { NextRequest, NextResponse } from 'next/server';
import { AveniaService } from '../../../../../lib/avenia/service';

export async function POST(request: NextRequest) {
  try {
    const { userId, amount, outputCurrency } = await request.json();

    if (!userId || !amount || !outputCurrency) {
      return NextResponse.json(
        { error: 'User ID, amount, and output currency are required' },
        { status: 400 }
      );
    }

    if (!['USDC', 'USDT'].includes(outputCurrency)) {
      return NextResponse.json(
        { error: 'Output currency must be USDC or USDT' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    const aveniaService = new AveniaService();
    const conversion = await aveniaService.convertBRLAToStablecoin(userId, amount, outputCurrency);

    return NextResponse.json({
      success: true,
      conversion,
      message: `BRLA to ${outputCurrency} conversion initiated successfully.`,
    });
  } catch (error) {
    console.error('Currency conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert currency' },
      { status: 500 }
    );
  }
}