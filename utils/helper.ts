import type { Position } from "../types";
import type { AsterAccountSnapshot, AsterKline } from "../exchanges/aster";

/**
 * Get position information from account snapshot
 */
export function getPosition(
  accountSnapshot: AsterAccountSnapshot | null,
  tradingSymbol: string
): Position {
  if (!accountSnapshot) {
    return { positionAmt: 0, entryPrice: 0, unrealizedProfit: 0 };
  }
  
  const position = accountSnapshot.positions?.find((p) => p.symbol === tradingSymbol);
  if (!position) {
    return { positionAmt: 0, entryPrice: 0, unrealizedProfit: 0 };
  }
  
  return {
    positionAmt: parseFloat(position.positionAmt),
    entryPrice: parseFloat(position.entryPrice),
    unrealizedProfit: parseFloat(position.unrealizedProfit),
  };
}

/**
 * Calculate Simple Moving Average over 30 periods (SMA30)
 */
export function calculateSMA30(klineSnapshot: AsterKline[]): number | null {
  if (!klineSnapshot || klineSnapshot.length < 30) {
    return null;
  }
  
  const closes = klineSnapshot.slice(-30).map((k) => parseFloat(k.close));
  return closes.reduce((sum, price) => sum + price, 0) / closes.length;
}
