import { NextRequest, NextResponse } from 'next/server';
import { AveniaService } from '../../../../../lib/avenia/service';
import connectMongoDB from '../../../../../lib/mongodb';
import User from '../../../../../models/User';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `kyc-init-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[API:KYCInitiate] ${requestId} - Starting KYC initiation request`);
  
  try {
    const body = await request.json();
    const { userId, subaccountId, fullName } = body;

    console.log(`[API:KYCInitiate] ${requestId} - Received KYC initiation request`);
    console.log(`[API:KYCInitiate] ${requestId} - Using pre-configured AVENIA tokens for authentication`);
    if (fullName) console.log(`[API:KYCInitiate] ${requestId} - Full name provided: ${fullName}`);

    // Initialize Avenia service with pre-configured tokens
    const aveniaService = new AveniaService();
    await connectMongoDB();

    let finalUserId = userId;
    let userEmail = 'user@rendex.app';
    let finalSubaccountId = subaccountId;

    if (!userId) {
      // No userId provided - create a new user in our database
      console.log(`[API:KYCInitiate] ${requestId} - No userId provided, creating new user record`);
      
      // Generate a unique email for this user session
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      userEmail = `user-${timestamp}-${randomId}@rendex.app`;
      
      // Create new user in our database
      const newUser = new User({
        email: userEmail,
        kycStatus: 'not_started',
      });
      await newUser.save();
      
      finalUserId = newUser._id.toString();
      console.log(`[API:KYCInitiate] ${requestId} - New user created with ID: ${finalUserId}, email: ${userEmail}`);
    } else {
      // Get existing user
      console.log(`[API:KYCInitiate] ${requestId} - Using existing user ID: ${userId}`);
      const existingUser = await User.findById(userId);
      if (existingUser) {
        userEmail = existingUser.email;
        console.log(`[API:KYCInitiate] ${requestId} - Found existing user: ${userEmail}`);
      }
    }

    // Step 1: Create INDIVIDUAL subaccount if fullName is provided and no subaccountId
    if (fullName && !finalSubaccountId) {
      console.log(`[API:KYCInitiate] ${requestId} - Creating INDIVIDUAL subaccount for: ${fullName}`);
      try {
        const subaccountResult = await aveniaService.createSubaccount(finalUserId, fullName);
        finalSubaccountId = subaccountResult.subaccountId;
        console.log(`[API:KYCInitiate] ${requestId} - Subaccount created successfully: ${finalSubaccountId}`);
      } catch (subaccountError: any) {
        console.error(`[API:KYCInitiate] ${requestId} - Failed to create subaccount:`, subaccountError.message);
        return NextResponse.json(
          { error: 'Failed to create subaccount', details: subaccountError.message },
          { status: 500 }
        );
      }
    }
    
    // Step 2: Initiate KYC with the subaccount ID
    console.log(`[API:KYCInitiate] ${requestId} - Calling initiateKYC for user: ${finalUserId}${finalSubaccountId ? ` with subaccount: ${finalSubaccountId}` : ''}`);
    const kycUrl = await aveniaService.initiateKYC(finalUserId, finalSubaccountId);

    const duration = Date.now() - startTime;
    console.log(`[API:KYCInitiate] ${requestId} - KYC initiated successfully for user: ${finalUserId} (${duration}ms)`);
    console.log(`[API:KYCInitiate] ${requestId} - KYC URL generated: ${kycUrl}`);

    return NextResponse.json({
      success: true,
      kycUrl,
      userId: finalUserId,
      subaccountId: finalSubaccountId,
      email: userEmail,
      message: 'KYC process initiated. Please complete the verification at the provided URL.',
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[API:KYCInitiate] ${requestId} - KYC initiation failed after ${duration}ms:`, {
      message: error.message,
      stack: error.stack,
    });
    
    return NextResponse.json(
      { error: 'Failed to initiate KYC process', details: error.message },
      { status: 500 }
    );
  }
}