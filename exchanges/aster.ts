import crypto from 'crypto';

export type StringBoolean = "true" | "false";

export type DepthLimit = 5 | 10 | 20 | 50 | 100 | 500 | 1000;

export interface KlineParams {
    symbol: string;
    interval: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
}

export interface SubscribeParams {
    method?: string;
    params: string[];
    id: number;
}

export type MarginType = "ISOLATED" | "CROSSED";

export type OrderSide = "BUY" | "SELL";
export type PositionSide = "BOTH" | "LONG" | "SHORT";
export type OrderType = "LIMIT" | "MARKET" | "STOP" | "STOP_MARKET" | "TAKE_PROFIT" | "TAKE_PROFIT_MARKET" | "TRAILING_STOP_MARKET";
export type TimeInForce = "GTC" | "IOC" | "FOK" | "GTX";
export type WorkingType = "MARK_PRICE" | "CONTRACT_PRICE";

export interface CreateOrderParams {
    symbol: string;
    side: OrderSide;
    positionSide?: PositionSide;
    type: OrderType;
    reduceOnly?: StringBoolean;
    quantity?: number;
    price?: number;
    newClientOrderId?: string;
    stopPrice?: number;
    closePosition?: StringBoolean;
    activationPrice?: number;
    callbackRate?: number;
    timeInForce?: TimeInForce;
    workingType?: WorkingType;
}

// Asset information
export interface AsterAccountAsset {
    asset: string;
    walletBalance: string;
    unrealizedProfit: string;
    marginBalance: string;
    maintMargin: string;
    initialMargin: string;
    positionInitialMargin: string;
    openOrderInitialMargin: string;
    crossWalletBalance: string;
    crossUnPnl: string;
    availableBalance: string;
    maxWithdrawAmount: string;
    marginAvailable: boolean;
    updateTime: number;
}

// Position information
export interface AsterAccountPosition {
    symbol: string;
    initialMargin: string;
    maintMargin: string;
    unrealizedProfit: string;
    positionInitialMargin: string;
    openOrderInitialMargin: string;
    leverage: string;
    isolated: boolean;
    entryPrice: string;
    maxNotional: string;
    positionSide: string;
    positionAmt: string;
    updateTime: number;
    // WS push specific fields
    cr?: string; // Cumulative realized PnL
    mt?: string; // Margin type
    iw?: string; // Position margin
}

// Account snapshot
export interface AsterAccountSnapshot {
    feeTier: number;
    canTrade: boolean;
    canDeposit: boolean;
    canWithdraw: boolean;
    updateTime: number;
    totalInitialMargin: string;
    totalMaintMargin: string;
    totalWalletBalance: string;
    totalUnrealizedProfit: string;
    totalMarginBalance: string;
    totalPositionInitialMargin: string;
    totalOpenOrderInitialMargin: string;
    totalCrossWalletBalance: string;
    totalCrossUnPnl: string;
    availableBalance: string;
    maxWithdrawAmount: string;
    assets: AsterAccountAsset[];
    positions: AsterAccountPosition[];
}

// Order information
export interface AsterOrder {
    avgPrice: string;           // Average filled price
    clientOrderId: string;      // User custom order ID
    cumQuote: string;           // Cumulative quote quantity
    executedQty: string;        // Executed quantity
    orderId: number;            // System order ID
    origQty: string;            // Original order quantity
    origType: string;           // Original order type before trigger
    price: string;              // Order price
    reduceOnly: boolean;        // Reduce only
    side: string;               // Order side (BUY/SELL)
    positionSide: string;       // Position side
    status: string;             // Order status
    stopPrice: string;          // Stop price
    closePosition: boolean;     // Close all positions
    symbol: string;             // Trading pair
    time: number;               // Order time
    timeInForce: string;        // Time in force
    type: string;               // Order type
    activatePrice?: string;     // Trailing stop activation price
    priceRate?: string;         // Trailing stop callback rate
    updateTime: number;         // Update time
    workingType: string;        // Conditional price trigger type
    priceProtect: boolean;      // Price protection enabled

    // WS push specific fields
    eventType?: string;         // Event type e
    eventTime?: number;         // Event time E
    matchTime?: number;         // Match time T
    lastFilledQty?: string;     // Last filled quantity l
    lastFilledPrice?: string;   // Last filled price L
    commissionAsset?: string;   // Commission asset type N
    commission?: string;        // Commission amount n
    tradeId?: number;           // Trade ID t
    bidValue?: string;          // Bid value b
    askValue?: string;          // Ask value a
    isMaker?: boolean;          // Is this trade a maker order m
    wt?: string;                // Working type
    ot?: string;                // Original order type
    cp?: boolean;               // Is conditional close position order
    rp?: string;                // Realized PnL of this trade
    _pushedOnce?: boolean;      // Mark if already pushed once
}

// Depth level
export type AsterDepthLevel = [string, string];

// Depth data
export interface AsterDepth {
    eventType?: string;      // Event type e (WS push)
    eventTime?: number;      // Event time E
    tradeTime?: number;      // Trade/match time T
    symbol?: string;         // Trading pair s
    firstUpdateId?: number;  // U (WS push)
    lastUpdateId: number;    // u (WS push) / lastUpdateId (HTTP)
    prevUpdateId?: number;   // pu (WS push)
    bids: AsterDepthLevel[]; // Bids
    asks: AsterDepthLevel[]; // Asks
}

// Ticker data
export interface AsterTicker {
    // Common fields
    symbol: string;             // Trading pair
    lastPrice: string;          // Last price
    openPrice: string;          // First trade price in 24h
    highPrice: string;          // 24h high price
    lowPrice: string;           // 24h low price
    volume: string;             // 24h volume
    quoteVolume: string;        // 24h quote volume

    // HTTP specific
    priceChange?: string;           // 24h price change
    priceChangePercent?: string;    // 24h price change percentage
    weightedAvgPrice?: string;      // Weighted average price
    lastQty?: string;               // Last trade quantity
    openTime?: number;              // First trade time in 24h
    closeTime?: number;             // Last trade time in 24h
    firstId?: number;               // First trade ID
    lastId?: number;                // Last trade ID
    count?: number;                 // Trade count

    // WS push specific
    eventType?: string;             // Event type e
    eventTime?: number;             // Event time E
}

// Kline data
export interface AsterKline {
    openTime: number;                // Open time
    open: string;                    // Open price
    high: string;                    // High price
    low: string;                     // Low price
    close: string;                   // Close price
    volume: string;                  // Volume
    closeTime: number;               // Close time
    quoteAssetVolume: string;        // Quote asset volume
    numberOfTrades: number;          // Number of trades
    takerBuyBaseAssetVolume: string; // Taker buy base asset volume
    takerBuyQuoteAssetVolume: string;// Taker buy quote asset volume

    // WS push specific
    eventType?: string;              // Event type e
    eventTime?: number;              // Event time E
    symbol?: string;                 // Trading pair s
    interval?: string;               // Kline interval i
    firstTradeId?: number;           // First trade ID f
    lastTradeId?: number;            // Last trade ID L
    isClosed?: boolean;              // Is this kline closed x
}

export class Aster {
    baseURL: string;
    websocketURL: string;
    ws: WebSocket;
    private accountUpdateCallbacks: Array<(data: any) => void> = [];
    private listenKey?: string;
    private pongIntervalId?: ReturnType<typeof setInterval>;
    private accountSnapshot: any = null;
    private orderUpdateCallbacks: Array<(data: any) => void> = [];
    private listenKeyKeepAliveIntervalId?: ReturnType<typeof setInterval>;
    private subscribedChannels: Set<string> = new Set();
    private listenKeyChannel: string | null = null;
    private reconnectTimeoutId?: ReturnType<typeof setTimeout>;
    private defaultMarket: string;
    private openOrders: Map<number, any> = new Map();
    private depthUpdateCallbacks: Array<(data: any) => void> = [];
    private lastDepthData: any = null;
    private tickerUpdateCallbacks: Array<(data: any) => void> = [];
    private lastTickerData: any = null;
    private klineUpdateCallbacks: Array<(data: any[]) => void> = [];
    private lastKlines: any[] = [];
    private klineSymbol: string = '';
    private klineInterval: string = '';
    private pollingIntervalId?: ReturnType<typeof setInterval>;
    constructor(private readonly apiKey: string, private readonly apiSecret: string, defaultMarket: string = 'BTCUSDT') {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.baseURL = 'https://fapi.asterdex.com';
        this.websocketURL = 'wss://fstream.asterdex.com/ws';
        this.defaultMarket = defaultMarket;

        this.initWebSocket();
        this.startPolling(); // Start periodic polling
    }

    private initWebSocket() {
        this.ws = new WebSocket(this.websocketURL);
        this.ws.onmessage = (event: MessageEvent) => {
            // console.log('onmessage', event.data);
            // Handle ping frames and JSON messages
            if (typeof event.data === 'string') {
                const text = event.data.trim();
                // 1. Handle ping frame
                if (text === 'ping') {
                    if (this.ws.readyState === WebSocket.OPEN) {
                        this.ws.send('pong');
                    }
                    return;
                }
                // 2. Only try to parse JSON format
                if (text.startsWith('{') || text.startsWith('[')) {
                    try {
                        const data = JSON.parse(text);
                        // Only handle account update events
                        if (data.e === 'ACCOUNT_UPDATE') {
                            this.mergeAccountUpdate(data);
                            this.accountUpdateCallbacks.forEach(cb => cb(this.accountSnapshot));
                        }
                        // Handle order push
                        if (data.e === 'ORDER_TRADE_UPDATE') {
                            this.formatOrderUpdate(data.o, data);
                        }
                        // Handle depth push
                        if (data.e === 'depthUpdate') {
                            this.lastDepthData = data;
                            const formatted = this.formatDepthData(data);
                            this.depthUpdateCallbacks.forEach(cb => cb(formatted));
                        }
                        // Handle ticker push
                        if (data.e === '24hrMiniTicker') {
                            const formatted = this.formatTickerData(data);
                            this.lastTickerData = formatted;
                            this.tickerUpdateCallbacks.forEach(cb => cb(formatted));
                        }
                        // Handle kline push
                        if (data.e === 'kline') {
                            const k = this.formatWsKline(data.k);
                            // Merge into local kline array
                            const idx = this.lastKlines.findIndex(item => item.openTime === k.openTime);
                            if (idx !== -1) {
                                this.lastKlines[idx] = k;
                            } else {
                                this.lastKlines.push(k);
                                // Keep array length constant (e.g., 100)
                                if (this.lastKlines.length > 100) this.lastKlines.shift();
                            }
                            this.klineUpdateCallbacks.forEach(cb => cb(this.lastKlines));
                        }
                    } catch (e) {
                        // Invalid JSON, ignore
                    }
                }
                // Other non-JSON, non-ping messages ignored
            }
        };
        // After connection succeeds, subscribe to user data stream and restore all subscriptions
        this.ws.onopen = async () => {
            try {
                await this.initAccountSnapshot();
                // Re-subscribe to all regular channels
                for (const channel of this.subscribedChannels) {
                    this.subscribe({ params: [channel], id: Math.floor(Math.random() * 10000) });
                }
                // Re-subscribe to account listenKey channel (need to get new listenKey)
                await this.subscribeUserData();
                // Periodically send pong frame to prevent server disconnection
                this.pongIntervalId = setInterval(() => {
                    if (this.ws.readyState === WebSocket.OPEN) {
                        this.ws.send('pong');
                    }
                }, 4 * 60 * 1000); // Every 4 minutes
                // Periodically extend listenKey validity
                this.listenKeyKeepAliveIntervalId = setInterval(() => {
                    this.extendListenKey();
                }, 45 * 60 * 1000); // Every 45 minutes
            } catch (err) {
                console.error("WebSocket onopen initialization failed:", err);
                // Auto reconnect after close
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.close();
                }
            }
        };
        this.ws.onclose = () => {
            if (this.pongIntervalId) {
                clearInterval(this.pongIntervalId);
                this.pongIntervalId = undefined;
            }
            if (this.listenKeyKeepAliveIntervalId) {
                clearInterval(this.listenKeyKeepAliveIntervalId);
                this.listenKeyKeepAliveIntervalId = undefined;
            }
            // Auto reconnect
            if (!this.reconnectTimeoutId) {
                this.reconnectTimeoutId = setTimeout(() => {
                    this.reconnectTimeoutId = undefined;
                    this.initWebSocket();
                }, 2000); // Reconnect after 2 seconds
            }
        };
    }

    private async publicRequest(path: string, method: string, params: any) {
        const url = `${this.baseURL}${path}`;
        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            return data;
        } catch (err) {
            console.error("publicRequest network request failed:", err);
            throw err;
        }
    }

    private generateSignature(params: any) {
        // 1. Sort parameters by key
        const ordered = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&');
        // 2. HMAC SHA256 signature
        return crypto.createHmac('sha256', this.apiSecret).update(ordered).digest('hex');
    }

    private async signedRequest(path: string, method: string, params: any) {
        // 1. Add timestamp and recvWindow
        const timestamp = Date.now();
        const recvWindow = params.recvWindow || 5000;
        const fullParams = { ...params, timestamp, recvWindow };
        // 2. Generate signature
        const signature = this.generateSignature(fullParams);
        // 3. Concatenate parameter string
        const paramStr = Object.keys(fullParams).sort().map(key => `${key}=${fullParams[key]}`).join('&');
        let url = `${this.baseURL}${path}`;
        const fetchOptions: any = {
            method,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-MBX-APIKEY': this.apiKey,
            }
        };
        if (method === 'GET') {
            url = `${url}?${paramStr}&signature=${signature}`;
        } else {
            fetchOptions.body = `${paramStr}&signature=${signature}`;
        }
        try {
            const response = await fetch(url, fetchOptions);
            const data = await response.json();
            return data;
        } catch (err) {
            console.error("signedRequest network request failed:", err);
            throw err;
        }
    }

    public async ping() {
        const data = await this.publicRequest('/fapi/v1/ping', 'GET', {});
        return data;
    }

    public async time() {
        const data = await this.publicRequest('/fapi/v1/time', 'GET', {});
        return data;
    }

    public async getExchangeInfo() {
        const data = await this.publicRequest('/fapi/v1/exchangeInfo', 'GET', {});
        return data;
    }

    public async getDepth(symbol: string, limit: DepthLimit = 5) {
        const data = await this.publicRequest(`/fapi/v1/depth?symbol=${symbol}&limit=${limit}`, 'GET', {});
        return data;
    }

    public async getRecentTrades(symbol: string, limit: number = 500) {
        const data = await this.publicRequest(`/fapi/v1/trades?symbol=${symbol}&limit=${limit}`, 'GET', {});
        return data;
    }

    public async getHistoricalTrades(symbol: string, limit: number = 500) {
        const data = await this.publicRequest(`/fapi/v1/historicalTrades?symbol=${symbol}&limit=${limit}`, 'GET', {});
        return data;
    }

    public async getAggregatedTrades(params: {
        symbol: string;
        fromId?: number;
        startTime?: number;
        endTime?: number;
        limit?: number;
    }) {
        const data = await this.publicRequest(`/fapi/v1/aggTrades?symbol=${params.symbol}&fromId=${params.fromId}&startTime=${params.startTime}&endTime=${params.endTime}&limit=${params.limit}`, 'GET', {});
        return data;
    }

    public async getKlines(params: KlineParams) {
        const data = await this.publicRequest(`/fapi/v1/klines?symbol=${params.symbol}&interval=${params.interval}&startTime=${params.startTime}&endTime=${params.endTime}&limit=${params.limit}`, 'GET', {});
        return data;
    }

    public async getIndexPriceKlines(params: KlineParams) {
        const data = await this.publicRequest(`/fapi/v1/indexPriceKlines?symbol=${params.symbol}&interval=${params.interval}&startTime=${params.startTime}&endTime=${params.endTime}&limit=${params.limit}`, 'GET', {});
        return data;
    }

    public async getMarkPriceKlines(params: KlineParams) {
        const data = await this.publicRequest(`/fapi/v1/markPriceKlines?symbol=${params.symbol}&interval=${params.interval}&startTime=${params.startTime}&endTime=${params.endTime}&limit=${params.limit}`, 'GET', {});
        return data;
    }

    public async getPremiumIndexPrice(symbol: string) {
        const data = await this.publicRequest(`/fapi/v1/premiumIndexPrice?symbol=${symbol}`, 'GET', {});
        return data;
    }

    public async getFundingRate(params: {
        symbol: string;
        startTime?: number;
        endTime?: number;
        limit?: number;
    }) {
        const data = await this.publicRequest(`/fapi/v1/fundingRate?symbol=${params.symbol}&startTime=${params.startTime}&endTime=${params.endTime}&limit=${params.limit}`, 'GET', {});
        return data;
    }

    public async getTicker(symbol: string) {
        const data = await this.publicRequest(`/fapi/v1/ticker/24hr?symbol=${symbol}`, 'GET', {});
        return data;
    }

    public async getTickerPrice(symbol: string) {
        const data = await this.publicRequest(`/fapi/v1/ticker/price?symbol=${symbol}`, 'GET', {});
        return data;
    }

    public async getTickerBookTicker(symbol: string) {
        const data = await this.publicRequest(`/fapi/v1/ticker/bookTicker?symbol=${symbol}`, 'GET', {});
        return data;
    }

    /**
     * WebSocket
     */

    public async subscribe(params: SubscribeParams) {
        const channel = params.params[0];
        // Account channel not added to regular set
        if (!this.listenKeyChannel || channel !== this.listenKeyChannel) {
            this.subscribedChannels.add(channel);
        }
        const msg = JSON.stringify({ ...params, method: 'SUBSCRIBE' });
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(msg);
        } else {
            this.ws.addEventListener('open', () => {
                this.ws.send(msg);
            }, { once: true });
        }
    }

    public async unsubscribe(params: SubscribeParams) {
        const channel = params.params[0];
        if (this.subscribedChannels.has(channel)) {
            this.subscribedChannels.delete(channel);
        }
        const msg = JSON.stringify({ ...params, method: 'UNSUBSCRIBE' });
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(msg);
        } else {
            this.ws.addEventListener('open', () => {
                this.ws.send(msg);
            }, { once: true });
        }
    }

    public async close() {
        this.ws.close();
        if (this.pongIntervalId) {
            clearInterval(this.pongIntervalId);
            this.pongIntervalId = undefined;
        }
        if (this.listenKeyKeepAliveIntervalId) {
            clearInterval(this.listenKeyKeepAliveIntervalId);
            this.listenKeyKeepAliveIntervalId = undefined;
        }
        this.stopPolling(); // Stop periodic polling
    }

    public async subscribeAggregatedTrade(symbol: string) {
        this.subscribe({ params: [`${symbol}@aggTrade`], id: 1 });
    }

    public async subscribeMarkPrice(symbol: string) {
        this.subscribe({ params: [`${symbol}@markPrice`], id: 2 });
    }

    public async subscribeKline(symbol: string, interval: string) {
        this.subscribe({ params: [`${symbol}@kline_${interval}`], id: 3 });
    }

    public async subscribeMiniTicker(symbol: string) {
        this.subscribe({ params: [`${symbol}@miniTicker`], id: 4 });
    }

    public async subscribeAllMarketMiniTicker() {
        this.subscribe({ params: [`!miniTicker@arr`], id: 5 });
    }

    public async subscribeTicker(symbol: string) {
        this.subscribe({ params: [`${symbol}@ticker`], id: 6 });
    }

    public async subscribeAllMarketTicker() {
        this.subscribe({ params: [`!ticker@arr`], id: 7 });
    }

    public async subscribeBookTicker(symbol: string) {
        this.subscribe({ params: [`${symbol}@bookTicker`], id: 8 });
    }

    public async subscribeAllMarketBookTicker() {
        this.subscribe({ params: [`!bookTicker`], id: 9 });
    }

    public async subscribeForceOrder(symbol: string) {
        this.subscribe({ params: [`${symbol}@forceOrder`], id: 10 });
    }

    public async subscribeDepth(symbol: string, levels: number) {
        this.subscribe({ params: [`${symbol}@depth${levels}@100ms`], id: 11 });
    }

    public async postPositionSide(dualSidePosition: string) {
        const data = await this.signedRequest('/fapi/v1/positionSide/dual', 'POST', { dualSidePosition });
        return data;
    }

    public async getPositionSide() {
        const data = await this.signedRequest('/fapi/v1/positionSide/dual', 'GET', { });
        return data;
    }

    public async postMargin(multiAssetsMargin: "true" | "false") {
        const data = await this.signedRequest('/fapi/v1/margin/type', 'POST', { multiAssetsMargin });
        return data;
    }

    public async getMargin() {
        const data = await this.signedRequest('/fapi/v1/margin/type', 'GET', { });
        return data;
    }

    public async createOrder(params: CreateOrderParams) {
        const data = await this.signedRequest('/fapi/v1/order', 'POST', params);
        return data;
    }

    public async createTestOrder(params: CreateOrderParams) {
        const data = await this.signedRequest('/fapi/v1/order/test', 'POST', params);
        return data;
    }

    public async createOrders(params: {
        batchOrders: CreateOrderParams[];
    }) {
        const data = await this.signedRequest('/fapi/v1/batchOrders', 'POST', params);
        return data;
    }

    public async getOrder(params: {
        symbol: string;
        orderId?: number;
        origClientOrderId?: string;
    }) {
        const data = await this.signedRequest('/fapi/v1/order', 'GET', params);
        return data;
    }

    public async cancelOrder(params: {
        symbol: string;
        orderId?: number;
        origClientOrderId?: string;
    }) {
        const data = await this.signedRequest('/fapi/v1/order', 'DELETE', params);
        return data;
    }

    public async cancelOrders(params: {
        symbol: string;
        orderIdList?: number[];
        origClientOrderIdList?: string[];
    }) {
        const data = await this.signedRequest('/fapi/v1/batchOrders', 'DELETE', params);
        return data;
    }

    public async cancelAllOrders(params: {
        symbol: string;
    }) {
        const data = await this.signedRequest('/fapi/v1/allOpenOrders', 'DELETE', params);
        return data;
    }

    public async countdownCancelAllOrders(params: {
        symbol: string;
        countdownTime: number;
    }) {
        const data = await this.signedRequest('/fapi/v1/countdownCancelAll', 'POST', params);
        return data;
    }

    public async getOpenOrder(params: {
        symbol: string;
        orderId?: number;
        origClientOrderId?: string; 
    }) {
        const data = await this.signedRequest('/fapi/v1/openOrder', 'GET', params);
        return data;
    }

    public async getOpenOrders(params: {
        symbol?: string;
    }) {
        const data = await this.signedRequest('/fapi/v1/openOrders', 'GET', params);
        return data;
    }

    public async getAllOrders(params: {
        symbol?: string;
        orderId?: number;
        startTime?: number;
        endTime?: number;
        limit?: number;
    }) {
        const data = await this.signedRequest('/fapi/v1/allOrders', 'GET', params);
        return data;
    }

    public async getBalance() {
        const data = await this.signedRequest('/fapi/v2/balance', 'GET', { });
        return data;
    }

    public async getAccount() {
        const data = await this.signedRequest('/fapi/v2/account', 'GET', { });
        return data;
    }

    public async setLeverage(params: {
        symbol: string;
        leverage: number;
    }) {
        const data = await this.signedRequest('/fapi/v1/leverage', 'POST', params);
        return data;
    }

    public async setMarginType(params: {
        symbol: string;
        marginType: MarginType;
    }) {
        const data = await this.signedRequest('/fapi/v1/marginType', 'POST', params);
        return data;
    }

    public async setPositionMargin(params: {
        symbol: string;
        positionSide?: PositionSide;
        amount: number;
        type: 1 | 2;
    }) {
        const data = await this.signedRequest('/fapi/v1/positionMargin', 'POST', params);
        return data;
    }

    public async getPositionMarginHistory(params: {
        symbol: string;
        type: 1 | 2;
        startTime?: number;
        endTime?: number;
        limit?: number;
    }) {
        const data = await this.signedRequest('/fapi/v1/positionMargin/history', 'GET', params);
        return data;
    }

    public async getPositionRisk(params:{
        symbol?: string;
    }) {
        const data = await this.signedRequest('/fapi/v2/positionRisk', 'GET', params);
        return data;
    }

    public async getUserTrades(params: {
        symbol?: string;
        startTime?: number;
        endTime?: number;
        fromId?: number;
        limit?: number;
    }) {
        const data = await this.signedRequest('/fapi/v1/userTrades', 'GET', params);
        return data;
    }

    public async getIncome(params: {
        symbol?: string;
        incomeType?: string;
        startTime?: number;
        endTime?: number;
        limit?: number;
    }) {
        const data = await this.signedRequest('/fapi/v1/income', 'GET', params);
        return data;
    }

    public async getLeverageBracket(symbol?: string) {
        const data = await this.signedRequest('/fapi/v1/leverageBracket', 'GET', { symbol });
        return data;
    }

    public async getAdlQuantile(symbol?: string) {
        const data = await this.signedRequest('/fapi/v1/adlQuantile', 'GET', { symbol });
        return data;
    }

    public async getForceOrders(params: {
        symbol?: string;
        autoCloseType: "LIQUIDATION" | "ADL";
        startTime?: number;
        endTime?: number;
        limit?: number;
    }) {
        const data = await this.signedRequest('/fapi/v1/forceOrders', 'GET', params);
        return data;
    }

    public async getCommissionRate(symbol: string) {
        const data = await this.signedRequest('/fapi/v1/commissionRate', 'GET', { symbol });
        return data;
    }

    private async generateListenKey() {
        const data = await this.signedRequest('/fapi/v1/listenKey', 'POST', { });
        return data;
    }

    private async extendListenKey() {
        const data = await this.signedRequest('/fapi/v1/listenKey', 'PUT', { });
        return data;
    }

    private async closeListenKey() {
        const data = await this.signedRequest('/fapi/v1/listenKey', 'DELETE', {  });
        return data;
    }

    public async subscribeUserData() {
        const { listenKey } = await this.generateListenKey();
        this.listenKeyChannel = listenKey;
        this.subscribe({ params: [listenKey], id: 99 });
    }

    // Initialize account snapshot
    private async initAccountSnapshot(retry = 0) {
        try {
            const account = await this.getAccount();
            this.accountSnapshot = account;
            // Initialize open orders snapshot
            const openOrders = await this.getOpenOrders({ symbol: this.defaultMarket });
            this.openOrders.clear();
            for (const order of openOrders) {
                this.openOrders.set(order.orderId, order);
            }
        } catch (err) {
            console.error("initAccountSnapshot failed, retrying:", err);
            if (retry < 5) {
                setTimeout(() => this.initAccountSnapshot(retry + 1), 2000 * (retry + 1));
            } else {
                // Exceeded max retries, reconnect WebSocket after 2 seconds
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.close();
                }
            }
        }
    }

    // Merge WS push to local account snapshot
    private mergeAccountUpdate(update: any) {
        if (!this.accountSnapshot) return;
        // Merge assets
        if (update.a && Array.isArray(update.a.B)) {
            for (const b of update.a.B) {
                const asset = this.accountSnapshot.assets.find((a: any) => a.asset === b.a);
                if (asset) {
                    asset.walletBalance = b.wb;
                    asset.crossWalletBalance = b.cw;
                    // WS push doesn't have unrealizedProfit, marginBalance, etc., keep original
                    // Optional: if bc field exists, can customize handling
                }
            }
        }
        // Merge positions
        if (update.a && Array.isArray(update.a.P)) {
            for (const p of update.a.P) {
                const pos = this.accountSnapshot.positions.find(
                    (x: any) => x.symbol === p.s && x.positionSide === p.ps
                );
                if (pos) {
                    pos.positionAmt = p.pa;
                    pos.entryPrice = p.ep;
                    pos.unrealizedProfit = p.up;
                    pos.updateTime = update.E;
                    // WS push specific fields
                    pos.cr = p.cr;
                    pos.mt = p.mt;
                    pos.iw = p.iw;
                }
            }
        }
    }

    /**
     * Register account and position real-time push callback
     * @param cb Callback function, parameter is structured account snapshot
     */
    public watchAccount(cb: (data: any) => void) {
        this.accountUpdateCallbacks.push(cb);
        // Push snapshot once immediately on registration (if initialized), otherwise wait for initialization
        if (this.accountSnapshot) {
            cb(this.accountSnapshot);
        } else {
            // Wait for initialization to complete, then push once
            const interval = setInterval(() => {
                if (this.accountSnapshot) {
                    cb(this.accountSnapshot);
                    clearInterval(interval);
                }
            }, 200);
        }
    }

    /**
     * Register order push callback, returns formatted order structure
     */
    public watchOrder(cb: (data: any) => void) {
        this.orderUpdateCallbacks.push(cb);
        // Push current open orders list once immediately on registration (if initialized), otherwise wait for initialization
        if (this.openOrders.size > 0) {
            cb(Array.from(this.openOrders.values()));
        } else {
            const interval = setInterval(() => {
                if (this.openOrders.size > 0) {
                    cb(Array.from(this.openOrders.values()));
                    clearInterval(interval);
                }
            }, 200);
        }
    }

    // Format order push to HTTP query order structure, and maintain openOrders
    private formatOrderUpdate(o: any, event?: any): void {
        const order: AsterOrder = {
            avgPrice: o.ap ?? o.avgPrice ?? "0",
            clientOrderId: o.c ?? o.clientOrderId ?? '',
            cumQuote: o.z ?? o.cumQuote ?? "0",
            executedQty: o.z ?? o.executedQty ?? "0",
            orderId: o.i ?? o.orderId,
            origQty: o.q ?? o.origQty ?? "0",
            origType: o.ot ?? o.origType ?? '',
            price: o.p ?? o.price ?? "0",
            reduceOnly: o.R ?? o.reduceOnly ?? false,
            side: o.S ?? o.side ?? '',
            positionSide: o.ps ?? o.positionSide ?? '',
            status: o.X ?? o.status ?? '',
            stopPrice: o.sp ?? o.stopPrice ?? '',
            closePosition: o.cp ?? o.closePosition ?? false,
            symbol: o.s ?? o.symbol ?? '',
            time: o.T ?? o.time ?? 0,
            timeInForce: o.f ?? o.timeInForce ?? '',
            type: o.o ?? o.type ?? '',
            activatePrice: o.AP ?? o.activatePrice,
            priceRate: o.cr ?? o.priceRate,
            updateTime: o.T ?? o.updateTime ?? 0,
            workingType: o.wt ?? o.workingType ?? '',
            priceProtect: o.PP ?? o.priceProtect ?? false,

            // WS push specific
            eventType: event?.e,
            eventTime: event?.E,
            matchTime: event?.T,
            lastFilledQty: o.l,
            lastFilledPrice: o.L,
            commissionAsset: o.N,
            commission: o.n,
            tradeId: o.t,
            bidValue: o.b,
            askValue: o.a,
            isMaker: o.m,
            wt: o.wt,
            ot: o.ot,
            cp: o.cp,
            rp: o.rp
        };
        // Maintain openOrders
        if (order.status === 'NEW' || order.status === 'PARTIALLY_FILLED') {
            this.openOrders.set(order.orderId, order);
        } else {
            // Market order special handling: delete after at least one push
            const prev = this.openOrders.get(order.orderId);
            if (order.type === 'MARKET') {
                if (!prev || !prev._pushedOnce) {
                    // First push, mark it, don't delete
                    order._pushedOnce = true;
                    this.openOrders.set(order.orderId, order);
                } else {
                    // Already pushed once, delete
                    this.openOrders.delete(order.orderId);
                }
            } else {
                this.openOrders.delete(order.orderId);
            }
        }
        // Actively clean all market orders that have been pushed
        for (const [id, o] of this.openOrders) {
            if (o.type === 'MARKET' && o._pushedOnce) {
                this.openOrders.delete(id);
            }
        }
        // Push latest open orders list
        this.orderUpdateCallbacks.forEach(cb => cb(Array.from(this.openOrders.values())));
    }

    /**
     * Subscribe and push 5-level depth information for symbol
     */
    public watchDepth(symbol: string, cb: (data: any) => void) {
        const channel = `${symbol.toLowerCase()}@depth5@100ms`;
        this.depthUpdateCallbacks.push(cb);
        this.subscribe({ params: [channel], id: Math.floor(Math.random() * 10000) });
        // If snapshot already exists on registration, push immediately
        if (this.lastDepthData && this.lastDepthData.s === symbol.toUpperCase()) {
            cb(this.formatDepthData(this.lastDepthData));
        }
    }

    // Format depth push to standard structure
    private formatDepthData(data: any): AsterDepth {
        return {
            eventType: data.e,
            eventTime: data.E,
            tradeTime: data.T,
            symbol: data.s,
            firstUpdateId: data.U,
            lastUpdateId: data.u ?? data.lastUpdateId,
            prevUpdateId: data.pu,
            bids: data.b ?? data.bids ?? [],
            asks: data.a ?? data.asks ?? []
        };
    }

    /**
     * Subscribe and push ticker information for symbol
     */
    public async watchTicker(symbol?: string, cb?: (data: any) => void) {
        const useSymbol = (symbol || this.defaultMarket).toUpperCase();
        const channel = `${useSymbol.toLowerCase()}@miniTicker`;
        if (cb) this.tickerUpdateCallbacks.push(cb);
        this.subscribe({ params: [channel], id: Math.floor(Math.random() * 10000) });
        // Get ticker once from HTTP on initialization
        if (!this.lastTickerData || this.lastTickerData.symbol !== useSymbol) {
            const ticker = await this.getTicker(useSymbol);
            this.lastTickerData = ticker;
        }
        // Push immediately on registration
        if (cb) {
            if (this.lastTickerData && this.lastTickerData.symbol === useSymbol) {
                cb(this.lastTickerData);
            } else {
                const interval = setInterval(() => {
                    if (this.lastTickerData && this.lastTickerData.symbol === useSymbol) {
                        cb(this.lastTickerData);
                        clearInterval(interval);
                    }
                }, 200);
            }
        }
    }

    // Format ticker push to standard structure
    private formatTickerData(data: any): AsterTicker {
        // WS push
        if (data.e === '24hrMiniTicker') {
            return {
                symbol: data.s,
                lastPrice: data.c,
                openPrice: data.o,
                highPrice: data.h,
                lowPrice: data.l,
                volume: data.v,
                quoteVolume: data.q,
                eventType: data.e,
                eventTime: data.E
            };
        }
        // http
        return {
            symbol: data.symbol,
            lastPrice: data.lastPrice,
            openPrice: data.openPrice,
            highPrice: data.highPrice,
            lowPrice: data.lowPrice,
            volume: data.volume,
            quoteVolume: data.quoteVolume,
            priceChange: data.priceChange,
            priceChangePercent: data.priceChangePercent,
            weightedAvgPrice: data.weightedAvgPrice,
            lastQty: data.lastQty,
            openTime: data.openTime,
            closeTime: data.closeTime,
            firstId: data.firstId,
            lastId: data.lastId,
            count: data.count
        };
    }

    /**
     * Subscribe and push kline data for symbol+interval
     */
    public async watchKline(symbol: string, interval: string, cb: (data: any[]) => void) {
        this.klineSymbol = symbol.toUpperCase();
        this.klineInterval = interval;
        this.klineUpdateCallbacks.push(cb);
        // First get historical klines once from HTTP
        if (!this.lastKlines.length) {
            const klines = await this.getKlines({ symbol: this.klineSymbol, interval: this.klineInterval, limit: 100 });
            this.lastKlines = klines.map(this.formatKlineArray);
        }
        // Subscribe to WS kline channel
        const channel = `${symbol.toLowerCase()}@kline_${interval}`;
        this.subscribe({ params: [channel], id: Math.floor(Math.random() * 10000) });
        // Push immediately on registration
        if (this.lastKlines.length) {
            cb(this.lastKlines);
        } else {
            const intervalId = setInterval(() => {
                if (this.lastKlines.length) {
                    cb(this.lastKlines);
                    clearInterval(intervalId);
                }
            }, 200);
        }
    }

    // Format HTTP kline array
    private formatKlineArray(arr: any[]): AsterKline {
        return {
            openTime: arr[0],
            open: arr[1],
            high: arr[2],
            low: arr[3],
            close: arr[4],
            volume: arr[5],
            closeTime: arr[6],
            quoteAssetVolume: arr[7],
            numberOfTrades: arr[8],
            takerBuyBaseAssetVolume: arr[9],
            takerBuyQuoteAssetVolume: arr[10]
        };
    }

    // Format WS kline
    private formatWsKline(k: any, event?: any): AsterKline {
        return {
            openTime: k.t,
            open: k.o,
            high: k.h,
            low: k.l,
            close: k.c,
            volume: k.v,
            closeTime: k.T,
            quoteAssetVolume: k.q,
            numberOfTrades: k.n,
            takerBuyBaseAssetVolume: k.V,
            takerBuyQuoteAssetVolume: k.Q,
            eventType: event?.e,
            eventTime: event?.E,
            symbol: k.s ?? event?.s,
            interval: k.i,
            firstTradeId: k.f,
            lastTradeId: k.L,
            isClosed: k.x
        };
    }

    private startPolling() {
        this.pollingIntervalId = setInterval(async () => {
            try {
                // 1. Poll account information
                const account = await this.getAccount();
                if (this.accountSnapshot) {
                    // Directly replace all fields of original content with new data (seamless overwrite, don't clear object)
                    Object.keys(account).forEach(key => {
                        this.accountSnapshot[key] = account[key];
                    });
                } else {
                    this.accountSnapshot = account;
                }
                this.accountUpdateCallbacks.forEach(cb => cb(this.accountSnapshot));

                // 2. Poll open orders information
                const openOrders = await this.getOpenOrders({ symbol: this.defaultMarket });
                // Don't clear, directly replace Map content with new data
                // First delete orders in Map that are no longer in new list
                const newOrderIds = new Set(openOrders.map((o: any) => o.orderId));
                for (const id of Array.from(this.openOrders.keys())) {
                    if (!newOrderIds.has(id)) {
                        this.openOrders.delete(id);
                    }
                }
                // Then update and add new
                for (const order of openOrders) {
                    this.openOrders.set(order.orderId, order);
                }
                this.orderUpdateCallbacks.forEach(cb => cb(Array.from(this.openOrders.values())));
            } catch (err) {
                console.error("Periodic polling failed:", err);
            }
        }, 10000); // Every 10 seconds
    }

    private stopPolling() {
        if (this.pollingIntervalId) {
            clearInterval(this.pollingIntervalId);
            this.pollingIntervalId = undefined;
        }
    }
}