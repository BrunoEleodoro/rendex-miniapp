import { NextRequest, NextResponse } from 'next/server';
import { AveniaService } from '../../../../lib/avenia/service';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[API:Webhook] ${requestId} - Received webhook request`);
  
  try {
    const webhookData = await request.json();
    
    console.log(`[API:Webhook] ${requestId} - Webhook payload received:`, JSON.stringify(webhookData, null, 2));
    console.log(`[API:Webhook] ${requestId} - Webhook type: ${webhookData.type || 'unknown'}`);

    const aveniaService = new AveniaService();

    // Determine webhook type based on the event data
    if (webhookData.type?.includes('KYC') || webhookData.data?.attempt) {
      console.log(`[API:Webhook] ${requestId} - Processing KYC webhook`);
      await aveniaService.handleKYCWebhook(webhookData);
      console.log(`[API:Webhook] ${requestId} - KYC webhook processed successfully`);
    } else if (webhookData.type?.includes('TICKET') || webhookData.data?.ticket) {
      console.log(`[API:Webhook] ${requestId} - Processing transaction webhook`);
      await aveniaService.handleTransactionWebhook(webhookData);
      console.log(`[API:Webhook] ${requestId} - Transaction webhook processed successfully`);
    } else {
      console.warn(`[API:Webhook] ${requestId} - Unknown webhook type: ${webhookData.type}`);
      console.warn(`[API:Webhook] ${requestId} - Webhook data structure:`, Object.keys(webhookData));
    }

    const duration = Date.now() - startTime;
    console.log(`[API:Webhook] ${requestId} - Webhook processing completed (${duration}ms)`);

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[API:Webhook] ${requestId} - Webhook processing failed after ${duration}ms:`, {
      message: error.message,
      stack: error.stack,
    });
    
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Handle GET requests for webhook verification (if needed by Avenia)
export async function GET(request: NextRequest) {
  const requestId = `webhook-get-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[API:Webhook] ${requestId} - GET request received for webhook verification`);
  
  const searchParams = request.nextUrl.searchParams;
  const challenge = searchParams.get('challenge');
  
  if (challenge) {
    console.log(`[API:Webhook] ${requestId} - Webhook challenge received: ${challenge}`);
    return new NextResponse(challenge, { status: 200 });
  }
  
  console.log(`[API:Webhook] ${requestId} - Webhook endpoint health check`);
  return NextResponse.json({ 
    message: 'Avenia webhook endpoint is active',
    timestamp: new Date().toISOString(),
    endpoint: '/api/avenia/webhooks'
  });
}