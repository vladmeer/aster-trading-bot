/**
 * Trading Configuration
 * 
 * Configure your trading parameters here.
 * All values are in USDT unless otherwise specified.
 */

export const TRADING_SYMBOL = "BTCUSDT";
export const TRADING_AMOUNT = 0.001;

// Risk Management
export const MAX_LOSS_PER_TRADE = 0.03; // Maximum loss per trade in USDT
export const STOP_LOSS_DISTANCE = 0.1; // Stop loss distance in USDT
export const TRAILING_STOP_PROFIT_ACTIVATION = 0.2; // Trailing stop profit activation in USDT
export const TRAILING_STOP_CALLBACK_RATE = 0.2; // Trailing stop callback rate percentage (0.2 = 20%)

// Arbitrage Configuration
export const ARBITRAGE_THRESHOLD = 80; // Minimum price difference to trigger arbitrage
export const CLOSE_POSITION_DIFF = 3; // Price difference threshold for closing positions (3 USDT)
export const PROFIT_DIFFERENCE_LIMIT = 1; // Profit difference threshold when closing positions on both exchanges, in USDT

