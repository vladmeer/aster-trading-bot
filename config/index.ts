/**
 * Configuration Export
 * 
 * Re-exports all configuration for backward compatibility
 */

export * from "./trading";

// Legacy exports for backward compatibility (deprecated)
export const TRADE_SYMBOL = "BTCUSDT";
export const TRADE_AMOUNT = 0.001;
export const LOSS_LIMIT = 0.03;
export const TRAILING_PROFIT = 0.2;
export const ARB_THRESHOLD = 80;
export const CLOSE_DIFF = 3;
export const PROFIT_DIFF_LIMIT = 1;
export const STOP_LOSS_DIST = 0.1;
export const TRAILING_CALLBACK_RATE = 0.2;

