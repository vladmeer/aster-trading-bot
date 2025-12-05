import chalk from "chalk";
import { AsterTicker, AsterDepth, AsterOrder } from "../exchanges/aster";

export interface TradeLogItem {
  time: string;
  type: string;
  detail: string;
}

export function logTrade(tradeLog: TradeLogItem[], type: string, detail: string) {
  tradeLog.push({ time: new Date().toLocaleString(), type, detail });
  if (tradeLog.length > 1000) tradeLog.shift();
}

export function printStatus({
  ticker,
  ob,
  sma,
  trend,
  openOrder,
  closeOrder,
  stopOrder,
  pos,
  pnl,
  unrealized,
  tradeLog,
  totalProfit,
  totalTrades,
  openOrders
}: {
  ticker: AsterTicker;
  ob: AsterDepth;
  sma: number | null;
  trend: string;
  openOrder: { side: "BUY" | "SELL"; price: number; amount: number } | null;
  closeOrder: { side: "BUY" | "SELL"; price: number; amount: number } | null;
  stopOrder: { side: "BUY" | "SELL"; stopPrice: number } | null;
  pos: { positionAmt: number; entryPrice: number; unrealizedProfit: number };
  pnl: number;
  unrealized: number;
  tradeLog: TradeLogItem[];
  totalProfit: number;
  totalTrades: number;
  openOrders: AsterOrder[];
}) {
  process.stdout.write('\x1Bc');
  console.log(chalk.bold.bgCyan("  Trend Strategy Bot  "));
  console.log(
    chalk.yellow(
      `Latest Price: ${ticker?.lastPrice ?? "-"} | SMA30: ${sma?.toFixed(2) ?? "-"}`
    )
  );
  if (ob) {
    console.log(
      chalk.green(
        `Order Book  Bid: ${ob.bids?.[0]?.[0] ?? "-"} Ask: ${ob.asks?.[0]?.[0] ?? "-"}`
      )
    );
  }
  console.log(chalk.magenta(`Current Trend: ${trend}`));
  if (openOrder) {
    console.log(
      chalk.blue(
        `Current Open Order: ${openOrder.side} @ ${openOrder.price} Amount: ${openOrder.amount}`
      )
    );
  }
  if (closeOrder) {
    console.log(
      chalk.blueBright(
        `Current Close Order: ${closeOrder.side} @ ${closeOrder.price} Amount: ${closeOrder.amount}`
      )
    );
  }
  if (stopOrder) {
    console.log(
      chalk.red(
        `Stop Loss Order: ${stopOrder.side} STOP_MARKET @ ${stopOrder.stopPrice}`
      )
    );
  }
  if (pos && Math.abs(pos.positionAmt) > 0.00001) {
    console.log(
      chalk.bold(
        `Position: ${pos.positionAmt > 0 ? "Long" : "Short"} Entry Price: ${pos.entryPrice} Current PnL: ${pnl?.toFixed(4) ?? "-"} USDT Account Unrealized: ${unrealized?.toFixed(4) ?? "-"}`
      )
    );
  } else {
    console.log(chalk.gray("No position"));
  }
  console.log(
    chalk.bold(
      `Total Trades: ${totalTrades}  Total Profit: ${totalProfit.toFixed(4)} USDT`
    )
  );
  console.log(chalk.bold("Recent Trade/Order Log:"));
  tradeLog.slice(-10).forEach((log) => {
    let color = chalk.white;
    if (log.type === "open") color = chalk.green;
    if (log.type === "close") color = chalk.blue;
    if (log.type === "stop") color = chalk.red;
    if (log.type === "order") color = chalk.yellow;
    if (log.type === "error") color = chalk.redBright;
    console.log(color(`[${log.time}] [${log.type}] ${log.detail}`));
  });
  if (openOrders && openOrders.length > 0) {
    console.log(chalk.bold("Current Open Orders:"));
    const tableData = openOrders.map(o => ({
      orderId: o.orderId,
      side: o.side,
      type: o.type,
      price: o.price,
      origQty: o.origQty,
      executedQty: o.executedQty,
      status: o.status
    }));
    console.table(tableData);
  } else {
    console.log(chalk.gray("No open orders"));
  }
  console.log(chalk.gray("Press Ctrl+C to exit"));
}
