import { NextRequest, NextResponse } from 'next/server';
import { AveniaService } from '../../../../../lib/avenia/service';
import connectMongoDB from '../../../../../lib/mongodb';
import User from '../../../../../models/User';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `pix-deposit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[API:PIXDeposit] ${requestId} - Starting PIX deposit process`);
  
  try {
    const body = await request.json();
    const { userId, outputAmount, walletAddress } = body; // outputAmount in BRLA, walletAddress for external wallet

    if (!userId || !outputAmount) {
      console.error(`[API:PIXDeposit] ${requestId} - Missing required fields`);
      return NextResponse.json(
        { error: 'userId and outputAmount are required' },
        { status: 400 }
      );
    }

    console.log(`[API:PIXDeposit] ${requestId} - Target wallet address: ${walletAddress || 'internal (subaccount)'}`);

    console.log(`[API:PIXDeposit] ${requestId} - Processing PIX deposit for user: ${userId}, amount: ${outputAmount} BRLA`);

    await connectMongoDB();
    const aveniaService = new AveniaService();

    // Get user and subaccount ID - handle both ObjectId and username/email
    let user;
    
    // Try to find by ObjectId first, then fall back to username/email
    if (userId.match(/^[0-9a-fA-F]{24}$/)) {
      // Valid ObjectId format
      user = await User.findById(userId);
    } else {
      // Assume it's username or email
      user = await User.findOne({
        $or: [
          { email: userId },
          { farcasterUsername: userId },
          { id: userId } // Custom ID field
        ]
      });
    }

    if (!user) {
      console.error(`[API:PIXDeposit] ${requestId} - User not found: ${userId}`);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log(`[API:PIXDeposit] ${requestId} - User found: ${user.email}, subaccount: ${user.aveniaSubaccountId || 'none - will create'}`);

    // If user doesn't have a subaccount, create one automatically
    if (!user.aveniaSubaccountId) {
      console.log(`[API:PIXDeposit] ${requestId} - User has no subaccount, creating one automatically`);
      
      try {
        const subaccountName = `${user.farcasterUsername || user.email.split('@')[0] || 'user'}-subaccount`;
        console.log(`[API:PIXDeposit] ${requestId} - Creating subaccount with name: ${subaccountName}`);
        
        const subaccountResult = await aveniaService.createSubaccount(user._id.toString(), subaccountName);
        
        // Update user with new subaccount ID
        user.aveniaSubaccountId = subaccountResult.subaccountId;
        await user.save();
        
        console.log(`[API:PIXDeposit] ${requestId} - Subaccount created successfully: ${subaccountResult.subaccountId}`);
      } catch (subaccountError: any) {
        console.error(`[API:PIXDeposit] ${requestId} - Failed to create subaccount:`, subaccountError.message);
        return NextResponse.json(
          { error: 'Failed to create user subaccount', details: subaccountError.message },
          { status: 500 }
        );
      }
    }

    console.log(`[API:PIXDeposit] ${requestId} - User ready for PIX deposit: ${user.email}, subaccount: ${user.aveniaSubaccountId}`);

    // Step 1: Get PIX to BRLA quote with subaccount
    // Determine output payment method based on whether we're sending to external wallet
    const outputPaymentMethod = walletAddress ? 'POLYGON' : 'INTERNAL';
    console.log(`[API:PIXDeposit] ${requestId} - Getting PIX to BRLA quote for amount: ${outputAmount} BRLA, subaccount: ${user.aveniaSubaccountId}, method: ${outputPaymentMethod}`);
    
    const quote = await aveniaService.getPixToBRLAQuote(outputAmount, user.aveniaSubaccountId, outputPaymentMethod);
    console.log(`[API:PIXDeposit] ${requestId} - Quote received - Input: ${quote.inputAmount} BRL, Output: ${quote.outputAmount} BRLA`);
    
    // Step 2: Create PIX ticket
    console.log(`[API:PIXDeposit] ${requestId} - Creating PIX ticket for subaccount: ${user.aveniaSubaccountId}`);
    
    // Create PIX ticket - use walletAddress from request if provided, otherwise keep internal
    const ticketResult = await aveniaService.createPixTicketForUser(
      user.aveniaSubaccountId, 
      quote.quoteToken,
      walletAddress // Use the external wallet address from frontend, or undefined for internal
    );
    
    console.log(`[API:PIXDeposit] ${requestId} - PIX ticket created successfully`);
    console.log(`[API:PIXDeposit] ${requestId} - Ticket ID: ${ticketResult.id}`);
    console.log(`[API:PIXDeposit] ${requestId} - PIX Code: ${ticketResult.brCode ? 'Generated' : 'None'}`);

    const duration = Date.now() - startTime;
    console.log(`[API:PIXDeposit] ${requestId} - PIX deposit process completed (${duration}ms)`);

    return NextResponse.json({
      success: true,
      id: ticketResult.id, // Use id to match Avenia API response
      brCode: ticketResult.brCode,
      expiration: ticketResult.expiration,
      quote: {
        inputAmount: quote.inputAmount,
        inputCurrency: quote.inputCurrency,
        outputAmount: quote.outputAmount,
        outputCurrency: quote.outputCurrency,
        appliedFees: quote.appliedFees,
        basePrice: quote.basePrice
      },
      message: 'PIX deposit initiated. Use the brCode to make payment.',
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[API:PIXDeposit] ${requestId} - PIX deposit failed after ${duration}ms:`, {
      message: error.message,
      stack: error.stack,
    });
    
    return NextResponse.json(
      { error: 'Failed to create PIX deposit', details: error.message },
      { status: 500 }
    );
  }
}