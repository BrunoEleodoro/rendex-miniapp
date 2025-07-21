import { NextRequest, NextResponse } from 'next/server';
import { AveniaService } from '../../../../lib/avenia/service';
import connectMongoDB from '../../../../lib/mongodb';
import User from '../../../../models/User';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `wallet-connect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[API:WalletConnect] ${requestId} - Starting wallet connection process`);
  
  try {
    const body = await request.json();
    const { walletAddress, _signature, _message, fullName } = body;

    if (!walletAddress || !fullName) {
      console.error(`[API:WalletConnect] ${requestId} - Missing required fields`);
      return NextResponse.json(
        { error: 'walletAddress and fullName are required' },
        { status: 400 }
      );
    }

    console.log(`[API:WalletConnect] ${requestId} - Processing wallet: ${walletAddress}`);
    console.log(`[API:WalletConnect] ${requestId} - Full name: ${fullName}`);

    await connectMongoDB();
    const aveniaService = new AveniaService();

    // Check if wallet already exists
    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    
    if (user) {
      console.log(`[API:WalletConnect] ${requestId} - Existing user found: ${user._id}`);
      console.log(`[API:WalletConnect] ${requestId} - Subaccount ID: ${user.aveniaSubaccountId || 'none'}`);
      
      const _duration = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        userId: user._id.toString(),
        subaccountId: user.aveniaSubaccountId,
        kycStatus: user.kycStatus,
        isNewUser: false,
        message: 'Wallet already connected',
      });
    }

    // Create new user with wallet address
    console.log(`[API:WalletConnect] ${requestId} - Creating new user for wallet: ${walletAddress}`);
    
    const newUser = new User({
      email: `${walletAddress.toLowerCase()}@wallet.rendex.app`,
      walletAddress: walletAddress.toLowerCase(),
      personalInfo: {
        fullName: fullName.trim()
      },
      kycStatus: 'not_started',
    });
    await newUser.save();
    
    console.log(`[API:WalletConnect] ${requestId} - New user created: ${newUser._id}`);

    // Create INDIVIDUAL subaccount for this wallet
    console.log(`[API:WalletConnect] ${requestId} - Creating subaccount for: ${fullName}`);
    
    try {
      const subaccountResult = await aveniaService.createSubaccount(newUser._id.toString(), fullName);
      
      // Update user with subaccount ID
      newUser.aveniaSubaccountId = subaccountResult.subaccountId;
      await newUser.save();
      
      console.log(`[API:WalletConnect] ${requestId} - Subaccount created: ${subaccountResult.subaccountId}`);
      
      const duration = Date.now() - startTime;
      console.log(`[API:WalletConnect] ${requestId} - Wallet connection completed successfully (${duration}ms)`);

      return NextResponse.json({
        success: true,
        userId: newUser._id.toString(),
        subaccountId: subaccountResult.subaccountId,
        kycStatus: newUser.kycStatus,
        isNewUser: true,
        message: 'Wallet connected and subaccount created successfully',
      });
      
    } catch (subaccountError: any) {
      console.error(`[API:WalletConnect] ${requestId} - Failed to create subaccount:`, subaccountError.message);
      
      // Remove the user if subaccount creation failed
      await User.findByIdAndDelete(newUser._id);
      
      return NextResponse.json(
        { error: 'Failed to create subaccount', details: subaccountError.message },
        { status: 500 }
      );
    }

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[API:WalletConnect] ${requestId} - Wallet connection failed after ${duration}ms:`, {
      message: error.message,
      stack: error.stack,
    });
    
    return NextResponse.json(
      { error: 'Failed to connect wallet', details: error.message },
      { status: 500 }
    );
  }
}