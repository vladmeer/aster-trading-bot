# Aster Trading Bot

A professional TypeScript trading bot for the Aster exchange with multiple trading strategies including trend following, market making, and cross-exchange arbitrage.

## Features

- **Trend Strategy**: SMA30-based trend following strategy with automatic stop loss and trailing stop orders
- **Market Making**: Bid-ask spread market making strategy
- **Arbitrage Bot**: Cross-exchange arbitrage between Aster and Bitget exchanges
- **Real-time Monitoring**: Live order book, ticker, and position monitoring via WebSocket
- **CLI Interface**: Command-line interface for monitoring and managing trades
- **Risk Management**: Built-in stop loss, trailing stops, and position management

## Prerequisites

- Node.js (v18 or higher)
- pnpm (v10.11.1 or higher)
- API keys from Aster exchange (and optionally Bitget for arbitrage)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/vladmeer/aster-trading-bot.git
cd aster-trading-bot
```

2. Install dependencies:
```bash
pnpm install
```

3. Create a `.env` file based on `env.example`:
```bash
cp env.example .env
```

4. Configure your API keys in `.env`:
```env
ASTER_API_KEY=your_aster_api_key
ASTER_API_SECRET=your_aster_api_secret
BITGET_API_KEY=your_bitget_api_key (optional, for arbitrage)
BITGET_API_SECRET=your_bitget_secret (optional, for arbitrage)
BITGET_PASSPHARE=your_bitget_passphrase (optional, for arbitrage)
```

5. Configure trading parameters in `config.ts`:
```typescript
export const TRADE_SYMBOL = "BTCUSDT";
export const TRADE_AMOUNT = 0.001;
export const LOSS_LIMIT = 0.03; // Maximum loss per trade in USDT
export const TRAILING_PROFIT = 0.2; // Trailing stop profit activation in USDT
// ... and more
```

## Usage

### Trend Following Strategy

Run the trend following strategy:
```bash
npm run trend
# or
npm start
```

This strategy:
- Monitors price movements relative to SMA30
- Opens positions when price crosses SMA30
- Manages stop loss and trailing stop orders automatically
- Displays real-time trading status

### Market Making Strategy

Run the market making strategy:
```bash
npm run maker
```

**Note**: This strategy file needs to be migrated to the new structure. See `MIGRATION.md` for details.

This strategy:
- Places buy and sell orders at bid-ask prices
- Maintains positions and manages risk
- Automatically adjusts orders based on market conditions

### Arbitrage Strategy

Run the arbitrage strategy:
```bash
npm run arbitrage
```

### Arbitrage Bot (CLI)

Run the arbitrage bot with CLI interface:
```bash
npm run cli:start
```

**Note**: CLI and arbitrage files need to be migrated to the new structure. See `MIGRATION.md` for details.

View trade logs:
```bash
npm run cli:log
```

Reset statistics:
```bash
npm run cli:reset
```

The arbitrage bot:
- Monitors price differences between Aster and Bitget
- Executes simultaneous trades when arbitrage opportunities arise
- Displays real-time order book, price differences, and trade statistics

## Project Structure

```
aster-trading-bot/
├── config/
│   ├── index.ts          # Configuration exports
│   └── trading.ts       # Trading configuration
├── strategies/
│   ├── trend-following.ts    # Trend following strategy (SMA30-based)
│   ├── market-maker.ts       # Market making strategy
│   └── arbitrage.ts          # Cross-exchange arbitrage strategy
├── cli/
│   └── index.ts         # Command-line interface
├── types/
│   └── index.ts         # Shared TypeScript type definitions
├── exchanges/
│   ├── aster.ts         # Aster exchange API client
│   └── aster.test.ts    # Tests for Aster client
├── utils/
│   ├── helper.ts        # Helper functions (SMA, position calculations)
│   ├── log.ts           # Logging utilities
│   └── order.ts         # Order management functions
├── tsconfig.json        # TypeScript configuration
└── package.json
```

## Configuration

Edit `config/trading.ts` to customize trading parameters:

### Trading Parameters
- `TRADING_SYMBOL`: Trading pair (e.g., "BTCUSDT")
- `TRADING_AMOUNT`: Position size

### Risk Management
- `MAX_LOSS_PER_TRADE`: Maximum loss per trade in USDT
- `STOP_LOSS_DISTANCE`: Stop loss distance in USDT
- `TRAILING_STOP_PROFIT_ACTIVATION`: Trailing stop profit activation threshold
- `TRAILING_STOP_CALLBACK_RATE`: Trailing stop callback rate percentage

### Arbitrage Configuration
- `ARBITRAGE_THRESHOLD`: Minimum price difference to trigger arbitrage
- `CLOSE_POSITION_DIFF`: Price difference threshold for closing positions
- `PROFIT_DIFFERENCE_LIMIT`: Profit difference limit between exchanges

**Note**: Legacy configuration names are still supported for backward compatibility. See `MIGRATION.md` for migration details.

## Risk Warning

⚠️ **Trading cryptocurrencies involves substantial risk of loss. This bot is provided for educational purposes only. Use at your own risk.**

- Always test with small amounts first
- Monitor your bot regularly
- Set appropriate stop loss limits
- Never invest more than you can afford to lose

## Development

Run tests:
```bash
npm test
```

Test Aster exchange client:
```bash
npm run aster:test
```

Type check:
```bash
npm run lint
```

## Migration

If you're upgrading from an older version, see [MIGRATION.md](./MIGRATION.md) for detailed migration instructions.

## Technologies

- **TypeScript**: Type-safe development
- **CCXT**: Cryptocurrency exchange trading library
- **WebSocket**: Real-time market data streaming
- **Commander**: CLI framework
- **Chalk**: Terminal styling
- **Vitest**: Testing framework

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC

## Author

**Vladmeer**

- Telegram: [@vladmeer67](https://t.me/vladmeer67)
- Twitter/X: [@vladmeer67](https://x.com/vladmeer67)

## Support

For questions, issues, or support, please contact:
- Telegram: [@vladmeer67](https://t.me/vladmeer67)
- Open an issue on [GitHub](https://github.com/vladmeer/aster-trading-bot/issues)

## Disclaimer

This software is for educational purposes only. The authors and contributors are not responsible for any financial losses incurred from using this bot. Always do your own research and trade responsibly.

