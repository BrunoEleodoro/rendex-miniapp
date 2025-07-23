// APY Calculator for stBRLA based on provided implementation
// Simplified version for React/Next.js usage

// ABDK Math 64x64 helper functions (simplified JavaScript implementation)
class ABDKMath64x64 {
  static DECIMALS = 64;
  static ONE = BigInt(1) << BigInt(64); // 2^64

  static fromUInt(x: number) {
    return BigInt(x) << BigInt(64);
  }

  static toUInt(x: bigint) {
    return Number(x >> BigInt(64));
  }

  static divu(x: string | number | bigint, y: string | number | bigint) {
    const xBig = BigInt(x);
    const yBig = BigInt(y);
    if (yBig === 0n) throw new Error("Division by zero");
    return (xBig << BigInt(64)) / yBig;
  }

  static mulu(x: bigint, y: bigint) {
    return (x * y) >> BigInt(64);
  }

  static sub(x: bigint, y: bigint) {
    return x - y;
  }

  static div(x: bigint, y: bigint) {
    if (y === 0n) throw new Error("Division by zero");
    return (x << BigInt(64)) / y;
  }

  static mul(x: bigint, y: bigint) {
    return (x * y) >> BigInt(64);
  }
}

export interface APYResult {
  apyPercent: number;
  apyBasisPoints: number;
  timePeriodDays: number;
  startPrice?: number;
  endPrice?: number;
  currentPrice?: number;
}

export interface PriceSnapshot {
  timestamp: number;
  price: bigint;
  blockNumber?: number;
}

export class StBRLAAPYCalculator {
  private snapshots: Map<string, PriceSnapshot> = new Map();

  /**
   * Calculate current price based on total supply and BRLA balance
   */
  calculateCurrentPrice(totalSupply: bigint, brlaBalance: bigint): bigint {
    if (totalSupply === 0n) {
      return ABDKMath64x64.fromUInt(1);
    }
    return ABDKMath64x64.divu(brlaBalance.toString(), totalSupply.toString());
  }

  /**
   * Take a snapshot of current price
   */
  takeSnapshot(totalSupply: bigint, brlaBalance: bigint, label?: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const price = this.calculateCurrentPrice(totalSupply, brlaBalance);
    
    const snapshotId = label || `snapshot_${timestamp}`;
    this.snapshots.set(snapshotId, {
      timestamp,
      price,
    });

    return snapshotId;
  }

  /**
   * Calculate APY between two snapshots
   */
  calculateAPY(startSnapshotId: string, endSnapshotId: string): APYResult {
    const startSnapshot = this.snapshots.get(startSnapshotId);
    const endSnapshot = this.snapshots.get(endSnapshotId);

    if (!startSnapshot || !endSnapshot) {
      throw new Error('Invalid snapshot IDs');
    }

    const timeDiff = endSnapshot.timestamp - startSnapshot.timestamp;
    if (timeDiff <= 0) {
      throw new Error('Invalid time difference');
    }

    const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;

    // Calculate return rate: (endPrice - startPrice) / startPrice
    const priceDiff = ABDKMath64x64.sub(endSnapshot.price, startSnapshot.price);
    const returnRate = ABDKMath64x64.div(priceDiff, startSnapshot.price);

    let annualizedReturn: bigint;
    if (timeDiff >= SECONDS_PER_YEAR) {
      // For periods >= 1 year, use actual return rate
      annualizedReturn = returnRate;
    } else {
      // For shorter periods, scale to annual
      const scalingFactor = ABDKMath64x64.divu(SECONDS_PER_YEAR, timeDiff);
      annualizedReturn = ABDKMath64x64.mul(returnRate, scalingFactor);
    }

    // Convert to percentage (multiply by 10000 for basis points)
    const apyBasisPoints = ABDKMath64x64.toUInt(
      ABDKMath64x64.mul(annualizedReturn, ABDKMath64x64.fromUInt(10000))
    );

    return {
      apyPercent: apyBasisPoints / 100, // Convert basis points to percentage
      apyBasisPoints,
      timePeriodDays: timeDiff / (24 * 60 * 60),
      startPrice: ABDKMath64x64.toUInt(startSnapshot.price),
      endPrice: ABDKMath64x64.toUInt(endSnapshot.price)
    };
  }

  /**
   * Calculate APY from a snapshot to current time
   */
  calculateAPYFromSnapshot(
    snapshotId: string, 
    currentTotalSupply: bigint, 
    currentBrlaBalance: bigint
  ): APYResult {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) {
      throw new Error('Invalid snapshot ID');
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const currentPrice = this.calculateCurrentPrice(currentTotalSupply, currentBrlaBalance);

    const timeDiff = currentTimestamp - snapshot.timestamp;
    if (timeDiff <= 0) {
      throw new Error('Invalid time difference');
    }

    const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
    const priceDiff = ABDKMath64x64.sub(currentPrice, snapshot.price);
    const returnRate = ABDKMath64x64.div(priceDiff, snapshot.price);

    let annualizedReturn: bigint;
    if (timeDiff >= SECONDS_PER_YEAR) {
      annualizedReturn = returnRate;
    } else {
      const scalingFactor = ABDKMath64x64.divu(SECONDS_PER_YEAR, timeDiff);
      annualizedReturn = ABDKMath64x64.mul(returnRate, scalingFactor);
    }

    const apyBasisPoints = ABDKMath64x64.toUInt(
      ABDKMath64x64.mul(annualizedReturn, ABDKMath64x64.fromUInt(10000))
    );

    return {
      apyPercent: apyBasisPoints / 100,
      apyBasisPoints,
      timePeriodDays: timeDiff / (24 * 60 * 60),
      startPrice: ABDKMath64x64.toUInt(snapshot.price),
      currentPrice: ABDKMath64x64.toUInt(currentPrice)
    };
  }

  /**
   * Get all snapshots
   */
  getSnapshots(): Array<{ id: string; timestamp: number; priceFormatted: number }> {
    return Array.from(this.snapshots.entries()).map(([id, data]) => ({
      id,
      timestamp: data.timestamp,
      priceFormatted: ABDKMath64x64.toUInt(data.price) / Math.pow(10, 18) // Assuming 18 decimals
    }));
  }

  /**
   * Estimate APY based on recent reward distribution
   */
  static estimateAPYFromReward(
    rewardAmount: bigint, 
    totalStaked: bigint, 
    distributionFrequencyPerYear: number = 12
  ): APYResult {
    if (totalStaked === 0n) {
      throw new Error('No staked amount');
    }

    const yieldRate = ABDKMath64x64.divu(rewardAmount.toString(), totalStaked.toString());
    const annualizedYield = ABDKMath64x64.mul(
      yieldRate, 
      ABDKMath64x64.fromUInt(distributionFrequencyPerYear)
    );

    const apyBasisPoints = ABDKMath64x64.toUInt(
      ABDKMath64x64.mul(annualizedYield, ABDKMath64x64.fromUInt(10000))
    );

    return {
      apyPercent: apyBasisPoints / 100,
      apyBasisPoints,
      timePeriodDays: 365,
    };
  }

  /**
   * Clear all snapshots
   */
  clearSnapshots(): void {
    this.snapshots.clear();
  }

  /**
   * Get snapshot count
   */
  getSnapshotCount(): number {
    return this.snapshots.size;
  }
}

// Export a singleton instance for global use
export const apyCalculator = new StBRLAAPYCalculator();