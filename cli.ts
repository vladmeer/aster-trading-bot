#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import Table from "cli-table3";
import ora from "ora";
import {
  startArbBot,
  getStats,
  getLogs,
  resetStats,
} from "./bot";

const program = new Command();

program
  .name("bitget-aster-bot")
  .description("Professional dual-platform arbitrage bot CLI")
  .version("1.0.0");

function clearScreen() {
  process.stdout.write("\x1Bc");
}

function printOrderbook({ asterOrderbook, bitgetOrderbook, diff1, diff2 }: any) {
  const table = new Table({
    head: [
      chalk.cyan("Platform"),
      chalk.cyan("Bid Price"),
      chalk.cyan("Ask Price"),
      chalk.cyan("Bid Qty"),
      chalk.cyan("Ask Qty")
    ],
    colAligns: ["center", "right", "right", "right", "right"]
  });
  table.push([
    "Aster",
    asterOrderbook?.bids?.[0]?.[0] ?? "-",
    asterOrderbook?.asks?.[0]?.[0] ?? "-",
    asterOrderbook?.bids?.[0]?.[1] ?? "-",
    asterOrderbook?.asks?.[0]?.[1] ?? "-"
  ]);
  table.push([
    "Bitget",
    bitgetOrderbook?.bids?.[0]?.[0] ?? "-",
    bitgetOrderbook?.asks?.[0]?.[0] ?? "-",
    bitgetOrderbook?.bids?.[0]?.[1] ?? "-",
    bitgetOrderbook?.asks?.[0]?.[1] ?? "-"
  ]);
  console.log(table.toString());
  console.log(
    chalk.yellow(
      `Bitget Bid - Aster Ask: ${diff1?.toFixed(2) ?? "-"} USDT    Aster Bid - Bitget Ask: ${diff2?.toFixed(2) ?? "-"} USDT`
    )
  );
}

function printStats(stats: any) {
  const table = new Table({
    head: [chalk.green("Total Trades"), chalk.green("Total Amount"), chalk.green("Total Profit (Est.) USDT")],
    colAligns: ["center", "center", "center"]
  });
  table.push([
    stats.totalTrades,
    stats.totalAmount,
    stats.totalProfit?.toFixed(2)
  ]);
  console.log(table.toString());
}

function printTradeLog(log: any) {
  let color = chalk.white;
  if (log.type === "open") color = chalk.green;
  if (log.type === "close") color = chalk.blue;
  if (log.type === "error") color = chalk.red;
  console.log(color(`[${log.time}] [${log.type}] ${log.detail}`));
}

program
  .command("start")
  .description("Start arbitrage bot, display real-time market, price difference, trade logs and statistics")
  .action(async () => {
    clearScreen();
    let lastOrderbook: any = {};
    let lastStats: any = getStats();
    let lastLogLen = 0;
    let logs = getLogs();
    let spinner = ora("Bot starting...").start();
    setTimeout(() => spinner.stop(), 1000);
    // Real-time refresh
    function render() {
      clearScreen();
      console.log(chalk.bold.bgCyan("  Bitget-Aster Arbitrage Bot  "));
      if (lastOrderbook.asterOrderbook && lastOrderbook.bitgetOrderbook) {
        printOrderbook(lastOrderbook);
      } else {
        console.log(chalk.gray("Waiting for orderbook data..."));
      }
      printStats(lastStats);
      console.log(chalk.bold("\nRecent Trades/Error Log:"));
      logs.slice(-10).forEach(printTradeLog);
      console.log(chalk.gray("Press Ctrl+C to exit"));
    }
    // Start main loop
    startArbBot({
      onOrderbook: (ob) => {
        lastOrderbook = ob;
        render();
      },
      onTrade: () => {
        logs = getLogs();
        lastStats = getStats();
        render();
      },
      onLog: () => {
        logs = getLogs();
        render();
      },
      onStats: (s) => {
        lastStats = s;
        render();
      }
    });
    // Periodic refresh to prevent UI freeze when no events
    const intervalId = setInterval(render, 2000);
    // Listen for Ctrl+C, graceful exit
    process.on("SIGINT", () => {
      clearInterval(intervalId);
      console.log(chalk.red("\nArbitrage bot terminated."));
      process.exit(0);
    });
  });

program
  .command("log")
  .description("View all historical order/close/error logs")
  .action(() => {
    const logs = getLogs();
    if (!logs.length) {
      console.log(chalk.gray("No records"));
      return;
    }
    logs.forEach(printTradeLog);
  });

program
  .command("reset")
  .description("Reset statistics")
  .action(() => {
    resetStats();
    console.log(chalk.yellow("Statistics reset."));
  });

program.parse(); 