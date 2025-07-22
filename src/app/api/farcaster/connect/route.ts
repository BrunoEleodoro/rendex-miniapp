import { NextRequest, NextResponse } from 'next/server';
import { AveniaService } from '../../../../lib/avenia/service';
import connectMongoDB from '../../../../lib/mongodb';
import User from '../../../../models/User';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `farcaster-connect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[API:FarcasterConnect] ${requestId} - Starting Farcaster connection process`);
  
  try {
    const body = await request.json();
    const { fid, username, displayName, walletAddress, pfpUrl } = body;

    if (!fid || !username) {
      console.error(`[API:FarcasterConnect] ${requestId} - Missing required fields`);
      return NextResponse.json(
        { error: 'fid and username are required' },
        { status: 400 }
      );
    }

    console.log(`[API:FarcasterConnect] ${requestId} - Processing FID: ${fid}`);
    console.log(`[API:FarcasterConnect] ${requestId} - Username: ${username}`);
    console.log(`[API:FarcasterConnect] ${requestId} - Display name: ${displayName}`);

    await connectMongoDB();
    const aveniaService = new AveniaService();

    // Check if Farcaster user already exists (by FID)
    const existingUser = await User.findOne({ 
      $or: [
        { farcasterFid: fid },
        { aveniaSubaccountId: fid.toString() }
      ]
    });
    
    if (existingUser) {
      console.log(`[API:FarcasterConnect] ${requestId} - Existing Farcaster user found: ${existingUser._id}`);
      console.log(`[API:FarcasterConnect] ${requestId} - Subaccount ID: ${existingUser.aveniaSubaccountId || 'none'}`);
      
      // Update user info with latest Farcaster data
      existingUser.farcasterUsername = username;
      existingUser.farcasterDisplayName = displayName;
      existingUser.farcasterPfpUrl = pfpUrl;
      if (walletAddress && !existingUser.walletAddress) {
        existingUser.walletAddress = walletAddress.toLowerCase();
      }
      await existingUser.save();
      
      const _duration = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        userId: existingUser._id.toString(),
        subaccountId: existingUser.aveniaSubaccountId,
        kycStatus: existingUser.kycStatus,
        isNewUser: false,
        message: 'Farcaster user already connected',
      });
    }

    // Create new user with Farcaster data
    console.log(`[API:FarcasterConnect] ${requestId} - Creating new Farcaster user: ${username} (FID: ${fid})`);
    
    const newUser = new User({
      email: `${username}@farcaster.xyz`,
      walletAddress: walletAddress?.toLowerCase() || null,
      farcasterFid: fid,
      farcasterUsername: username,
      farcasterDisplayName: displayName,
      farcasterPfpUrl: pfpUrl,
      personalInfo: {
        fullName: displayName || username
      },
      kycStatus: 'not_started',
    });
    await newUser.save();
    
    console.log(`[API:FarcasterConnect] ${requestId} - New Farcaster user created: ${newUser._id}`);

    // Create INDIVIDUAL subaccount using FID as the subaccount ID
    console.log(`[API:FarcasterConnect] ${requestId} - Creating subaccount with FID: ${fid}`);
    
    try {
      const _subaccountResult = await aveniaService.createSubaccount(
        fid.toString(), // Use FID as subaccount ID
        displayName || username
      );
      
      // Update user with subaccount ID (should be the same as FID)
      newUser.aveniaSubaccountId = fid.toString();
      await newUser.save();
      
      console.log(`[API:FarcasterConnect] ${requestId} - Subaccount created with ID: ${fid}`);
      
      const duration = Date.now() - startTime;
      console.log(`[API:FarcasterConnect] ${requestId} - Farcaster connection completed successfully (${duration}ms)`);

      return NextResponse.json({
        success: true,
        userId: newUser._id.toString(),
        subaccountId: fid.toString(),
        kycStatus: newUser.kycStatus,
        isNewUser: true,
        message: 'Farcaster user connected and subaccount created successfully',
      });
      
    } catch (subaccountError: any) {
      console.error(`[API:FarcasterConnect] ${requestId} - Failed to create subaccount:`, subaccountError.message);
      
      // If subaccount creation fails, still keep the user but without subaccount
      // This allows for retry later
      console.log(`[API:FarcasterConnect] ${requestId} - Keeping user without subaccount for retry`);
      
      return NextResponse.json({
        success: true,
        userId: newUser._id.toString(),
        subaccountId: fid.toString(), // Return FID as subaccount ID even if creation failed
        kycStatus: newUser.kycStatus,
        isNewUser: true,
        message: 'Farcaster user connected, subaccount creation pending',
        subaccountCreationFailed: true,
      });
    }

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[API:FarcasterConnect] ${requestId} - Farcaster connection failed after ${duration}ms:`, {
      message: error.message,
      stack: error.stack,
    });
    
    return NextResponse.json(
      { error: 'Failed to connect Farcaster user', details: error.message },
      { status: 500 }
    );
  }
}