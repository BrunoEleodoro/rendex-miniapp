import { NextRequest, NextResponse } from 'next/server';
import { AveniaService } from '../../../../../lib/avenia/service';

export async function POST(request: NextRequest) {
  try {
    const { userId, name } = await request.json();

    if (!userId || !name) {
      return NextResponse.json(
        { error: 'User ID and name are required' },
        { status: 400 }
      );
    }

    const aveniaService = new AveniaService();
    const subaccount = await aveniaService.createSubaccount(userId, name);

    return NextResponse.json({
      success: true,
      subaccount,
      message: 'Subaccount created successfully.',
    });
  } catch (error) {
    console.error('Subaccount creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create subaccount' },
      { status: 500 }
    );
  }
}