import { Aster, CreateOrderParams, AsterOrder } from "../exchanges/aster";
import { TRADING_SYMBOL, TRADING_AMOUNT, TRAILING_STOP_CALLBACK_RATE } from "../config/trading";
import type { OrderLockState, OrderUnlockTimerState, OrderPendingIdState } from "../types";

/**
 * Round price to 1 decimal place
 */
export function roundPriceToOneDecimal(price: number): number {
  return Math.floor(price * 10) / 10;
}

/**
 * Round quantity to 3 decimal places
 */
export function roundQuantityToThreeDecimals(quantity: number): number {
  return Math.floor(quantity * 1000) / 1000;
}

/**
 * Check if an order type is currently locked
 */
export function isOrderTypeLocked(orderTypeLocks: OrderLockState, type: string): boolean {
  return !!orderTypeLocks[type];
}

/**
 * Lock an order type to prevent concurrent operations
 */
export function lockOrderType(
  orderTypeLocks: OrderLockState,
  orderTypeUnlockTimer: OrderUnlockTimerState,
  orderTypePendingOrderId: OrderPendingIdState,
  type: string,
  logTrade: (type: string, detail: string) => void,
  timeout = 3000
): void {
  orderTypeLocks[type] = true;
  if (orderTypeUnlockTimer[type]) clearTimeout(orderTypeUnlockTimer[type]!);
  orderTypeUnlockTimer[type] = setTimeout(() => {
    orderTypeLocks[type] = false;
    orderTypePendingOrderId[type] = null;
    logTrade("error", `${type} operation timeout, auto unlock`);
  }, timeout);
}

/**
 * Unlock an order type
 */
export function unlockOrderType(
  orderTypeLocks: OrderLockState,
  orderTypeUnlockTimer: OrderUnlockTimerState,
  orderTypePendingOrderId: OrderPendingIdState,
  type: string
): void {
  orderTypeLocks[type] = false;
  orderTypePendingOrderId[type] = null;
  if (orderTypeUnlockTimer[type]) clearTimeout(orderTypeUnlockTimer[type]!);
  orderTypeUnlockTimer[type] = null;
}

/**
 * Remove duplicate orders of the same type and side
 */
export async function deduplicateOrders(
  aster: Aster,
  openOrders: AsterOrder[],
  orderTypeLocks: OrderLockState,
  orderTypeUnlockTimer: OrderUnlockTimerState,
  orderTypePendingOrderId: OrderPendingIdState,
  type: string,
  side: string,
  logTrade: (type: string, detail: string) => void
): Promise<void> {
  const sameTypeOrders = openOrders.filter(o => o.type === type && o.side === side);
  if (sameTypeOrders.length <= 1) return;
  
  sameTypeOrders.sort((a, b) => {
    const ta = b.updateTime || b.time || 0;
    const tb = a.updateTime || a.time || 0;
    return ta - tb;
  });
  
  const toCancel = sameTypeOrders.slice(1);
  const orderIdList = toCancel.map(o => o.orderId);
  
  if (orderIdList.length > 0) {
    try {
      lockOrderType(orderTypeLocks, orderTypeUnlockTimer, orderTypePendingOrderId, type, logTrade);
      await aster.cancelOrders({ symbol: TRADING_SYMBOL, orderIdList });
      logTrade("order", `Deduplicate: cancel duplicate ${type} orders: ${orderIdList.join(",")}`);
    } catch (e) {
      logTrade("error", `Deduplicate cancel failed: ${e}`);
    } finally {
      unlockOrderType(orderTypeLocks, orderTypeUnlockTimer, orderTypePendingOrderId, type);
    }
  }
}

/**
 * Place a limit order
 */
export async function placeLimitOrder(
  aster: Aster,
  openOrders: AsterOrder[],
  orderTypeLocks: OrderLockState,
  orderTypeUnlockTimer: OrderUnlockTimerState,
  orderTypePendingOrderId: OrderPendingIdState,
  side: "BUY" | "SELL",
  price: number,
  amount: number,
  logTrade: (type: string, detail: string) => void,
  reduceOnly = false
): Promise<AsterOrder | undefined> {
  const type = "LIMIT";
  if (isOrderTypeLocked(orderTypeLocks, type)) return;
  
  const params: CreateOrderParams = {
    symbol: TRADING_SYMBOL,
    side,
    type,
    quantity: roundQuantityToThreeDecimals(amount),
    price: roundPriceToOneDecimal(price),
    timeInForce: "GTX",
  };
  if (reduceOnly) params.reduceOnly = "true";
  params.price = roundPriceToOneDecimal(params.price!);
  
  await deduplicateOrders(aster, openOrders, orderTypeLocks, orderTypeUnlockTimer, orderTypePendingOrderId, type, side, logTrade);
  lockOrderType(orderTypeLocks, orderTypeUnlockTimer, orderTypePendingOrderId, type, logTrade);
  
  try {
    const order = await aster.createOrder(params);
    orderTypePendingOrderId[type] = String(order.orderId);
    logTrade(
      "order",
      `Place order: ${side} @ ${params.price} Amount: ${params.quantity} reduceOnly: ${reduceOnly}`
    );
    return order;
  } catch (e) {
    unlockOrderType(orderTypeLocks, orderTypeUnlockTimer, orderTypePendingOrderId, type);
    throw e;
  }
}

/**
 * Place a stop loss order
 */
export async function placeStopLossOrder(
  aster: Aster,
  openOrders: AsterOrder[],
  orderTypeLocks: OrderLockState,
  orderTypeUnlockTimer: OrderUnlockTimerState,
  orderTypePendingOrderId: OrderPendingIdState,
  tickerSnapshot: { lastPrice: string },
  side: "BUY" | "SELL",
  stopPrice: number,
  logTrade: (type: string, detail: string) => void
): Promise<AsterOrder | undefined> {
  const type = "STOP_MARKET";
  if (isOrderTypeLocked(orderTypeLocks, type)) return;
  
  if (!tickerSnapshot) {
    logTrade("error", `Stop loss order failed: unable to get latest price`);
    return;
  }
  
  const lastPrice = parseFloat(tickerSnapshot.lastPrice);
  if (side === "SELL" && stopPrice >= lastPrice) {
    logTrade(
      "error",
      `Stop loss price (${stopPrice}) is higher than or equal to current price (${lastPrice}), skip order`
    );
    return;
  }
  if (side === "BUY" && stopPrice <= lastPrice) {
    logTrade(
      "error",
      `Stop loss price (${stopPrice}) is lower than or equal to current price (${lastPrice}), skip order`
    );
    return;
  }
  
  const params: CreateOrderParams = {
    symbol: TRADING_SYMBOL,
    side,
    type,
    stopPrice: roundPriceToOneDecimal(stopPrice),
    closePosition: "true",
    timeInForce: "GTC",
    quantity: roundQuantityToThreeDecimals(TRADING_AMOUNT),
  };
  params.stopPrice = roundPriceToOneDecimal(params.stopPrice!);
  
  await deduplicateOrders(aster, openOrders, orderTypeLocks, orderTypeUnlockTimer, orderTypePendingOrderId, type, side, logTrade);
  lockOrderType(orderTypeLocks, orderTypeUnlockTimer, orderTypePendingOrderId, type, logTrade);
  
  try {
    const order = await aster.createOrder(params);
    orderTypePendingOrderId[type] = String(order.orderId);
    logTrade("stop", `Place stop loss order: ${side} STOP_MARKET @ ${params.stopPrice}`);
    return order;
  } catch (e) {
    unlockOrderType(orderTypeLocks, orderTypeUnlockTimer, orderTypePendingOrderId, type);
    throw e;
  }
}

/**
 * Close position using market order
 */
export async function closePositionMarket(
  aster: Aster,
  openOrders: AsterOrder[],
  orderTypeLocks: OrderLockState,
  orderTypeUnlockTimer: OrderUnlockTimerState,
  orderTypePendingOrderId: OrderPendingIdState,
  side: "SELL" | "BUY",
  logTrade: (type: string, detail: string) => void
): Promise<void> {
  const type = "MARKET";
  if (isOrderTypeLocked(orderTypeLocks, type)) return;
  
  const params: CreateOrderParams = {
    symbol: TRADING_SYMBOL,
    side,
    type,
    quantity: roundQuantityToThreeDecimals(TRADING_AMOUNT),
    reduceOnly: "true",
  };
  
  await deduplicateOrders(aster, openOrders, orderTypeLocks, orderTypeUnlockTimer, orderTypePendingOrderId, type, side, logTrade);
  lockOrderType(orderTypeLocks, orderTypeUnlockTimer, orderTypePendingOrderId, type, logTrade);
  
  try {
    const order = await aster.createOrder(params);
    orderTypePendingOrderId[type] = String(order.orderId);
    logTrade("close", `Market close position: ${side}`);
  } catch (e) {
    unlockOrderType(orderTypeLocks, orderTypeUnlockTimer, orderTypePendingOrderId, type);
    throw e;
  }
}

/**
 * Calculate stop loss price based on entry price and maximum loss
 */
export function calculateStopLossPrice(
  entryPrice: number,
  quantity: number,
  side: "long" | "short",
  maxLoss: number
): number {
  if (side === "long") {
    return entryPrice - maxLoss / quantity;
  } else {
    return entryPrice + maxLoss / Math.abs(quantity);
  }
}

/**
 * Calculate trailing stop activation price
 */
export function calculateTrailingActivationPrice(
  entryPrice: number,
  quantity: number,
  side: "long" | "short",
  profitActivation: number
): number {
  if (side === "long") {
    return entryPrice + profitActivation / quantity;
  } else {
    return entryPrice - profitActivation / Math.abs(quantity);
  }
}

/**
 * Place a trailing stop order
 */
export async function placeTrailingStopOrder(
  aster: Aster,
  openOrders: AsterOrder[],
  orderTypeLocks: OrderLockState,
  orderTypeUnlockTimer: OrderUnlockTimerState,
  orderTypePendingOrderId: OrderPendingIdState,
  side: "BUY" | "SELL",
  activationPrice: number,
  quantity: number,
  logTrade: (type: string, detail: string) => void
): Promise<AsterOrder | undefined> {
  const type = "TRAILING_STOP_MARKET";
  if (isOrderTypeLocked(orderTypeLocks, type)) return;
  
  const params: CreateOrderParams = {
    symbol: TRADING_SYMBOL,
    side,
    type,
    quantity: roundQuantityToThreeDecimals(quantity),
    reduceOnly: "true",
    activationPrice: roundPriceToOneDecimal(activationPrice),
    callbackRate: TRAILING_STOP_CALLBACK_RATE,
    timeInForce: "GTC",
  };
  params.activationPrice = roundPriceToOneDecimal(params.activationPrice!);
  
  await deduplicateOrders(aster, openOrders, orderTypeLocks, orderTypeUnlockTimer, orderTypePendingOrderId, type, side, logTrade);
  lockOrderType(orderTypeLocks, orderTypeUnlockTimer, orderTypePendingOrderId, type, logTrade);
  
  try {
    const order = await aster.createOrder(params);
    orderTypePendingOrderId[type] = String(order.orderId);
    logTrade(
      "order",
      `Place trailing stop order: ${side} TRAILING_STOP_MARKET activationPrice=${params.activationPrice} callbackRate=${TRAILING_STOP_CALLBACK_RATE}`
    );
    return order;
  } catch (e) {
    unlockOrderType(orderTypeLocks, orderTypeUnlockTimer, orderTypePendingOrderId, type);
    throw e;
  }
}

/**
 * Place a market order
 */
export async function placeMarketOrder(
  aster: Aster,
  openOrders: AsterOrder[],
  orderTypeLocks: OrderLockState,
  orderTypeUnlockTimer: OrderUnlockTimerState,
  orderTypePendingOrderId: OrderPendingIdState,
  side: "BUY" | "SELL",
  amount: number,
  logTrade: (type: string, detail: string) => void,
  reduceOnly = false
): Promise<AsterOrder | undefined> {
  const type = "MARKET";
  if (isOrderTypeLocked(orderTypeLocks, type)) return;
  
  const params: CreateOrderParams = {
    symbol: TRADING_SYMBOL,
    side,
    type,
    quantity: roundQuantityToThreeDecimals(amount),
  };
  if (reduceOnly) params.reduceOnly = "true";
  
  await deduplicateOrders(aster, openOrders, orderTypeLocks, orderTypeUnlockTimer, orderTypePendingOrderId, type, side, logTrade);
  lockOrderType(orderTypeLocks, orderTypeUnlockTimer, orderTypePendingOrderId, type, logTrade);
  
  try {
    const order = await aster.createOrder(params);
    orderTypePendingOrderId[type] = String(order.orderId);
    logTrade("order", `Market order: ${side} Amount: ${params.quantity} reduceOnly: ${reduceOnly}`);
    return order;
  } catch (e) {
    unlockOrderType(orderTypeLocks, orderTypeUnlockTimer, orderTypePendingOrderId, type);
    throw e;
  }
}
