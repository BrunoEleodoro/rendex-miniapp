import { NextRequest, NextResponse } from 'next/server';
import _connectMongoDB from '../../../../../lib/mongodb';
import _User from '../../../../../models/User';
import _KYCAttempt from '../../../../../models/KYCAttempt';
import _Transaction from '../../../../../models/Transaction';

// Global connections storage for SSE
const connections = new Map<string, ReadableStreamDefaultController>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const resolvedParams = await params;
  const userId = resolvedParams.userId;
  console.log(`[API:SSE] Starting SSE connection for user: ${userId}`);

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      console.log(`[API:SSE] SSE stream started for user: ${userId}`);
      
      // Store connection for this user
      connections.set(userId, controller);
      
      // Send initial connection message
      const data = JSON.stringify({
        type: 'connected',
        timestamp: new Date().toISOString(),
        message: 'Real-time updates connected'
      });
      
      controller.enqueue(`data: ${data}\n\n`);
      
      // Send periodic heartbeat
      const heartbeat = setInterval(() => {
        try {
          const heartbeatData = JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          });
          controller.enqueue(`data: ${heartbeatData}\n\n`);
        } catch (_error) {
          console.log(`[API:SSE] Heartbeat failed for user: ${userId}, cleaning up`);
          clearInterval(heartbeat);
          connections.delete(userId);
        }
      }, 30000); // Every 30 seconds
      
      // Clean up when connection closes
      request.signal.addEventListener('abort', () => {
        console.log(`[API:SSE] Connection closed for user: ${userId}`);
        clearInterval(heartbeat);
        connections.delete(userId);
        controller.close();
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

// Function to send real-time updates to connected clients  
function _sendRealTimeUpdate(userId: string, updateData: any) {
  const controller = connections.get(userId);
  
  if (controller) {
    try {
      const data = JSON.stringify({
        ...updateData,
        timestamp: new Date().toISOString()
      });
      
      console.log(`[API:SSE] Sending real-time update to user: ${userId}`, updateData);
      controller.enqueue(`data: ${data}\n\n`);
    } catch (error) {
      console.error(`[API:SSE] Failed to send update to user: ${userId}`, error);
      connections.delete(userId);
    }
  } else {
    console.log(`[API:SSE] No active connection for user: ${userId}`);
  }
}

// Note: sendRealTimeUpdate function is available for internal use but not exported
// from route files due to Next.js restrictions