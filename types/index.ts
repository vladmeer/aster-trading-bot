/**
 * Shared Type Definitions
 */

import { AsterAccountSnapshot, AsterOrder, AsterTicker, AsterDepth } from "../exchanges/aster";

export interface Position {
  positionAmt: number;
  entryPrice: number;
  unrealizedProfit: number;
}

export interface TradeStatistics {
  totalTrades: number;
  totalAmount: number;
  totalProfit: number;
}

export interface TradeLogItem {
  time: string;
  type: string;
  detail: string;
}

export interface OrderLockState {
  [key: string]: boolean;
}

export interface OrderPendingIdState {
  [key: string]: string | null;
}

export interface OrderUnlockTimerState {
  [key: string]: NodeJS.Timeout | null;
}

export interface LastOrderState {
  side: "BUY" | "SELL" | null;
  price: number | null;
}

export interface MarketSnapshot {
  account: AsterAccountSnapshot | null;
  orders: AsterOrder[];
  depth: AsterDepth | null;
  ticker: AsterTicker | null;
  klines: any[];
}

export type PositionSide = "long" | "short" | "none";
export type OrderSide = "BUY" | "SELL";

