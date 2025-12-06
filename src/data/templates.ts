import { DisplayMode, WidgetField, ChartType, ChartInterval } from '@/store/dashboardStore';

export interface WidgetTemplate {
  name: string;
  apiUrl: string;
  refreshInterval: number;
  displayMode: DisplayMode;
  chartType: ChartType;
  chartInterval: ChartInterval;
  selectedFields: WidgetField[];
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  widgets: WidgetTemplate[];
}

export const dashboardTemplates: DashboardTemplate[] = [
  {
    id: 'crypto',
    name: 'Crypto Tracker',
    description: 'Track Bitcoin, Ethereum, and major cryptocurrencies in real-time',
    icon: 'Bitcoin',
    color: 'from-orange-500 to-yellow-500',
    widgets: [
      {
        name: 'Bitcoin (BTC)',
        apiUrl: 'https://api.coinbase.com/v2/exchange-rates?currency=BTC',
        refreshInterval: 30,
        displayMode: 'card',
        chartType: 'line',
        chartInterval: 'daily',
        selectedFields: [
          { path: 'data.currency', label: 'Currency', type: 'string' },
          { path: 'data.rates.USD', label: 'USD', type: 'string' },
          { path: 'data.rates.EUR', label: 'EUR', type: 'string' },
          { path: 'data.rates.GBP', label: 'GBP', type: 'string' },
        ],
      },
      {
        name: 'Ethereum (ETH)',
        apiUrl: 'https://api.coinbase.com/v2/exchange-rates?currency=ETH',
        refreshInterval: 30,
        displayMode: 'card',
        chartType: 'line',
        chartInterval: 'daily',
        selectedFields: [
          { path: 'data.currency', label: 'Currency', type: 'string' },
          { path: 'data.rates.USD', label: 'USD', type: 'string' },
          { path: 'data.rates.EUR', label: 'EUR', type: 'string' },
          { path: 'data.rates.BTC', label: 'BTC', type: 'string' },
        ],
      },
      {
        name: 'Solana (SOL)',
        apiUrl: 'https://api.coinbase.com/v2/exchange-rates?currency=SOL',
        refreshInterval: 30,
        displayMode: 'card',
        chartType: 'line',
        chartInterval: 'daily',
        selectedFields: [
          { path: 'data.currency', label: 'Currency', type: 'string' },
          { path: 'data.rates.USD', label: 'USD', type: 'string' },
          { path: 'data.rates.EUR', label: 'EUR', type: 'string' },
        ],
      },
    ],
  },
  {
    id: 'forex',
    name: 'Forex Monitor',
    description: 'Monitor major currency exchange rates and pairs',
    icon: 'DollarSign',
    color: 'from-emerald-500 to-teal-500',
    widgets: [
      {
        name: 'USD Exchange Rates',
        apiUrl: 'https://api.coinbase.com/v2/exchange-rates?currency=USD',
        refreshInterval: 60,
        displayMode: 'card',
        chartType: 'line',
        chartInterval: 'daily',
        selectedFields: [
          { path: 'data.currency', label: 'Base', type: 'string' },
          { path: 'data.rates.EUR', label: 'EUR', type: 'string' },
          { path: 'data.rates.GBP', label: 'GBP', type: 'string' },
          { path: 'data.rates.JPY', label: 'JPY', type: 'string' },
          { path: 'data.rates.CHF', label: 'CHF', type: 'string' },
          { path: 'data.rates.CAD', label: 'CAD', type: 'string' },
        ],
      },
      {
        name: 'EUR Exchange Rates',
        apiUrl: 'https://api.coinbase.com/v2/exchange-rates?currency=EUR',
        refreshInterval: 60,
        displayMode: 'card',
        chartType: 'line',
        chartInterval: 'daily',
        selectedFields: [
          { path: 'data.currency', label: 'Base', type: 'string' },
          { path: 'data.rates.USD', label: 'USD', type: 'string' },
          { path: 'data.rates.GBP', label: 'GBP', type: 'string' },
          { path: 'data.rates.JPY', label: 'JPY', type: 'string' },
          { path: 'data.rates.CHF', label: 'CHF', type: 'string' },
        ],
      },
      {
        name: 'GBP Exchange Rates',
        apiUrl: 'https://api.coinbase.com/v2/exchange-rates?currency=GBP',
        refreshInterval: 60,
        displayMode: 'card',
        chartType: 'line',
        chartInterval: 'daily',
        selectedFields: [
          { path: 'data.currency', label: 'Base', type: 'string' },
          { path: 'data.rates.USD', label: 'USD', type: 'string' },
          { path: 'data.rates.EUR', label: 'EUR', type: 'string' },
          { path: 'data.rates.JPY', label: 'JPY', type: 'string' },
        ],
      },
    ],
  },
  {
    id: 'stablecoins',
    name: 'Stablecoin Watch',
    description: 'Monitor stablecoin rates and their USD pegs',
    icon: 'Coins',
    color: 'from-blue-500 to-indigo-500',
    widgets: [
      {
        name: 'USDT Rates',
        apiUrl: 'https://api.coinbase.com/v2/exchange-rates?currency=USDT',
        refreshInterval: 30,
        displayMode: 'card',
        chartType: 'line',
        chartInterval: 'daily',
        selectedFields: [
          { path: 'data.currency', label: 'Currency', type: 'string' },
          { path: 'data.rates.USD', label: 'USD', type: 'string' },
          { path: 'data.rates.EUR', label: 'EUR', type: 'string' },
          { path: 'data.rates.BTC', label: 'BTC', type: 'string' },
        ],
      },
      {
        name: 'USDC Rates',
        apiUrl: 'https://api.coinbase.com/v2/exchange-rates?currency=USDC',
        refreshInterval: 30,
        displayMode: 'card',
        chartType: 'line',
        chartInterval: 'daily',
        selectedFields: [
          { path: 'data.currency', label: 'Currency', type: 'string' },
          { path: 'data.rates.USD', label: 'USD', type: 'string' },
          { path: 'data.rates.EUR', label: 'EUR', type: 'string' },
          { path: 'data.rates.BTC', label: 'BTC', type: 'string' },
        ],
      },
      {
        name: 'DAI Rates',
        apiUrl: 'https://api.coinbase.com/v2/exchange-rates?currency=DAI',
        refreshInterval: 30,
        displayMode: 'card',
        chartType: 'line',
        chartInterval: 'daily',
        selectedFields: [
          { path: 'data.currency', label: 'Currency', type: 'string' },
          { path: 'data.rates.USD', label: 'USD', type: 'string' },
          { path: 'data.rates.EUR', label: 'EUR', type: 'string' },
        ],
      },
    ],
  },
];
