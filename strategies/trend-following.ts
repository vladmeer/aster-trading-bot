/**
 * Trend Following Strategy
 * 
 * This strategy uses SMA30 (Simple Moving Average over 30 periods) to identify trends
 * and automatically opens/closes positions with stop loss and trailing stop management.
 */

import {
  Aster,
  AsterDepth,
  AsterTicker,
  AsterKline,
  AsterOrder,
  AsterAccountSnapshot,
} from "../exchanges/aster";
import "dotenv/config";
import {
  TRADING_SYMBOL,
  TRADING_AMOUNT,
  MAX_LOSS_PER_TRADE,
  TRAILING_STOP_PROFIT_ACTIVATION,
} from "../config/trading";
import {
  roundPriceToOneDecimal,
  isOrderTypeLocked,
  unlockOrderType,
  placeStopLossOrder,
  closePositionMarket,
  calculateStopLossPrice,
  calculateTrailingActivationPrice,
  placeTrailingStopOrder,
  placeMarketOrder
} from "../utils/order";
import { logTrade, printStatus } from "../utils/log";
import { getPosition, calculateSMA30 } from "../utils/helper";
import type { TradeLogItem, Position, OrderLockState, OrderPendingIdState, OrderUnlockTimerState, LastOrderState } from "../types";

const aster = new Aster(
  process.env.ASTER_API_KEY!,
  process.env.ASTER_API_SECRET!
);

// Market data snapshots
let accountSnapshot: AsterAccountSnapshot | null = null;
let openOrders: AsterOrder[] = [];
let depthSnapshot: AsterDepth | null = null;
let tickerSnapshot: AsterTicker | null = null;
let klineSnapshot: AsterKline[] = [];

// Trading statistics
let tradeLog: TradeLogItem[] = [];
let totalProfit = 0;
let totalTrades = 0;

// Order management locks
let orderTypeLocks: OrderLockState = {};
let orderTypePendingOrderId: OrderPendingIdState = {};
let orderTypeUnlockTimer: OrderUnlockTimerState = {};

// Subscribe to market data streams
aster.watchAccount((data) => {
  accountSnapshot = data;
});

aster.watchOrder((orders: AsterOrder[]) => {
  // Unlock order types when pending orders are filled or cancelled
  Object.keys(orderTypePendingOrderId).forEach(type => {
    const pendingOrderId = orderTypePendingOrderId[type];
    if (pendingOrderId) {
      const pendingOrder = orders.find(o => String(o.orderId) === String(pendingOrderId));
      if (pendingOrder) {
        if (pendingOrder.status && pendingOrder.status !== "NEW") {
          unlockOrderType(orderTypeLocks, orderTypeUnlockTimer, orderTypePendingOrderId, type);
        }
      } else {
        // Order not found, means it's been filled or cancelled
        unlockOrderType(orderTypeLocks, orderTypeUnlockTimer, orderTypePendingOrderId, type);
      }
    }
  });
  // Filter out market orders from open orders list
  openOrders = Array.isArray(orders) ? orders.filter(o => o.type !== 'MARKET') : [];
});

aster.watchDepth(TRADING_SYMBOL, (depth: AsterDepth) => {
  depthSnapshot = depth;
});

aster.watchTicker(TRADING_SYMBOL, (ticker: AsterTicker) => {
  tickerSnapshot = ticker;
});

aster.watchKline(TRADING_SYMBOL, "1m", (klines: AsterKline[]) => {
  klineSnapshot = klines;
});

/**
 * Check if all required market data is available
 */
function isMarketDataReady(): boolean {
  return accountSnapshot !== null && 
         tickerSnapshot !== null && 
         depthSnapshot !== null && 
         klineSnapshot.length > 0;
}

/**
 * Check if position is empty (no position held)
 */
function hasNoPosition(position: Position): boolean {
  return Math.abs(position.positionAmt) < 0.00001;
}

/**
 * Handle opening new positions when price crosses SMA30
 */
async function handlePositionOpening(
  lastPrice: number | null,
  lastSMA30: number,
  currentPrice: number,
  openOrders: AsterOrder[],
  orderTypeLocks: OrderLockState,
  aster: Aster,
  tradeLog: TradeLogItem[],
  lastOpenOrder: LastOrderState
): Promise<void> {
  // Cancel all existing orders before opening new position
  if (openOrders.length > 0) {
    isOrderTypeLocked(orderTypeLocks, "MARKET");
    await aster.cancelAllOrders({ symbol: TRADING_SYMBOL });
  }

  // Only place market order when price crosses SMA30
  if (lastPrice !== null) {
    // Price crossed below SMA30 - open short position
    if (lastPrice > lastSMA30 && currentPrice < lastSMA30) {
      isOrderTypeLocked(orderTypeLocks, "MARKET");
      await placeMarketOrder(
        aster,
        openOrders,
        orderTypeLocks,
        orderTypeUnlockTimer,
        orderTypePendingOrderId,
        "SELL",
        TRADING_AMOUNT,
        (type: string, detail: string) => logTrade(tradeLog, type, detail)
      );
      logTrade(tradeLog, "open", `Crossed below SMA30, market open short: SELL @ ${currentPrice}`);
      lastOpenOrder.side = "SELL";
      lastOpenOrder.price = currentPrice;
    } 
    // Price crossed above SMA30 - open long position
    else if (lastPrice < lastSMA30 && currentPrice > lastSMA30) {
      isOrderTypeLocked(orderTypeLocks, "MARKET");
      await placeMarketOrder(
        aster,
        openOrders,
        orderTypeLocks,
        orderTypeUnlockTimer,
        orderTypePendingOrderId,
        "BUY",
        TRADING_AMOUNT,
        (type: string, detail: string) => logTrade(tradeLog, type, detail)
      );
      logTrade(tradeLog, "open", `Crossed above SMA30, market open long: BUY @ ${currentPrice}`);
      lastOpenOrder.side = "BUY";
      lastOpenOrder.price = currentPrice;
    }
  }
}

/**
 * Handle position management including stop loss and trailing stops
 */
async function handlePositionManagement(
  position: Position,
  currentPrice: number,
  lastSMA30: number,
  openOrders: AsterOrder[],
  orderTypeLocks: OrderLockState,
  orderTypeUnlockTimer: OrderUnlockTimerState,
  orderTypePendingOrderId: OrderPendingIdState,
  tickerSnapshot: AsterTicker,
  aster: Aster,
  tradeLog: TradeLogItem[],
  lastCloseOrder: LastOrderState,
  lastStopOrder: LastOrderState
): Promise<{ closed: boolean; pnl: number }> {
  const direction = position.positionAmt > 0 ? "long" : "short";
  const pnl = (direction === "long" 
    ? currentPrice - position.entryPrice 
    : position.entryPrice - currentPrice) * Math.abs(position.positionAmt);
  
  const stopSide: "SELL" | "BUY" = direction === "long" ? "SELL" : "BUY";
  const stopPrice = calculateStopLossPrice(
    position.entryPrice,
    Math.abs(position.positionAmt),
    direction as "long" | "short",
    MAX_LOSS_PER_TRADE
  );
  
  const activationPrice = calculateTrailingActivationPrice(
    position.entryPrice,
    Math.abs(position.positionAmt),
    direction as "long" | "short",
    TRAILING_STOP_PROFIT_ACTIVATION
  );

  const hasStopOrder = openOrders.some((o: AsterOrder) => o.type === "STOP_MARKET" && o.side === stopSide);
  const hasTrailingOrder = openOrders.some((o: AsterOrder) => o.type === "TRAILING_STOP_MARKET" && o.side === stopSide);
  
  const profitMoveThreshold = 0.05;
  const profitMoveStopPrice = direction === "long"
    ? roundPriceToOneDecimal(position.entryPrice + profitMoveThreshold / Math.abs(position.positionAmt))
    : roundPriceToOneDecimal(position.entryPrice - profitMoveThreshold / Math.abs(position.positionAmt));
  
  const currentStopOrder = openOrders.find((o: AsterOrder) => o.type === "STOP_MARKET" && o.side === stopSide);

  // If profit > 0.1 USDT, move stop loss to breakeven + 0.05 USDT profit
  if (pnl > 0.1 || position.unrealizedProfit > 0.1) {
    if (!currentStopOrder) {
      isOrderTypeLocked(orderTypeLocks, "MARKET");
      await placeStopLossOrder(
        aster,
        openOrders,
        orderTypeLocks,
        orderTypeUnlockTimer,
        orderTypePendingOrderId,
        tickerSnapshot,
        stopSide,
        profitMoveStopPrice,
        (type: string, detail: string) => logTrade(tradeLog, type, detail)
      );
      logTrade(tradeLog, "stop", `Profit > 0.1u, place profit 0.05u stop loss order: ${stopSide} @ ${profitMoveStopPrice}`);
    } else {
      const currentStopPrice = parseFloat(currentStopOrder.stopPrice);
      if (Math.abs(currentStopPrice - profitMoveStopPrice) > 0.01) {
        isOrderTypeLocked(orderTypeLocks, "MARKET");
        await aster.cancelOrder({ symbol: TRADING_SYMBOL, orderId: currentStopOrder.orderId });
        isOrderTypeLocked(orderTypeLocks, "MARKET");
        await placeStopLossOrder(
          aster,
          openOrders,
          orderTypeLocks,
          orderTypeUnlockTimer,
          orderTypePendingOrderId,
          tickerSnapshot,
          stopSide,
          profitMoveStopPrice,
          (type: string, detail: string) => logTrade(tradeLog, type, detail)
        );
        logTrade(tradeLog, "stop", `Profit > 0.1u, move stop loss order to profit 0.05u: ${stopSide} @ ${profitMoveStopPrice}`);
      }
    }
  }

  // Place initial stop loss if not exists
  if (!hasStopOrder) {
    isOrderTypeLocked(orderTypeLocks, "MARKET");
    await placeStopLossOrder(
      aster,
      openOrders,
      orderTypeLocks,
      orderTypeUnlockTimer,
      orderTypePendingOrderId,
      tickerSnapshot,
      stopSide,
      roundPriceToOneDecimal(stopPrice),
      (type: string, detail: string) => logTrade(tradeLog, type, detail)
    );
  }

  // Place trailing stop if not exists
  if (!hasTrailingOrder) {
    isOrderTypeLocked(orderTypeLocks, "MARKET");
    await placeTrailingStopOrder(
      aster,
      openOrders,
      orderTypeLocks,
      orderTypeUnlockTimer,
      orderTypePendingOrderId,
      stopSide,
      roundPriceToOneDecimal(activationPrice),
      Math.abs(position.positionAmt),
      (type: string, detail: string) => logTrade(tradeLog, type, detail)
    );
  }

  // Force close if loss exceeds limit
  if (pnl < -MAX_LOSS_PER_TRADE || position.unrealizedProfit < -MAX_LOSS_PER_TRADE) {
    if (openOrders.length > 0) {
      isOrderTypeLocked(orderTypeLocks, "MARKET");
      const orderIdList = openOrders.map(o => o.orderId);
      await aster.cancelOrders({ symbol: TRADING_SYMBOL, orderIdList });
    }
    isOrderTypeLocked(orderTypeLocks, "MARKET");
    await closePositionMarket(
      aster,
      openOrders,
      orderTypeLocks,
      orderTypeUnlockTimer,
      orderTypePendingOrderId,
      direction === "long" ? "SELL" : "BUY",
      (type: string, detail: string) => logTrade(tradeLog, type, detail)
    );
    lastCloseOrder.side = null;
    lastCloseOrder.price = null;
    lastStopOrder.side = null;
    lastStopOrder.price = null;
    logTrade(tradeLog, "close", `Stop loss close position: ${direction === "long" ? "SELL" : "BUY"}`);
    return { closed: true, pnl };
  }

  return { closed: false, pnl };
}

/**
 * Main trend following strategy loop
 */
async function runTrendFollowingStrategy(): Promise<void> {
  let lastSMA30: number | null = null;
  let lastPrice: number | null = null;
  let lastOpenOrder: LastOrderState = { side: null, price: null };
  let lastCloseOrder: LastOrderState = { side: null, price: null };
  let lastStopOrder: LastOrderState = { side: null, price: null };

  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!isMarketDataReady()) continue;

    lastSMA30 = calculateSMA30(klineSnapshot);
    if (lastSMA30 === null) continue;

    const orderBook = depthSnapshot!;
    const ticker = tickerSnapshot!;
    const currentPrice = parseFloat(ticker.lastPrice);
    const position = getPosition(accountSnapshot, TRADING_SYMBOL);

    let trend = "No signal";
    if (currentPrice < lastSMA30) trend = "Short";
    if (currentPrice > lastSMA30) trend = "Long";

    let pnl = 0;

    if (hasNoPosition(position)) {
      await handlePositionOpening(
        lastPrice,
        lastSMA30,
        currentPrice,
        openOrders,
        orderTypeLocks,
        aster,
        tradeLog,
        lastOpenOrder
      );
      lastStopOrder.side = null;
      lastStopOrder.price = null;
    } else {
      const result = await handlePositionManagement(
        position,
        currentPrice,
        lastSMA30,
        openOrders,
        orderTypeLocks,
        orderTypeUnlockTimer,
        orderTypePendingOrderId,
        ticker,
        aster,
        tradeLog,
        lastCloseOrder,
        lastStopOrder
      );
      pnl = result.pnl;
      if (result.closed) {
        totalTrades++;
        totalProfit += pnl;
        continue;
      }
    }

    printStatus({
      ticker,
      ob: orderBook,
      sma: lastSMA30,
      trend,
      openOrder: hasNoPosition(position) && lastOpenOrder.side && lastOpenOrder.price
        ? { side: lastOpenOrder.side, price: lastOpenOrder.price, amount: TRADING_AMOUNT }
        : null,
      closeOrder: !hasNoPosition(position) && lastCloseOrder.side && lastCloseOrder.price
        ? { side: lastCloseOrder.side, price: lastCloseOrder.price, amount: Math.abs(position.positionAmt) }
        : null,
      stopOrder: !hasNoPosition(position) && lastStopOrder.side && lastStopOrder.price
        ? { side: lastStopOrder.side, stopPrice: lastStopOrder.price }
        : null,
      pos: position,
      pnl,
      unrealized: position.unrealizedProfit,
      tradeLog,
      totalProfit,
      totalTrades,
      openOrders
    });

    lastPrice = currentPrice;
  }
}

// Start the strategy
runTrendFollowingStrategy().catch(console.error);

