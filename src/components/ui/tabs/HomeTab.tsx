"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/badge";

/**
 * HomeTab component displays the main landing content for the mini app.
 * 
 * This is the default tab that users see when they first open the mini app.
 * It provides a simple welcome message and placeholder content that can be
 * customized for specific use cases.
 * 
 * @example
 * ```tsx
 * <HomeTab />
 * ```
 */
export function HomeTab() {
  return (
    <div className="space-y-6 py-6">
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Welcome to your Mini App</h2>
          <p className="text-muted-foreground">
            Built with shadcn/ui components and powered by Neynar 🪐
          </p>
        </div>
        
        <div className="flex justify-center gap-2">
          <Badge variant="secondary">DeFi</Badge>
          <Badge variant="secondary">BRLA</Badge>
          <Badge variant="secondary">Farcaster</Badge>
        </div>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>BRLA Stablecoins</CardTitle>
            <CardDescription>
              Track and manage your BRLA stablecoin positions with integrations to Morpho, Aave, and USDC protocols.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This mini app provides a comprehensive interface for DeFi operations with BRLA stablecoins.
            </p>
            <Button className="w-full">
              Get Started
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm">Morpho Protocol Integration</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm">Aave Protocol Support</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm">USDC Integration</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm">Farcaster Authentication</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 