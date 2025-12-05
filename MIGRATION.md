# Migration Guide

This document outlines the changes made during the professional refactoring of the project.

## File Structure Changes

### New Structure
```
aster-trading-bot/
├── config/
│   ├── index.ts          # Configuration exports
│   └── trading.ts        # Trading configuration
├── strategies/
│   ├── trend-following.ts    # Trend following strategy (renamed from trend.ts)
│   ├── market-maker.ts       # Market making strategy (renamed from maker.ts)
│   └── arbitrage.ts          # Arbitrage strategy (renamed from bot.ts)
├── cli/
│   └── index.ts          # CLI interface (renamed from cli.ts)
├── types/
│   └── index.ts          # Shared type definitions
├── exchanges/
│   ├── aster.ts
│   └── aster.test.ts
├── utils/
│   ├── helper.ts
│   ├── log.ts
│   └── order.ts
└── tsconfig.json         # TypeScript configuration
```

### Old Structure
```
aster-trading-bot/
├── config.ts
├── trend.ts
├── maker.ts
├── bot.ts
├── cli.ts
└── ...
```

## Variable Name Changes

### Configuration Variables
- `TRADE_SYMBOL` → `TRADING_SYMBOL`
- `TRADE_AMOUNT` → `TRADING_AMOUNT`
- `LOSS_LIMIT` → `MAX_LOSS_PER_TRADE`
- `STOP_LOSS_DIST` → `STOP_LOSS_DISTANCE`
- `TRAILING_PROFIT` → `TRAILING_STOP_PROFIT_ACTIVATION`
- `TRAILING_CALLBACK_RATE` → `TRAILING_STOP_CALLBACK_RATE`
- `ARB_THRESHOLD` → `ARBITRAGE_THRESHOLD`
- `CLOSE_DIFF` → `CLOSE_POSITION_DIFF`
- `PROFIT_DIFF_LIMIT` → `PROFIT_DIFFERENCE_LIMIT`

### Function Name Changes
- `toPrice1Decimal` → `roundPriceToOneDecimal`
- `toQty3Decimal` → `roundQuantityToThreeDecimals`
- `isOperating` → `isOrderTypeLocked`
- `lockOperating` → `lockOrderType`
- `unlockOperating` → `unlockOrderType`
- `placeOrder` → `placeLimitOrder`
- `marketClose` → `closePositionMarket`
- `calcStopLossPrice` → `calculateStopLossPrice`
- `calcTrailingActivationPrice` → `calculateTrailingActivationPrice`
- `getPosition` → `getPosition` (signature improved)
- `getSMA30` → `calculateSMA30`

## Import Path Changes

### Old Imports
```typescript
import { TRADE_SYMBOL, TRADE_AMOUNT } from "./config";
import { toPrice1Decimal } from "./utils/order";
```

### New Imports
```typescript
import { TRADING_SYMBOL, TRADING_AMOUNT } from "./config/trading";
import { roundPriceToOneDecimal } from "./utils/order";
import type { Position, OrderLockState } from "./types";
```

## Type Improvements

- Replaced `any` types with proper TypeScript types
- Created shared type definitions in `types/index.ts`
- Added proper type annotations to all functions
- Improved function signatures with explicit return types

## Backward Compatibility

The old configuration file (`config.ts`) is deprecated but still works. The new structure is recommended for new code.

Legacy exports are available in `config/index.ts` for backward compatibility during migration.

## Migration Steps

1. Update imports to use new paths:
   - `./config` → `./config/trading`
   - `./trend` → `./strategies/trend-following`
   - `./bot` → `./strategies/arbitrage`
   - `./maker` → `./strategies/market-maker`
   - `./cli` → `./cli/index`

2. Update variable names in your code to use the new naming conventions

3. Update function calls to use the new function names

4. Add type imports from `./types` where needed

5. Update package.json scripts if you have custom scripts

## Benefits

- **Better Organization**: Clear separation of concerns with dedicated folders
- **Type Safety**: Improved TypeScript types throughout
- **Maintainability**: Consistent naming conventions
- **Scalability**: Easier to add new strategies and features
- **Documentation**: Better code documentation with JSDoc comments

