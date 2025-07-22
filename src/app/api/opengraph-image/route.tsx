import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { APP_URL } from "~/lib/constants";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return new ImageResponse(
    (
      <div tw="flex h-full w-full">
        <img 
          src={`${APP_URL}/banner.png`} 
          alt="Banner" 
          tw="w-full h-full object-cover" 
        />
      </div>
    ),
    {
      width: 1200,
      height: 800,
    }
  );
}