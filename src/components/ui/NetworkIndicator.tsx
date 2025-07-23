'use client';

import { useAccount } from 'wagmi';
import { useEnsurePolygonNetwork } from '../../lib/contracts';
import { polygon } from 'wagmi/chains';
import { Button } from './Button';

export const NetworkIndicator = () => {
  const { isConnected, chainId } = useAccount();
  const { isOnPolygon, needsSwitch, switchToPolygon } = useEnsurePolygonNetwork();

  if (!isConnected) {
    return null;
  }

  const getChainName = (chainId: number) => {
    switch (chainId) {
      case polygon.id:
        return 'Polygon';
      case 1:
        return 'Ethereum';
      case 8453:
        return 'Base';
      case 10:
        return 'Optimism';
      default:
        return `Chain ${chainId}`;
    }
  };

  if (isOnPolygon) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
        <span>Polygon Network</span>
      </div>
    );
  }

  if (needsSwitch) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          <span className="text-orange-800 text-sm font-medium">
            Connected to {getChainName(chainId!)}
          </span>
        </div>
        <Button
          onClick={switchToPolygon}
          size="sm"
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          Switch to Polygon
        </Button>
      </div>
    );
  }

  return null;
};