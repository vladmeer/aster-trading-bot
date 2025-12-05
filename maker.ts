import { pro as ccxt } from "ccxt";
import "dotenv/config";
import { TRADE_SYMBOL, TRADE_AMOUNT, LOSS_LIMIT } from "./config";

const asterPrivate = new ccxt.binance({
  apiKey: process.env.ASTER_API_KEY,
  secret: process.env.ASTER_API_SECRET,
  options: {
    defaultType: "swap",
  },
  urls: {
    api: {
      fapiPublic: "https://fapi.asterdex.com/fapi/v1",
      fapiPublicV2: "https://fapi.asterdex.com/fapi/v2",
      fapiPublicV3: "https://fapi.asterdex.com/fapi/v2",
      fapiPrivate: "https://fapi.asterdex.com/fapi/v1",
      fapiPrivateV2: "https://fapi.asterdex.com/fapi/v2",
      fapiPrivateV3: "https://fapi.asterdex.com/fapi/v2",
      fapiData: "https://fapi.asterdex.com/futures/data",
      public: "https://fapi.asterdex.com/fapi/v1",
      private: "https://fapi.asterdex.com/fapi/v2",
      v1: "https://fapi.asterdex.com/fapi/v1",
      ws: {
        spot: "wss://fstream.asterdex.com/ws",
        margin: "wss://fstream.asterdex.com/ws",
        future: "wss://fstream.asterdex.com/ws",
        "ws-api": "wss://fstream.asterdex.com/ws",
      },
    },
  },
});

const aster = new ccxt.binance({
  options: {
    defaultType: "swap",
  },
  urls: {
    api: {
      fapiPublic: "https://fapi.asterdex.com/fapi/v1",
      fapiPublicV2: "https://fapi.asterdex.com/fapi/v2",
      fapiPublicV3: "https://fapi.asterdex.com/fapi/v2",
      fapiPrivate: "https://fapi.asterdex.com/fapi/v1",
      fapiPrivateV2: "https://fapi.asterdex.com/fapi/v2",
      fapiPrivateV3: "https://fapi.asterdex.com/fapi/v2",
      fapiData: "https://fapi.asterdex.com/futures/data",
      public: "https://fapi.asterdex.com/fapi/v1",
      private: "https://fapi.asterdex.com/fapi/v2",
      v1: "https://fapi.asterdex.com/fapi/v1",
      ws: {
        spot: "wss://fstream.asterdex.com/ws",
        margin: "wss://fstream.asterdex.com/ws",
        future: "wss://fstream.asterdex.com/ws",
        "ws-api": "wss://fstream.asterdex.com/ws",
      },
    },
  },
});

let position: "long" | "short" | "none" = "none";
let entryPrice = 0;
let orderBuy: any = null;
let orderSell: any = null;
let wsOrderbook: any = null;
let recentUnrealizedProfit = 0;
let lastPositionAmt = 0;
let lastEntryPrice = 0;

// Global order status monitoring queue
let pendingOrders: { orderId: string | number, lastStatus?: string }[] = [];

// Async order status watcher
async function orderStatusWatcher() {
  while (true) {
    if (pendingOrders.length === 0) {
      await new Promise(r => setTimeout(r, 500));
      continue;
    }
    for (let i = pendingOrders.length - 1; i >= 0; i--) {
      const { orderId, lastStatus } = pendingOrders[i];
      try {
        const order = await asterPrivate.fapiPrivateGetOrder({ symbol: TRADE_SYMBOL, orderId });
        if (order) {
          if (order.status !== lastStatus) {
            console.log(`[Order Status Change] Order ID: ${orderId}, New Status: ${order.status}`);
            pendingOrders[i].lastStatus = order.status;
          }
          if (["FILLED", "CANCELED", "REJECTED", "EXPIRED"].includes(order.status)) {
            pendingOrders.splice(i, 1); // Remove finalized orders
          }
        }
      } catch (e) {
        // Network errors, etc., ignore
      }
    }
    await new Promise(r => setTimeout(r, 1000));
  }
}

// Start order status watcher
orderStatusWatcher();

// Modified placeOrder only handles placing orders and returns order object
async function placeOrder(side: "BUY" | "SELL", price: number, amount: number, reduceOnly = false): Promise<any> {
  try {
    const params: any = {
      symbol: TRADE_SYMBOL,
      side,
      type: "LIMIT",
      quantity: amount,
      price,
      timeInForce: "GTX",
    };
    if (reduceOnly) params.reduceOnly = true;
    const order = await asterPrivate.fapiPrivatePostOrder(params);
    if (order && order.orderId) {
      console.log(`[Order Placed] ${side} ${amount} @ ${price} reduceOnly=${reduceOnly}, Order ID: ${order.orderId}`);
      pendingOrders.push({ orderId: order.orderId }); // Add to monitoring queue
      return order;
    } else {
      console.log(`[Order Failed] ${side} ${amount} @ ${price} reduceOnly=${reduceOnly}`);
      return null;
    }
  } catch (e) {
    console.log(`[Order Exception] ${side} ${amount} @ ${price} reduceOnly=${reduceOnly}`, e);
    return null;
  }
}

async function getPosition() {
  try {
    const account = await asterPrivate.fapiPrivateV2GetAccount();
    if (account && typeof account.totalUnrealizedProfit === 'string') {
      recentUnrealizedProfit = parseFloat(account.totalUnrealizedProfit);
    }
    if (!account || !account.positions || !Array.isArray(account.positions)) return { positionAmt: 0, entryPrice: 0, unrealizedProfit: 0 };
    const pos = account.positions.find((p: any) => p.symbol === TRADE_SYMBOL);
    if (!pos) return { positionAmt: 0, entryPrice: 0, unrealizedProfit: 0 };
    const positionAmt = parseFloat(pos.positionAmt);
    const entryPrice = parseFloat(pos.entryPrice);
    if (positionAmt !== lastPositionAmt || entryPrice !== lastEntryPrice) {
      console.log(`[Position Change] Position Amount: ${lastPositionAmt} => ${positionAmt}, Entry Price: ${lastEntryPrice} => ${entryPrice}`);
      lastPositionAmt = positionAmt;
      lastEntryPrice = entryPrice;
    }
    return {
      positionAmt,
      entryPrice,
      unrealizedProfit: parseFloat(pos.unrealizedProfit)
    };
  } catch (e) {
    return { positionAmt: 0, entryPrice: 0, unrealizedProfit: 0 };
  }
}

async function marketClose(side: "SELL" | "BUY") {
  try {
    await asterPrivate.fapiPrivatePostOrder({
      symbol: TRADE_SYMBOL,
      side,
      type: "MARKET",
      quantity: TRADE_AMOUNT,
      reduceOnly: true
    });
  } catch (e) {
    console.log("Market close failed", e);
  }
}

function watchOrderBookWS(symbol: string) {
  (async () => {
    while (true) {
      try {
        wsOrderbook = await aster.watchOrderBook(symbol, 5);
      } catch (e) {
        console.log("WS orderbook error", e);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  })();
}

// Start WS subscription
watchOrderBookWS(TRADE_SYMBOL);

async function ensureNoPendingReduceOnly(side: "BUY" | "SELL", price: number) {
  // Check if there are any unfilled reduceOnly orders
  const openOrders = await asterPrivate.fapiPrivateGetOpenOrders({ symbol: TRADE_SYMBOL });
  return !openOrders.some((o: any) => o.side === side && o.reduceOnly && parseFloat(o.price) === price);
}

async function cancelAllOrders() {
  try {
    await asterPrivate.fapiPrivateDeleteAllOpenOrders({ symbol: TRADE_SYMBOL });
  } catch (e) {
    console.log("Cancel orders failed", e);
  }
}

async function makerStrategy() {
  while (true) {
    try {
      // 1. Get order book (using wsOrderbook)
      const ob = wsOrderbook;
      if (!ob) {
        await new Promise(r => setTimeout(r, 200));
        continue;
      }
      let buy1 = ob.bids[0]?.[0];
      let sell1 = ob.asks[0]?.[0];
      if (typeof buy1 !== 'number' || typeof sell1 !== 'number') {
        await new Promise(r => setTimeout(r, 200));
        continue;
      }
      // 2. Check current position
      const pos = await getPosition();
      // 3. Get current open orders
      const openOrders = await asterPrivate.fapiPrivateGetOpenOrders({ symbol: TRADE_SYMBOL });
      // 4. When no position, ensure both sides of orders are placed successfully and not cancelled
      if (pos.positionAmt > -0.00001 && pos.positionAmt < 0.00001) {
        // Cancel all orders, re-place both sides
        await cancelAllOrders();
        let orderBuy = await placeOrder("BUY", buy1, TRADE_AMOUNT, false);
        let orderSell = await placeOrder("SELL", sell1, TRADE_AMOUNT, false);
        let filled = false;
        let lastBuy1 = buy1;
        let lastSell1 = sell1;
        while (!filled) {
          await new Promise(r => setTimeout(r, 1000));
          // Check if order book has changed
          const ob2 = wsOrderbook;
          if (!ob2) continue;
          const newBuy1 = ob2.bids[0]?.[0];
          const newSell1 = ob2.asks[0]?.[0];
          if (typeof newBuy1 !== 'number' || typeof newSell1 !== 'number') continue;
          let needReplace = false;
          if (newBuy1 !== lastBuy1 || newSell1 !== lastSell1) {
            needReplace = true;
          }
          // Check order status
          const buyOrderStatus = orderBuy ? await asterPrivate.fapiPrivateGetOrder({ symbol: TRADE_SYMBOL, orderId: orderBuy.orderId }) : null;
          const sellOrderStatus = orderSell ? await asterPrivate.fapiPrivateGetOrder({ symbol: TRADE_SYMBOL, orderId: orderSell.orderId }) : null;
          if (!buyOrderStatus || !sellOrderStatus ||
            !["NEW", "PARTIALLY_FILLED"].includes(buyOrderStatus.status) ||
            !["NEW", "PARTIALLY_FILLED"].includes(sellOrderStatus.status)) {
            needReplace = true;
          }
          if (needReplace) {
            await cancelAllOrders();
            // Re-fetch order book
            const ob3 = wsOrderbook;
            if (!ob3) continue;
            buy1 = ob3.bids[0]?.[0];
            sell1 = ob3.asks[0]?.[0];
            if (typeof buy1 !== 'number' || typeof sell1 !== 'number') continue;
            lastBuy1 = buy1;
            lastSell1 = sell1;
            orderBuy = await placeOrder("BUY", buy1, TRADE_AMOUNT, false);
            orderSell = await placeOrder("SELL", sell1, TRADE_AMOUNT, false);
            continue;
          }
          // Check if filled
          const pos2 = await getPosition();
          if (pos2.positionAmt > 0.00001) {
            // Buy order filled, holding long
            position = "long";
            entryPrice = pos2.entryPrice;
            filled = true;
            console.log(`[Open Position] Buy order filled, holding long ${TRADE_AMOUNT} @ ${entryPrice}`);
            break;
          } else if (pos2.positionAmt < -0.00001) {
            // Sell order filled, holding short
            position = "short";
            entryPrice = pos2.entryPrice;
            filled = true;
            console.log(`[Open Position] Sell order filled, holding short ${TRADE_AMOUNT} @ ${entryPrice}`);
            break;
          }
        }
      } else {
        // When holding position, only place close orders, cancel all non-close orders
        let closeSide: "SELL" | "BUY" = pos.positionAmt > 0 ? "SELL" : "BUY";
        let closePrice = pos.positionAmt > 0 ? sell1 : buy1;
        // First cancel all orders that are not in close direction
        for (const o of openOrders) {
          if (o.side !== closeSide || o.reduceOnly !== true || parseFloat(o.price) !== closePrice) {
            await asterPrivate.fapiPrivateDeleteOrder({ symbol: TRADE_SYMBOL, orderId: o.orderId });
            console.log(`[Cancel Non-Close Order] Order ID: ${o.orderId} side: ${o.side} price: ${o.price}`);
          }
        }
        // Check if close order is already placed
        const stillOpenOrders = await asterPrivate.fapiPrivateGetOpenOrders({ symbol: TRADE_SYMBOL });
        const hasCloseOrder = stillOpenOrders.some((o: any) => o.side === closeSide && o.reduceOnly === true && parseFloat(o.price) === closePrice);
        if (!hasCloseOrder && Math.abs(pos.positionAmt) > 0.00001) {
          // Only place order when there's no unfilled reduceOnly order and position is not closed
          if (await ensureNoPendingReduceOnly(closeSide, closePrice)) {
            await placeOrder(closeSide, closePrice, TRADE_AMOUNT, true);
          }
        }
        // Close position stop loss logic remains unchanged
        let pnl = 0;
        if (position === "long") {
          pnl = (buy1 - entryPrice) * TRADE_AMOUNT;
        } else if (position === "short") {
          pnl = (entryPrice - sell1) * TRADE_AMOUNT;
        }
        if (pnl < -LOSS_LIMIT || recentUnrealizedProfit < -LOSS_LIMIT || pos.unrealizedProfit < -LOSS_LIMIT) {
          await cancelAllOrders();
          await marketClose(closeSide);
          let waitCount = 0;
          while (true) {
            const posCheck = await getPosition();
            if ((position === "long" && posCheck.positionAmt < 0.00001) || (position === "short" && posCheck.positionAmt > -0.00001)) {
              break;
            }
            await new Promise(r => setTimeout(r, 500));
            waitCount++;
            if (waitCount > 20) break;
          }
          console.log(`[Force Close] Loss exceeded limit, Direction: ${position}, Entry Price: ${entryPrice}, Current Price: ${position === "long" ? buy1 : sell1}, Estimated Loss: ${pnl.toFixed(4)} USDT, Account Unrealized: ${recentUnrealizedProfit.toFixed(4)} USDT, Position Unrealized: ${pos.unrealizedProfit.toFixed(4)} USDT`);
          position = "none";
        }
        // Check if position is closed
        const pos2 = await getPosition();
        if (position === "long" && pos2.positionAmt < 0.00001) {
          console.log(`[Close Position] Long closed, Entry Price: ${entryPrice}, Close Price: ${sell1}, PnL: ${(sell1 - entryPrice) * TRADE_AMOUNT} USDT`);
          position = "none";
        } else if (position === "short" && pos2.positionAmt > -0.00001) {
          console.log(`[Close Position] Short closed, Entry Price: ${entryPrice}, Close Price: ${buy1}, PnL: ${(entryPrice - buy1) * TRADE_AMOUNT} USDT`);
          position = "none";
        }
      }
      // Next iteration
    } catch (e) {
      console.log("Strategy exception", e);
      await cancelAllOrders();
      position = "none";
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

makerStrategy(); 