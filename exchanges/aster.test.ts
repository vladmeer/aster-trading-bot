import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
import { Aster } from './aster';

// mock fetch
const globalAny: any = global;

// mock createHmac
vi.mock('crypto', async () => {
  const actual: any = await vi.importActual('crypto');
  return {
    ...actual,
    createHmac: vi.fn(() => ({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn(() => 'mocked_signature'),
    })),
  };
});

// mock WebSocket
class MockWebSocket implements WebSocket {
  send = vi.fn();
  close = vi.fn();
  binaryType: 'blob' | 'arraybuffer' = 'blob';
  bufferedAmount = 0;
  extensions = '';
  onclose = null;
  onerror = null;
  onmessage = null;
  onopen = null;
  protocol = '';
  readyState = 1;
  url = '';
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  dispatchEvent = vi.fn();
  // 静态属性
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  // 实例属性
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;
}
globalAny.WebSocket = MockWebSocket;

describe('Aster', () => {
  const apiKey = 'test-key';
  const apiSecret = 'test-secret';
  let aster: Aster;

  beforeEach(() => {
    aster = new Aster(apiKey, apiSecret);
    globalAny.fetch = vi.fn();
    aster.ws = new MockWebSocket(); // 替换为 mock ws
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('ping should call publicRequest and return data', async () => {
    const mockData = { result: 'pong' };
    globalAny.fetch.mockResolvedValueOnce({
      json: async () => mockData,
    });
    const res = await aster.ping();
    expect(globalAny.fetch).toHaveBeenCalledWith(
      'https://fapi.asterdex.com/fapi/v1/ping',
      expect.objectContaining({ method: 'GET' })
    );
    expect(res).toEqual(mockData);
  });

  it('time should call publicRequest and return data', async () => {
    const mockData = { serverTime: 1234567890 };
    globalAny.fetch.mockResolvedValueOnce({
      json: async () => mockData,
    });
    const res = await aster.time();
    expect(globalAny.fetch).toHaveBeenCalledWith(
      'https://fapi.asterdex.com/fapi/v1/time',
      expect.objectContaining({ method: 'GET' })
    );
    expect(res).toEqual(mockData);
  });

  it('getExchangeInfo should call publicRequest and return data', async () => {
    const mockData = { symbols: [] };
    globalAny.fetch.mockResolvedValueOnce({
      json: async () => mockData,
    });
    const res = await aster.getExchangeInfo();
    expect(globalAny.fetch).toHaveBeenCalledWith(
      'https://fapi.asterdex.com/fapi/v1/exchangeInfo',
      expect.objectContaining({ method: 'GET' })
    );
    expect(res).toEqual(mockData);
  });

  it('getDepth should call publicRequest and return data', async () => {
    const mockData = { bids: [], asks: [] };
    globalAny.fetch.mockResolvedValueOnce({
      json: async () => mockData,
    });
    const res = await aster.getDepth('BTCUSDT', 10);
    expect(globalAny.fetch).toHaveBeenCalledWith(
      'https://fapi.asterdex.com/fapi/v1/depth?symbol=BTCUSDT&limit=10',
      expect.objectContaining({ method: 'GET' })
    );
    expect(res).toEqual(mockData);
  });

  it('createOrder should call signedRequest and return data', async () => {
    const mockData = { orderId: 123 };
    globalAny.fetch.mockResolvedValueOnce({
      json: async () => mockData,
    });
    const params = {
      symbol: 'BTCUSDT',
      side: 'BUY',
      type: 'LIMIT',
      quantity: 1,
      price: 10000,
      timestamp: 1234567890,
    };
    // mock Date.now
    vi.spyOn(Date, 'now').mockReturnValue(1234567890);
    const res = await aster.createOrder(params as any);
    expect(globalAny.fetch).toHaveBeenCalledWith(
      'https://fapi.asterdex.com/fapi/v1/order',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'X-MBX-APIKEY': apiKey }),
        body: expect.stringContaining('symbol=BTCUSDT'),
      })
    );
    expect(res).toEqual(mockData);
  });

  it('subscribe should send SUBSCRIBE message via WebSocket', async () => {
    const params = { params: ['BTCUSDT@aggTrade'], id: 1 };
    await aster.subscribe(params);
    expect(aster.ws.send).toHaveBeenCalledWith(
      JSON.stringify({ ...params, method: 'SUBSCRIBE' })
    );
  });

  it('unsubscribe should send UNSUBSCRIBE message via WebSocket', async () => {
    const params = { params: ['BTCUSDT@aggTrade'], id: 1 };
    await aster.unsubscribe(params);
    expect(aster.ws.send).toHaveBeenCalledWith(
      JSON.stringify({ ...params, method: 'UNSUBSCRIBE' })
    );
  });

  it('close should close WebSocket', async () => {
    await aster.close();
    expect(aster.ws.close).toHaveBeenCalled();
  });
});
